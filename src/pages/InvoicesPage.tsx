import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { StatusBadge, PayBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { toast } from 'sonner';
import { downloadPdf } from '@/utils/generatePdf';
import type { ArticleLine } from '@/types';
import { PAYMENT_MODES } from '@/types';
import type { Json } from '@/integrations/supabase/types';

const defaultForm = {
  client_id: '',
  mode_paiement: 'Espèce',
  date_facture: new Date().toISOString().slice(0, 10),
  date_echeance: '',
  notes: '',
};

export default function InvoicesPage() {
  const { factures, clients, produits, entreprise, journal, cliName, fmt } = useApp();
  const [search, setSearch] = useState('');
  const [statFilter, setStatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [articles, setArticles] = useState<ArticleLine[]>([{ nom: '', quantite: 1, prix_unitaire: 0 }]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; numero: string } | null>(null);

  // Auto-detect overdue invoices
  const today = new Date().toISOString().slice(0, 10);
  const enrichedData = factures.data.map(f => {
    if (f.statut === 'En attente' && f.date_echeance && f.date_echeance < today) {
      return { ...f, statut: 'En retard' };
    }
    return f;
  });

  let filtered = enrichedData;
  if (statFilter) filtered = filtered.filter(f => f.statut === statFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(f => f.numero?.toLowerCase().includes(q) || cliName(f.client_id).toLowerCase().includes(q));
  }

  const tva = entreprise.data?.tva ?? 18;
  const totalHT = articles.reduce((s, a) => s + a.quantite * a.prix_unitaire, 0);
  const totalTVA = Math.round(totalHT * tva / 100);
  const totalTTC = totalHT + totalTVA;

  const openNew = () => {
    setEditId(null);
    setForm(defaultForm);
    setArticles([{ nom: '', quantite: 1, prix_unitaire: 0 }]);
    setShowModal(true);
  };

  const openEdit = (f: typeof factures.data[0]) => {
    setEditId(f.id);
    const arts = Array.isArray(f.articles) ? (f.articles as unknown as ArticleLine[]).map(a => ({
      nom: a.nom || '', quantite: a.quantite || 1, prix_unitaire: a.prix_unitaire || 0
    })) : [{ nom: '', quantite: 1, prix_unitaire: 0 }];
    setForm({
      client_id: f.client_id || '',
      mode_paiement: f.mode_paiement || 'Espèce',
      date_facture: f.date_facture,
      date_echeance: f.date_echeance || '',
      notes: f.notes || '',
    });
    setArticles(arts);
    setShowModal(true);
  };

  useEffect(() => {
    const handler = () => openNew();
    window.addEventListener('open-create-modal', handler);
    return () => window.removeEventListener('open-create-modal', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addArticleLine = () => setArticles([...articles, { nom: '', quantite: 1, prix_unitaire: 0 }]);
  const removeArticleLine = (i: number) => setArticles(articles.filter((_, idx) => idx !== i));
  const updateArticle = (i: number, field: keyof ArticleLine, value: string | number) => {
    const next = articles.map((a, idx) => idx === i ? { ...a, [field]: value } : a);
    setArticles(next);
  };

  const selectProduct = (i: number, produitId: string) => {
    const p = produits.data.find(x => x.id === produitId);
    if (p) {
      setArticles(prev => prev.map((a, idx) => idx === i ? { ...a, nom: p.nom, prix_unitaire: p.prix } : a));
    }
  };

  const save = async () => {
    if (!form.client_id || articles.every(a => !a.nom)) {
      toast.error('Sélectionnez un client et au moins un article');
      return;
    }
    if (form.date_echeance && form.date_echeance < form.date_facture) {
      toast.error("La date d'échéance doit être après la date de facture");
      return;
    }
    const validArticles = articles.filter(a => a.nom);
    const ht = validArticles.reduce((s, a) => s + a.quantite * a.prix_unitaire, 0);
    const tvaMontant = Math.round(ht * tva / 100);
    const ttc = ht + tvaMontant;

    try {
      if (editId) {
        await factures.update(editId, {
          client_id: form.client_id,
          articles: validArticles as unknown as Json,
          montant_ht: ht,
          montant_tva: tvaMontant,
          montant_ttc: ttc,
          mode_paiement: form.mode_paiement,
          date_facture: form.date_facture,
          date_echeance: form.date_echeance || null,
          notes: form.notes || null,
        });
        toast.success('Facture modifiée');
      } else {
        const numero = `FAC-${Date.now().toString(36).toUpperCase()}`;
        await factures.add({
          numero,
          client_id: form.client_id,
          articles: validArticles as unknown as Json,
          montant_ht: ht,
          montant_tva: tvaMontant,
          montant_ttc: ttc,
          montant_regle: 0,
          mode_paiement: form.mode_paiement,
          date_facture: form.date_facture,
          date_echeance: form.date_echeance || null,
          notes: form.notes || null,
          statut: 'En attente',
        });
        toast.success('Facture créée');
      }
      setShowModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const del = async () => {
    if (!deleteTarget) return;
    try {
      // Clean up journal entries linked to this invoice
      await journal.removeByFactureId(deleteTarget.id);
      await factures.remove(deleteTarget.id);
      toast.success('Facture supprimée (+ écritures journal nettoyées)');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setDeleteTarget(null);
  };

  const markPaid = async (f: typeof factures.data[0]) => {
    // Guard against double payment
    if (f.statut === 'Payée') {
      toast.info('Cette facture est déjà marquée comme payée');
      return;
    }
    try {
      await factures.update(f.id, { statut: 'Payée', montant_regle: f.montant_ttc });
      await journal.add({
        libelle: `Paiement facture ${f.numero}`,
        type: 'Recette',
        montant: f.montant_ttc,
        mode_paiement: f.mode_paiement || 'Espèce',
        categorie: 'Vente',
        date_operation: new Date().toISOString().slice(0, 10),
        facture_id: f.id,
      });
      toast.success('Facture marquée comme payée + écriture journal');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-foreground">Factures ({filtered.length})</h3>
          <div className="flex gap-2 items-center">
            <input
              className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2.5 text-xs text-foreground outline-none w-[160px] font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/10"
              placeholder="🔍 N°, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2 text-xs text-foreground outline-none font-sans"
              value={statFilter}
              onChange={e => setStatFilter(e.target.value)}
            >
              <option value="">Tous statuts</option>
              <option>Payée</option>
              <option>En attente</option>
              <option>En retard</option>
              <option>Annulée</option>
            </select>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">
              ＋ Nouvelle
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {factures.isLoading ? <TableSkeleton rows={5} cols={9} /> : (
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  {['N°', 'Client', 'HT', 'TVA', 'TTC', 'Paiement', 'Date', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map(f => (
                  <tr key={f.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{f.numero}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(f.client_id)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{fmt(f.montant_ht)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{fmt(f.montant_tva)}</td>
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{fmt(f.montant_ttc)}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <PayBadge mode={f.mode_paiement || ''} />
                    </td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{f.date_facture}</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border"><StatusBadge status={f.statut} /></td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex gap-1">
                        <button
                          onClick={() => downloadPdf({
                            type: 'facture', numero: f.numero, date: f.date_facture,
                            echeance: f.date_echeance, client: cliName(f.client_id),
                            articles: (f.articles as unknown as ArticleLine[]) || [], montant_ht: f.montant_ht,
                            montant_tva: f.montant_tva, montant_ttc: f.montant_ttc,
                            tva_pct: entreprise.data?.tva ?? 18, mode_paiement: f.mode_paiement,
                            notes: f.notes, entreprise: entreprise.data,
                          })}
                          className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all"
                          title="Télécharger PDF"
                        >📄</button>
                        {f.statut !== 'Payée' && (
                          <button onClick={() => openEdit(f)} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all" title="Modifier">✏️</button>
                        )}
                        {(f.statut === 'En attente' || f.statut === 'En retard') && (
                          <button
                            onClick={() => markPaid(f)}
                            className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-success hover:text-success transition-all"
                            title="Marquer payée"
                          >💳</button>
                        )}
                        <button onClick={() => setDeleteTarget({ id: f.id, numero: f.numero })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">
                    <div className="text-4xl opacity-30 mb-2">🧾</div>
                    <div className="text-sm">Aucune facture</div>
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
        title={`Supprimer la facture ${deleteTarget?.numero} ?`}
        description="Cette action est irréversible. Les écritures journal liées seront également supprimées."
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[1000] flex items-end lg:items-center justify-center">
          <div className="bg-card border border-border rounded-2xl lg:rounded-2xl rounded-b-none w-full lg:max-w-[640px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.22s_ease]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-[15px] text-foreground">{editId ? 'Modifier Facture' : 'Nouvelle Facture'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground text-xl bg-transparent border-none cursor-pointer">✕</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Client *</label>
                  <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {clients.data.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mode de paiement</label>
                  <select className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.mode_paiement} onChange={e => setForm({ ...form, mode_paiement: e.target.value })}>
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date facture</label>
                  <input type="date" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.date_facture} onChange={e => setForm({ ...form, date_facture: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date échéance</label>
                  <input type="date" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.date_echeance} onChange={e => setForm({ ...form, date_echeance: e.target.value })} min={form.date_facture} />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Articles</label>
                  <button onClick={addArticleLine} className="text-xs text-primary font-bold hover:underline">＋ Ajouter</button>
                </div>
                {articles.map((a, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-end">
                    <div className="flex-1 flex flex-col gap-1">
                      {i === 0 && <span className="text-[10px] text-muted-foreground">Produit</span>}
                      <select className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2 text-xs text-foreground outline-none font-sans focus:border-primary w-full" value="" onChange={e => selectProduct(i, e.target.value)}>
                        <option value="">Choisir...</option>
                        {produits.data.map(p => <option key={p.id} value={p.id}>{p.nom} — {fmt(p.prix)}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      {i === 0 && <span className="text-[10px] text-muted-foreground">Désignation</span>}
                      <input className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2 text-xs text-foreground outline-none font-sans focus:border-primary w-full" value={a.nom} onChange={e => updateArticle(i, 'nom', e.target.value)} placeholder="Nom article" />
                    </div>
                    <div className="w-16 flex flex-col gap-1">
                      {i === 0 && <span className="text-[10px] text-muted-foreground">Qté</span>}
                      <input type="number" min={1} className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2 text-xs text-foreground outline-none font-sans focus:border-primary w-full" value={a.quantite} onChange={e => updateArticle(i, 'quantite', Number(e.target.value))} />
                    </div>
                    <div className="w-24 flex flex-col gap-1">
                      {i === 0 && <span className="text-[10px] text-muted-foreground">Prix U.</span>}
                      <input type="number" className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2 text-xs text-foreground outline-none font-sans focus:border-primary w-full" value={a.prix_unitaire} onChange={e => updateArticle(i, 'prix_unitaire', Number(e.target.value))} />
                    </div>
                    {articles.length > 1 && (
                      <button onClick={() => removeArticleLine(i)} className="text-destructive text-sm mb-0.5">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-background border-[1.5px] border-border rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span className="font-bold">{fmt(totalHT)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">TVA ({tva}%)</span><span className="font-bold">{fmt(totalTVA)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-bold">Total TTC</span><span className="font-black text-primary">{fmt(totalTTC)}</span></div>
              </div>

              <div className="mt-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
                <textarea className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans resize-y min-h-[60px] focus:border-primary w-full" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="bg-card border-[1.5px] border-border text-muted-foreground py-2 px-4 rounded-lg text-xs font-bold hover:bg-background transition-all">Annuler</button>
              <button onClick={save} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">💾 {editId ? 'Modifier' : 'Créer la facture'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
