import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppData, Section, Client, Facture, Devis, Produit, MobileMoney, JournalEntry } from '@/types';
import { demoData } from '@/data/demoData';

interface AppContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  currentSection: Section;
  setCurrentSection: (s: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  userName: string;
  loginDemo: () => void;
  logout: () => void;
  cliName: (id: string) => string;
  fmt: (n: number) => string;
  addClient: (c: Client) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addFacture: (f: Facture) => void;
  updateFacture: (f: Facture) => void;
  deleteFacture: (id: string) => void;
  addDevis: (d: Devis) => void;
  updateDevis: (d: Devis) => void;
  deleteDevis: (id: string) => void;
  addProduit: (p: Produit) => void;
  updateProduit: (p: Produit) => void;
  deleteProduit: (id: string) => void;
  addJournal: (j: JournalEntry) => void;
  deleteJournal: (id: string) => void;
  addMM: (m: MobileMoney) => void;
  deleteMM: (id: string) => void;
}

const emptyData: AppData = {
  co: { nom: '', adr: '', tel: '', email: '', ninea: '', rccm: '', slogan: '', tva: 18, devise: 'FCFA' },
  clients: [], produits: [], factures: [], devis: [], mm: [], journal: [],
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');

  const loginDemo = useCallback(() => {
    setData({ ...demoData });
    setUserName('Compte Démo');
    setIsLoggedIn(true);
    setCurrentSection('dashboard');
  }, []);

  const logout = useCallback(() => {
    setData(emptyData);
    setIsLoggedIn(false);
    setUserName('');
    setCurrentSection('dashboard');
  }, []);

  const cliName = useCallback((id: string) => {
    const c = data.clients.find(x => x.id === id);
    return c ? `${c.pre} ${c.nom}` : '—';
  }, [data.clients]);

  const fmt = useCallback((n: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' ' + (data.co?.devise || 'FCFA');
  }, [data.co?.devise]);

  const addClient = (c: Client) => setData(d => ({ ...d, clients: [...d.clients, c] }));
  const updateClient = (c: Client) => setData(d => ({ ...d, clients: d.clients.map(x => x.id === c.id ? c : x) }));
  const deleteClient = (id: string) => setData(d => ({ ...d, clients: d.clients.filter(x => x.id !== id) }));

  const addFacture = (f: Facture) => setData(d => ({ ...d, factures: [...d.factures, f] }));
  const updateFacture = (f: Facture) => setData(d => ({ ...d, factures: d.factures.map(x => x.id === f.id ? f : x) }));
  const deleteFacture = (id: string) => setData(d => ({ ...d, factures: d.factures.filter(x => x.id !== id) }));

  const addDevis = (d2: Devis) => setData(d => ({ ...d, devis: [...d.devis, d2] }));
  const updateDevis = (d2: Devis) => setData(d => ({ ...d, devis: d.devis.map(x => x.id === d2.id ? d2 : x) }));
  const deleteDevis = (id: string) => setData(d => ({ ...d, devis: d.devis.filter(x => x.id !== id) }));

  const addProduit = (p: Produit) => setData(d => ({ ...d, produits: [...d.produits, p] }));
  const updateProduit = (p: Produit) => setData(d => ({ ...d, produits: d.produits.map(x => x.id === p.id ? p : x) }));
  const deleteProduit = (id: string) => setData(d => ({ ...d, produits: d.produits.filter(x => x.id !== id) }));

  const addJournal = (j: JournalEntry) => setData(d => ({ ...d, journal: [j, ...d.journal] }));
  const deleteJournal = (id: string) => setData(d => ({ ...d, journal: d.journal.filter(x => x.id !== id) }));

  const addMM = (m: MobileMoney) => setData(d => ({ ...d, mm: [...d.mm, m] }));
  const deleteMM = (id: string) => setData(d => ({ ...d, mm: d.mm.filter(x => x.id !== id) }));

  return (
    <AppContext.Provider value={{
      data, setData, isLoggedIn, setIsLoggedIn, currentSection, setCurrentSection,
      sidebarOpen, setSidebarOpen, userName, loginDemo, logout, cliName, fmt,
      addClient, updateClient, deleteClient,
      addFacture, updateFacture, deleteFacture,
      addDevis, updateDevis, deleteDevis,
      addProduit, updateProduit, deleteProduit,
      addJournal, deleteJournal,
      addMM, deleteMM,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
