import { useState } from 'react';
import { Receipt, FileText, Trash2, Save, Download } from 'lucide-react';
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
import { PAYMENT_MODES } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const defaultForm = {
  client_id: '',
  facture_id: '',
  date_recu: new Date().toISOString().slice(0, 10),
  montant: 0,
  mode_paiement: 'Espèce',
  reference: '',
  description: '',
  notes: '',
};

export default function RecusPage() {
  const { recus, clients, factures, entreprise, cliName, fmt } = useApp();
  const { limits, requirePro, proGate } = useProGate();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; numero: string } | null>(null);
  const [saving, setSaving] = useState(false);

  let pre = recus.data;
  if (search) {
    const q = search.toLowerCase();
    pre = pre.filter(r => r.numero?.toLowerCase().includes(q) || cliName(r.client_id).toLowerCase().includes(q));
  }
  const { filtered, month, setMonth, availableMonths } = useDateFilter(pre, 'date_recu');
  const pagination = usePagination(filtered);

  const openNew = () => { setForm(defaultForm); setShowModal(true); };

  const save = async () => {
    if (!form.client_id || !form.montant || form.montant <= 0) {
      toast.error('Sélectionnez un client et un montant valide');
      return;
    }
    setSaving(true);
    try {
      const numero = await recus.nextNumero();
      await recus.add({
        numero,
        client_id: form.client_id,
        facture_id: form.facture_id || null,
        date_recu: form.date_recu,
        montant: form.montant,
        mode_paiement: form.mode_paiement,
        reference: form.reference || '',
        description: form.description || '',
        notes: form.notes || '',
      });
      toast.success('Reçu créé');
      setShowModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setSaving(false);
  };

  const del = async () => {
    if (!deleteTarget) return;
    try {
      await recus.remove(deleteTarget.id);
      toast.success('Reçu supprimé');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportCsv('recus', ['N°', 'Client', 'Date', 'Montant', 'Mode', 'Référence', 'Description'],
      filtered.map(r => [r.numero, cliName(r.client_id), r.date_recu, String(r.montant), r.mode_paiement, r.reference || '', r.description || '']));
    toast.success('Export CSV téléchargé');
  };

  const factureRef = (id: string | null) => factures.data.find(f => f.id === id)?.numero || null;

  const generateRecuPdf = (r: typeof recus.data[0]) => downloadPdf({
    type: 'recu',
    numero: r.numero,
    date: r.date_recu,
    client: cliName(r.client_id),
    articles: [],
    montant_ht: r.montant,
    montant_tva: 0,
    montant_ttc: r.montant,
    tva_pct: 0,
    mode_paiement: r.mode_paiement,
    reference: r.reference,
    description: r.description,
    facture_ref: factureRef(r.facture_id),
    notes: r.notes,
    entreprise: entreprise.data,
  });

  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background";

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-sm text-foreground">Reçus ({filtered.length})</h3>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all lg:hidden">＋ Nouveau</button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input className="bg-background border-[1.5px] border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground outline-none flex-1 min-w-[100px] max-w-[160px]" placeholder="N°, client..." value={search} onChange={e => setSearch(e.target.value)} />
            <DateFilter month={month} setMonth={setMonth} availableMonths={availableMonths} />
            <button onClick={handleExport} className="bg-background border-[1.5px] border-border text-muted-foreground py-1.5 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all" title="Exporter CSV"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all hidden lg:inline-flex">＋ Nouveau</button>
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden">
          {recus.isLoading ? <TableSkeleton rows={5} cols={3} /> : (
            pagination.items.length ? pagination.items.map(r => (
              <div key={r.id} className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-foreground">{r.numero}</div>
                  <span className="font-bold text-sm text-success">{fmt(r.montant)}</span>
                </div>
                <div className="text-[10.5px] text-muted-foreground truncate">{cliName(r.client_id)} · {formatDate(r.date_recu)} · {r.mode_paiement}</div>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => requirePro(limits.canExportPdf, 'Export PDF', () => generateRecuPdf(r))} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs"><FileText className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget({ id: r.id, numero: r.numero })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">
                <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <div className="text-sm">Aucun reçu</div>
              </div>
            )
          )}
        </div>

        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          {recus.isLoading ? <TableSkeleton rows={5} cols={6} /> : (
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className={thClass}>N°</th>
                  <th className={thClass}>Client</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Montant</th>
                  <th className={thClass}>Mode</th>
                  <th className={thClass}>Référence</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.length ? pagination.items.map(r => (
                  <tr key={r.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{r.numero}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(r.client_id)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{formatDate(r.date_recu)}</td>
                    <td className="px-3.5 py-3 text-sm font-bold text-success border-b border-border">{fmt(r.montant)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{r.mode_paiement}</td>
                    <td className="px-3.5 py-3 text-sm text-muted-foreground border-b border-border">{r.reference || '—'}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex gap-1">
                        <button onClick={() => requirePro(limits.canExportPdf, 'Export PDF', () => generateRecuPdf(r))} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all" title="PDF"><FileText className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ id: r.id, numero: r.numero })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    <div className="text-sm">Aucun reçu</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <PaginationControls {...pagination} />
      </div>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title={`Supprimer le reçu ${deleteTarget?.numero} ?`} description="Cette action est irréversible." onConfirm={del} confirmLabel="Supprimer" />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau Reçu</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Client *</label>
              <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none focus:border-primary" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                <option value="">— Sélectionner —</option>
                {clients.data.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date</label>
              <input type="date" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.date_recu} onChange={e => setForm({ ...form, date_recu: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Montant *</label>
              <input type="number" inputMode="decimal" min="1" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.montant || ''} onChange={e => setForm({ ...form, montant: Number(e.target.value) })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mode</label>
              <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
                {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Facture liée (optionnel)</label>
              <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.facture_id} onChange={e => setForm({ ...form, facture_id: e.target.value })}>
                <option value="">— Aucune —</option>
                {factures.data.filter(f => !form.client_id || f.client_id === form.client_id).map(f => <option key={f.id} value={f.id}>{f.numero}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Référence transaction</label>
              <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm focus:border-primary resize-y min-h-[60px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={500} />
            </div>
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
