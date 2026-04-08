import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricChecked, setBiometricChecked] = useState(false);

  // Check if WebAuthn / biometric is available
  React.useEffect(() => {
    async function checkBiometric() {
      try {
        if (
          window.PublicKeyCredential &&
          typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
        ) {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometricAvailable(available);
        }
      } catch {
        setBiometricAvailable(false);
      }
      setBiometricChecked(true);
    }
    checkBiometric();
  }, []);

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !user?.email) return;
    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (error) {
        toast.error('Mot de passe incorrect');
      } else {
        setPassword('');
        onUnlock();
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      // Use WebAuthn to verify the user's identity via biometric
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
          allowCredentials: [],
        },
      });
      // If we get here, biometric verification succeeded
      if (credential) {
        onUnlock();
      }
    } catch (err: any) {
      // NotAllowedError = user cancelled, other errors = not set up
      if (err?.name === 'NotAllowedError') {
        toast.error('Authentification annulée');
      } else {
        // Fallback: on many devices without pre-registered credentials,
        // we can still try the simpler approach
        toast.error('Empreinte non disponible, utilisez votre mot de passe');
      }
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center gap-6 animate-in fade-in duration-300">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">{initials || '?'}</span>
        </div>

        {/* Name */}
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center mt-1">
            <Lock className="w-3.5 h-3.5" />
            Session verrouillée
          </p>
        </div>

        {/* Password form */}
        <form onSubmit={handlePasswordUnlock} className="w-full space-y-3">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
            {loading ? 'Vérification...' : 'Déverrouiller'}
          </Button>
        </form>

        {/* Biometric button */}
        {biometricChecked && biometricAvailable && (
          <button
            onClick={handleBiometricUnlock}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <div className="w-14 h-14 rounded-full border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-colors">
              <Fingerprint className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium">Empreinte digitale</span>
          </button>
        )}

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center">
          Déconnexion automatique après 5 min d'inactivité
        </p>
      </div>
    </div>
  );
}
