import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import { toast } from 'sonner';

export default function CashPage() {
  const { comptes, journal, fmt } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ operateur: 'Wave', numero: '', titulaire: '', solde: 0 });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

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

  const total = soldeCaisse + mmTot + soldeBanque;

  const openNew = () => {
    setForm({ operateur: 'Wave', numero: '', titulaire: '', solde: 0 });
    setShowModal(true);
  };

  useEffect(() => {
    const handler = () => openNew();
    window.addEventListener('open-create-modal', handler);
    return () => window.removeEventListener('open-create-modal', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!form.numero) {
      toast.error('Renseignez le numéro');
      return;
    }
    try {
      await comptes.add(form);
      setShowModal(false);
      toast.success('Compte ajouté');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const del = async () => {
    if (!deleteTarget) return;
    try {
      await comptes.remove(deleteTarget.id);
      toast.success('Supprimé');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-3.5">
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-secondary" />
          <div className="text-2xl mb-2">💵</div>
          <div className={`font-black text-lg ${soldeCaisse >= 0 ? '' : 'text-destructive'}`}>{fmt(soldeCaisse)}</div>
          <div className="text-[11px] text-muted-foreground">Caisse — Espèce</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-secondary to-primary" />
          <div className="text-2xl mb-2">📱</div>
          <div className="font-black text-lg">{fmt(mmTot)}</div>
          <div className="text-[11px] text-muted-foreground">Mobile Money (total)</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 relative overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-success" />
          <div className="text-2xl mb-2">🏦</div>
          <div className="font-black text-lg">{fmt(soldeBanque)}</div>
          <div className="text-[11px] text-muted-foreground">Banque</div>
        </div>
      </div>

      <div className="gradient-primary rounded-xl p-4 px-5 flex justify-between items-center text-primary-foreground mb-4 shadow-primary">
        <div className="text-sm font-bold opacity-85">💰 Trésorerie totale</div>
        <div className="font-black text-xl">{fmt(total)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-foreground">📱 Comptes Mobile Money</h3>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">
              ＋ Compte
            </button>
          </div>
          <div className="p-4">
            {mmCards.length ? mmCards.map(({ mm, sol, mIn, mOut }) => (
              <div key={mm.id} className="bg-background border-[1.5px] border-border rounded-xl p-3 flex items-center justify-between mb-2 hover:border-primary/30 transition-all">
                <div>
                  <div className="font-bold text-sm">{icons[mm.operateur] || '📱'} {mm.operateur}</div>
                  <div className="text-[11px] text-muted-foreground">{mm.titulaire ? mm.titulaire + ' · ' : ''}{mm.numero}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Init: {fmt(mm.solde)} · +{fmt(mIn)} · -{fmt(mOut)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-base ${sol >= 0 ? 'text-success' : 'text-destructive'}`}>{fmt(sol)}</div>
                  <button onClick={() => setDeleteTarget({ id: mm.id, label: `${mm.operateur} ${mm.numero}` })} className="text-[10.5px] text-muted-foreground hover:text-destructive mt-1">🗑 Supprimer</button>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer ce compte ?"
        description={`Le compte "${deleteTarget?.label}" sera définitivement supprimé.`}
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[1000] flex items-end lg:items-center justify-center">
          <div className="bg-card border border-border rounded-2xl lg:rounded-2xl rounded-b-none w-full lg:max-w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.22s_ease]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-[15px] text-foreground">Nouveau Compte Mobile Money</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground text-xl bg-transparent border-none cursor-pointer">✕</button>
            </div>
            <div className="p-5 grid gap-3.5">
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
