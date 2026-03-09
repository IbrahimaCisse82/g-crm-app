import { Link } from 'react-router-dom';

export default function DataProtectionPage() {
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
          <span className="text-muted-foreground text-sm">/ Protection des données</span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-black mb-2 text-foreground">Politique de Protection des Données</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose-custom space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Engagement</h2>
            <p>GROWHUB SARL s'engage à protéger les données personnelles de ses utilisateurs conformément à la loi sénégalaise n°2008-12 du 25 janvier 2008 portant sur la protection des données à caractère personnel et aux standards internationaux en matière de sécurité des données.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Responsable du traitement</h2>
            <p>Le responsable du traitement des données est :</p>
            <p className="mt-2 font-semibold">GROWHUB SARL<br />Siège social : Dakar, Sénégal<br />Email : g-crm@growhubsenegal.com</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Mesures de sécurité techniques</h2>
            <p>Nous mettons en œuvre les mesures de sécurité suivantes pour protéger vos données :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Chiffrement :</strong> toutes les communications sont chiffrées via HTTPS/TLS</li>
              <li><strong>Mots de passe :</strong> les mots de passe sont hachés avec des algorithmes sécurisés (bcrypt) et ne sont jamais stockés en clair</li>
              <li><strong>Isolation des données :</strong> chaque utilisateur accède uniquement à ses propres données grâce à des politiques de sécurité au niveau de la base de données (Row Level Security)</li>
              <li><strong>Sauvegardes :</strong> des sauvegardes régulières sont effectuées pour prévenir toute perte de données</li>
              <li><strong>Accès restreint :</strong> l'accès aux serveurs et bases de données est limité au personnel autorisé</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. Hébergement des données</h2>
            <p>Les données sont hébergées sur des serveurs sécurisés. L'infrastructure utilisée est conforme aux normes de sécurité internationales (SOC 2, ISO 27001). Les données peuvent être hébergées en dehors du Sénégal, dans des centres de données conformes aux réglementations européennes (RGPD).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">5. Notification en cas de violation</h2>
            <p>En cas de violation de données susceptible d'engendrer un risque élevé pour les droits et libertés des utilisateurs, GROWHUB SARL s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Notifier la Commission des Données Personnelles (CDP) du Sénégal dans les 72 heures</li>
              <li>Informer les utilisateurs concernés dans les meilleurs délais</li>
              <li>Mettre en œuvre les mesures correctives nécessaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">6. Transferts internationaux</h2>
            <p>En cas de transfert de données vers des pays tiers, GROWHUB SARL s'assure que ces pays offrent un niveau de protection adéquat ou met en place des garanties contractuelles appropriées.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">7. Suppression des données</h2>
            <p>À la suppression de votre compte, vos données personnelles et commerciales seront définitivement supprimées dans un délai de 30 jours. Certaines données pourront être conservées pour des durées plus longues en cas d'obligation légale (comptabilité, fiscalité).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">8. Sous-traitants</h2>
            <p>Nos sous-traitants techniques sont contractuellement tenus de protéger vos données et de les utiliser uniquement aux fins prévues. La liste de nos sous-traitants peut être communiquée sur demande.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">9. Contact DPO</h2>
            <p>Pour toute question relative à la protection de vos données :</p>
            <p className="mt-2 font-semibold">GROWHUB SARL — Délégué à la Protection des Données<br />Email : g-crm@growhubsenegal.com<br />Adresse : Dakar, Sénégal</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link to="/landing" className="hover:text-foreground transition-colors">← Retour à l'accueil</Link>
          <Link to="/cgu" className="hover:text-foreground transition-colors">CGU</Link>
          <Link to="/confidentialite" className="hover:text-foreground transition-colors">Politique de confidentialité</Link>
        </div>
      </article>
    </div>
  );
}
