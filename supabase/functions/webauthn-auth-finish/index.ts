import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { verifyAuthenticationResponse } from "https://esm.sh/@simplewebauthn/server@10.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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

    const { response, rpId, origin } = await req.json();
    if (!response || !rpId || !origin) return json({ error: "Missing fields" }, 400);

    const { data: chal } = await admin
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("kind", "authentication")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!chal) return json({ error: "Challenge expiré" }, 400);

    const credentialId: string = response.id;
    const { data: cred } = await admin
      .from("webauthn_credentials")
      .select("*")
      .eq("user_id", userId)
      .eq("credential_id", credentialId)
      .maybeSingle();
    if (!cred) return json({ error: "Credential inconnue" }, 400);

    const publicKey = Uint8Array.from(atob(cred.public_key), (c) => c.charCodeAt(0));

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: chal.challenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      credential: {
        id: cred.credential_id,
        publicKey,
        counter: Number(cred.counter),
      },
      requireUserVerification: true,
    });

    if (!verification.verified) return json({ error: "Vérification échouée" }, 401);

    await admin
      .from("webauthn_credentials")
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", cred.id);
    await admin.from("webauthn_challenges").delete().eq("id", chal.id);

    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
