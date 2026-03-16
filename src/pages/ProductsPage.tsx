import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaginationControls } from '@/components/PaginationControls';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { produits, fmt, createModalTrigger } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: '', type: 'Service', prix: 0, unite: 'forfait', description: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string } | null>(null);
  const triggerRef = useRef(createModalTrigger);

  let filtered = produits.data;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => (p.nom + ' ' + p.description + ' ' + p.type).toLowerCase().includes(q));
  }

  const pagination = usePagination(filtered);

  const openNew = () => { setEditId(null); setForm({ nom: '', type: 'Service', prix: 0, unite: 'forfait', description: '' }); setShowModal(true); };
  const openEdit = (p: typeof produits.data[0]) => { setEditId(p.id); setForm({ nom: p.nom, type: p.type || 'Service', prix: p.prix, unite: p.unite || 'forfait', description: p.description || '' }); setShowModal(true); };

  useEffect(() => {
    if (createModalTrigger > triggerRef.current) {
      openNew();
    }
    triggerRef.current = createModalTrigger;
  }, [createModalTrigger]);

  const save = async () => {
    if (!form.nom) { toast.error('Renseignez le nom du produit'); return; }
    try {
      if (editId) await produits.update(editId, form);
      else await produits.add(form);
      setShowModal(false);
      toast.success(editId ? 'Produit modifié' : 'Produit ajouté');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
  };

  const del = async () => {
    if (!deleteTarget) return;
    try {
      await produits.remove(deleteTarget.id);
      toast.success('Supprimé');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-foreground">Produits & Services ({filtered.length})</h3>
          <div className="flex gap-2 items-center">
            <input
              className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2.5 text-xs text-foreground outline-none w-[140px] font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/10"
              placeholder="🔍 Rechercher..."
              value={search}
              onChange={e => { setSearch(e.target.value); pagination.resetPage(); }}
            />
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">＋ Nouveau</button>
          </div>
        </div>
        {/* Mobile card view */}
        <div className="lg:hidden">
          {produits.isLoading ? <TableSkeleton rows={5} cols={3} /> : (
            pagination.items.length ? pagination.items.map(p => (
              <div key={p.id} className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-foreground truncate">{p.nom}</div>
                  <div className="text-[10.5px] text-muted-foreground truncate">{p.type} · {p.unite} {p.description ? `· ${p.description}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-sm text-foreground">{fmt(p.prix)}</span>
                  <button onClick={() => openEdit(p)} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">✏️</button>
                  <button onClick={() => setDeleteTarget({ id: p.id, nom: p.nom })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">🗑️</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">
                <div className="text-4xl opacity-30 mb-2">📦</div>
                <div className="text-sm">Aucun produit</div>
              </div>
            )
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          {produits.isLoading ? <TableSkeleton rows={5} cols={6} /> : (
            <table className="w-full border-collapse min-w-[560px]">
              <thead>
                <tr>
                  {['Nom', 'Type', 'Prix unitaire', 'Unité', 'Description', 'Actions'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagination.items.length ? pagination.items.map(p => (
                  <tr key={p.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{p.nom}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{p.type}</td>
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{fmt(p.prix)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{p.unite}</td>
                    <td className="px-3.5 py-3 text-sm text-muted-foreground border-b border-border">{p.description}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all">✏️</button>
                        <button onClick={() => setDeleteTarget({ id: p.id, nom: p.nom })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                    <div className="text-4xl opacity-30 mb-2">📦</div>
                    <div className="text-sm">Aucun produit</div>
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
        title={`Supprimer "${deleteTarget?.nom}" ?`}
        description="Ce produit sera définitivement supprimé."
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[1000] flex items-end lg:items-center justify-center">
          <div className="bg-card border border-border rounded-2xl lg:rounded-2xl rounded-b-none w-full lg:max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.22s_ease]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-[15px] text-foreground">{editId ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground text-xl bg-transparent border-none cursor-pointer">✕</button>
            </div>
            <div className="p-5 grid gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nom *</label>
                <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Prix</label>
                  <input type="number" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.prix} onChange={e => setForm({ ...form, prix: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Unité</label>
                  <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                <textarea className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans resize-y min-h-[70px] focus:border-primary w-full" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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
