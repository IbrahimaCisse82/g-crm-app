import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = claims.claims.sub as string;

    // Check that caller has admin role
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return json({ error: "Forbidden — admin role required" }, 403);
    }

    const body = await req.json();
    const { action, request_id, admin_notes, months } = body;

    const audit = async (act: string, table: string, recordId: string | null, after: unknown) => {
      await supabaseAdmin.from("audit_log").insert({
        user_id: userId, action: act, table_name: table, record_id: recordId, after,
      });
    };

    if (action === "approve" && request_id) {
      const monthsNum = Math.max(1, Math.min(24, Number(months) || 1));

      // Approbation atomique via RPC : verrouille la demande, refuse si déjà traitée,
      // met à jour la demande ET l'abonnement dans une seule transaction.
      const { data, error } = await supabaseAdmin.rpc("approve_subscription_request", {
        _admin_id: userId,
        _request_id: request_id,
        _admin_notes: admin_notes || null,
        _months: monthsNum,
      });

      if (error) {
        const msg: string = error.message || "";
        if (error.code === "P0002" || msg.includes("Demande introuvable")) {
          return json({ error: "Demande introuvable" }, 404);
        }
        if (error.code === "P0003" || msg.includes("déjà traitée")) {
          return json({ error: "Cette demande a déjà été traitée" }, 409);
        }
        if (error.code === "P0001" || msg.includes("Access denied")) {
          return json({ error: "Forbidden — admin role required" }, 403);
        }
        return json({ error: `Échec de l'approbation : ${msg}` }, 500);
      }

      await audit("admin_approve", "subscription_requests", request_id, { months: monthsNum, admin_notes: admin_notes || null });
      return json(data);
    }

    if (action === "reject" && request_id) {
      const reason = typeof admin_notes === "string" ? admin_notes.trim() : "";
      if (reason.length < 3) {
        return json({ error: "Le motif du refus est obligatoire" }, 400);
      }
      // Ne rejeter que les demandes encore en attente (évite le rejeu)
      const { data: updated, error: rejError } = await supabaseAdmin
        .from("subscription_requests")
        .update({ status: "rejected", admin_notes: reason })
        .eq("id", request_id)
        .eq("status", "pending")
        .select("id");

      if (rejError) {
        return json({ error: `Échec du rejet : ${rejError.message}` }, 500);
      }
      if (!updated || updated.length === 0) {
        return json({ error: "Cette demande a déjà été traitée ou est introuvable" }, 409);
      }
      await audit("admin_reject", "subscription_requests", request_id, { admin_notes: reason });
      return json({ success: true });
    }

    if (action === "revoke" && body.user_id) {
      const { error: revError } = await supabaseAdmin
        .from("subscriptions")
        .update({ plan: "free", status: "cancelled", expires_at: null })
        .eq("user_id", body.user_id);
      if (revError) {
        return json({ error: `Échec de la révocation : ${revError.message}` }, 500);
      }
      await audit("admin_revoke", "subscriptions", null, { user_id: body.user_id });
      return json({ success: true });
    }

    return json({ error: "Action invalide" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
