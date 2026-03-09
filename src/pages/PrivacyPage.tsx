import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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
          <span className="text-muted-foreground text-sm">/ Confidentialité</span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-black mb-2 text-foreground">Politique de Confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose-custom space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Introduction</h2>
            <p>GROWHUB SARL, société de droit sénégalais basée à Dakar, est responsable du traitement des données personnelles collectées via la plateforme G-CRM. La présente politique décrit comment nous collectons, utilisons et protégeons vos données.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Données d'inscription :</strong> nom, adresse email, mot de passe (chiffré), nom de l'entreprise</li>
              <li><strong>Données commerciales :</strong> informations clients, factures, devis, transactions saisies par l'utilisateur</li>
              <li><strong>Données d'entreprise :</strong> nom, adresse, NINEA, RCCM, coordonnées de l'entreprise de l'utilisateur</li>
              <li><strong>Données techniques :</strong> adresse IP, type de navigateur, données de connexion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Finalité du traitement</h2>
            <p>Les données collectées sont utilisées pour :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Fournir et maintenir le Service</li>
              <li>Gérer les comptes utilisateurs et l'authentification</li>
              <li>Personnaliser l'expérience utilisateur</li>
              <li>Assurer la sécurité et prévenir les fraudes</li>
              <li>Améliorer le Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. Partage des données</h2>
            <p>Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées uniquement avec :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Nos prestataires techniques (hébergement, base de données) sous contrat de confidentialité</li>
              <li>Les autorités compétentes en cas d'obligation légale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">5. Durée de conservation</h2>
            <p>Les données sont conservées pendant toute la durée d'utilisation du Service et pendant une durée de 12 mois après la suppression du compte, sauf obligation légale imposant une durée différente.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">6. Cookies</h2>
            <p>G-CRM utilise des cookies strictement nécessaires au fonctionnement du Service (authentification, session). Aucun cookie publicitaire ou de traçage n'est utilisé.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">7. Vos droits</h2>
            <p>Conformément à la loi sénégalaise n°2008-12 sur la protection des données à caractère personnel, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit de suppression</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit à la portabilité de vos données</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits, contactez-nous à : <strong>g-crm@growhubsenegal.com</strong></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">8. Autorité de contrôle</h2>
            <p>Vous pouvez adresser une réclamation à la Commission des Données Personnelles (CDP) du Sénégal si vous estimez que le traitement de vos données n'est pas conforme à la réglementation.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">9. Contact</h2>
            <p className="font-semibold">GROWHUB SARL<br />Dakar, Sénégal<br />Email : g-crm@growhubsenegal.com</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/landing" className="hover:text-foreground transition-colors">← Retour à l'accueil</Link>
          <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link to="/protection-donnees" className="hover:text-foreground transition-colors">Protection des données</Link>
        </div>
      </article>
    </div>
  );
}
