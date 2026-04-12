import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Trash2, Download, Save, BookOpen, ArrowDownCircle, ArrowUpCircle, Scale, Plus, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaginationControls } from '@/components/PaginationControls';
import { DateFilter } from '@/components/DateFilter';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { usePagination } from '@/hooks/usePagination';
import { useDateFilter } from '@/hooks/useDateFilter';
import { useSortableTable } from '@/hooks/useSortableTable';
import { exportCsv } from '@/utils/exportCsv';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatDate';
import { JOURNAL_CATEGORIES, PAYMENT_MODES } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePayment } from '@/hooks/usePayment';

export default function JournalPage() {
  const { journal, factures, comptes, fmt, cliName, createModalTrigger, categories } = useApp();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [form, setForm] = useState({ libelle: '', type: 'Recette', montant: 0, mode_paiement: 'Espèce', categorie: '', compte: '', date_operation: new Date().toISOString().slice(0, 10), facture_id: '' });

  // Factures en attente de paiement (non payées ou partielles)
  const pendingInvoices = factures.data.filter(f => f.statut !== 'Payée' && f.montant_ttc > (f.montant_regle || 0));
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; libelle: string } | null>(null);
  const triggerRef = useRef(createModalTrigger);

  const totR = journal.data.filter(j => j.type === 'Recette' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const totD = journal.data.filter(j => j.type === 'Dépense' && j.categorie !== 'Transfert').reduce((s, j) => s + (j.montant || 0), 0);
  const bal = totR - totD;

  let preFiltered = journal.data;
  if (filter === 'Recette' || filter === 'Dépense') preFiltered = preFiltered.filter(j => j.type === filter && j.categorie !== 'Transfert');
  else if (filter !== 'all') preFiltered = preFiltered.filter(j => j.mode_paiement === filter);

  if (search) {
    const q = search.toLowerCase();
    preFiltered = preFiltered.filter(j => (j.libelle + ' ' + j.categorie + ' ' + j.compte).toLowerCase().includes(q));
  }

  const { filtered: dateFiltered, month, setMonth, availableMonths } = useDateFilter(preFiltered, 'date_operation');
  const { sorted, toggleSort, sortIndicator } = useSortableTable(dateFiltered, 'date_operation');
  const pagination = usePagination(sorted);

  const filters = ['all', 'Recette', 'Dépense', ...PAYMENT_MODES];
  const filterLabels: Record<string, string> = { all: 'Tous', Recette: 'Recettes', 'Dépense': 'Dépenses', Espèce: 'Espèce', Wave: 'Wave', 'Orange Money': 'Orange', 'Yas Money': 'Yas', Virement: 'Virement', Chèque: 'Chèque' };

  const openNew = () => {
    setForm({ libelle: '', type: 'Recette', montant: 0, mode_paiement: 'Espèce', categorie: '', compte: '', date_operation: new Date().toISOString().slice(0, 10), facture_id: '' });
    setShowModal(true);
  };

  useEffect(() => {
    if (createModalTrigger > triggerRef.current) openNew();
    triggerRef.current = createModalTrigger;
  }, [createModalTrigger]);

  const handleSelectInvoice = (factureId: string) => {
    const inv = pendingInvoices.find(f => f.id === factureId);
    if (!inv) { setForm({ ...form, facture_id: '', libelle: '', montant: 0 }); return; }
    const reste = inv.montant_ttc - (inv.montant_regle || 0);
    setForm({
      ...form,
      facture_id: inv.id,
      libelle: `Paiement ${inv.numero} - ${cliName(inv.client_id)}`,
      montant: Math.round(reste),
      categorie: '',
    });
  };

  const { submitPayment: processPayment } = usePayment();

  const save = async () => {
    if (!form.libelle || !form.montant || form.montant <= 0) { toast.error('Renseignez le libellé et un montant valide'); return; }
    if (form.type === 'Recette' && !form.facture_id) { toast.error('Sélectionnez une facture pour la recette'); return; }
    setSaving(true);
    try {
      if (form.type === 'Recette' && form.facture_id) {
        await processPayment({
          factureId: form.facture_id,
          amount: form.montant,
          mode_paiement: form.mode_paiement,
          date_operation: form.date_operation,
        });
      } else {
        await journal.add({
          libelle: form.libelle,
          type: form.type,
          montant: form.montant,
          mode_paiement: form.mode_paiement,
          compte: form.compte,
          date_operation: form.date_operation,
          categorie: form.categorie || null,
          facture_id: null,
        } as any);
      }
      setShowModal(false);
      toast.success('Transaction ajoutée');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
    finally { setSaving(false); }
  };

  const addNewCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await categories.add({ nom: newCatName.trim(), type: form.type === 'Recette' ? 'Recette' : 'Dépense' });
      setForm({ ...form, categorie: newCatName.trim() });
      setNewCatName('');
      setShowNewCat(false);
      toast.success('Catégorie ajoutée');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
  };

  const del = async () => {
    if (!deleteTarget) return;
    try {
      await journal.remove(deleteTarget.id);
      toast.success('Supprimé');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportCsv('journal', ['Date', 'Libellé', 'Type', 'Montant', 'Mode', 'Catégorie', 'Compte'],
      dateFiltered.map(j => [j.date_operation, j.libelle, j.type, String(j.montant || 0), j.mode_paiement || '', j.categorie || '', j.compte || '']));
    toast.success('Export CSV téléchargé');
  };

  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background cursor-pointer hover:text-primary transition-colors select-none";

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4">
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2 text-success"><ArrowDownCircle className="h-6 w-6 lg:h-7 lg:w-7" /></div>
          <div className="font-black text-xs lg:text-lg text-success truncate">{fmt(totR)}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Recettes</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-destructive to-accent" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2 text-destructive"><ArrowUpCircle className="h-6 w-6 lg:h-7 lg:w-7" /></div>
          <div className="font-black text-xs lg:text-lg text-destructive truncate">{fmt(totD)}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Dépenses</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-success" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2 text-primary"><Scale className="h-6 w-6 lg:h-7 lg:w-7" /></div>
          <div className={`font-black text-xs lg:text-lg truncate ${bal >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(Math.abs(bal))}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Balance</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-sm text-foreground">Journal ({dateFiltered.length})</h3>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all lg:hidden">
              ＋ Transaction
            </button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              className="bg-background border-[1.5px] border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground outline-none flex-1 min-w-[100px] max-w-[160px] font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/10"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); pagination.resetPage(); }}
            />
            <DateFilter month={month} setMonth={setMonth} availableMonths={availableMonths} />
            <button onClick={handleExport} className="bg-background border-[1.5px] border-border text-muted-foreground py-1.5 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all" title="Exporter CSV"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all hidden lg:inline-flex">
              ＋ Transaction
            </button>
          </div>
        </div>
        <div className="px-4 py-2 border-b border-border">
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); pagination.resetPage(); }}
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
            pagination.items.length ? pagination.items.map(j => (
              <div key={j.id} className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">{j.libelle || '—'}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{formatDate(j.date_operation)} · {j.mode_paiement} {j.categorie ? `· ${j.categorie}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-bold text-sm ${j.type === 'Recette' ? 'text-success' : 'text-destructive'}`}>
                    {j.type === 'Recette' ? '+' : '-'}{fmt(j.montant || 0)}
                  </span>
                  <button onClick={() => setDeleteTarget({ id: j.id, libelle: j.libelle })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto opacity-30 mb-2" />
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
                  <th className={thClass} onClick={() => toggleSort('date_operation')}>Date{sortIndicator('date_operation')}</th>
                  <th className={thClass} onClick={() => toggleSort('libelle')}>Libellé{sortIndicator('libelle')}</th>
                  <th className={thClass} onClick={() => toggleSort('type')}>Type{sortIndicator('type')}</th>
                  <th className={thClass} onClick={() => toggleSort('mode_paiement')}>Mode{sortIndicator('mode_paiement')}</th>
                  <th className={thClass} onClick={() => toggleSort('compte')}>Compte{sortIndicator('compte')}</th>
                  <th className={thClass} onClick={() => toggleSort('montant')}>Montant{sortIndicator('montant')}</th>
                  <th className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background"></th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.length ? pagination.items.map(j => (
                  <tr key={j.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{formatDate(j.date_operation)}</td>
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
                      <button onClick={() => setDeleteTarget({ id: j.id, libelle: j.libelle })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    <div className="text-sm">Aucune transaction</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <PaginationControls {...pagination} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer cette transaction ?"
        description={`"${deleteTarget?.libelle}" sera définitivement supprimée.`}
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5">
            {/* Type first */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Type</label>
              <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.type} onChange={e => setForm({ ...form, type: e.target.value, libelle: '', montant: 0, facture_id: '', categorie: '' })}>
                <option>Recette</option>
                <option>Dépense</option>
              </select>
            </div>

            {/* Recette: invoice selector */}
            {form.type === 'Recette' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Facture à encaisser *</label>
                <select
                  className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full"
                  value={form.facture_id}
                  onChange={e => handleSelectInvoice(e.target.value)}
                >
                  <option value="">— Sélectionner une facture —</option>
                  {pendingInvoices.map(f => {
                    const reste = f.montant_ttc - (f.montant_regle || 0);
                    return (
                      <option key={f.id} value={f.id}>
                        {f.numero} — {cliName(f.client_id)} — Reste: {fmt(reste)}
                      </option>
                    );
                  })}
                </select>
                {form.facture_id && (
                  <div className="text-[10.5px] text-muted-foreground bg-muted/50 rounded-lg p-2 mt-1">
                    {form.libelle}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Libellé *</label>
                <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Montant *</label>
                <input type="number" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.montant} onChange={e => setForm({ ...form, montant: Number(e.target.value) })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mode paiement</label>
                <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
                  {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
                <input type="date" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.date_operation} onChange={e => setForm({ ...form, date_operation: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Compte</label>
                <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.compte} onChange={e => setForm({ ...form, compte: e.target.value })} placeholder="Caisse, Banque..." />
              </div>
            </div>

            {/* Catégorie only for Dépense */}
            {form.type === 'Dépense' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Catégorie</label>
                {showNewCat ? (
                  <div className="flex gap-2">
                    <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary flex-1" placeholder="Nom de la catégorie" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNewCategory()} />
                    <button onClick={addNewCategory} className="gradient-primary text-primary-foreground border-none py-2 px-3 rounded-lg text-xs font-bold"><Plus className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setShowNewCat(false)} className="bg-card border-[1.5px] border-border text-muted-foreground py-2 px-3 rounded-lg text-xs font-bold">✕</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary flex-1" value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                      <option value="">— Choisir —</option>
                      {(categories.data.length ? categories.data.filter(c => c.type === 'Dépense') : JOURNAL_CATEGORIES.map(c => ({ nom: c }))).map(c => <option key={c.nom} value={c.nom}>{c.nom}</option>)}
                    </select>
                    <button onClick={() => setShowNewCat(true)} className="bg-background border-[1.5px] border-border text-primary py-2 px-3 rounded-lg text-xs font-bold hover:border-primary transition-all" title="Nouvelle catégorie"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button onClick={() => setShowModal(false)} className="bg-card border-[1.5px] border-border text-muted-foreground py-2 px-4 rounded-lg text-xs font-bold hover:bg-background transition-all w-full sm:w-auto">Annuler</button>
            <button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all w-full sm:w-auto flex items-center justify-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
