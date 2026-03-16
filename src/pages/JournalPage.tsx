import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';
import { JOURNAL_CATEGORIES, PAYMENT_MODES } from '@/types';

export default function JournalPage() {
  const { journal, comptes, fmt } = useApp();
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ libelle: '', type: 'Recette', montant: 0, mode_paiement: 'Espèce', categorie: '', compte: '', date_operation: new Date().toISOString().slice(0, 10) });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; libelle: string } | null>(null);

  const totR = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const totD = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const bal = totR - totD;

  let filtered = journal.data;
  if (filter === 'Recette' || filter === 'Dépense') filtered = filtered.filter(j => j.type === filter && j.categorie !== 'Transfert');
  else if (filter !== 'all') filtered = filtered.filter(j => j.mode_paiement === filter);

  const filters = ['all', 'Recette', 'Dépense', ...PAYMENT_MODES];
  const filterLabels: Record<string, string> = { all: 'Tous', Recette: '📥 Recettes', 'Dépense': '📤 Dépenses', Espèce: '💵 Espèce', Wave: 'Wave', 'Orange Money': '🟠 Orange', 'Yas Money': '🟣 Yas', Virement: '🏦 Virement', Chèque: '✉️ Chèque' };

  const openNew = () => {
    setForm({ libelle: '', type: 'Recette', montant: 0, mode_paiement: 'Espèce', categorie: '', compte: '', date_operation: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  useEffect(() => {
    const handler = () => openNew();
    window.addEventListener('open-create-modal', handler);
    return () => window.removeEventListener('open-create-modal', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!form.libelle || !form.montant) {
      toast.error('Renseignez le libellé et le montant');
      return;
    }
    try {
      await journal.add(form);
      setShowModal(false);
      toast.success('Transaction ajoutée');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const del = async () => {
    if (!deleteTarget) return;
    try {
      await journal.remove(deleteTarget.id);
      toast.success('Supprimé');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4">
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2">📥</div>
          <div className="font-black text-xs lg:text-lg text-success truncate">{fmt(totR)}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Recettes</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-destructive to-accent" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2">📤</div>
          <div className="font-black text-xs lg:text-lg text-destructive truncate">{fmt(totD)}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Dépenses</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-success" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2">⚖️</div>
          <div className={`font-black text-xs lg:text-lg truncate ${bal >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(Math.abs(bal))}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Balance</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-foreground">Journal</h3>
          <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">
            ＋ Transaction
          </button>
        </div>
        <div className="px-4 py-2 border-b border-border">
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
        {/* Mobile card view */}
        <div className="lg:hidden">
          {journal.isLoading ? <TableSkeleton rows={5} cols={3} /> : (
            filtered.length ? filtered.map(j => (
              <div key={j.id} className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">{j.libelle || '—'}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{j.date_operation} · {j.mode_paiement} {j.categorie ? `· ${j.categorie}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-bold text-sm ${j.type === 'Recette' ? 'text-success' : 'text-destructive'}`}>
                    {j.type === 'Recette' ? '+' : '-'}{fmt(j.montant || 0)}
                  </span>
                  <button onClick={() => setDeleteTarget({ id: j.id, libelle: j.libelle })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">🗑️</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">
                <div className="text-4xl opacity-30 mb-2">📒</div>
                <div className="text-sm">Aucune transaction</div>
              </div>
            )
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          {journal.isLoading ? <TableSkeleton rows={5} cols={7} /> : (
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
                      <button onClick={() => setDeleteTarget({ id: j.id, libelle: j.libelle })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all">🗑️</button>
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
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer cette transaction ?"
        description={`"${deleteTarget?.libelle}" sera définitivement supprimée.`}
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[1000] flex items-end lg:items-center justify-center">
          <div className="bg-card border border-border rounded-2xl lg:rounded-2xl rounded-b-none w-full lg:max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.22s_ease]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-[15px] text-foreground">Nouvelle Transaction</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground text-xl bg-transparent border-none cursor-pointer">✕</button>
            </div>
            <div className="p-5 grid gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Libellé *</label>
                <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Type</label>
                  <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option>Recette</option>
                    <option>Dépense</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Montant *</label>
                  <input type="number" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.montant} onChange={e => setForm({ ...form, montant: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mode paiement</label>
                  <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
                  <input type="date" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.date_operation} onChange={e => setForm({ ...form, date_operation: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Catégorie</label>
                  <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                    <option value="">— Choisir —</option>
                    {JOURNAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Compte</label>
                  <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.compte} onChange={e => setForm({ ...form, compte: e.target.value })} placeholder="Caisse, Banque..." />
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="bg-card border-[1.5px] border-border text-muted-foreground py-2 px-4 rounded-lg text-xs font-bold hover:bg-background transition-all">Annuler</button>
              <button onClick={save} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
