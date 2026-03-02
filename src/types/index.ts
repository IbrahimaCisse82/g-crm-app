export interface Client {
  id: string;
  pre: string;
  nom: string;
  email: string;
  tel: string;
  ent: string;
  stat: 'Actif' | 'Prospect' | 'Inactif';
  adr: string;
  notes: string;
}

export interface Article {
  des: string;
  qty: number;
  pu: number;
}

export interface Facture {
  id: string;
  num: string;
  cliId: string;
  arts: Article[];
  ht: number;
  tva: number;
  ttc: number;
  pay: string;
  mmC: string;
  date: string;
  ech: string;
  stat: 'Payée' | 'En attente' | 'En retard' | 'Annulée';
  notes: string;
  regle: number;
}

export interface Devis {
  id: string;
  num: string;
  cliId: string;
  arts: Article[];
  ht: number;
  tva: number;
  ttc: number;
  date: string;
  val: number;
  stat: 'En attente' | 'Accepté' | 'Refusé' | 'Expiré' | 'Converti';
  notes: string;
}

export interface Produit {
  id: string;
  nom: string;
  typ: string;
  prix: number;
  unit: string;
  desc: string;
}

export interface MobileMoney {
  id: string;
  op: string;
  tit: string;
  num: string;
  sol: number;
}

export interface JournalEntry {
  id: string;
  type: 'Recette' | 'Dépense';
  date: string;
  lib: string;
  cat: string;
  mnt: number;
  mode: string;
  cpt: string;
  facId: string | null;
}

export interface Entreprise {
  id?: string;
  nom: string;
  adr: string;
  tel: string;
  email: string;
  ninea: string;
  rccm: string;
  slogan: string;
  tva: number;
  devise: string;
  logo?: string | null;
}

export interface AppData {
  co: Entreprise;
  clients: Client[];
  produits: Produit[];
  factures: Facture[];
  devis: Devis[];
  mm: MobileMoney[];
  journal: JournalEntry[];
}

export type Section = 'dashboard' | 'clients' | 'factures' | 'devis' | 'produits' | 'journal' | 'caisse' | 'entreprise';
