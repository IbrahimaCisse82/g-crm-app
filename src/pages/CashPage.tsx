import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Pencil, Trash2, Save, Banknote, Smartphone, Landmark, Wallet } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function CashPage() {
  const { comptes, journal, fmt, createModalTrigger } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ operateur: 'Wave', numero: '', titulaire: '', solde: 0 });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [search, setSearch] = useState('');
  const triggerRef = useRef(createModalTrigger);

  const mmModes = ['Wave', 'Orange Money', 'Yas Money'];
  const icons: Record<string, string> = { Wave: '🔵', 'Orange Money': '🟠', 'Yas Money': '🟣' };

  const eIn = journal.data.filter(j => j.type === 'Recette' && (j.mode_paiement === 'Espèce' || j.compte === 'Caisse')).reduce((s, j) => s + (j.montant || 0), 0);
  const eOut = journal.data.filter(j => j.type === 'Dépense' && (j.mode_paiement === 'Espèce' || j.compte === 'Caisse')).reduce((s, j) => s + (j.montant || 0), 0);
  const soldeCaisse = eIn - eOut;

  const bIn = journal.data.filter(j => j.type === 'Recette' && (j.mode_paiement === 'Virement' || j.mode_paiement === 'Chèque')).reduce((s, j) => s + (j.montant || 0), 0);
  const bOut = journal.data.filter(j => j.type === 'Dépense' && (j.mode_paiement === 'Virement' || j.mode_paiement === 'Chèque')).reduce((s, j) => s + (j.montant || 0), 0);
  const soldeBanque = bIn - bOut;

  let mmTot = 0;
  const mmCards = comptes.data.map(mm => {
    const mIn = journal.data.filter(j => j.type === 'Recette' && mmModes.includes(j.mode_paiement || '') && j.compte?.includes(mm.numero)).reduce((s, j) => s + (j.montant || 0), 0);
    const mOut = journal.data.filter(j => j.type === 'Dépense' && mmModes.includes(j.mode_paiement || '') && j.compte?.includes(mm.numero)).reduce((s, j) => s + (j.montant || 0), 0);
    const sol = mm.solde + mIn - mOut;
    mmTot += sol;
    return { mm, sol, mIn, mOut };
  });

  const filteredMmCards = search
    ? mmCards.filter(({ mm }) => (mm.operateur + ' ' + mm.numero + ' ' + mm.titulaire).toLowerCase().includes(search.toLowerCase()))
    : mmCards;

  const total = soldeCaisse + mmTot + soldeBanque;

  const openNew = () => {
    setEditId(null);
    setForm({ operateur: 'Wave', numero: '', titulaire: '', solde: 0 });
    setShowModal(true);
  };

  const openEdit = (mm: typeof comptes.data[0]) => {
    setEditId(mm.id);
    setForm({ operateur: mm.operateur, numero: mm.numero, titulaire: mm.titulaire, solde: mm.solde });
    setShowModal(true);
  };

  useEffect(() => {
    if (createModalTrigger > triggerRef.current) openNew();
    triggerRef.current = createModalTrigger;
  }, [createModalTrigger]);

  if (comptes.isLoading || journal.isLoading) {
    return (
      <div>
        <div className="grid grid-cols-3 gap-3 mb-3.5">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
        <div className="h-16 bg-card border border-border rounded-xl animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl h-48 animate-pulse" />
          <div className="bg-card border border-border rounded-xl h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  const save = async () => {
    if (!form.numero) { toast.error('Renseignez le numéro'); return; }
    try {
      if (editId) {
        await comptes.update(editId, form);
        toast.success('Compte modifié');
      } else {
        await comptes.add(form);
        toast.success('Compte ajouté');
      }
      setShowModal(false);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
  };

  const del = async () => {
    if (!deleteTarget) return;
    try { await comptes.remove(deleteTarget.id); toast.success('Supprimé'); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-3.5">
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2 text-success"><Banknote className="h-6 w-6 lg:h-7 lg:w-7" /></div>
          <div className={`font-black text-xs lg:text-lg truncate ${soldeCaisse >= 0 ? '' : 'text-destructive'}`}>{fmt(soldeCaisse)}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Caisse</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-primary" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2 text-primary"><Smartphone className="h-6 w-6 lg:h-7 lg:w-7" /></div>
          <div className="font-black text-xs lg:text-lg truncate">{fmt(mmTot)}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Mobile Money</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-2.5 lg:p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-success" />
          <div className="text-lg lg:text-2xl mb-1 lg:mb-2 text-secondary"><Landmark className="h-6 w-6 lg:h-7 lg:w-7" /></div>
          <div className="font-black text-xs lg:text-lg truncate">{fmt(soldeBanque)}</div>
          <div className="text-[9px] lg:text-[11px] text-muted-foreground">Banque</div>
        </div>
      </div>

      <div className="gradient-primary rounded-xl p-4 px-5 flex justify-between items-center text-primary-foreground mb-4 shadow-primary">
        <div className="text-sm font-bold opacity-85 flex items-center gap-2"><Wallet className="h-4 w-4" /> Trésorerie totale</div>
        <div className="font-black text-xl">{fmt(total)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5"><Smartphone className="h-4 w-4" /> Comptes Mobile Money</h3>
            <div className="flex gap-2 items-center">
              <input className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2.5 text-xs text-foreground outline-none w-[120px] font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/10" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
              <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">＋ Compte</button>
            </div>
          </div>
          <div className="p-4">
            {filteredMmCards.length ? filteredMmCards.map(({ mm, sol, mIn, mOut }) => (
              <div key={mm.id} className="bg-background border-[1.5px] border-border rounded-xl p-3 flex items-center justify-between mb-2 hover:border-primary/30 transition-all">
                <div>
                  <div className="font-bold text-sm">{mm.operateur}</div>
                  <div className="text-[11px] text-muted-foreground">{mm.titulaire ? mm.titulaire + ' · ' : ''}{mm.numero}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Init: {fmt(mm.solde)} · +{fmt(mIn)} · -{fmt(mOut)}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-base ${sol >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(sol)}</div>
                  <div className="flex gap-2 mt-1 justify-end">
                    <button onClick={() => openEdit(mm)} className="text-[10.5px] text-muted-foreground hover:text-primary flex items-center gap-0.5"><Pencil className="h-3 w-3" /> Modifier</button>
                    <button onClick={() => setDeleteTarget({ id: mm.id, label: `${mm.operateur} ${mm.numero}` })} className="text-[10.5px] text-muted-foreground hover:text-destructive flex items-center gap-0.5"><Trash2 className="h-3 w-3" /> Supprimer</button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-7 text-muted-foreground text-xs">Aucun compte Mobile Money</div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-extrabold text-sm text-foreground">Récap par compte</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Compte', 'Mode(s)', 'Solde'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-background">
                  <td className="px-3.5 py-3 text-sm font-bold border-b border-border">💵 Caisse</td>
                  <td className="px-3.5 py-3 text-[11.5px] text-muted-foreground border-b border-border">Espèce</td>
                  <td className={`px-3.5 py-3 text-sm font-bold border-b border-border ${soldeCaisse >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(soldeCaisse)}</td>
                </tr>
                {mmCards.map(({ mm, sol }) => (
                  <tr key={mm.id} className="hover:bg-background">
                    <td className="px-3.5 py-3 text-sm font-bold border-b border-border">{icons[mm.operateur] || '📱'} {mm.operateur}</td>
                    <td className="px-3.5 py-3 text-[11.5px] text-muted-foreground border-b border-border">Mobile Money</td>
                    <td className={`px-3.5 py-3 text-sm font-bold border-b border-border ${sol >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(sol)}</td>
                  </tr>
                ))}
                <tr className="hover:bg-background">
                  <td className="px-3.5 py-3 text-sm font-bold border-b border-border">🏦 Banque</td>
                  <td className="px-3.5 py-3 text-[11.5px] text-muted-foreground border-b border-border">Virement / Chèque</td>
                  <td className={`px-3.5 py-3 text-sm font-bold border-b border-border ${soldeBanque >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(soldeBanque)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground">TOTAL</span>
            <span className="text-sm font-black text-primary">{fmt(total)}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Supprimer ce compte ?" description={`Le compte "${deleteTarget?.label}" sera définitivement supprimé.`} onConfirm={del} confirmLabel="Supprimer" />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editId ? 'Modifier Compte' : 'Nouveau Compte Mobile Money'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Opérateur</label>
              <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.operateur} onChange={e => setForm({ ...form, operateur: e.target.value })}>
                <option>Wave</option>
                <option>Orange Money</option>
                <option>Yas Money</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Numéro *</label>
              <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="77 123 45 67" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Titulaire</label>
              <input className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.titulaire} onChange={e => setForm({ ...form, titulaire: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Solde initial</label>
              <input type="number" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.solde} onChange={e => setForm({ ...form, solde: Number(e.target.value) })} />
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
