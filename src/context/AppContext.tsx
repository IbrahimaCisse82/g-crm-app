import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClients, useFactures, useDevis, useProduits, useJournal, useComptesTresorerie, useEntreprise } from '@/hooks/useSupabaseData';
import type { Section } from '@/types';

interface AppContextType {
  // Navigation
  currentSection: Section;
  setCurrentSection: (s: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  // Auth
  isLoggedIn: boolean;
  userName: string;
  logout: () => void;
  // Data (from Supabase)
  clients: ReturnType<typeof useClients>;
  factures: ReturnType<typeof useFactures>;
  devis: ReturnType<typeof useDevis>;
  produits: ReturnType<typeof useProduits>;
  journal: ReturnType<typeof useJournal>;
  comptes: ReturnType<typeof useComptesTresorerie>;
  entreprise: ReturnType<typeof useEntreprise>;
  // Helpers
  cliName: (id: string | null) => string;
  fmt: (n: number) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [currentSection, setCurrentSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const clients = useClients();
  const factures = useFactures();
  const devis = useDevis();
  const produits = useProduits();
  const journal = useJournal();
  const comptes = useComptesTresorerie();
  const entreprise = useEntreprise();

  const isLoggedIn = !!user;
  const userName = user?.user_metadata?.full_name || user?.email || '';

  const logout = useCallback(async () => {
    await signOut();
    setCurrentSection('dashboard');
  }, [signOut]);

  const cliName = useCallback((id: string | null) => {
    if (!id) return '—';
    const c = clients.data.find(x => x.id === id);
    return c ? `${c.prenom} ${c.nom}` : '—';
  }, [clients.data]);

  const fmt = useCallback((n: number) => {
    const devise = entreprise.data?.devise || 'FCFA';
    return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' ' + devise;
  }, [entreprise.data?.devise]);

  return (
    <AppContext.Provider value={{
      currentSection, setCurrentSection, sidebarOpen, setSidebarOpen,
      isLoggedIn, userName, logout,
      clients, factures, devis, produits, journal, comptes, entreprise,
      cliName, fmt,
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
