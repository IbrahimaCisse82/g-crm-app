import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { generateRegistrationOptions } from "https://esm.sh/@simplewebauthn/server@10.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;
    const email = (claims.claims.email as string) || userId;

    const { rpId } = await req.json().catch(() => ({ rpId: "" }));
    if (!rpId || typeof rpId !== "string") return json({ error: "rpId required" }, 400);

    const { data: existing } = await admin
      .from("webauthn_credentials")
      .select("credential_id, transports")
      .eq("user_id", userId);

    const options = await generateRegistrationOptions({
      rpName: "G-CRM",
      rpID: rpId,
      userID: new TextEncoder().encode(userId),
      userName: email,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "required",
        authenticatorAttachment: "platform",
      },
      excludeCredentials: (existing ?? []).map((c) => ({
        id: c.credential_id,
        transports: c.transports ? c.transports.split(",") as any : undefined,
      })),
    });

    await admin.from("webauthn_challenges").delete().eq("user_id", userId).eq("kind", "registration");
    await admin.from("webauthn_challenges").insert({
      user_id: userId,
      challenge: options.challenge,
      kind: "registration",
    });

    return json({ options });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
