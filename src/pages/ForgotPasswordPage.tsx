import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) return toast.error('Veuillez entrer votre adresse email');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success('Email de réinitialisation envoyé !');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center gradient-auth p-4">
      <div className="bg-card rounded-2xl p-8 sm:p-10 w-full max-w-[420px] shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="flex flex-col items-center text-center mb-7 gap-3">
          <div className="w-[72px] h-[72px] rounded-full gradient-primary flex items-center justify-center shadow-primary">
            <span className="text-3xl font-black text-primary-foreground">G</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground">Entrez votre email pour recevoir un lien de réinitialisation</p>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <p className="text-sm text-foreground font-semibold mb-2">Email envoyé !</p>
            <p className="text-xs text-muted-foreground mb-6">
              Vérifiez votre boîte de réception (et vos spams) pour le lien de réinitialisation.
            </p>
            <Link
              to="/login"
              className="inline-block gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-primary hover:-translate-y-px transition-all"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
                onKeyDown={e => e.key === 'Enter' && handleReset()}
              />
            </div>
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full h-12 gradient-primary rounded-xl text-primary-foreground text-[15px] font-bold shadow-primary hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-60"
            >
              {loading ? '⏳ Envoi...' : 'Envoyer le lien'}
            </button>
            <div className="text-center mt-4">
              <Link to="/login" className="text-sm text-primary font-semibold hover:underline">
                ← Retour à la connexion
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
