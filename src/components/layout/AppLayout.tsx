import { useApp } from '@/context/AppContext';
import AppSidebar from './AppSidebar';

const sectionTitles: Record<string, string> = {
  dashboard: 'Tableau de bord',
  clients: 'Clients',
  factures: 'Factures',
  devis: 'Devis',
  produits: 'Produits & Services',
  journal: 'Journal',
  caisse: 'Caisse & Trésorerie',
  entreprise: 'Infos Entreprise',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentSection, sidebarOpen, setSidebarOpen, setCurrentSection } = useApp();

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="fixed top-0 left-0 right-0 h-[52px] bg-card border-b border-border flex items-center justify-between px-4 z-[90] shadow-card lg:hidden">
        <span className="font-black text-base text-primary tracking-tight">G-CRM</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-[34px] h-[34px] rounded-lg bg-background border border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary transition-all"
        >
          <span className={`w-[15px] h-[1.5px] bg-foreground rounded-sm transition-all ${sidebarOpen ? 'rotate-45 translate-y-[5.5px]' : ''}`} />
          <span className={`w-[15px] h-[1.5px] bg-foreground rounded-sm transition-all ${sidebarOpen ? 'opacity-0 scale-x-0' : ''}`} />
          <span className={`w-[15px] h-[1.5px] bg-foreground rounded-sm transition-all ${sidebarOpen ? '-rotate-45 -translate-y-[5.5px]' : ''}`} />
        </button>
      </div>

      <div className="lg:ml-[252px] flex-1 flex flex-col min-h-screen pt-[52px] lg:pt-0">
        <div className="hidden lg:flex h-14 bg-card border-b border-border items-center px-6 sticky top-0 z-[80] gap-3 shadow-card shrink-0">
          <h2 className="font-extrabold text-base flex-1 text-foreground tracking-tight">{sectionTitles[currentSection]}</h2>
          <input
            className="bg-background border-[1.5px] border-border rounded-lg py-1.5 px-3 text-xs text-foreground outline-none w-[200px] font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/10"
            placeholder="🔍 Rechercher..."
          />
        </div>

        <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-[190] shadow-[0_-2px_20px_rgba(0,0,0,0.12)] lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center h-[58px]">
          {[
            { key: 'dashboard', icon: '📊', label: 'Accueil' },
            { key: 'factures', icon: '🧾', label: 'Factures' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setCurrentSection(item.key as any)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent font-sans transition-colors ${currentSection === item.key ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <span className="text-[22px] leading-none">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
          <button
            className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[hsl(90,71%,43%)] to-[hsl(145,77%,23%)] text-primary-foreground text-[28px] font-light border-none flex items-center justify-center shadow-lg shrink-0 -mt-1.5"
          >
            ＋
          </button>
          {[
            { key: 'caisse', icon: '💰', label: 'Tréso' },
            { key: 'clients', icon: '👥', label: 'Plus' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setCurrentSection(item.key as any)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent font-sans transition-colors ${currentSection === item.key ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <span className="text-[22px] leading-none">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
