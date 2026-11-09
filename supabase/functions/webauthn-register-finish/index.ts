import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";
import { verifyRegistrationResponse } from "https://esm.sh/@simplewebauthn/server@10.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// L'origine fournie par le client n'est jamais fiable : elle doit figurer dans la
// liste blanche WEBAUTHN_ALLOWED_ORIGINS (séparateur : virgule). Le rpId est déduit
// de l'origine validée, jamais lu tel quel depuis le corps de la requête.
function resolveRpId(origin: unknown): { rpId?: string; origin?: string; error?: string } {
  if (typeof origin !== "string" || !origin) return { error: "Missing fields" };
  const allowed = (Deno.env.get("WEBAUTHN_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allowed.includes(origin)) return { error: "Origine non autorisée" };
  try {
    return { rpId: new URL(origin).hostname, origin };
  } catch {
    return { error: "Origine invalide" };
  }
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

    const body = await req.json();
    const { response, device_label } = body;
    const resolved = resolveRpId(body.origin);
    if (!response || resolved.error) return json({ error: resolved.error ?? "Missing fields" }, 400);
    const { rpId, origin } = resolved as { rpId: string; origin: string };

    const { data: chal } = await admin
      .from("webauthn_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("kind", "registration")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!chal) return json({ error: "Challenge expiré ou introuvable" }, 400);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: chal.challenge,
      expectedOrigin: origin,
      expectedRPID: rpId,
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return json({ error: "Vérification échouée" }, 400);
    }

    const { credential } = verification.registrationInfo as any;
    const credentialId: string = credential.id;
    const publicKey: Uint8Array = credential.publicKey;
    const counter: number = credential.counter ?? 0;
    const transports = (response.response?.transports ?? []).join(",") || null;

    const publicKeyB64 = btoa(String.fromCharCode(...publicKey));

    const { error: insErr } = await admin.from("webauthn_credentials").insert({
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKeyB64,
      counter,
      transports,
      device_label: device_label || null,
    });
    if (insErr) return json({ error: insErr.message }, 400);

    await admin.from("webauthn_challenges").delete().eq("id", chal.id);
    return json({ success: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
