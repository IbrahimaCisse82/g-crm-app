export type Section = 'dashboard' | 'clients' | 'factures' | 'devis' | 'produits' | 'journal' | 'caisse' | 'entreprise';

export const sectionPaths: Record<Section, string> = {
  dashboard: '/',
  clients: '/clients',
  factures: '/factures',
  devis: '/devis',
  produits: '/produits',
  journal: '/journal',
  caisse: '/caisse',
  entreprise: '/entreprise',
};

export const pathToSection: Record<string, Section> = Object.fromEntries(
  Object.entries(sectionPaths).map(([k, v]) => [v, k as Section])
) as Record<string, Section>;

// Shared article line type used in factures and devis
export interface ArticleLine {
  nom: string;
  quantite: number;
  prix_unitaire: number;
}

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
