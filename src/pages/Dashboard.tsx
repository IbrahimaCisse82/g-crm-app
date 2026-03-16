import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { formatDate } from '@/lib/formatDate';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';

function StatCard({ icon, value, label, sub }: { icon: string; value: string; label: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 lg:p-[18px] relative overflow-hidden shadow-card hover:-translate-y-px hover:shadow-elevated hover:border-primary/25 transition-all cursor-default">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
      <div className="text-xl lg:text-[26px] mb-1 lg:mb-2">{icon}</div>
      <div className="font-black text-sm lg:text-2xl text-foreground truncate">{value}</div>
      <div className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 truncate">{label}</div>
      {sub && <div className="text-[10px] lg:text-[10.5px] text-accent mt-0.5 lg:mt-1 truncate">{sub}</div>}
    </div>
  );
}

const COLORS = [
  'hsl(168 100% 31%)',   // primary
  'hsl(204 70% 53%)',    // secondary
  'hsl(36 91% 44%)',     // accent
  'hsl(0 72% 51%)',      // destructive
  'hsl(160 84% 39%)',    // success
  'hsl(270 60% 55%)',    // purple
];

export default function Dashboard() {
  const { clients, factures, journal, cliName, fmt, entreprise } = useApp();
  const navigate = useNavigate();
  const devise = entreprise.data?.devise || 'FCFA';

  const isLoading = clients.isLoading || factures.isLoading || journal.isLoading;

  const actifs = clients.data.filter(c => c.statut === 'Actif').length;
  const totR = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const totD = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const pen = factures.data.filter(f => f.statut === 'En attente' || f.statut === 'En retard').length;
  const bal = totR - totD;

  // --- Chart data: last 6 months ---
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('fr-FR', { month: 'short' }) });
  }

  const barData = months.map(m => {
    const recettes = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0);
    const depenses = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0);
    return { mois: m.label, Recettes: Math.round(recettes), Dépenses: Math.round(depenses) };
  });

  // --- Pie: payment mode distribution ---
  const modeMap: Record<string, number> = {};
  journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert').forEach(j => {
    const mode = j.mode_paiement || 'Non défini';
    modeMap[mode] = (modeMap[mode] || 0) + (j.montant || 0);
  });
  const pieData = Object.entries(modeMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  // --- Line: expense evolution ---
  const lineData = months.map(m => {
    const dep = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0);
    return { mois: m.label, Dépenses: Math.round(dep) };
  });

  const last6Txns = journal.data.slice(0, 6);
  const today = new Date().toISOString().slice(0, 10);
  const recentFacs = factures.data.slice(0, 5).map(f => {
    if (f.statut === 'En attente' && f.date_echeance && f.date_echeance < today) {
      return { ...f, statut: 'En retard' };
    }
    return f;
  });

  const fmtTooltip = (v: number) => new Intl.NumberFormat('fr-FR').format(v) + ' ' + devise;

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5 mb-5">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-card border border-border rounded-xl p-4 h-[260px] animate-pulse"><div className="h-4 w-32 bg-muted rounded mb-4" /><div className="h-40 bg-muted rounded" /></div>
          <div className="bg-card border border-border rounded-xl p-4 h-[260px] animate-pulse"><div className="h-4 w-32 bg-muted rounded mb-4" /><div className="h-40 bg-muted rounded" /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5 mb-5">
        <StatCard icon="👥" value={String(actifs)} label="Clients actifs" />
        <StatCard icon="💰" value={fmt(totR)} label="Recettes totales" />
        <StatCard icon="🧾" value={String(factures.data.length)} label="Factures" sub={`En attente: ${pen}`} />
        <StatCard icon="📊" value={`${bal >= 0 ? '+' : '-'}${fmt(Math.abs(bal))}`} label="Balance nette" sub={bal >= 0 ? '✅ Positif' : '⚠️ Négatif'} />
      </div>

      {/* Charts row 1: Revenue bar + Payment pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Monthly revenue bar chart */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-extrabold text-sm text-foreground">Chiffre d'affaires mensuel</h3>
            <p className="text-[10.5px] text-muted-foreground">Recettes vs Dépenses — 6 derniers mois</p>
          </div>
          <div className="px-2 py-3 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                <Tooltip formatter={(v: number) => fmtTooltip(v)} labelStyle={{ fontWeight: 700 }} />
                <Bar dataKey="Recettes" fill="hsl(168 100% 31%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Dépenses" fill="hsl(0 72% 51% / 0.5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment mode pie chart */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-extrabold text-sm text-foreground">Répartition par mode de paiement</h3>
            <p className="text-[10.5px] text-muted-foreground">Recettes par méthode de paiement</p>
          </div>
          <div className="px-2 py-3 h-[220px]">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtTooltip(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Aucune donnée</div>
            )}
          </div>
        </div>
      </div>

      {/* Chart row 2: Expense line chart */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card mb-4">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-extrabold text-sm text-foreground">Évolution des dépenses</h3>
          <p className="text-[10.5px] text-muted-foreground">Tendance mensuelle — 6 derniers mois</p>
        </div>
        <div className="px-2 py-3 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="hsl(215 16% 47%)" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(215 16% 47%)" tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
              <Tooltip formatter={(v: number) => fmtTooltip(v)} labelStyle={{ fontWeight: 700 }} />
              <Line type="monotone" dataKey="Dépenses" stroke="hsl(0 72% 51%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(0 72% 51%)' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions + Factures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground">Dernières transactions</h3>
            <button onClick={() => navigate('/journal')} className="text-[10.5px] text-primary font-semibold hover:underline">Voir tout →</button>
          </div>
          {last6Txns.length ? last6Txns.map(j => (
            <div key={j.id} className="flex justify-between px-4 py-2.5 border-b border-border text-xs">
              <div>
                <div className="font-semibold text-foreground">{j.libelle || '—'}</div>
                <div className="text-[10.5px] text-muted-foreground">{formatDate(j.date_operation)} · {j.mode_paiement}</div>
              </div>
              <div className={`font-bold ${j.type === 'Recette' ? 'text-success' : 'text-destructive'}`}>
                {j.type === 'Recette' ? '+' : '-'}{fmt(j.montant || 0)}
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-xs text-muted-foreground">Aucune transaction</div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground">Factures récentes</h3>
            <button onClick={() => navigate('/factures')} className="text-[10.5px] text-primary font-semibold hover:underline">Voir tout →</button>
          </div>
          <div className="lg:hidden">
            {recentFacs.length ? recentFacs.map(f => (
              <div key={f.id} className="px-4 py-3 border-b border-border flex items-center justify-between" onClick={() => navigate('/factures')}>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">{f.numero}</div>
                  <div className="text-[10.5px] text-muted-foreground truncate">{cliName(f.client_id)} · {formatDate(f.date_facture)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-bold text-xs text-foreground">{fmt(f.montant_ttc)}</span>
                  <StatusBadge status={f.statut} />
                </div>
              </div>
            )) : (
              <div className="text-center py-5 text-sm text-muted-foreground">Aucune facture</div>
            )}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['N° Facture', 'Client', 'Montant TTC', 'Date', 'Statut'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentFacs.length ? recentFacs.map(f => (
                  <tr key={f.id} className="hover:bg-background transition-colors cursor-pointer" onClick={() => navigate('/factures')}>
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{f.numero}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(f.client_id)}</td>
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{fmt(f.montant_ttc)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{formatDate(f.date_facture)}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border"><StatusBadge status={f.statut} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="text-center py-5 text-sm text-muted-foreground">Aucune facture</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
