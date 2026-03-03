import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppProvider, useApp } from '@/context/AppContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center gradient-auth">
        <div className="w-[72px] h-[72px] rounded-full gradient-primary flex items-center justify-center shadow-primary animate-[logoPulse_3s_ease-in-out_infinite]">
          <span className="text-3xl font-black text-primary-foreground">G</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

function AppRouter() {
  const { currentSection } = useApp();

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
