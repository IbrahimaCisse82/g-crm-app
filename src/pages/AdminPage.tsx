import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';
import {
  Shield, Users, CreditCard, Clock, CheckCircle2, XCircle,
  Search, TrendingUp, AlertCircle, Crown, RefreshCw, LayoutDashboard,
  Download, ArrowUpDown, ChevronLeft, ChevronRight, Ban, UserCheck,
  Mail, Phone,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type RequestRow = {
  id: string;
  user_id: string;
  plan: string;
  payment_mode: string;
  payment_reference: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  amount: number | null;
  payment_mode: string | null;
};

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type Section = 'dashboard' | 'requests' | 'subscriptions' | 'users';
const PAGE_SIZE = 20;

const fmtAmount = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

export default function AdminPage() {
  const { isAdmin, isLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>('dashboard');

  const requestsQuery = useQuery({
    queryKey: ['admin', 'requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const subsQuery = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as SubscriptionRow[];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const profilesQuery = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    (profilesQuery.data ?? []).forEach(p => m.set(p.user_id, p));
    return m;
  }, [profilesQuery.data]);

  const subMap = useMemo(() => {
    const m = new Map<string, SubscriptionRow>();
    (subsQuery.data ?? []).forEach(s => m.set(s.user_id, s));
    return m;
  }, [subsQuery.data]);

  const userLabel = (uid: string) => {
    const p = profileMap.get(uid);
    if (!p) return uid.slice(0, 8) + '…';
    return p.full_name || p.email || uid.slice(0, 8) + '…';
  };
  const userEmail = (uid: string) => profileMap.get(uid)?.email ?? '—';
  const userPhone = (uid: string) => profileMap.get(uid)?.phone ?? '—';

  const stats = useMemo(() => {
    const reqs = requestsQuery.data ?? [];
    const subs = subsQuery.data ?? [];
    const now = Date.now();
    return {
      pendingCount: reqs.filter(r => r.status === 'pending').length,
      activeProUsers: subs.filter(s =>
        s.plan === 'pro' && s.status === 'active' &&
        (!s.expires_at || new Date(s.expires_at).getTime() > now)
      ).length,
      totalUsers: profilesQuery.data?.length ?? 0,
      totalRevenue: reqs.filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
      monthRevenue: reqs.filter(r => {
        if (r.status !== 'approved') return false;
        const d = new Date(r.created_at);
        const cur = new Date();
        return d.getMonth() === cur.getMonth() && d.getFullYear() === cur.getFullYear();
      }).reduce((sum, r) => sum + Number(r.amount || 0), 0),
    };
  }, [requestsQuery.data, subsQuery.data, profilesQuery.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm">Vérification des permissions…</div>
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['admin'] });
    toast.success('Données actualisées');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-primary">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Backoffice Admin</h1>
            <p className="text-xs text-muted-foreground">Gestion de la plateforme G-CRM</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 bg-card border-[1.5px] border-border text-muted-foreground py-1.5 px-3 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* Sub navigation */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        <NavTab active={section === 'dashboard'} onClick={() => setSection('dashboard')} icon={<LayoutDashboard className="w-3.5 h-3.5" />}>Dashboard</NavTab>
        <NavTab active={section === 'requests'} onClick={() => setSection('requests')} icon={<Clock className="w-3.5 h-3.5" />}>
          Demandes {stats.pendingCount > 0 && <span className="ml-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full px-1.5">{stats.pendingCount}</span>}
        </NavTab>
        <NavTab active={section === 'subscriptions'} onClick={() => setSection('subscriptions')} icon={<Crown className="w-3.5 h-3.5" />}>Abonnements</NavTab>
        <NavTab active={section === 'users'} onClick={() => setSection('users')} icon={<Users className="w-3.5 h-3.5" />}>Utilisateurs</NavTab>
      </div>

      {section === 'dashboard' && (
        <DashboardSection
          stats={stats}
          requests={requestsQuery.data ?? []}
          userLabel={userLabel}
          onGoRequests={() => setSection('requests')}
        />
      )}

      {section === 'requests' && (
        <RequestsSection
          requests={requestsQuery.data ?? []}
          loading={requestsQuery.isLoading}
          userLabel={userLabel}
          userEmail={userEmail}
          onChanged={() => qc.invalidateQueries({ queryKey: ['admin'] })}
        />
      )}

      {section === 'subscriptions' && (
        <SubscriptionsSection
          subs={subsQuery.data ?? []}
          loading={subsQuery.isLoading}
          userLabel={userLabel}
          userEmail={userEmail}
          onChanged={() => qc.invalidateQueries({ queryKey: ['admin'] })}
        />
      )}

      {section === 'users' && (
        <UsersSection
          profiles={profilesQuery.data ?? []}
          loading={profilesQuery.isLoading}
          subMap={subMap}
        />
      )}
    </div>
  );
}

/* ------------------------- Shared UI ------------------------- */

function NavTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
        active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}{children}
    </button>
  );
}

