import { Link } from 'react-router-dom';

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/landing" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(168,100%,31%)] to-[hsl(160,84%,39%)] flex items-center justify-center">
              <span className="text-sm font-black text-white">G</span>
            </div>
            <span className="font-bold text-sm text-foreground">G-CRM</span>
          </Link>
          <span className="text-muted-foreground text-sm">/ CGU</span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-black mb-2 text-foreground">Conditions Générales d'Utilisation</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose-custom space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Objet</h2>
            <p>Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions d'accès et d'utilisation de la plateforme G-CRM (ci-après « le Service »), éditée par GROWHUB SARL, société de droit sénégalais dont le siège social est situé à Dakar, Sénégal.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Acceptation des CGU</h2>
            <p>L'accès et l'utilisation du Service impliquent l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Description du Service</h2>
            <p>G-CRM est une application de gestion commerciale et de trésorerie destinée aux TPE/PME. Elle permet notamment :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>La gestion de la base clients</li>
              <li>La création et le suivi des factures et devis</li>
              <li>La tenue d'un journal comptable simplifié</li>
              <li>Le suivi de la trésorerie (caisse, mobile money, banque)</li>
              <li>L'export de documents au format PDF</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. Inscription et compte utilisateur</h2>
            <p>L'utilisation du Service nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes et à jour. Il est responsable de la confidentialité de ses identifiants de connexion et de toute activité réalisée sous son compte.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">5. Obligations de l'utilisateur</h2>
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utiliser le Service conformément à sa destination et aux lois en vigueur</li>
              <li>Ne pas tenter de compromettre la sécurité ou l'intégrité du Service</li>
              <li>Ne pas reproduire, copier ou revendre tout ou partie du Service</li>
              <li>Sauvegarder régulièrement ses données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">6. Propriété intellectuelle</h2>
            <p>Le Service, sa structure, son design, son code source et l'ensemble des éléments le composant sont la propriété exclusive de GROWHUB SARL. Toute reproduction ou utilisation non autorisée est strictement interdite.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">7. Responsabilité</h2>
            <p>GROWHUB SARL s'efforce d'assurer la disponibilité du Service mais ne garantit pas un fonctionnement ininterrompu. L'utilisateur reconnaît que le Service est fourni « en l'état ». GROWHUB SARL ne saurait être tenue responsable des pertes de données ou dommages indirects liés à l'utilisation du Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">8. Résiliation</h2>
            <p>L'utilisateur peut résilier son compte à tout moment. GROWHUB SARL se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU, sans préavis ni indemnité.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">9. Droit applicable et litiges</h2>
            <p>Les présentes CGU sont régies par le droit sénégalais. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux de Dakar seront seuls compétents.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">10. Contact</h2>
            <p>Pour toute question relative aux présentes CGU :</p>
            <p className="mt-2 font-semibold">GROWHUB SARL<br />Dakar, Sénégal<br />Email : g-crm@growhubsenegal.com</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/landing" className="hover:text-foreground transition-colors">← Retour à l'accueil</Link>
          <Link to="/confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
          <Link to="/protection-donnees" className="hover:text-foreground transition-colors">Protection des données</Link>
        </div>
      </article>
    </div>
  );
}
