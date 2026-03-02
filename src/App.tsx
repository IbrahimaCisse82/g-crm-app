import { AppProvider, useApp } from '@/context/AppContext';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import ClientsPage from '@/pages/ClientsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import QuotesPage from '@/pages/QuotesPage';
import ProductsPage from '@/pages/ProductsPage';
import JournalPage from '@/pages/JournalPage';
import CashPage from '@/pages/CashPage';
import CompanyPage from '@/pages/CompanyPage';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { isLoggedIn, currentSection } = useApp();

  if (!isLoggedIn) return <LoginPage />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    clients: <ClientsPage />,
    factures: <InvoicesPage />,
    devis: <QuotesPage />,
    produits: <ProductsPage />,
    journal: <JournalPage />,
    caisse: <CashPage />,
    entreprise: <CompanyPage />,
  };

  return (
    <AppLayout>
      {pages[currentSection] || <Dashboard />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster />
    </AppProvider>
  );
}
