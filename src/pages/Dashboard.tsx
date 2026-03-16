import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { CardSkeleton, TableSkeleton } from '@/components/LoadingSkeleton';
import { formatDate } from '@/lib/formatDate';

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

export default function Dashboard() {
  const { clients, factures, journal, cliName, fmt } = useApp();
  const navigate = useNavigate();

  const isLoading = clients.isLoading || factures.isLoading || journal.isLoading;

  const actifs = clients.data.filter(c => c.statut === 'Actif').length;
  const totR = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const totD = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const pen = factures.data.filter(f => f.statut === 'En attente' || f.statut === 'En retard').length;
  const bal = totR - totD;

  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('fr-FR', { month: 'short' }) });
  }
  const maxR = Math.max(1, ...months.map(m => journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0)));

  const last6Txns = journal.data.slice(0, 6);
  const today = new Date().toISOString().slice(0, 10);
  const recentFacs = factures.data.slice(0, 5).map(f => {
    if (f.statut === 'En attente' && f.date_echeance && f.date_echeance < today) {
      return { ...f, statut: 'En retard' };
    }
    return f;
  });

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5 mb-5">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="bg-card border border-border rounded-xl p-4 h-[200px] animate-pulse"><div className="h-4 w-32 bg-muted rounded mb-4" /><div className="h-24 bg-muted rounded" /></div>
          <div className="bg-card border border-border rounded-xl p-4 h-[200px] animate-pulse"><div className="h-4 w-32 bg-muted rounded mb-4" /><div className="h-24 bg-muted rounded" /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5 mb-5">
        <StatCard icon="👥" value={String(actifs)} label="Clients actifs" />
        <StatCard icon="💰" value={fmt(totR)} label="Recettes totales" />
        <StatCard icon="🧾" value={String(factures.data.length)} label="Factures" sub={`En attente: ${pen}`} />
        <StatCard icon="📊" value={`${bal >= 0 ? '+' : '-'}${fmt(Math.abs(bal))}`} label="Balance nette" sub={bal >= 0 ? '✅ Positif' : '⚠️ Négatif'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-extrabold text-sm text-foreground">Évolution mensuelle</h3>
          </div>
          <div className="flex items-end gap-1 lg:gap-1.5 px-3 lg:px-4 py-3 h-[140px]">
            {months.map(m => {
              const r = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0);
              const d = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0);
              const rh = Math.round((r / maxR) * 80);
              const dh = Math.round((d / maxR) * 80);
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[8px] lg:text-[9px] text-muted-foreground truncate max-w-full">{r ? fmt(r) : ''}</div>
                  <div className="flex gap-0.5 items-end h-20">
                    <div className="w-2.5 lg:w-3 rounded-t bg-primary transition-all duration-500" style={{ height: `${rh}px`, minHeight: r ? 2 : 0 }} title={`Recettes: ${fmt(r)}`} />
                    <div className="w-2.5 lg:w-3 rounded-t bg-destructive/40 transition-all duration-500" style={{ height: `${dh}px`, minHeight: d ? 2 : 0 }} title={`Dépenses: ${fmt(d)}`} />
                  </div>
                  <span className="text-[8px] lg:text-[9.5px] text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="px-4 pb-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 bg-primary rounded-sm inline-block" /> Recettes
            <span className="w-2.5 h-2.5 bg-destructive/40 rounded-sm inline-block ml-2" /> Dépenses
          </div>
        </div>

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
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-foreground">Factures récentes</h3>
          <button onClick={() => navigate('/factures')} className="text-[10.5px] text-primary font-semibold hover:underline">Voir tout →</button>
        </div>

        {/* Mobile card view */}
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

        {/* Desktop table */}
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
                  <td className="px-3.5 py-3 text-sm border-b border-border">
                    <StatusBadge status={f.statut} />
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-5 text-sm text-muted-foreground">Aucune facture</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
