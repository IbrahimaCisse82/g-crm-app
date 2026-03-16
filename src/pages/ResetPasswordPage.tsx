import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check if this is a recovery flow from the URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password || !confirm) return toast.error('Veuillez remplir les deux champs');
    if (password.length < 6) return toast.error('Le mot de passe doit contenir au moins 6 caractères');
    if (password !== confirm) return toast.error('Les mots de passe ne correspondent pas');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Mot de passe mis à jour avec succès !');
      navigate('/');
    }
  };

  if (!isRecovery) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center gradient-auth p-4">
        <div className="bg-card rounded-2xl p-8 sm:p-10 w-full max-w-[420px] shadow-2xl text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-black text-foreground mb-2">Lien invalide</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-primary hover:-translate-y-px transition-all"
          >
            Demander un nouveau lien
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center gradient-auth p-4">
      <div className="bg-card rounded-2xl p-8 sm:p-10 w-full max-w-[420px] shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="flex flex-col items-center text-center mb-7 gap-3">
          <div className="w-[72px] h-[72px] rounded-full gradient-primary flex items-center justify-center shadow-primary">
            <span className="text-3xl font-black text-primary-foreground">G</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Nouveau mot de passe</h1>
            <p className="text-sm text-muted-foreground">Choisissez un nouveau mot de passe sécurisé</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 caractères"
            className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Répétez le mot de passe"
            className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
            onKeyDown={e => e.key === 'Enter' && handleReset()}
          />
        </div>
        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full h-12 gradient-primary rounded-xl text-primary-foreground text-[15px] font-bold shadow-primary hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-60"
        >
          {loading ? '⏳ Mise à jour...' : 'Mettre à jour le mot de passe'}
        </button>
      </div>
    </div>
  );
}
