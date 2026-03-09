import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building2, BookOpen, LogOut } from 'lucide-react';
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

const quickActions = [
  { path: '/factures', label: '🧾 Facture' },
  { path: '/devis', label: '📋 Devis' },
  { path: '/journal', label: '📒 Transaction' },
  { path: '/clients', label: '👥 Client' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentSection, sidebarOpen, setSidebarOpen, logout } = useApp();
  const navigate = useNavigate();
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowTopMenu(false);
      }
    };
    if (showTopMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTopMenu]);

  const handleFabAction = (path: string) => {
    setShowFabMenu(false);
    navigate(path);
    setTimeout(() => window.dispatchEvent(new CustomEvent('open-create-modal')), 100);
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="fixed top-0 left-0 right-0 h-[52px] bg-card border-b border-border flex items-center justify-between px-4 z-[90] shadow-card lg:hidden">
        <span className="font-black text-base text-primary tracking-tight">G-CRM</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowTopMenu(!showTopMenu)}
            className="w-[34px] h-[34px] rounded-lg bg-background border border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary transition-all"
          >
            <span className={`w-[15px] h-[1.5px] bg-foreground rounded-sm transition-all ${showTopMenu ? 'rotate-45 translate-y-[5.5px]' : ''}`} />
            <span className={`w-[15px] h-[1.5px] bg-foreground rounded-sm transition-all ${showTopMenu ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`w-[15px] h-[1.5px] bg-foreground rounded-sm transition-all ${showTopMenu ? '-rotate-45 -translate-y-[5.5px]' : ''}`} />
          </button>
          {showTopMenu && (
            <div className="absolute right-0 top-[40px] w-48 bg-card border border-border rounded-xl shadow-elevated py-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => { setShowTopMenu(false); navigate('/entreprise'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Infos Entreprise
              </button>
              <button
                onClick={() => { setShowTopMenu(false); navigate('/journal'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                Journal
              </button>
              <div className="h-px bg-border mx-2 my-1" />
              <button
                onClick={() => { setShowTopMenu(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:ml-[252px] flex-1 flex flex-col min-h-screen pt-[52px] lg:pt-0">
        <div className="hidden lg:flex h-14 bg-card border-b border-border items-center px-6 sticky top-0 z-[80] gap-3 shadow-card shrink-0">
          <h2 className="font-extrabold text-base flex-1 text-foreground tracking-tight">{sectionTitles[currentSection]}</h2>
        </div>

        <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </div>
      </div>

      {showFabMenu && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-[180] lg:hidden" onClick={() => setShowFabMenu(false)}>
          <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center animate-[slideUp_0.15s_ease]" onClick={e => e.stopPropagation()}>
            {quickActions.map(a => (
              <button
                key={a.path}
                onClick={() => handleFabAction(a.path)}
                className="bg-card border border-border rounded-full px-4 py-2.5 text-sm font-bold shadow-elevated flex items-center gap-2 hover:bg-background transition-all whitespace-nowrap"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-[190] shadow-[0_-2px_20px_rgba(0,0,0,0.12)] lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center h-[58px]">
          {[
            { path: '/', icon: '📊', label: 'Accueil', section: 'dashboard' },
            { path: '/factures', icon: '🧾', label: 'Factures', section: 'factures' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent font-sans transition-colors ${currentSection === item.section ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <span className="text-[22px] leading-none">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[hsl(90,71%,43%)] to-[hsl(145,77%,23%)] text-primary-foreground text-[28px] font-light border-none flex items-center justify-center shadow-lg shrink-0 -mt-1.5 transition-transform ${showFabMenu ? 'rotate-45' : ''}`}
          >
            ＋
          </button>
          {[
            { path: '/caisse', icon: '💰', label: 'Tréso', section: 'caisse' },
            { path: '/clients', icon: '👥', label: 'Plus', section: 'clients' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 border-none bg-transparent font-sans transition-colors ${currentSection === item.section ? 'text-primary' : 'text-muted-foreground'}`}
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
