import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [suEmail, setSuEmail] = useState('');
  const [suPw, setSuPw] = useState('');
  const [loading, setLoading] = useState(false);

  // Traduit les erreurs techniques Supabase/réseau en messages clairs en français
  const translateAuthError = (raw: string): string => {
    const msg = raw.toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
      return 'Connexion impossible, vérifiez votre réseau';
    }
    if (msg.includes('invalid login credentials')) {
      return 'Email ou mot de passe incorrect';
    }
    if (msg.includes('email not confirmed')) {
      return 'Veuillez confirmer votre email avant de vous connecter';
    }
    if (msg.includes('user already registered')) {
      return 'Un compte existe déjà avec cet email';
    }
    if (msg.includes('password') && (msg.includes('at least') || msg.includes('should be'))) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
      return 'Adresse email invalide';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Trop de tentatives, réessayez dans quelques minutes';
    }
    return 'Une erreur est survenue, veuillez réessayer';
  };

  const handleLogin = async () => {
    if (!email || !pw) return toast.error('Veuillez remplir tous les champs');
    setLoading(true);
    const { error } = await signIn(email, pw);
    setLoading(false);
    if (error) toast.error(translateAuthError(error));
  };

  const handleSignup = async () => {
    if (!suEmail || !suPw || !name) return toast.error('Veuillez remplir les champs obligatoires');
    if (!acceptedTerms) return toast.error('Veuillez accepter les conditions d\'utilisation');
    if (suPw.length < 8) return toast.error('Le mot de passe doit contenir au moins 8 caractères');
    setLoading(true);
    const { error } = await signUp(suEmail, suPw, name, company);
    setLoading(false);
    if (error) toast.error(translateAuthError(error));
    else toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center gradient-auth p-4">
      <div className="bg-card rounded-2xl p-8 sm:p-10 w-full max-w-[420px] shadow-2xl animate-[slideUp_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-7 gap-3">
          <div className="w-[72px] h-[72px] rounded-full gradient-primary flex items-center justify-center shadow-primary animate-[logoPulse_3s_ease-in-out_infinite]">
            <span className="text-3xl font-black text-primary-foreground">G</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">G-CRM</h1>
            <p className="text-sm text-muted-foreground">Gestion commerciale &amp; trésorerie pour TPE</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-6 gap-1">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Créer un compte
          </button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Adresse email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 pr-11 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="flex justify-end mb-4">
              <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 gradient-primary rounded-xl text-primary-foreground text-[15px] font-bold shadow-primary hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-60"
            >
              {loading ? '⏳ Connexion...' : 'Connexion'}
            </button>
          </div>
        )}

        {/* Signup form */}
        {tab === 'signup' && (
          <div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Nom complet *</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Votre nom"
                className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Entreprise</label>
              <input
                type="text"
                autoComplete="organization"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Votre entreprise"
                className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email *</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={suEmail}
                onChange={e => setSuEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mot de passe *</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={suPw}
                onChange={e => setSuPw(e.target.value)}
                placeholder="Min. 8 caractères"
                className="w-full h-[46px] border-[1.5px] border-border rounded-xl px-3.5 text-sm text-foreground bg-muted outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-primary/10 focus:bg-card"
                onKeyDown={e => e.key === 'Enter' && handleSignup()}
              />
            </div>
            <div className="mb-4 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-border accent-[hsl(168,100%,31%)] cursor-pointer shrink-0"
              />
              <label htmlFor="accept-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                J'accepte les{' '}
                <Link to="/cgu" className="text-primary font-semibold hover:underline" target="_blank">Conditions d'utilisation</Link>,{' '}
                la <Link to="/confidentialite" className="text-primary font-semibold hover:underline" target="_blank">Politique de confidentialité</Link>{' '}
                et la <Link to="/protection-donnees" className="text-primary font-semibold hover:underline" target="_blank">Politique de protection des données</Link>.
              </label>
            </div>
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full h-12 gradient-primary rounded-xl text-primary-foreground text-[15px] font-bold shadow-primary hover:-translate-y-px hover:shadow-lg transition-all active:translate-y-0 disabled:opacity-60"
            >
              {loading ? '⏳ Création...' : 'Créer mon compte'}
            </button>
          </div>
        )}

        <div className="text-center mt-5 text-[11px] text-muted-foreground/50">
          © 2026 G-CRM — GROW HUB SARL
        </div>
      </div>
    </div>
  );
}
