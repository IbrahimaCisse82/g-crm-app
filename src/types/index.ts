export type Section = 'dashboard' | 'clients' | 'factures' | 'devis' | 'recus' | 'avoirs' | 'produits' | 'journal' | 'caisse' | 'entreprise' | 'abonnement' | 'archives' | 'admin';

export const sectionPaths: Record<Section, string> = {
  dashboard: '/',
  clients: '/clients',
  factures: '/factures',
  devis: '/devis',
  recus: '/recus',
  avoirs: '/avoirs',
  produits: '/produits',
  journal: '/journal',
  caisse: '/caisse',
  entreprise: '/entreprise',
  abonnement: '/abonnement',
  archives: '/archives',
  admin: '/admin',
};

export const pathToSection: Record<string, Section> = Object.fromEntries(
  Object.entries(sectionPaths).map(([k, v]) => [v, k as Section])
) as Record<string, Section>;

// Shared article line type used in factures and devis
export interface ArticleLine {
  nom: string;
  quantite: number;
  prix_unitaire: number;
  /** Taux TVA spécifique à la ligne (en %). Si non défini, on utilise le taux global de l'entreprise. */
  tva_pct?: number;
}

export const REGIMES_FISCAUX = ['Réel', 'Forfait', 'CGU', 'Exonéré'] as const;
export type RegimeFiscal = typeof REGIMES_FISCAUX[number];

// Journal categories for consistency
export const JOURNAL_CATEGORIES = [
  'Vente',
  'Prestation',
  'Loyer',
  'Fournitures',
  'Transport',
  'Salaires',
  'Impôts & Taxes',
  'Marketing',
  'Équipement',
  'Autre',
] as const;

export const PAYMENT_MODES = ['Espèce', 'Wave', 'Orange Money', 'Yas Money', 'Virement', 'Chèque'] as const;
