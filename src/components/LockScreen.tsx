import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Fingerprint, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  verifyBiometric,
  registerBiometric,
  hasRegisteredBiometric,
  isPlatformAuthenticatorAvailable,
} from '@/lib/webauthn';

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);
  const [checked, setChecked] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isPlatformAuthenticatorAvailable();
      setPlatformAvailable(available);
      if (available) {
        const has = await hasRegisteredBiometric();
        setHasCredential(has);
      }
      setChecked(true);
    })();
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
      await verifyBiometric();
      onUnlock();
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        toast.error('Authentification annulée');
      } else {
        toast.error(err?.message || 'Authentification biométrique échouée');
      }
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await registerBiometric();
      setHasCredential(true);
      toast.success('Empreinte enregistrée — vous pouvez désormais déverrouiller sans mot de passe');
    } catch (err: any) {
      toast.error(err?.message || "Impossible d'enregistrer l'empreinte");
    } finally {
      setRegistering(false);
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
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">{initials || '?'}</span>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{displayName}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center mt-1">
            <Lock className="w-3.5 h-3.5" />
            Session verrouillée
          </p>
        </div>

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

        {checked && platformAvailable && hasCredential && (
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

        {checked && platformAvailable && !hasCredential && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegister}
            disabled={registering}
            className="gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {registering ? 'Configuration…' : 'Activer la biométrie'}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Déconnexion automatique après 5 min d'inactivité
        </p>
      </div>
    </div>
  );
}
