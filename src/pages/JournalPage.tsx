import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export default function JournalPage() {
  const { journal, fmt } = useApp();
  const [filter, setFilter] = useState('all');

  const totR = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const totD = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const bal = totR - totD;

  let filtered = journal.data;
  if (filter === 'Recette' || filter === 'Dépense') filtered = filtered.filter(j => j.type === filter && j.categorie !== 'Transfert');
  else if (filter !== 'all') filtered = filtered.filter(j => j.mode_paiement === filter);

  const filters = ['all', 'Recette', 'Dépense', 'Espèce', 'Wave', 'Orange Money', 'Yas Money', 'Virement', 'Chèque'];
  const filterLabels: Record<string, string> = { all: 'Tous', Recette: '📥 Recettes', 'Dépense': '📤 Dépenses', Espèce: '💵 Espèce', Wave: 'Wave', 'Orange Money': '🟠 Orange', 'Yas Money': '🟣 Yas', Virement: '🏦 Virement', Chèque: '✉️ Chèque' };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
          <div className="text-2xl mb-2">📥</div>
          <div className="font-black text-lg text-success">{fmt(totR)}</div>
          <div className="text-[11px] text-muted-foreground">Recettes</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-destructive to-accent" />
          <div className="text-2xl mb-2">📤</div>
          <div className="font-black text-lg text-destructive">{fmt(totD)}</div>
          <div className="text-[11px] text-muted-foreground">Dépenses</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-success" />
          <div className="text-2xl mb-2">⚖️</div>
          <div className={`font-black text-lg ${bal >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(Math.abs(bal))}</div>
          <div className="text-[11px] text-muted-foreground">Balance</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-extrabold text-sm text-foreground mb-2">Journal</h3>
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`border-[1.5px] rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-all ${filter === f ? 'bg-primary/10 text-primary border-primary' : 'bg-background border-border text-muted-foreground hover:bg-card'}`}
              >
                {filterLabels[f] || f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {['Date', 'Libellé', 'Type', 'Mode', 'Compte', 'Montant', ''].map(h => (
                  <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(j => (
                <tr key={j.id} className="hover:bg-background transition-colors">
                  <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{j.date_operation || '—'}</td>
                  <td className="px-3.5 py-3 text-sm border-b border-border">
                    <div className="font-bold text-foreground">{j.libelle || '—'}</div>
                    <div className="text-[10.5px] text-muted-foreground">{j.categorie || ''}</div>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-border">
                    <span className={`font-bold ${j.type === 'Recette' ? 'text-success' : 'text-destructive'}`}>{j.type}</span>
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-border text-muted-foreground">{j.mode_paiement || '—'}</td>
                  <td className="px-3.5 py-3 text-[11.5px] border-b border-border text-muted-foreground">{j.compte || '—'}</td>
                  <td className={`px-3.5 py-3 text-sm font-bold border-b border-border ${j.type === 'Recette' ? 'text-success' : 'text-destructive'}`}>
                    {j.type === 'Recette' ? '+' : '-'}{fmt(j.montant || 0)}
                  </td>
                  <td className="px-3.5 py-3 text-sm border-b border-border">
                    <button onClick={async () => { if (confirm('Supprimer ?')) { await journal.remove(j.id); toast.success('Supprimé'); } }} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all">🗑️</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                  <div className="text-4xl opacity-30 mb-2">📒</div>
                  <div className="text-sm">Aucune transaction</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