function KpiCard({ icon, label, value, accent = 'default' }: { icon: React.ReactNode; label: string; value: string; accent?: 'default' | 'primary' | 'success' | 'warning' }) {
  const accentClass = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-accent/10 text-accent',
  }[accent];
  return (
    <div className="bg-card border border-border rounded-xl p-3.5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${accentClass}`}>{icon}</span>
      </div>
      <div className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-lg font-black text-foreground mt-0.5 truncate">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-accent/10 text-accent',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    active: 'bg-success/10 text-success',
    cancelled: 'bg-muted text-muted-foreground',
    expired: 'bg-destructive/10 text-destructive',
  };
  const label: Record<string, string> = {
    pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée',
    active: 'Active', cancelled: 'Annulée', expired: 'Expirée',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] || 'bg-muted text-muted-foreground'}`}>
      {label[status] || status}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border bg-background/50">
      <div className="text-[11px] text-muted-foreground">Page {page} / {totalPages}</div>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = '\uFEFF' + rows.map(r =>
    r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------- Dashboard ------------------------- */

function DashboardSection({ stats, requests, userLabel, onGoRequests }: {
  stats: { pendingCount: number; activeProUsers: number; totalUsers: number; totalRevenue: number; monthRevenue: number };
  requests: RequestRow[];
  userLabel: (id: string) => string;
  onGoRequests: () => void;
}) {
  const recent = requests.slice(0, 6);
  const pending = requests.filter(r => r.status === 'pending').slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Clock className="w-4 h-4" />} label="Demandes en attente" value={stats.pendingCount.toString()} accent={stats.pendingCount > 0 ? 'warning' : 'default'} />
        <KpiCard icon={<Crown className="w-4 h-4" />} label="Abonnés Pro actifs" value={stats.activeProUsers.toString()} accent="primary" />
        <KpiCard icon={<TrendingUp className="w-4 h-4" />} label="Revenu du mois" value={fmtAmount(stats.monthRevenue)} accent="success" />
        <KpiCard icon={<CreditCard className="w-4 h-4" />} label="Revenu total" value={fmtAmount(stats.totalRevenue)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><AlertCircle className="w-4 h-4 text-accent" /> Demandes à traiter</h3>
            {pending.length > 0 && (
              <button onClick={onGoRequests} className="text-xs font-bold text-primary hover:underline">Voir tout →</button>
            )}
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto opacity-30 mb-2" />
              Aucune demande en attente
            </div>
          ) : (
            <ul className="space-y-2">
              {pending.map(r => (
                <li key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background text-sm">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{userLabel(r.user_id)}</div>
                    <div className="text-[11px] text-muted-foreground">{r.payment_mode} · {fmtAmount(Number(r.amount))}</div>
                  </div>
                  <span className="text-[10.5px] text-muted-foreground shrink-0">{formatDate(r.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <h3 className="font-bold text-sm text-foreground mb-3">Activité récente</h3>
          {recent.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">Aucune activité</div>
          ) : (
            <ul className="space-y-2">
              {recent.map(r => (
                <li key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusPill status={r.status} />
                    <span className="truncate">{userLabel(r.user_id)}</span>
                  </div>
                  <span className="text-[10.5px] text-muted-foreground shrink-0">{formatDate(r.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Requests ------------------------- */

function RequestsSection({ requests, loading, userLabel, userEmail, onChanged }: {
  requests: RequestRow[];
  loading: boolean;
  userLabel: (id: string) => string;
  userEmail: (id: string) => string;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ req: RequestRow; action: 'approve' | 'reject' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let list = [...requests];
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.payment_reference.toLowerCase().includes(q) ||
        r.payment_mode.toLowerCase().includes(q) ||
        userLabel(r.user_id).toLowerCase().includes(q) ||
        userEmail(r.user_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const t = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? t : -t;
    });
    return list;
  }, [requests, statusFilter, search, sortAsc, userLabel, userEmail]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleAction = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: target.action,
          request_id: target.req.id,
          admin_notes: adminNotes.trim() || null,
          months: target.action === 'approve' ? months : undefined,
        },
      });
      if (error) throw error;
      toast.success(target.action === 'approve' ? 'Demande approuvée' : 'Demande rejetée');
      setTarget(null);
      setAdminNotes('');
      setMonths(1);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const header = ['Date', 'Utilisateur', 'Email', 'Mode', 'Référence', 'Montant', 'Statut', 'Note'];
    const rows = filtered.map(r => [
      formatDate(r.created_at), userLabel(r.user_id), userEmail(r.user_id),
      r.payment_mode, r.payment_reference, Number(r.amount), r.status, r.admin_notes || '',
    ]);
    downloadCSV(`demandes-abonnement-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background";

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Email, nom, référence…"
            className="w-full bg-background border-[1.5px] border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
          className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs text-foreground outline-none"
        >
          <option value="all">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Rejetées</option>
        </select>
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center gap-1.5 bg-card border-[1.5px] border-border text-muted-foreground py-2 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all"
        >
          <ArrowUpDown className="w-3.5 h-3.5" /> Date {sortAsc ? '↑' : '↓'}
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 bg-card border-[1.5px] border-border text-muted-foreground py-2 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all ml-auto"
        >
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Utilisateur</th>
                <th className={thClass}>Mode</th>
                <th className={thClass}>Référence</th>
                <th className={thClass}>Montant</th>
                <th className={thClass}>Statut</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Chargement…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <div className="text-sm">Aucune demande</div>
                </td></tr>
              ) : paged.map(r => (
                <tr key={r.id} className="hover:bg-background transition-colors">
                  <td className="px-3.5 py-3 text-xs text-muted-foreground border-b border-border whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-border">
                    <div className="font-bold text-foreground">{userLabel(r.user_id)}</div>
                    <div className="text-[10.5px] text-muted-foreground">{userEmail(r.user_id)}</div>
                  </td>
                  <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{r.payment_mode}</td>
                  <td className="px-3.5 py-3 text-xs text-foreground border-b border-border"><code className="bg-background px-1.5 py-0.5 rounded">{r.payment_reference}</code></td>
                  <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border whitespace-nowrap">{fmtAmount(Number(r.amount))}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-border"><StatusPill status={r.status} /></td>
                  <td className="px-3.5 py-3 text-sm border-b border-border">
                    {r.status === 'pending' ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setTarget({ req: r, action: 'approve' }); setAdminNotes(''); setMonths(1); }}
                          className="bg-success/10 text-success border border-success/20 px-2 py-1 rounded-md text-xs font-bold hover:bg-success hover:text-primary-foreground transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                        </button>
                        <button
                          onClick={() => { setTarget({ req: r, action: 'reject' }); setAdminNotes(''); }}
                          className="bg-destructive/10 text-destructive border border-destructive/20 px-2 py-1 rounded-md text-xs font-bold hover:bg-destructive hover:text-primary-foreground transition-all flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rejeter
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10.5px] text-muted-foreground italic">{r.admin_notes || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Chargement…</div>
          ) : paged.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <div className="text-sm">Aucune demande</div>
            </div>
          ) : paged.map(r => (
            <div key={r.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{userLabel(r.user_id)}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{userEmail(r.user_id)}</div>
                </div>
                <StatusPill status={r.status} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.payment_mode}</span>
                <span className="font-bold">{fmtAmount(Number(r.amount))}</span>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                <code className="bg-background px-1.5 py-0.5 rounded text-[10px]">{r.payment_reference}</code>
                <span>{formatDate(r.created_at)}</span>
              </div>
              {r.status === 'pending' && (
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => { setTarget({ req: r, action: 'approve' }); setAdminNotes(''); setMonths(1); }}
                    className="flex-1 bg-success/10 text-success border border-success/20 px-2 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                  </button>
                  <button
                    onClick={() => { setTarget({ req: r, action: 'reject' }); setAdminNotes(''); }}
                    className="flex-1 bg-destructive/10 text-destructive border border-destructive/20 px-2 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* Action dialog */}
      <Dialog open={!!target} onOpenChange={(o) => { if (!o) setTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {target?.action === 'approve' ? 'Approuver la demande' : 'Rejeter la demande'}
            </DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <div><span className="text-muted-foreground">Utilisateur :</span> <strong>{userLabel(target.req.user_id)}</strong></div>
                <div><span className="text-muted-foreground">Email :</span> {userEmail(target.req.user_id)}</div>
                <div><span className="text-muted-foreground">Mode :</span> {target.req.payment_mode}</div>
                <div><span className="text-muted-foreground">Référence :</span> <code className="bg-background px-1 rounded">{target.req.payment_reference}</code></div>
                <div><span className="text-muted-foreground">Montant :</span> <strong>{fmtAmount(Number(target.req.amount))}</strong></div>
              </div>
              {target.action === 'approve' && (
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Durée</label>
                  <select
                    value={months}
                    onChange={e => setMonths(Number(e.target.value))}
                    className="w-full bg-background border-[1.5px] border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary"
                  >
                    {[1, 3, 6, 12].map(m => <option key={m} value={m}>{m} mois</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {target.action === 'reject' ? 'Raison du rejet' : 'Note interne (optionnel)'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-background border-[1.5px] border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary resize-y"
                  placeholder={target.action === 'reject' ? 'Raison du rejet…' : 'Commentaire…'}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setTarget(null)}
              className="px-3 py-2 text-xs rounded-lg border-[1.5px] border-border text-muted-foreground hover:bg-background"
            >
              Annuler
            </button>
            <button
              onClick={handleAction}
              disabled={submitting}
              className={`px-3 py-2 text-xs rounded-lg font-bold text-primary-foreground disabled:opacity-50 ${
                target?.action === 'approve' ? 'gradient-primary' : 'bg-destructive'
              }`}
            >
              {submitting ? '…' : (target?.action === 'approve' ? 'Confirmer & activer' : 'Confirmer le rejet')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------- Subscriptions ------------------------- */

function SubscriptionsSection({ subs, loading, userLabel, userEmail, onChanged }: {
  subs: SubscriptionRow[];
  loading: boolean;
  userLabel: (id: string) => string;
  userEmail: (id: string) => string;
  onChanged: () => void;
}) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [page, setPage] = useState(1);
  const [revokeTarget, setRevokeTarget] = useState<SubscriptionRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const now = Date.now();

  const filtered = useMemo(() => {
    let list = [...subs];
    if (planFilter !== 'all') list = list.filter(s => s.plan === planFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        userLabel(s.user_id).toLowerCase().includes(q) ||
        userEmail(s.user_id).toLowerCase().includes(q)
      );
    }
    return list;
  }, [subs, planFilter, search, userLabel, userEmail]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: { action: 'revoke', user_id: revokeTarget.user_id },
      });
      if (error) throw error;
      toast.success('Abonnement révoqué');
      setRevokeTarget(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const header = ['Utilisateur', 'Email', 'Plan', 'Statut', 'Démarré', 'Expire', 'Montant'];
    const rows = filtered.map(s => [
      userLabel(s.user_id), userEmail(s.user_id), s.plan, s.status,
      s.starts_at ? formatDate(s.starts_at) : '',
      s.expires_at ? formatDate(s.expires_at) : '',
      Number(s.amount || 0),
    ]);
    downloadCSV(`abonnements-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background";

  const renderDaysLeft = (s: SubscriptionRow) => {
    if (!s.expires_at) return <span className="text-muted-foreground text-xs">—</span>;
    const expMs = new Date(s.expires_at).getTime();
    const expired = expMs < now;
    const daysLeft = Math.max(0, Math.ceil((expMs - now) / (1000 * 60 * 60 * 24)));
    if (expired) return <span className="text-xs font-bold text-destructive">Expiré</span>;
    return (
      <span className={`text-xs font-bold ${daysLeft < 7 ? 'text-accent' : 'text-foreground'}`}>
        {daysLeft} j{daysLeft < 7 && ' ⚠'}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher utilisateur…"
            className="w-full bg-background border-[1.5px] border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value as typeof planFilter); setPage(1); }}
          className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs text-foreground outline-none"
        >
          <option value="all">Tous plans</option>
          <option value="free">Gratuit</option>
          <option value="pro">Pro</option>
        </select>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 bg-card border-[1.5px] border-border text-muted-foreground py-2 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all ml-auto"
        >
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className={thClass}>Utilisateur</th>
                <th className={thClass}>Plan</th>
                <th className={thClass}>Statut</th>
                <th className={thClass}>Démarré</th>
                <th className={thClass}>Expire</th>
                <th className={thClass}>Restant</th>
                <th className={thClass}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Chargement…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <div className="text-sm">Aucun abonnement</div>
                </td></tr>
              ) : paged.map(s => {
                const expMs = s.expires_at ? new Date(s.expires_at).getTime() : null;
                const expired = expMs !== null && expMs < now;
                return (
                  <tr key={s.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="font-bold text-foreground">{userLabel(s.user_id)}</div>
                      <div className="text-[10.5px] text-muted-foreground">{userEmail(s.user_id)}</div>
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${s.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {s.plan === 'pro' && <Crown className="w-3 h-3" />}{s.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <StatusPill status={expired && s.plan === 'pro' ? 'expired' : s.status} />
                    </td>
                    <td className="px-3.5 py-3 text-xs text-muted-foreground border-b border-border whitespace-nowrap">{s.starts_at ? formatDate(s.starts_at) : '—'}</td>
                    <td className="px-3.5 py-3 text-xs text-muted-foreground border-b border-border whitespace-nowrap">{s.expires_at ? formatDate(s.expires_at) : '—'}</td>
                    <td className="px-3.5 py-3 border-b border-border whitespace-nowrap">{renderDaysLeft(s)}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      {s.plan === 'pro' && s.status === 'active' ? (
                        <button
                          onClick={() => setRevokeTarget(s)}
                          className="bg-destructive/10 text-destructive border border-destructive/20 px-2 py-1 rounded-md text-xs font-bold hover:bg-destructive hover:text-primary-foreground transition-all flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Révoquer
                        </button>
                      ) : (
                        <span className="text-[10.5px] text-muted-foreground italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Chargement…</div>
          ) : paged.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <div className="text-sm">Aucun abonnement</div>
            </div>
          ) : paged.map(s => {
            const expMs = s.expires_at ? new Date(s.expires_at).getTime() : null;
            const expired = expMs !== null && expMs < now;
            return (
              <div key={s.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{userLabel(s.user_id)}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{userEmail(s.user_id)}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${s.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {s.plan === 'pro' && <Crown className="w-3 h-3" />}{s.plan.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <StatusPill status={expired && s.plan === 'pro' ? 'expired' : s.status} />
                  {renderDaysLeft(s)}
                </div>
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Début: {s.starts_at ? formatDate(s.starts_at) : '—'}</span>
                  <span>Fin: {s.expires_at ? formatDate(s.expires_at) : '—'}</span>
                </div>
                {s.plan === 'pro' && s.status === 'active' && (
                  <button
                    onClick={() => setRevokeTarget(s)}
                    className="w-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Ban className="w-3.5 h-3.5" /> Révoquer
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
      </div>

      <Dialog open={!!revokeTarget} onOpenChange={(o) => { if (!o) setRevokeTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Révoquer l'abonnement Pro ?</DialogTitle>
          </DialogHeader>
          {revokeTarget && (
            <div className="space-y-3 py-2 text-sm">
              <div className="rounded-lg bg-destructive/10 p-3 text-xs">
                L'utilisateur <strong>{userLabel(revokeTarget.user_id)}</strong> repassera immédiatement au plan <strong>Gratuit</strong> et perdra l'accès aux fonctionnalités Pro.
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setRevokeTarget(null)} className="px-3 py-2 text-xs rounded-lg border-[1.5px] border-border text-muted-foreground hover:bg-background">Annuler</button>
            <button onClick={handleRevoke} disabled={submitting} className="px-3 py-2 text-xs rounded-lg font-bold bg-destructive text-primary-foreground disabled:opacity-50">
              {submitting ? '…' : 'Confirmer la révocation'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------- Users ------------------------- */

function UsersSection({ profiles, loading, subMap }: {
  profiles: ProfileRow[];
  loading: boolean;
  subMap: Map<string, SubscriptionRow>;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(p =>
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const exportCSV = () => {
    const header = ['Nom', 'Email', 'Téléphone', 'Plan'];
    const rows = filtered.map(p => [
      p.full_name || '', p.email || '', p.phone || '',
      subMap.get(p.user_id)?.plan || 'free',
    ]);
    downloadCSV(`utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  };

  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background";

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Nom, email, téléphone…"
            className="w-full bg-background border-[1.5px] border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          />
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 bg-card border-[1.5px] border-border text-muted-foreground py-2 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all ml-auto"
        >
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className={thClass}>Nom complet</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Téléphone</th>
                <th className={thClass}>Plan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Chargement…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <div className="text-sm">Aucun utilisateur</div>
                </td></tr>
              ) : paged.map(p => {
                const sub = subMap.get(p.user_id);
                const isPro = sub?.plan === 'pro' && sub.status === 'active' && (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now());
                return (
                  <tr key={p.user_id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                          {(p.full_name || p.email || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground">{p.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{p.email || '—'}</td>
                    <td className="px-3.5 py-3 text-sm text-muted-foreground border-b border-border">{p.phone || '—'}</td>
                    <td className="px-3.5 py-3 border-b border-border">
                      <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${isPro ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {isPro ? <><Crown className="w-3 h-3" />PRO</> : <><UserCheck className="w-3 h-3" />FREE</>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Chargement…</div>
          ) : paged.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <div className="text-sm">Aucun utilisateur</div>
            </div>
          ) : paged.map(p => {
            const sub = subMap.get(p.user_id);
            const isPro = sub?.plan === 'pro' && sub.status === 'active' && (!sub.expires_at || new Date(sub.expires_at).getTime() > Date.now());
            return (
              <div key={p.user_id} className="p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-sm truncate">{p.full_name || '—'}</div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isPro ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {isPro ? <><Crown className="w-3 h-3" />PRO</> : 'FREE'}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />{p.email || '—'}</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" />{p.phone || '—'}</div>
              </div>
            );
          })}
        </div>

        <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
