import { AppData } from '@/types';

export const demoData: AppData = {
  co: {
    id: 'co-1',
    nom: 'GROW HUB SARL',
    adr: 'Dakar, Sénégal',
    tel: '+221 77 000 00 00',
    email: 'demo@gcrm.app',
    ninea: 'SN-2024-001',
    rccm: 'DKR-2024-001',
    slogan: 'Votre croissance, notre mission',
    tva: 18,
    devise: 'FCFA',
  },
  clients: [
    { id: 'cli-1', pre: 'Bakary', nom: 'Diallo', email: 'bakary@example.sn', tel: '+221 77 111 22 33', ent: 'Particulier', stat: 'Actif', adr: 'Dakar, Plateau', notes: '' },
    { id: 'cli-2', pre: 'Fatou', nom: 'Traoré', email: 'fatou@traoresa.sn', tel: '+221 76 444 55 66', ent: 'Traoré SARL', stat: 'Actif', adr: 'Thiès, Centre', notes: 'Client fidèle' },
    { id: 'cli-3', pre: 'Ibrahim', nom: 'Koné', email: 'ibra.kone@mail.com', tel: '+221 70 777 88 99', ent: 'Koné Consulting', stat: 'Actif', adr: 'Saint-Louis', notes: '' },
    { id: 'cli-4', pre: 'Aïssatou', nom: 'Ba', email: 'aissatou.ba@pro.sn', tel: '+221 78 222 33 44', ent: 'Ba & Associés', stat: 'Prospect', adr: 'Ziguinchor', notes: 'À relancer' },
  ],
  produits: [
    { id: 'pro-1', nom: 'Création site web', typ: 'Service', prix: 350000, unit: 'forfait', desc: 'Site vitrine responsive 5 pages' },
    { id: 'pro-2', nom: 'Gestion réseaux sociaux', typ: 'Service', prix: 75000, unit: 'mois', desc: 'Pack mensuel 12 posts + stories' },
    { id: 'pro-3', nom: 'Formation Excel', typ: 'Service', prix: 45000, unit: 'session', desc: 'Formation 2 jours tout niveau' },
    { id: 'pro-4', nom: 'Audit marketing digital', typ: 'Service', prix: 120000, unit: 'forfait', desc: 'Analyse complète de votre présence digitale' },
  ],
  factures: [
    { id: 'fac-1', num: 'FAC-2026-0001', cliId: 'cli-1', arts: [{ des: 'Création site web', qty: 1, pu: 350000 }], ht: 350000, tva: 63000, ttc: 413000, pay: 'Virement', mmC: '', date: '2026-02-01', ech: '2026-02-15', stat: 'Payée', notes: '', regle: 413000 },
    { id: 'fac-2', num: 'FAC-2026-0002', cliId: 'cli-2', arts: [{ des: 'Gestion réseaux sociaux', qty: 3, pu: 75000 }], ht: 225000, tva: 40500, ttc: 265500, pay: 'Wave', mmC: 'Wave 77 000 00 00', date: '2026-02-10', ech: '2026-03-10', stat: 'En attente', notes: '', regle: 0 },
    { id: 'fac-3', num: 'FAC-2026-0003', cliId: 'cli-3', arts: [{ des: 'Formation Excel', qty: 2, pu: 45000 }], ht: 90000, tva: 16200, ttc: 106200, pay: 'Espèce', mmC: '', date: '2026-01-20', ech: '2026-02-10', stat: 'En retard', notes: 'Relance envoyée', regle: 0 },
  ],
  devis: [
    { id: 'dev-1', num: 'DEV-2026-0001', cliId: 'cli-4', arts: [{ des: 'Audit marketing digital', qty: 1, pu: 120000 }], ht: 120000, tva: 21600, ttc: 141600, date: '2026-02-20', val: 30, stat: 'En attente', notes: '' },
  ],
  mm: [
    { id: 'mm-1', op: 'Wave', tit: 'GROW HUB SARL', num: '77 000 00 00', sol: 500000 },
    { id: 'mm-2', op: 'Orange Money', tit: 'GROW HUB SARL', num: '76 000 00 00', sol: 250000 },
    { id: 'mm-3', op: 'Yas Money', tit: 'GROW HUB SARL', num: '70 000 00 00', sol: 150000 },
  ],
  journal: [
    { id: 'j-1', type: 'Recette', date: '2026-02-01', lib: 'Règlement FAC-2026-0001 — Bakary Diallo', cat: 'Vente', mnt: 413000, mode: 'Virement', cpt: 'Banque', facId: 'fac-1' },
    { id: 'j-2', type: 'Dépense', date: '2026-02-05', lib: 'Achat matériel informatique', cat: 'Équipement', mnt: 85000, mode: 'Espèce', cpt: 'Caisse', facId: null },
    { id: 'j-3', type: 'Dépense', date: '2026-02-12', lib: 'Loyer bureau février', cat: 'Charges fixes', mnt: 120000, mode: 'Virement', cpt: 'Banque', facId: null },
    { id: 'j-4', type: 'Recette', date: '2026-02-15', lib: 'Acompte Fatou Traoré', cat: 'Vente', mnt: 100000, mode: 'Wave', cpt: 'Wave 77 000 00 00', facId: 'fac-2' },
    { id: 'j-5', type: 'Recette', date: '2026-02-18', lib: 'Paiement Ibrahim Koné', cat: 'Vente', mnt: 50000, mode: 'Orange Money', cpt: 'Orange Money 76 000 00 00', facId: 'fac-3' },
    { id: 'j-6', type: 'Dépense', date: '2026-02-22', lib: 'Fournitures bureau', cat: 'Charges', mnt: 25000, mode: 'Yas Money', cpt: 'Yas Money 70 000 00 00', facId: null },
  ],
};
