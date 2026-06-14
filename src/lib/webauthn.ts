import { supabase } from '@/integrations/supabase/client';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const rpId = window.location.hostname;
const origin = window.location.origin;

async function invoke<T = any>(fn: string, body: any): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export async function registerBiometric(deviceLabel?: string): Promise<void> {
  const { options } = await invoke<{ options: any }>('webauthn-register-begin', { rpId });
  const attResp = await startRegistration({ optionsJSON: options });
  await invoke('webauthn-register-finish', {
    response: attResp,
    rpId,
    origin,
    device_label: deviceLabel ?? navigator.userAgent.slice(0, 80),
  });
}

export async function verifyBiometric(): Promise<boolean> {
  const begin = await invoke<{ options: any }>('webauthn-auth-begin', { rpId });
  const assertion = await startAuthentication({ optionsJSON: begin.options });
  await invoke('webauthn-auth-finish', { response: assertion, rpId, origin });
  return true;
}

export async function hasRegisteredBiometric(): Promise<boolean> {
  const { count, error } = await supabase
    .from('webauthn_credentials')
    .select('id', { count: 'exact', head: true });
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  try {
    if (
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    /* ignore */
  }
  return false;
}
