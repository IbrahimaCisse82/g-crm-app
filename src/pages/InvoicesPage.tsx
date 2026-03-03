import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from './Dashboard';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const { factures, cliName, fmt } = useApp();
  const [search, setSearch] = useState('');
  const [statFilter, setStatFilter] = useState('');

  let filtered = factures.data;
  if (statFilter) filtered = filtered.filter(f => f.statut === statFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(f => f.numero?.toLowerCase().includes(q) || cliName(f.client_id).toLowerCase().includes(q));
  }

  const del = async (id: string) => {
    if (confirm('Supprimer cette facture ?')) {
      await factures.remove(id);
      toast.success('Facture supprimée');
    }
  };

  const markPaid = async (f: typeof factures.data[0]) => {
    await factures.update(f.id, { statut: 'Payée', montant_regle: f.montant_ttc });
    toast.success('Facture marquée comme payée');
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-extrabold text-sm text-foreground">Factures ({filtered.length})</h3>
        <div className="flex gap-2 items-center">
          <input
            className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2.5 text-xs text-foreground outline-none w-[160px] font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/10"
            placeholder="🔍 N°, client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2 text-xs text-foreground outline-none font-sans"
            value={statFilter}
            onChange={e => setStatFilter(e.target.value)}
          >
            <option value="">Tous statuts</option>
            <option>Payée</option>
            <option>En attente</option>
            <option>En retard</option>
            <option>Annulée</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              {['N°', 'Client', 'HT', 'TVA', 'TTC', 'Paiement', 'Date', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(f => (
              <tr key={f.id} className="hover:bg-background transition-colors">
                <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{f.numero}</td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(f.client_id)}</td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{fmt(f.montant_ht)}</td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{fmt(f.montant_tva)}</td>
                <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{fmt(f.montant_ttc)}</td>
                <td className="px-3.5 py-3 text-sm border-b border-border">
                  <PayBadge mode={f.mode_paiement || ''} />
                </td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{f.date_facture}</td>
                <td className="px-3.5 py-3 text-sm border-b border-border"><StatusBadge status={f.statut} /></td>
                <td className="px-3.5 py-3 text-sm border-b border-border">
                  <div className="flex gap-1">
                    {(f.statut === 'En attente' || f.statut === 'En retard') && (
                      <button
                        onClick={() => markPaid(f)}
                        className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-success hover:text-success transition-all"
                      >💳</button>
                    )}
                    <button onClick={() => del(f.id)} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all">🗑️</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">
                <div className="text-4xl opacity-30 mb-2">🧾</div>
                <div className="text-sm">Aucune facture</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayBadge({ mode }: { mode: string }) {
  const cls = mode === 'Espèce' ? 'bg-accent/10 text-accent'
    : mode === 'Wave' ? 'bg-primary/10 text-primary'
    : mode === 'Orange Money' ? 'bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]'
    : mode === 'Yas Money' ? 'bg-[hsl(271,76%,53%)]/10 text-[hsl(271,76%,53%)]'
    : mode === 'Virement' || mode === 'Chèque' ? 'bg-[hsl(239,84%,67%)]/10 text-[hsl(239,84%,67%)]'
    : 'bg-secondary/10 text-secondary';

  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${cls}`}>{mode || '—'}</span>;
}
