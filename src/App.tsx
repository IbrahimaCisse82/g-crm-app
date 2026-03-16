import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { AppProvider } from '@/context/AppContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import LandingPage from '@/pages/LandingPage';
import CGUPage from '@/pages/CGUPage';
import PrivacyPage from '@/pages/PrivacyPage';
import DataProtectionPage from '@/pages/DataProtectionPage';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import ClientsPage from '@/pages/ClientsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import QuotesPage from '@/pages/QuotesPage';
import ProductsPage from '@/pages/ProductsPage';
import JournalPage from '@/pages/JournalPage';
import CashPage from '@/pages/CashPage';
import CompanyPage from '@/pages/CompanyPage';
import NotFound from '@/pages/NotFound';
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

  if (!user) {
    return (
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/cgu" element={<CGUPage />} />
        <Route path="/confidentialite" element={<PrivacyPage />} />
        <Route path="/protection-donnees" element={<DataProtectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <AppProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/factures" element={<InvoicesPage />} />
          <Route path="/devis" element={<QuotesPage />} />
          <Route path="/produits" element={<ProductsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/caisse" element={<CashPage />} />
          <Route path="/entreprise" element={<CompanyPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AppProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
            <PWAInstallBanner />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
