import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from './Dashboard';

export default function QuotesPage() {
  const { data, cliName, fmt, deleteDevis } = useApp();
  const [search, setSearch] = useState('');
  const [statFilter, setStatFilter] = useState('');

  let filtered = data.devis;
  if (statFilter) filtered = filtered.filter(d => d.stat === statFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(d => d.num?.toLowerCase().includes(q) || cliName(d.cliId).toLowerCase().includes(q));
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-extrabold text-sm text-foreground">Devis ({filtered.length})</h3>
        <div className="flex gap-2 items-center">
          <input className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2.5 text-xs text-foreground outline-none w-[160px] font-sans placeholder:text-muted-foreground focus:border-primary" placeholder="🔍 N°, client..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2 text-xs text-foreground outline-none font-sans" value={statFilter} onChange={e => setStatFilter(e.target.value)}>
            <option value="">Tous statuts</option>
            <option>En attente</option>
            <option>Accepté</option>
            <option>Refusé</option>
            <option>Expiré</option>
            <option>Converti</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr>
              {['N°', 'Client', 'TTC', 'Date', 'Validité', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(d => (
              <tr key={d.id} className="hover:bg-background transition-colors">
                <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{d.num}</td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(d.cliId)}</td>
                <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{fmt(d.ttc)}</td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{d.date}</td>
                <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{d.val} jours</td>
                <td className="px-3.5 py-3 text-sm border-b border-border"><StatusBadge status={d.stat} /></td>
                <td className="px-3.5 py-3 text-sm border-b border-border">
                  <button onClick={() => { if (confirm('Supprimer ce devis ?')) deleteDevis(d.id); }} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all">🗑️</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                <div className="text-4xl opacity-30 mb-2">📋</div>
                <div className="text-sm">Aucun devis</div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
