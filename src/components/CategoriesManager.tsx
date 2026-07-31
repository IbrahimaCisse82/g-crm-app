import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Trash2, Pencil, Check, X, Tags } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import { useProGate } from '@/hooks/useProGate';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CategoriesManager({ open, onOpenChange }: Props) {
  const { categories } = useApp();
  const { limits, showUpgrade, proGate } = useProGate();
  const [tab, setTab] = useState<'Dépense' | 'Recette'>('Dépense');
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string } | null>(null);

  const filtered = categories.data.filter(c => c.type === tab);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (categories.data.length >= limits.maxCategories) {
      showUpgrade('Catégories illimitées');
      return;
    }
    if (categories.data.some(c => c.nom.toLowerCase() === name.toLowerCase() && c.type === tab)) {
      toast.error('Cette catégorie existe déjà');
      return;
    }
    try {
      await categories.add({ nom: name, type: tab });
      setNewName('');
      toast.success('Catégorie ajoutée');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      await categories.update(id, { nom: name });
      setEditingId(null);
      toast.success('Catégorie modifiée');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await categories.remove(deleteTarget.id);
      toast.success('Catégorie supprimée');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
    setDeleteTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Tags className="h-5 w-5" /> Gérer les catégories</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 mb-3">
            {(['Dépense', 'Recette'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`border-[1.5px] rounded-lg px-4 py-2 text-xs font-semibold transition-all flex-1 ${tab === t ? 'bg-primary/10 text-primary border-primary' : 'bg-background border-border text-muted-foreground hover:bg-card'}`}>
                {t === 'Dépense' ? 'Dépenses' : 'Recettes'}
              </button>
            ))}
          </div>

          {/* Add new */}
          <div className="flex gap-2 mb-4">
            <input
              className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary flex-1"
              placeholder={`Nouvelle catégorie ${tab.toLowerCase()}...`}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="gradient-primary text-primary-foreground border-none py-2.5 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </button>
          </div>

          {/* List */}
          <div className="border border-border rounded-xl overflow-hidden">
            {filtered.length ? filtered.map(cat => (
              <div key={cat.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0 hover:bg-background/50 transition-colors">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      className="bg-background border-[1.5px] border-primary rounded-lg py-1.5 px-3 text-sm text-foreground outline-none font-sans flex-1 min-w-0"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                      autoFocus
                    />
                    <button onClick={() => handleUpdate(cat.id)} className="text-success hover:bg-success/10 p-1.5 rounded-lg transition-all"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:bg-muted p-1.5 rounded-lg transition-all"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium text-foreground">{cat.nom}</span>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingId(cat.id); setEditName(cat.nom); }} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget({ id: cat.id, nom: cat.nom })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-sm text-muted-foreground">Aucune catégorie</div>
            )}
          </div>

          <p className="text-[10.5px] text-muted-foreground mt-2">
            {filtered.length} catégorie{filtered.length > 1 ? 's' : ''} · Les catégories sont utilisées dans le journal comptable
          </p>
        </DialogContent>
      </Dialog>

      {proGate}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={`Supprimer "${deleteTarget?.nom}" ?`}
        description="Cette catégorie sera définitivement supprimée. Les transactions existantes conserveront leur catégorie."
        onConfirm={handleDelete}
        confirmLabel="Supprimer"
      />
    </>
  );
}
