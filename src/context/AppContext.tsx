import React, { createContext, useContext, useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useClients, useFactures, useDevis, useProduits, useJournal, useComptesTresorerie, useEntreprise, useCategories } from '@/hooks/useSupabaseData';
import { useSubscription } from '@/hooks/useSubscription';
import type { Section } from '@/types';
import { sectionPaths, pathToSection } from '@/types';

interface AppContextType {
  currentSection: Section;
  setCurrentSection: (s: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isLoggedIn: boolean;
  userName: string;
  logout: () => void;
  clients: ReturnType<typeof useClients>;
  factures: ReturnType<typeof useFactures>;
  devis: ReturnType<typeof useDevis>;
  produits: ReturnType<typeof useProduits>;
  journal: ReturnType<typeof useJournal>;
  comptes: ReturnType<typeof useComptesTresorerie>;
  entreprise: ReturnType<typeof useEntreprise>;
  categories: ReturnType<typeof useCategories>;
  subscription: ReturnType<typeof useSubscription>;
  cliName: (id: string | null) => string;
  fmt: (n: number) => string;
  // Create modal trigger
  createModalTrigger: number;
  triggerCreateModal: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [createModalTrigger, setCreateModalTrigger] = useState(0);

  const currentSection: Section = pathToSection[location.pathname] || 'dashboard';

  const setCurrentSection = useCallback((s: Section) => {
    navigate(sectionPaths[s]);
  }, [navigate]);

  const clients = useClients();
  const factures = useFactures();
  const devis = useDevis();
  const produits = useProduits();
  const journal = useJournal();
  const comptes = useComptesTresorerie();
  const entreprise = useEntreprise();
  const categories = useCategories();
  const subscriptionData = useSubscription();

  const isLoggedIn = !!user;
  const userName = user?.user_metadata?.full_name || user?.email || '';

  const logout = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  const cliName = useCallback((id: string | null) => {
    if (!id) return '—';
    const c = clients.data.find(x => x.id === id);
    return c ? `${c.prenom} ${c.nom}` : '—';
  }, [clients.data]);

  const fmt = useCallback((n: number) => {
    const devise = entreprise.data?.devise || 'FCFA';
    return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' ' + devise;
  }, [entreprise.data?.devise]);

  const triggerCreateModal = useCallback(() => {
    setCreateModalTrigger(prev => prev + 1);
  }, []);

  return (
    <AppContext.Provider value={{
      currentSection, setCurrentSection, sidebarOpen, setSidebarOpen,
      isLoggedIn, userName, logout,
      clients, factures, devis, produits, journal, comptes, entreprise, categories, subscription: subscriptionData,
      cliName, fmt,
      createModalTrigger, triggerCreateModal,
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
