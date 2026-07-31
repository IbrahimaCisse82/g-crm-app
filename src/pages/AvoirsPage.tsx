import { useState } from 'react';
import { FileMinus, FileText, Trash2, Save, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaginationControls } from '@/components/PaginationControls';
import { DateFilter } from '@/components/DateFilter';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { usePagination } from '@/hooks/usePagination';
import { useDateFilter } from '@/hooks/useDateFilter';
import { exportCsv } from '@/utils/exportCsv';
import { toast } from 'sonner';
import { downloadPdf } from '@/utils/generatePdf';
import { useProGate } from '@/hooks/useProGate';
import { formatDate } from '@/lib/formatDate';
import type { ArticleLine } from '@/types';
import type { Json } from '@/integrations/supabase/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const defaultForm = {
  facture_id: '',
  date_avoir: new Date().toISOString().slice(0, 10),
  motif: '',
  notes: '',
};

export default function AvoirsPage() {
  const { avoirs, factures, clients, entreprise, cliName, fmt } = useApp();
  const { limits, requirePro, proGate } = useProGate();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [articles, setArticles] = useState<ArticleLine[]>([{ nom: '', quantite: 1, prix_unitaire: 0 }]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; numero: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const tva = entreprise.data?.tva ?? 18;
  const totalHT = articles.reduce((s, a) => s + a.quantite * a.prix_unitaire, 0);
  const totalTVA = Math.round(totalHT * tva / 100);
  const totalTTC = totalHT + totalTVA;

  let pre = avoirs.data;
  if (search) {
    const q = search.toLowerCase();
    pre = pre.filter(a => a.numero?.toLowerCase().includes(q) || cliName(a.client_id).toLowerCase().includes(q));
  }
  const { filtered, month, setMonth, availableMonths } = useDateFilter(pre, 'date_avoir');
  const pagination = usePagination(filtered);

  const openNew = () => {
    setForm(defaultForm);
    setArticles([{ nom: '', quantite: 1, prix_unitaire: 0 }]);
    setShowModal(true);
  };

  const onFactureChange = (id: string) => {
    const f = factures.data.find(x => x.id === id);
    if (f) {
      const arts = Array.isArray(f.articles) ? (f.articles as unknown as ArticleLine[]).map(a => ({
        nom: a.nom || '', quantite: a.quantite || 1, prix_unitaire: a.prix_unitaire || 0,
      })) : [{ nom: '', quantite: 1, prix_unitaire: 0 }];
      setArticles(arts);
    }
    setForm({ ...form, facture_id: id });
  };

  const updateArticle = (i: number, field: keyof ArticleLine, v: string | number) =>
    setArticles(articles.map((a, idx) => idx === i ? { ...a, [field]: v } : a));
  const removeArticle = (i: number) => setArticles(articles.filter((_, idx) => idx !== i));
  const addArticle = () => setArticles([...articles, { nom: '', quantite: 1, prix_unitaire: 0 }]);

  const save = async () => {
    if (!form.facture_id) { toast.error('Sélectionnez la facture source'); return; }
    const valid = articles.filter(a => a.nom);
    if (!valid.length) { toast.error('Au moins un article requis'); return; }
    const fac = factures.data.find(f => f.id === form.facture_id);
    setSaving(true);
    try {
      const numero = await avoirs.nextNumero();
      await avoirs.add({
        numero,
        client_id: fac?.client_id || null,
        facture_id: form.facture_id,
        date_avoir: form.date_avoir,
        articles: valid as unknown as Json,
        montant_ht: totalHT,
        montant_tva: totalTVA,
        montant_ttc: totalTTC,
        motif: form.motif,
        notes: form.notes,
      });
      toast.success('Avoir créé');
      setShowModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setSaving(false);
  };

  const del = async () => {
    if (!deleteTarget) return;
    try { await avoirs.remove(deleteTarget.id); toast.success('Avoir supprimé'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportCsv('avoirs', ['N°', 'Client', 'Facture', 'Date', 'Montant TTC', 'Motif'],
      filtered.map(a => [a.numero, cliName(a.client_id), factures.data.find(f => f.id === a.facture_id)?.numero || '', a.date_avoir, String(a.montant_ttc), a.motif || '']));
    toast.success('Export CSV téléchargé');
  };

  const factureRef = (id: string | null) => factures.data.find(f => f.id === id)?.numero || null;

  const generateAvoirPdf = (a: typeof avoirs.data[0]) => downloadPdf({
    type: 'avoir',
    numero: a.numero,
    date: a.date_avoir,
    client: cliName(a.client_id),
    articles: (a.articles as unknown as ArticleLine[]) || [],
    montant_ht: a.montant_ht,
    montant_tva: a.montant_tva,
    montant_ttc: a.montant_ttc,
    tva_pct: tva,
    motif: a.motif,
    facture_ref: factureRef(a.facture_id),
    notes: a.notes,
    entreprise: entreprise.data,
  });

  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background";

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-sm text-foreground">Avoirs ({filtered.length})</h3>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all lg:hidden">＋ Nouveau</button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input className="bg-background border-[1.5px] border-border rounded-lg py-1.5 px-2.5 text-xs flex-1 min-w-[100px] max-w-[160px]" placeholder="N°, client..." value={search} onChange={e => setSearch(e.target.value)} />
            <DateFilter month={month} setMonth={setMonth} availableMonths={availableMonths} />
            <button onClick={handleExport} className="bg-background border-[1.5px] border-border text-muted-foreground py-1.5 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all" title="Exporter CSV"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all hidden lg:inline-flex">＋ Nouveau</button>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          {avoirs.isLoading ? <TableSkeleton rows={5} cols={3} /> : (
            pagination.items.length ? pagination.items.map(a => (
              <div key={a.id} className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-foreground">{a.numero}</div>
                  <span className="font-bold text-sm text-destructive">−{fmt(a.montant_ttc)}</span>
                </div>
                <div className="text-[10.5px] text-muted-foreground truncate">{cliName(a.client_id)} · {formatDate(a.date_avoir)} · Fact. {factureRef(a.facture_id) || '—'}</div>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => requirePro(limits.canExportPdf, 'Export PDF', () => generateAvoirPdf(a))} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs"><FileText className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget({ id: a.id, numero: a.numero })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">
                <FileMinus className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <div className="text-sm">Aucun avoir</div>
              </div>
            )
          )}
        </div>

        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          {avoirs.isLoading ? <TableSkeleton rows={5} cols={6} /> : (
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className={thClass}>N°</th>
                  <th className={thClass}>Client</th>
                  <th className={thClass}>Facture source</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Montant TTC</th>
                  <th className={thClass}>Motif</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.length ? pagination.items.map(a => (
                  <tr key={a.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{a.numero}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(a.client_id)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{factureRef(a.facture_id) || '—'}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{formatDate(a.date_avoir)}</td>
                    <td className="px-3.5 py-3 text-sm font-bold text-destructive border-b border-border">−{fmt(a.montant_ttc)}</td>
                    <td className="px-3.5 py-3 text-sm text-muted-foreground border-b border-border truncate max-w-[200px]">{a.motif || '—'}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex gap-1">
                        <button onClick={() => requirePro(limits.canExportPdf, 'Export PDF', () => generateAvoirPdf(a))} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all" title="PDF"><FileText className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ id: a.id, numero: a.numero })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <FileMinus className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    <div className="text-sm">Aucun avoir</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <PaginationControls {...pagination} />
      </div>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title={`Supprimer l'avoir ${deleteTarget?.numero} ?`} description="Cette action est irréversible." onConfirm={del} confirmLabel="Supprimer" />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel Avoir</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Facture source *</label>
              <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.facture_id} onChange={e => onFactureChange(e.target.value)}>
                <option value="">— Sélectionner —</option>
                {factures.data.map(f => <option key={f.id} value={f.id}>{f.numero} — {cliName(f.client_id)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
              <input type="date" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.date_avoir} onChange={e => setForm({ ...form, date_avoir: e.target.value })} />
            </div>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Articles à créditer</label>
              <button onClick={addArticle} className="text-xs text-primary font-bold hover:underline">＋ Ajouter</button>
            </div>
            {articles.map((a, i) => (
              <div key={i} className="flex gap-2 items-end mb-2 flex-wrap">
                <input className="flex-1 min-w-[140px] bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs focus:border-primary" placeholder="Désignation" value={a.nom} onChange={e => updateArticle(i, 'nom', e.target.value)} />
                <input type="number" inputMode="decimal" min="1" className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs w-16 focus:border-primary" placeholder="Qté" value={a.quantite} onChange={e => updateArticle(i, 'quantite', Number(e.target.value))} />
                <input type="number" inputMode="decimal" min="0" className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs w-24 focus:border-primary" placeholder="Prix" value={a.prix_unitaire} onChange={e => updateArticle(i, 'prix_unitaire', Number(e.target.value))} />
                <span className="text-xs font-bold text-foreground w-24 text-right">{fmt(a.quantite * a.prix_unitaire)}</span>
                {articles.length > 1 && <button onClick={() => removeArticle(i)} className="text-destructive text-xs px-1">✕</button>}
              </div>
            ))}
          </div>
          <div className="bg-background border border-border rounded-lg p-3 mb-3.5">
            <div className="flex justify-between text-xs mb-1"><span>Total HT</span><span className="font-bold">{fmt(totalHT)}</span></div>
            <div className="flex justify-between text-xs mb-1"><span>TVA ({tva}%)</span><span className="font-bold">{fmt(totalTVA)}</span></div>
            <div className="flex justify-between text-sm font-black border-t border-border pt-1.5 mt-1.5"><span>Total avoir TTC</span><span className="text-destructive">−{fmt(totalTTC)}</span></div>
          </div>
          <div className="flex flex-col gap-1.5 mb-3">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Motif</label>
            <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })} placeholder="Ex : Retour marchandise" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
            <textarea className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary resize-y min-h-[60px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} maxLength={500} />
          </div>
          <DialogFooter>
            <button onClick={() => setShowModal(false)} className="bg-card border-[1.5px] border-border text-muted-foreground py-2 px-4 rounded-lg text-xs font-bold">Annuler</button>
            <button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary disabled:opacity-60 flex items-center gap-1.5">
              {saving ? 'Enregistrement...' : <><Save className="h-3.5 w-3.5" /> Enregistrer</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {proGate}

    </div>
  );
}
