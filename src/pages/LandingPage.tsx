import { Link } from 'react-router-dom';

const features = [
  { icon: '👥', title: 'Gestion Clients', desc: 'Centralisez vos contacts, suivez le statut de chaque client et gardez un historique complet.' },
  { icon: '🧾', title: 'Facturation', desc: 'Créez des factures professionnelles en quelques clics, suivez les paiements et les échéances.' },
  { icon: '📋', title: 'Devis', desc: 'Générez des devis et convertissez-les en factures instantanément.' },
  { icon: '📒', title: 'Journal Comptable', desc: 'Enregistrez recettes et dépenses, filtrez par mode de paiement et catégorie.' },
  { icon: '💰', title: 'Trésorerie', desc: 'Suivez vos soldes Caisse, Mobile Money et Banque en temps réel.' },
  { icon: '📄', title: 'Export PDF', desc: 'Téléchargez vos factures et devis en PDF avec l\'en-tête de votre entreprise.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(168,100%,31%)] to-[hsl(160,84%,39%)] flex items-center justify-center shadow-md">
              <span className="text-lg font-black text-white">G</span>
            </div>
            <span className="font-black text-lg text-foreground tracking-tight">G-CRM</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Link to="/login" className="bg-gradient-to-r from-[hsl(168,100%,31%)] to-[hsl(160,84%,39%)] text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md hover:-translate-y-px transition-all">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              🇸🇳 Conçu pour les TPE/PME africaines
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-5 text-foreground">
              Gérez votre entreprise <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(168,100%,31%)] to-[hsl(204,70%,53%)]">simplement et efficacement</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Clients, factures, devis, journal comptable et trésorerie — tout en un seul outil. Zéro complexité, 100% adapté à votre réalité.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="bg-gradient-to-r from-[hsl(168,100%,31%)] to-[hsl(160,84%,39%)] text-white text-base font-bold px-8 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">
                Essayer gratuitement →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3">Tout ce qu'il vous faut</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Une suite complète d'outils pour piloter votre activité au quotidien.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[hsl(168,100%,31%)] to-[hsl(160,84%,25%)] rounded-2xl p-8 sm:p-14 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Prêt à simplifier votre gestion ?</h2>
            <p className="text-white/80 mb-7 max-w-md mx-auto">Créez votre compte en 30 secondes et commencez à gérer vos clients et factures.</p>
            <Link to="/login" className="inline-block bg-white text-[hsl(168,100%,31%)] text-base font-bold px-8 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">
              Créer mon compte gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(168,100%,31%)] to-[hsl(160,84%,39%)] flex items-center justify-center">
                <span className="text-sm font-black text-white">G</span>
              </div>
              <span className="font-bold text-sm text-foreground">G-CRM par GROWHUB SARL</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link to="/cgu" className="hover:text-foreground transition-colors">Conditions d'utilisation</Link>
              <Link to="/confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
              <Link to="/protection-donnees" className="hover:text-foreground transition-colors">Protection des données</Link>
            </div>
          </div>
          <div className="text-center mt-6 text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} GROWHUB SARL — Société de droit sénégalais · Dakar, Sénégal · g-crm@growhubsenegal.com
          </div>
        </div>
      </footer>
    </div>
  );
}
