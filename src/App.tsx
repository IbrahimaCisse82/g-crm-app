import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { AppProvider } from '@/context/AppContext';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import LockScreen from '@/components/LockScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
// Pages du premier écran chargées immédiatement, le reste en lazy loading
import LoginPage from '@/pages/LoginPage';
import LandingPage from '@/pages/LandingPage';
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const CGUPage = lazy(() => import('@/pages/CGUPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const DataProtectionPage = lazy(() => import('@/pages/DataProtectionPage'));
const AppLayout = lazy(() => import('@/components/layout/AppLayout'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ClientsPage = lazy(() => import('@/pages/ClientsPage'));
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage'));
const QuotesPage = lazy(() => import('@/pages/QuotesPage'));
const RecusPage = lazy(() => import('@/pages/RecusPage'));
const AvoirsPage = lazy(() => import('@/pages/AvoirsPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const JournalPage = lazy(() => import('@/pages/JournalPage'));
const CashPage = lazy(() => import('@/pages/CashPage'));
const CompanyPage = lazy(() => import('@/pages/CompanyPage'));
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage'));
const ArchivesPage = lazy(() => import('@/pages/ArchivesPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
import OnboardingWizard from '@/components/OnboardingWizard';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center gradient-auth">
      <div className="w-[72px] h-[72px] rounded-full gradient-primary flex items-center justify-center shadow-primary animate-[logoPulse_3s_ease-in-out_infinite]">
        <span className="text-3xl font-black text-primary-foreground">G</span>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { isLocked, unlock } = useInactivityTimer(!!user);

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    );
  }

  return (
    <AppProvider>
      {isLocked && <LockScreen onUnlock={unlock} />}
      <OnboardingWizard />
      <Suspense fallback={<PageLoader />}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/factures" element={<InvoicesPage />} />
            <Route path="/devis" element={<QuotesPage />} />
            <Route path="/recus" element={<RecusPage />} />
            <Route path="/avoirs" element={<AvoirsPage />} />
            <Route path="/produits" element={<ProductsPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/caisse" element={<CashPage />} />
            <Route path="/entreprise" element={<CompanyPage />} />
            <Route path="/abonnement" element={<SubscriptionPage />} />
            <Route path="/archives" element={<ArchivesPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </Suspense>
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
