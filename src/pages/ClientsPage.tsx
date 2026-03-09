import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { toast } from 'sonner';

export default function ClientsPage() {
  const { clients, factures, devis } = useApp();
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', entreprise: '', statut: 'Actif', adresse: '', notes: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filtered = filter
    ? clients.data.filter(c => c.statut === filter || (c.nom + c.prenom + c.entreprise + c.email).toLowerCase().includes(filter.toLowerCase()))
    : clients.data;

  const openNew = () => {
    setEditId(null);
    setForm({ prenom: '', nom: '', email: '', telephone: '', entreprise: '', statut: 'Actif', adresse: '', notes: '' });
    setShowModal(true);
  };

  useEffect(() => {
    const handler = () => openNew();
    window.addEventListener('open-create-modal', handler);
    return () => window.removeEventListener('open-create-modal', handler);
  }, []);

  const openEdit = (c: typeof clients.data[0]) => {
    setEditId(c.id);
    setForm({ prenom: c.prenom, nom: c.nom, email: c.email || '', telephone: c.telephone || '', entreprise: c.entreprise || '', statut: c.statut, adresse: c.adresse || '', notes: c.notes || '' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.prenom && !form.nom) return;
    try {
      if (editId) {
        await clients.update(editId, form);
      } else {
        await clients.add(form);
      }
      setShowModal(false);
      toast.success(editId ? 'Client modifié' : 'Client ajouté');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const del = async () => {
    if (!deleteTarget) return;
    // Check for linked invoices/quotes
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-foreground">Clients ({filtered.length})</h3>
          <div className="flex gap-2 items-center">
            <select
              className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2 text-xs text-foreground outline-none font-sans"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="">Tous</option>
              <option>Actif</option>
              <option>Prospect</option>
              <option>Inactif</option>
            </select>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">
              ＋ Nouveau
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {clients.isLoading ? <TableSkeleton rows={5} cols={6} /> : (
            <table className="w-full border-collapse min-w-[560px]">
              <thead>
                <tr>
                  {['Nom', 'Email', 'Téléphone', 'Entreprise', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map(c => (
                  <tr key={c.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{c.prenom} {c.nom}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{c.email || '—'}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{c.telephone || '—'}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{c.entreprise || '—'}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border"><StatusBadge status={c.statut} /></td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all">✏️</button>
                        <button onClick={() => setDeleteTarget({ id: c.id, name: `${c.prenom} ${c.nom}` })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                    <div className="text-4xl opacity-30 mb-2">👥</div>
                    <div className="text-sm">Aucun client</div>
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
        title={`Supprimer ${deleteTarget?.name} ?`}
        description="Cette action est irréversible. Vérifiez qu'aucune facture ou devis n'est lié à ce client."
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[1000] flex items-center lg:items-center items-end justify-center">
          <div className="bg-card border border-border rounded-2xl lg:rounded-2xl rounded-b-none w-full lg:max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.22s_ease]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-[15px] text-foreground">{editId ? 'Modifier Client' : 'Nouveau Client'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground text-xl bg-transparent border-none cursor-pointer">✕</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                <FormField label="Prénom *" value={form.prenom} onChange={v => setForm({ ...form, prenom: v })} />
                <FormField label="Nom *" value={form.nom} onChange={v => setForm({ ...form, nom: v })} />
                <FormField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
                <FormField label="Téléphone" value={form.telephone} onChange={v => setForm({ ...form, telephone: v })} />
                <FormField label="Entreprise" value={form.entreprise} onChange={v => setForm({ ...form, entreprise: v })} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Statut</label>
                  <select
                    className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full"
                    value={form.statut}
                    onChange={e => setForm({ ...form, statut: e.target.value })}
                  >
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
                    <textarea
                      className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans resize-y min-h-[70px] focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full"
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
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

function FormField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary focus:ring-[3px] focus:ring-primary/10 w-full"
      />
    </div>
  );
}
