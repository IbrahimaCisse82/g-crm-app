import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
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
      return new Response(JSON.stringify({ error: "Forbidden — admin role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action, request_id, admin_notes, months } = body;

    if (action === "approve" && request_id) {
      const { data: request, error: reqError } = await supabaseAdmin
        .from("subscription_requests")
        .select("*")
        .eq("id", request_id)
        .single();

      if (reqError || !request) {
        return new Response(JSON.stringify({ error: "Demande introuvable" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabaseAdmin
        .from("subscription_requests")
        .update({ status: "approved", admin_notes: admin_notes || null })
        .eq("id", request_id);

      const monthsNum = Math.max(1, Math.min(24, Number(months) || 1));
      const now = new Date();
      const periodMs = monthsNum * 30 * 24 * 60 * 60 * 1000;

      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", request.user_id)
        .maybeSingle();

      let newExpiry = new Date(now.getTime() + periodMs);
      if (existing && existing.plan === "pro" && existing.expires_at && new Date(existing.expires_at) > now) {
        newExpiry = new Date(new Date(existing.expires_at).getTime() + periodMs);
      }

      if (existing) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            starts_at: now.toISOString(),
            expires_at: newExpiry.toISOString(),
            payment_reference: request.payment_reference,
            payment_mode: request.payment_mode,
            amount: request.amount,
          })
          .eq("user_id", request.user_id);
      } else {
        await supabaseAdmin.from("subscriptions").insert({
          user_id: request.user_id,
          plan: "pro",
          status: "active",
          starts_at: now.toISOString(),
          expires_at: newExpiry.toISOString(),
          payment_reference: request.payment_reference,
          payment_mode: request.payment_mode,
          amount: request.amount,
        });
      }

      return new Response(JSON.stringify({ success: true, expires_at: newExpiry.toISOString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reject" && request_id) {
      await supabaseAdmin
        .from("subscription_requests")
        .update({ status: "rejected", admin_notes: admin_notes || null })
        .eq("id", request_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "revoke" && body.user_id) {
      await supabaseAdmin
        .from("subscriptions")
        .update({ plan: "free", status: "cancelled", expires_at: null })
        .eq("user_id", body.user_id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Action invalide" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
