import { useApp } from '@/context/AppContext';

function StatCard({ icon, value, label, sub }: { icon: string; value: string; label: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 lg:p-[18px] relative overflow-hidden shadow-card hover:-translate-y-px hover:shadow-elevated hover:border-primary/25 transition-all cursor-default">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
      <div className="text-2xl lg:text-[26px] mb-2">{icon}</div>
      <div className="font-black text-lg lg:text-2xl text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-[10.5px] text-accent mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { clients, factures, journal, cliName, fmt } = useApp();

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
  const recentFacs = factures.data.slice(0, 5);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3.5 mb-5">
        <StatCard icon="👥" value={String(actifs)} label="Clients actifs" />
        <StatCard icon="💰" value={fmt(totR)} label="Recettes totales" />
        <StatCard icon="🧾" value={String(factures.data.length)} label="Factures" sub={`En attente: ${pen}`} />
        <StatCard icon="📊" value={fmt(Math.abs(bal))} label="Balance nette" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-extrabold text-sm text-foreground">Évolution mensuelle</h3>
          </div>
          <div className="flex items-end gap-1.5 px-4 py-3 h-[140px]">
            {months.map(m => {
              const r = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0);
              const d = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert' && j.date_operation?.startsWith(m.key)).reduce((s, j) => s + (j.montant || 0), 0);
              const rh = Math.round((r / maxR) * 80);
              const dh = Math.round((d / maxR) * 80);
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] text-muted-foreground">{r ? fmt(r) : ''}</div>
                  <div className="flex gap-0.5 items-end h-20">
                    <div className="w-3 rounded-t bg-primary transition-all duration-500" style={{ height: `${rh}px`, minHeight: r ? 2 : 0 }} title={`Recettes: ${fmt(r)}`} />
                    <div className="w-3 rounded-t bg-destructive/40 transition-all duration-500" style={{ height: `${dh}px`, minHeight: d ? 2 : 0 }} title={`Dépenses: ${fmt(d)}`} />
                  </div>
                  <span className="text-[9.5px] text-muted-foreground">{m.label}</span>
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
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-extrabold text-sm text-foreground">Dernières transactions</h3>
          </div>
          {last6Txns.length ? last6Txns.map(j => (
            <div key={j.id} className="flex justify-between px-4 py-2.5 border-b border-border text-xs">
              <div>
                <div className="font-semibold text-foreground">{j.libelle || '—'}</div>
                <div className="text-[10.5px] text-muted-foreground">{j.date_operation} · {j.mode_paiement}</div>
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
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-extrabold text-sm text-foreground">Factures récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {['N° Facture', 'Client', 'Montant TTC', 'Date', 'Statut'].map(h => (
                  <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentFacs.length ? recentFacs.map(f => (
                <tr key={f.id} className="hover:bg-background transition-colors">
                  <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{f.numero}</td>
                  <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(f.client_id)}</td>
                  <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{fmt(f.montant_ttc)}</td>
                  <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{f.date_facture}</td>
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

export function StatusBadge({ status }: { status: string }) {
  const cls = status === 'Payée' ? 'bg-success/10 text-success'
    : status === 'En retard' ? 'bg-destructive/10 text-destructive'
    : status === 'Annulée' ? 'bg-muted-foreground/15 text-muted-foreground'
    : status === 'Accepté' ? 'bg-primary/10 text-primary'
    : status === 'Refusé' ? 'bg-destructive/10 text-destructive'
    : status === 'Converti' ? 'bg-secondary/10 text-secondary'
    : 'bg-accent/10 text-accent';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}
