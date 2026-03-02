import { useApp } from '@/context/AppContext';
import { Section } from '@/types';

const navItems: { section: Section; icon: string; label: string; badge?: boolean }[] = [
  { section: 'dashboard', icon: '📊', label: 'Tableau de bord' },
  { section: 'clients', icon: '👥', label: 'Clients', badge: true },
  { section: 'factures', icon: '🧾', label: 'Factures', badge: true },
  { section: 'devis', icon: '📋', label: 'Devis' },
  { section: 'produits', icon: '📦', label: 'Produits & Services' },
  { section: 'journal', icon: '📒', label: 'Journal' },
  { section: 'caisse', icon: '🏦', label: 'Caisse & Paiements' },
  { section: 'entreprise', icon: '⚙️', label: 'Infos Entreprise' },
];

export default function AppSidebar() {
  const { currentSection, setCurrentSection, sidebarOpen, setSidebarOpen, data, userName, logout } = useApp();

  const pendingCount = data.factures.filter(f => f.stat === 'En attente' || f.stat === 'En retard').length;
  const initials = userName.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase() || 'U';

  const goTo = (s: Section) => {
    setCurrentSection(s);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-[150] bg-foreground/40 backdrop-blur-sm transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`w-[252px] h-screen bg-sidebar fixed top-0 left-0 z-[200] border-r border-sidebar-border flex flex-col transition-transform duration-300 shadow-lg lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="h-[60px] flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
          <div className="w-[34px] h-[34px] rounded-[9px] gradient-primary flex items-center justify-center font-black text-[15px] text-primary-foreground shrink-0 shadow-primary animate-[logoPulse_3s_ease-in-out_infinite]">
            G
          </div>
          <div>
            <div className="font-black text-base text-foreground tracking-tight">{data.co.nom || 'G-CRM'}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-[2px]">GROW HUB</div>
          </div>
        </div>

        {/* Search */}
        <div className="p-2.5 px-3 border-b border-sidebar-border shrink-0">
          <div className="bg-sidebar-hover border-[1.5px] border-sidebar-border rounded-lg h-8 flex items-center gap-1.5 px-2.5 transition-all focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10">
            <span className="text-sm text-muted-foreground">🔍</span>
            <input className="bg-transparent border-none outline-none text-xs text-foreground flex-1 font-sans placeholder:text-muted-foreground" placeholder="Rechercher..." />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-2 overflow-y-auto">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-muted-foreground px-2 pt-2.5 pb-1">Principal</div>
          {navItems.slice(0, 5).map(item => (
            <button
              key={item.section}
              onClick={() => goTo(item.section)}
              className={`w-full flex items-center h-[38px] px-2 rounded-lg text-[13px] font-medium mb-px transition-all relative overflow-hidden group
                ${currentSection === item.section
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground'
                }`}
            >
              <div className={`absolute left-0 top-1/2 w-[3px] rounded-r-[3px] bg-primary -translate-y-1/2 transition-all ${currentSection === item.section ? 'h-[22px]' : 'h-0 group-hover:h-4'}`} />
              <span className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[15px] shrink-0 transition-transform group-hover:scale-110">
                {item.icon}
              </span>
              <span className="flex-1 text-left text-[13px]">{item.label}</span>
              {item.section === 'clients' && data.clients.length > 0 && (
                <span className="min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 inline-flex items-center justify-center">{data.clients.length}</span>
              )}
              {item.section === 'factures' && pendingCount > 0 && (
                <span className="min-w-[18px] h-[18px] bg-accent text-accent-foreground text-[10px] font-bold rounded-full px-1.5 inline-flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          ))}

          <div className="h-px bg-sidebar-border my-1.5 mx-2" />
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-muted-foreground px-2 pt-2.5 pb-1">Trésorerie</div>
          {navItems.slice(5, 7).map(item => (
            <button
              key={item.section}
              onClick={() => goTo(item.section)}
              className={`w-full flex items-center h-[38px] px-2 rounded-lg text-[13px] font-medium mb-px transition-all relative overflow-hidden group
                ${currentSection === item.section
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground'
                }`}
            >
              <div className={`absolute left-0 top-1/2 w-[3px] rounded-r-[3px] bg-primary -translate-y-1/2 transition-all ${currentSection === item.section ? 'h-[22px]' : 'h-0 group-hover:h-4'}`} />
              <span className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[15px] shrink-0">{item.icon}</span>
              <span className="flex-1 text-left text-[13px]">{item.label}</span>
            </button>
          ))}

          <div className="h-px bg-sidebar-border my-1.5 mx-2" />
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-muted-foreground px-2 pt-2.5 pb-1">Administration</div>
          {navItems.slice(7).map(item => (
            <button
              key={item.section}
              onClick={() => goTo(item.section)}
              className={`w-full flex items-center h-[38px] px-2 rounded-lg text-[13px] font-medium mb-px transition-all relative overflow-hidden group
                ${currentSection === item.section
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-foreground'
                }`}
            >
              <div className={`absolute left-0 top-1/2 w-[3px] rounded-r-[3px] bg-primary -translate-y-1/2 transition-all ${currentSection === item.section ? 'h-[22px]' : 'h-0 group-hover:h-4'}`} />
              <span className="w-8 h-8 flex items-center justify-center rounded-[7px] text-[15px] shrink-0">{item.icon}</span>
              <span className="flex-1 text-left text-[13px]">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-2.5 px-3 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer hover:bg-sidebar-hover transition-colors group" onClick={logout}>
            <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-[hsl(239,84%,67%)] to-[hsl(263,70%,50%)] flex items-center justify-center font-bold text-xs text-primary-foreground relative shrink-0 shadow-md">
              {initials}
              <div className="absolute -bottom-px -right-px w-[9px] h-[9px] rounded-full bg-success border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{userName || 'Utilisateur'}</div>
              <div className="text-[10px] text-muted-foreground">Déconnexion</div>
            </div>
            <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">⋮</span>
          </div>
        </div>
      </aside>
    </>
  );
}
