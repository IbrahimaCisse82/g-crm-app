import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';
import {
  Shield, Users, CreditCard, Clock, CheckCircle2, XCircle,
  Search, TrendingUp, AlertCircle, Crown, RefreshCw, Eye,
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

type Tab = 'overview' | 'requests' | 'subscriptions';

export default function AdminPage() {
  const { isAdmin, isLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionTarget, setActionTarget] = useState<{ req: RequestRow; action: 'approve' | 'reject' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const requestsQuery = useQuery({
    queryKey: ['admin', 'requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
    enabled: isAdmin,
  });

  const subsQuery = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SubscriptionRow[];
    },
    enabled: isAdmin,
  });

  const profilesQuery = useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_users');
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
    enabled: isAdmin,
  });

  const profileMap = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    (profilesQuery.data ?? []).forEach(p => m.set(p.user_id, p));
    return m;
  }, [profilesQuery.data]);

  const userLabel = (uid: string) => {
    const p = profileMap.get(uid);
    if (!p) return uid.slice(0, 8) + '…';
    return p.full_name || p.email || uid.slice(0, 8) + '…';
  };

  const userEmail = (uid: string) => profileMap.get(uid)?.email ?? '—';

  // Stats
  const stats = useMemo(() => {
    const reqs = requestsQuery.data ?? [];
    const subs = subsQuery.data ?? [];
    const now = Date.now();
    return {
      pendingCount: reqs.filter(r => r.status === 'pending').length,
      approvedCount: reqs.filter(r => r.status === 'approved').length,
      rejectedCount: reqs.filter(r => r.status === 'rejected').length,
      totalUsers: subs.length,
      activeProUsers: subs.filter(s =>
        s.plan === 'pro' && s.status === 'active' &&
        (!s.expires_at || new Date(s.expires_at).getTime() > now)
      ).length,
      totalRevenue: reqs.filter(r => r.status === 'approved').reduce((sum, r) => sum + Number(r.amount || 0), 0),
      monthRevenue: reqs.filter(r => {
        if (r.status !== 'approved') return false;
        const d = new Date(r.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).reduce((sum, r) => sum + Number(r.amount || 0), 0),
    };
  }, [requestsQuery.data, subsQuery.data]);

  const filteredRequests = useMemo(() => {
    let list = requestsQuery.data ?? [];
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
    return list;
  }, [requestsQuery.data, statusFilter, search, profileMap]);

  const filteredSubs = useMemo(() => {
    let list = subsQuery.data ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        userLabel(s.user_id).toLowerCase().includes(q) ||
        userEmail(s.user_id).toLowerCase().includes(q) ||
        s.plan.toLowerCase().includes(q)
      );
    }
    return list;
  }, [subsQuery.data, search, profileMap]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground text-sm">Vérification des permissions…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

  const handleAction = async () => {
    if (!actionTarget) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: actionTarget.action,
          request_id: actionTarget.req.id,
          admin_notes: adminNotes.trim() || null,
          months: actionTarget.action === 'approve' ? months : undefined,
        },
      });
      if (error) throw error;
      toast.success(actionTarget.action === 'approve' ? 'Demande approuvée' : 'Demande rejetée');
      setActionTarget(null);
      setAdminNotes('');
      setMonths(1);
      qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="text-xl font-black text-foreground">Administration</h1>
            <p className="text-xs text-muted-foreground">Gérer les abonnements et utilisateurs</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 bg-card border-[1.5px] border-border text-muted-foreground py-1.5 px-3 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Actualiser
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Clock className="w-4 h-4" />}
          label="Demandes en attente"
          value={stats.pendingCount.toString()}
          accent={stats.pendingCount > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          icon={<Crown className="w-4 h-4" />}
          label="Abonnés Pro actifs"
          value={stats.activeProUsers.toString()}
          accent="primary"
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Revenu du mois"
          value={fmt(stats.monthRevenue)}
          accent="success"
        />
        <KpiCard
          icon={<CreditCard className="w-4 h-4" />}
          label="Revenu total"
          value={fmt(stats.totalRevenue)}
          accent="default"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={<Eye className="w-3.5 h-3.5" />}>Vue d'ensemble</TabButton>
        <TabButton active={tab === 'requests'} onClick={() => setTab('requests')} icon={<Clock className="w-3.5 h-3.5" />}>
          Demandes {stats.pendingCount > 0 && <span className="ml-1.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full px-1.5">{stats.pendingCount}</span>}
        </TabButton>
        <TabButton active={tab === 'subscriptions'} onClick={() => setTab('subscriptions')} icon={<Users className="w-3.5 h-3.5" />}>Abonnements</TabButton>
      </div>

      {/* Search bar (shared for requests/subs) */}
      {tab !== 'overview' && (
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher utilisateur, référence…"
              className="w-full bg-background border-[1.5px] border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
            />
          </div>
          {tab === 'requests' && (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs text-foreground outline-none"
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
            </select>
          )}
        </div>
      )}

      {/* Content */}
      {tab === 'overview' && <OverviewSection requests={requestsQuery.data ?? []} userLabel={userLabel} fmt={fmt} onGoRequests={() => setTab('requests')} />}

      {tab === 'requests' && (
        <RequestsTable
          requests={filteredRequests}
          userLabel={userLabel}
          userEmail={userEmail}
          fmt={fmt}
          loading={requestsQuery.isLoading}
          onAct={(req, action) => { setActionTarget({ req, action }); setAdminNotes(''); setMonths(1); }}
        />
      )}

      {tab === 'subscriptions' && (
        <SubscriptionsTable
          subs={filteredSubs}
          userLabel={userLabel}
          userEmail={userEmail}
          loading={subsQuery.isLoading}
        />
      )}

      {/* Action dialog */}
      <Dialog open={!!actionTarget} onOpenChange={(o) => { if (!o) setActionTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === 'approve' ? 'Approuver la demande' : 'Rejeter la demande'}
            </DialogTitle>
          </DialogHeader>
          {actionTarget && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                <div><span className="text-muted-foreground">Utilisateur :</span> <strong>{userLabel(actionTarget.req.user_id)}</strong></div>
                <div><span className="text-muted-foreground">Email :</span> {userEmail(actionTarget.req.user_id)}</div>
                <div><span className="text-muted-foreground">Mode :</span> {actionTarget.req.payment_mode}</div>
                <div><span className="text-muted-foreground">Référence :</span> <code className="bg-background px-1 rounded">{actionTarget.req.payment_reference}</code></div>
                <div><span className="text-muted-foreground">Montant :</span> <strong>{fmt(Number(actionTarget.req.amount))}</strong></div>
              </div>

              {actionTarget.action === 'approve' && (
                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Durée (mois)</label>
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
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Note interne (optionnel)</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-background border-[1.5px] border-border rounded-lg py-2 px-3 text-sm outline-none focus:border-primary resize-y"
                  placeholder={actionTarget.action === 'reject' ? 'Raison du rejet…' : 'Commentaire…'}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setActionTarget(null)}
              className="px-3 py-2 text-xs rounded-lg border-[1.5px] border-border text-muted-foreground hover:bg-background"
            >
              Annuler
            </button>
            <button
              onClick={handleAction}
              disabled={submitting}
              className={`px-3 py-2 text-xs rounded-lg font-bold text-primary-foreground disabled:opacity-50 ${
                actionTarget?.action === 'approve' ? 'gradient-primary' : 'bg-destructive'
              }`}
            >
              {submitting ? '…' : (actionTarget?.action === 'approve' ? 'Confirmer & activer' : 'Confirmer le rejet')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: 'default' | 'primary' | 'success' | 'warning' }) {
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

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
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

function OverviewSection({ requests, userLabel, fmt, onGoRequests }: {
  requests: RequestRow[];
  userLabel: (id: string) => string;
  fmt: (n: number) => string;
  onGoRequests: () => void;
}) {
  const recent = requests.slice(0, 5);
  const pending = requests.filter(r => r.status === 'pending');
  return (
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
            {pending.slice(0, 5).map(r => (
              <li key={r.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background text-sm">
                <div className="min-w-0">
                  <div className="font-bold truncate">{userLabel(r.user_id)}</div>
                  <div className="text-[11px] text-muted-foreground">{r.payment_mode} · {fmt(Number(r.amount))}</div>
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
  );
}

function RequestsTable({ requests, userLabel, userEmail, fmt, loading, onAct }: {
  requests: RequestRow[];
  userLabel: (id: string) => string;
  userEmail: (id: string) => string;
  fmt: (n: number) => string;
  loading: boolean;
  onAct: (req: RequestRow, action: 'approve' | 'reject') => void;
}) {
  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
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
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <div className="text-sm">Aucune demande</div>
              </td></tr>
            ) : requests.map(r => (
              <tr key={r.id} className="hover:bg-background transition-colors">
                <td className="px-3.5 py-3 text-xs text-muted-foreground border-b border-border whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-border">
                  <div className="font-bold text-foreground">{userLabel(r.user_id)}</div>
                  <div className="text-[10.5px] text-muted-foreground">{userEmail(r.user_id)}</div>
                </td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{r.payment_mode}</td>
                <td className="px-3.5 py-3 text-xs text-foreground border-b border-border"><code className="bg-background px-1.5 py-0.5 rounded">{r.payment_reference}</code></td>
                <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border whitespace-nowrap">{fmt(Number(r.amount))}</td>
                <td className="px-3.5 py-3 text-sm border-b border-border"><StatusPill status={r.status} /></td>
                <td className="px-3.5 py-3 text-sm border-b border-border">
                  {r.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAct(r, 'approve')}
                        title="Approuver"
                        className="bg-success/10 text-success border border-success/20 px-2 py-1 rounded-md text-xs font-bold hover:bg-success hover:text-primary-foreground transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                      </button>
                      <button
                        onClick={() => onAct(r, 'reject')}
                        title="Rejeter"
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
    </div>
  );
}

function SubscriptionsTable({ subs, userLabel, userEmail, loading }: {
  subs: SubscriptionRow[];
  userLabel: (id: string) => string;
  userEmail: (id: string) => string;
  loading: boolean;
}) {
  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background";
  const now = Date.now();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[680px]">
          <thead>
            <tr>
              <th className={thClass}>Utilisateur</th>
              <th className={thClass}>Plan</th>
              <th className={thClass}>Statut</th>
              <th className={thClass}>Démarré</th>
              <th className={thClass}>Expire</th>
              <th className={thClass}>Restant</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Chargement…</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <div className="text-sm">Aucun abonnement</div>
              </td></tr>
            ) : subs.map(s => {
              const expMs = s.expires_at ? new Date(s.expires_at).getTime() : null;
              const expired = expMs !== null && expMs < now;
              const daysLeft = expMs ? Math.max(0, Math.ceil((expMs - now) / (1000 * 60 * 60 * 24))) : null;
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
                  <td className="px-3.5 py-3 text-sm border-b border-border whitespace-nowrap">
                    {daysLeft === null ? <span className="text-muted-foreground">—</span> : (
                      <span className={`text-xs font-bold ${daysLeft === 0 ? 'text-destructive' : daysLeft < 7 ? 'text-accent' : 'text-foreground'}`}>
                        {daysLeft} j
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
