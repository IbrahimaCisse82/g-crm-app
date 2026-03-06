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
