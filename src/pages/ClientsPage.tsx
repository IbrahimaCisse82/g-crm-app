import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Pencil, Trash2, Download, Search, Save, Users } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaginationControls } from '@/components/PaginationControls';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { usePagination } from '@/hooks/usePagination';
import { useSortableTable } from '@/hooks/useSortableTable';
import { exportCsv } from '@/utils/exportCsv';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ClientsPage() {
  const { clients, factures, devis, createModalTrigger } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', entreprise: '', statut: 'Actif', adresse: '', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const triggerRef = useRef(createModalTrigger);

  let filtered = clients.data;
  if (statusFilter) filtered = filtered.filter(c => c.statut === statusFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => (c.nom + ' ' + c.prenom + ' ' + c.entreprise + ' ' + c.email + ' ' + c.telephone).toLowerCase().includes(q));
  }

  const { sorted, toggleSort, sortIndicator } = useSortableTable(filtered);
  const pagination = usePagination(sorted);

  const openNew = () => {
    setEditId(null);
    setForm({ prenom: '', nom: '', email: '', telephone: '', entreprise: '', statut: 'Actif', adresse: '', notes: '' });
    setShowModal(true);
  };

  useEffect(() => {
    if (createModalTrigger > triggerRef.current) openNew();
    triggerRef.current = createModalTrigger;
  }, [createModalTrigger]);

  const openEdit = (c: typeof clients.data[0]) => {
    setEditId(c.id);
    setForm({ prenom: c.prenom, nom: c.nom, email: c.email || '', telephone: c.telephone || '', entreprise: c.entreprise || '', statut: c.statut, adresse: c.adresse || '', notes: c.notes || '' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.prenom && !form.nom) { toast.error('Renseignez au moins le prénom ou le nom'); return; }
    try {
      if (editId) await clients.update(editId, form);
      else await clients.add(form);
      setShowModal(false);
      toast.success(editId ? 'Client modifié' : 'Client ajouté');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
  };

  const del = async () => {
    if (!deleteTarget) return;
    const linkedFacs = factures.data.filter(f => f.client_id === deleteTarget.id);
    const linkedDevis = devis.data.filter(d => d.client_id === deleteTarget.id);
    if (linkedFacs.length > 0 || linkedDevis.length > 0) {
      toast.error(`Ce client a ${linkedFacs.length} facture(s) et ${linkedDevis.length} devis liés. Supprimez-les d'abord.`);
      setDeleteTarget(null);
      return;
    }
    try {
      await clients.remove(deleteTarget.id);
      toast.success('Client supprimé');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    exportCsv('clients', ['Prénom', 'Nom', 'Email', 'Téléphone', 'Entreprise', 'Statut'], 
      filtered.map(c => [c.prenom, c.nom, c.email || '', c.telephone || '', c.entreprise || '', c.statut]));
    toast.success('Export CSV téléchargé');
  };

  const thClass = "px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background cursor-pointer hover:text-primary transition-colors select-none";

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-sm text-foreground">Clients ({filtered.length})</h3>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all lg:hidden">＋ Nouveau</button>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              className="bg-background border-[1.5px] border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground outline-none flex-1 min-w-[100px] max-w-[160px] font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/10"
              placeholder="Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); pagination.resetPage(); }}
            />
            <select
              className="bg-background border-[1.5px] border-border rounded-lg py-1.5 px-2 text-xs text-foreground outline-none font-sans"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); pagination.resetPage(); }}
            >
              <option value="">Tous</option>
              <option>Actif</option>
              <option>Prospect</option>
              <option>Inactif</option>
            </select>
            <button onClick={handleExport} className="bg-background border-[1.5px] border-border text-muted-foreground py-1.5 px-2.5 rounded-lg text-xs font-bold hover:border-primary hover:text-primary transition-all" title="Exporter CSV"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all hidden lg:inline-flex">＋ Nouveau</button>
          </div>
        </div>
        {/* Mobile card view */}
        <div className="lg:hidden">
          {clients.isLoading ? <TableSkeleton rows={5} cols={3} /> : (
            pagination.items.length ? pagination.items.map(c => (
              <div key={c.id} className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-foreground truncate">{c.prenom} {c.nom}</div>
                  <div className="text-[10.5px] text-muted-foreground truncate">{c.entreprise || c.email || c.telephone || '—'}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.statut} />
                  <button onClick={() => openEdit(c)} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget({ id: c.id, name: `${c.prenom} ${c.nom}` })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto opacity-30 mb-2" />
                <div className="text-sm">Aucun client</div>
              </div>
            )
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          {clients.isLoading ? <TableSkeleton rows={5} cols={6} /> : (
            <table className="w-full border-collapse min-w-[560px]">
              <thead>
                <tr>
                  <th className={thClass} onClick={() => toggleSort('nom')}>Nom{sortIndicator('nom')}</th>
                  <th className={thClass} onClick={() => toggleSort('email')}>Email{sortIndicator('email')}</th>
                  <th className={thClass} onClick={() => toggleSort('telephone')}>Téléphone{sortIndicator('telephone')}</th>
                  <th className={thClass} onClick={() => toggleSort('entreprise')}>Entreprise{sortIndicator('entreprise')}</th>
                  <th className={thClass} onClick={() => toggleSort('statut')}>Statut{sortIndicator('statut')}</th>
                  <th className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.items.length ? pagination.items.map(c => (
                  <tr key={c.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{c.prenom} {c.nom}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{c.email || '—'}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{c.telephone || '—'}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{c.entreprise || '—'}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border"><StatusBadge status={c.statut} /></td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ id: c.id, name: `${c.prenom} ${c.nom}` })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto opacity-30 mb-2" />
                    <div className="text-sm">Aucun client</div>
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
        title={`Supprimer ${deleteTarget?.name} ?`}
        description="Cette action est irréversible. Vérifiez qu'aucune facture ou devis n'est lié à ce client."
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Modifier Client' : 'Nouveau Client'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <FormField label="Prénom *" value={form.prenom} onChange={v => setForm({ ...form, prenom: v })} />
            <FormField label="Nom *" value={form.nom} onChange={v => setForm({ ...form, nom: v })} />
            <FormField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
            <FormField label="Téléphone" value={form.telephone} onChange={v => setForm({ ...form, telephone: v })} />
            <FormField label="Entreprise" value={form.entreprise} onChange={v => setForm({ ...form, entreprise: v })} />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Statut</label>
              <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full" value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option>Actif</option>
                <option>Prospect</option>
                <option>Inactif</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <FormField label="Adresse" value={form.adresse} onChange={v => setForm({ ...form, adresse: v })} />
            </div>
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
                <textarea className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans resize-y min-h-[70px] focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowModal(false)} className="bg-card border-[1.5px] border-border text-muted-foreground py-2 px-4 rounded-lg text-xs font-bold hover:bg-background transition-all">Annuler</button>
            <button onClick={save} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">💾 Enregistrer</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full" />
    </div>
  );
}
