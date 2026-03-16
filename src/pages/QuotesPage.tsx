import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PaginationControls } from '@/components/PaginationControls';
import { TableSkeleton } from '@/components/LoadingSkeleton';
import { usePagination } from '@/hooks/usePagination';
import { toast } from 'sonner';
import { downloadPdf } from '@/utils/generatePdf';
import { formatDate } from '@/lib/formatDate';
import type { ArticleLine } from '@/types';
import type { Json } from '@/integrations/supabase/types';

export default function QuotesPage() {
  const { devis, factures, clients, produits, entreprise, cliName, fmt, createModalTrigger } = useApp();
  const triggerRef = useRef(createModalTrigger);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statFilter, setStatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ client_id: '', date_devis: new Date().toISOString().slice(0, 10), validite_jours: 30, notes: '' });
  const [articles, setArticles] = useState<ArticleLine[]>([{ nom: '', quantite: 1, prix_unitaire: 0 }]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; numero: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-detect expired quotes
  const today = new Date().toISOString().slice(0, 10);
  const enrichedData = devis.data.map(d => {
    if (d.statut === 'En attente') {
      const expiry = new Date(d.date_devis);
      expiry.setDate(expiry.getDate() + d.validite_jours);
      if (expiry.toISOString().slice(0, 10) < today) {
        return { ...d, statut: 'Expiré' };
      }
    }
    return d;
  });

  let filtered = enrichedData;
  if (statFilter) filtered = filtered.filter(d => d.statut === statFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(d => d.numero?.toLowerCase().includes(q) || cliName(d.client_id).toLowerCase().includes(q));
  }

  const pagination = usePagination(filtered);

  const tva = entreprise.data?.tva ?? 18;
  const totalHT = articles.reduce((s, a) => s + a.quantite * a.prix_unitaire, 0);
  const totalTVA = Math.round(totalHT * tva / 100);
  const totalTTC = totalHT + totalTVA;

  const openNew = () => {
    setEditId(null);
    setForm({ client_id: '', date_devis: new Date().toISOString().slice(0, 10), validite_jours: 30, notes: '' });
    setArticles([{ nom: '', quantite: 1, prix_unitaire: 0 }]);
    setShowModal(true);
  };

  const openEdit = (d: typeof devis.data[0]) => {
    setEditId(d.id);
    const arts = Array.isArray(d.articles) ? (d.articles as unknown as ArticleLine[]).map(a => ({
      nom: a.nom || '', quantite: a.quantite || 1, prix_unitaire: a.prix_unitaire || 0
    })) : [{ nom: '', quantite: 1, prix_unitaire: 0 }];
    setForm({
      client_id: d.client_id || '',
      date_devis: d.date_devis,
      validite_jours: d.validite_jours,
      notes: d.notes || '',
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

  const addLine = () => setArticles([...articles, { nom: '', quantite: 1, prix_unitaire: 0 }]);
  const removeLine = (i: number) => setArticles(articles.filter((_, idx) => idx !== i));
  const updateArticle = (i: number, field: keyof ArticleLine, value: string | number) => {
    const next = articles.map((a, idx) => idx === i ? { ...a, [field]: value } : a);
    setArticles(next);
  };
  const selectProduct = (i: number, pid: string) => {
    const p = produits.data.find(x => x.id === pid);
    if (p) {
      setArticles(prev => prev.map((a, idx) => idx === i ? { ...a, nom: p.nom, prix_unitaire: p.prix } : a));
    }
  };

  const save = async () => {
    if (!form.client_id || articles.every(a => !a.nom)) {
      toast.error('Sélectionnez un client et au moins un article');
      return;
    }
    const validArticles = articles.filter(a => a.nom);
    if (validArticles.some(a => a.quantite <= 0 || a.prix_unitaire < 0)) {
      toast.error('Vérifiez les quantités et prix des articles');
      return;
    }
    const ht = validArticles.reduce((s, a) => s + a.quantite * a.prix_unitaire, 0);
    const tvaMontant = Math.round(ht * tva / 100);
    const ttc = ht + tvaMontant;

    setSaving(true);
    try {
      if (editId) {
        await devis.update(editId, {
          client_id: form.client_id,
          articles: validArticles as unknown as Json,
          montant_ht: ht,
          montant_tva: tvaMontant,
          montant_ttc: ttc,
          date_devis: form.date_devis,
          validite_jours: form.validite_jours,
          notes: form.notes || null,
        });
        toast.success('Devis modifié');
      } else {
        const numero = await devis.nextNumero();
        await devis.add({
          numero,
          client_id: form.client_id,
          articles: validArticles as unknown as Json,
          montant_ht: ht,
          montant_tva: tvaMontant,
          montant_ttc: ttc,
          date_devis: form.date_devis,
          validite_jours: form.validite_jours,
          notes: form.notes || null,
          statut: 'En attente',
        });
        toast.success('Devis créé');
      }
      setShowModal(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, statut: string) => {
    try {
      await devis.update(id, { statut });
      toast.success(`Devis marqué "${statut}"`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const convertToInvoice = async (d: typeof devis.data[0]) => {
    try {
      const numero = await factures.nextNumero();
      await factures.add({
        numero,
        client_id: d.client_id,
        articles: d.articles,
        montant_ht: d.montant_ht,
        montant_tva: d.montant_tva,
        montant_ttc: d.montant_ttc,
        montant_regle: 0,
        mode_paiement: 'Espèce',
        date_facture: new Date().toISOString().slice(0, 10),
        statut: 'En attente',
        notes: d.notes,
      });
      await devis.update(d.id, { statut: 'Converti' });
      toast.success('Devis converti en facture !');
      navigate('/factures');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const del = async () => {
    if (!deleteTarget) return;
    try {
      await devis.remove(deleteTarget.id);
      toast.success('Devis supprimé');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-foreground">Devis ({filtered.length})</h3>
          <div className="flex gap-2 items-center">
            <input className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2.5 text-xs text-foreground outline-none w-[160px] font-sans placeholder:text-muted-foreground focus:border-primary" placeholder="🔍 N°, client..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="bg-background border-[1.5px] border-border rounded-lg py-1 px-2 text-xs text-foreground outline-none font-sans" value={statFilter} onChange={e => setStatFilter(e.target.value)}>
              <option value="">Tous statuts</option>
              <option>En attente</option>
              <option>Accepté</option>
              <option>Refusé</option>
              <option>Expiré</option>
              <option>Converti</option>
            </select>
            <button onClick={openNew} className="gradient-primary text-primary-foreground border-none py-1.5 px-3 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all">
              ＋ Nouveau
            </button>
          </div>
        </div>
        {/* Mobile card view */}
        <div className="lg:hidden">
          {devis.isLoading ? <TableSkeleton rows={5} cols={3} /> : (
            filtered.length ? filtered.map(d => (
              <div key={d.id} className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-xs text-foreground">{d.numero}</div>
                  <StatusBadge status={d.statut} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10.5px] text-muted-foreground truncate">{cliName(d.client_id)} · {formatDate(d.date_devis)}</div>
                  <span className="font-bold text-sm text-foreground">{fmt(d.montant_ttc)}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  <button onClick={() => downloadPdf({ type: 'devis', numero: d.numero, date: d.date_devis, validite_jours: d.validite_jours, client: cliName(d.client_id), articles: (d.articles as unknown as ArticleLine[]) || [], montant_ht: d.montant_ht, montant_tva: d.montant_tva, montant_ttc: d.montant_ttc, tva_pct: entreprise.data?.tva ?? 18, notes: d.notes, entreprise: entreprise.data })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">📄</button>
                  <button onClick={() => openEdit(d)} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">✏️</button>
                  {d.statut === 'En attente' && (
                    <>
                      <button onClick={() => updateStatus(d.id, 'Accepté')} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">✅</button>
                      <button onClick={() => updateStatus(d.id, 'Refusé')} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">❌</button>
                    </>
                  )}
                  {d.statut === 'Accepté' && (
                    <button onClick={() => convertToInvoice(d)} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">🧾→</button>
                  )}
                  <button onClick={() => setDeleteTarget({ id: d.id, numero: d.numero })} className="bg-background border border-border text-muted-foreground px-2 py-1 rounded-md text-xs">🗑️</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground">
                <div className="text-4xl opacity-30 mb-2">📋</div>
                <div className="text-sm">Aucun devis</div>
              </div>
            )
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          {devis.isLoading ? <TableSkeleton rows={5} cols={7} /> : (
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  {['N°', 'Client', 'TTC', 'Date', 'Validité', 'Statut', 'Actions'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider text-left border-b border-border bg-background">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length ? filtered.map(d => (
                  <tr key={d.id} className="hover:bg-background transition-colors">
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{d.numero}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{cliName(d.client_id)}</td>
                    <td className="px-3.5 py-3 text-sm font-bold text-foreground border-b border-border">{fmt(d.montant_ttc)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{formatDate(d.date_devis)}</td>
                    <td className="px-3.5 py-3 text-sm text-foreground border-b border-border">{d.validite_jours} jours</td>
                    <td className="px-3.5 py-3 text-sm border-b border-border"><StatusBadge status={d.statut} /></td>
                    <td className="px-3.5 py-3 text-sm border-b border-border">
                      <div className="flex gap-1">
                        <button onClick={() => downloadPdf({ type: 'devis', numero: d.numero, date: d.date_devis, validite_jours: d.validite_jours, client: cliName(d.client_id), articles: (d.articles as unknown as ArticleLine[]) || [], montant_ht: d.montant_ht, montant_tva: d.montant_tva, montant_ttc: d.montant_ttc, tva_pct: entreprise.data?.tva ?? 18, notes: d.notes, entreprise: entreprise.data })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all" title="Télécharger PDF">📄</button>
                        <button onClick={() => openEdit(d)} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all" title="Modifier">✏️</button>
                        {d.statut === 'En attente' && (
                          <>
                            <button onClick={() => updateStatus(d.id, 'Accepté')} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-success hover:text-success transition-all" title="Accepter">✅</button>
                            <button onClick={() => updateStatus(d.id, 'Refusé')} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all" title="Refuser">❌</button>
                          </>
                        )}
                        {d.statut === 'Accepté' && (
                          <button onClick={() => convertToInvoice(d)} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all" title="Convertir en facture">🧾→</button>
                        )}
                        <button onClick={() => setDeleteTarget({ id: d.id, numero: d.numero })} className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="text-4xl opacity-30 mb-2">📋</div>
                    <div className="text-sm">Aucun devis</div>
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
        title={`Supprimer le devis ${deleteTarget?.numero} ?`}
        description="Cette action est irréversible."
        onConfirm={del}
        confirmLabel="Supprimer"
      />

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-[1000] flex items-end lg:items-center justify-center">
          <div className="bg-card border border-border rounded-2xl lg:rounded-2xl rounded-b-none w-full lg:max-w-[640px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.22s_ease]">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-[15px] text-foreground">{editId ? 'Modifier Devis' : 'Nouveau Devis'}</h3>
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
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Validité (jours)</label>
                  <input type="number" min="1" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.validite_jours} onChange={e => setForm({ ...form, validite_jours: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date devis</label>
                  <input type="date" className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans focus:border-primary w-full" value={form.date_devis} onChange={e => setForm({ ...form, date_devis: e.target.value })} />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Articles</label>
                  <button onClick={addLine} className="text-xs text-primary font-bold hover:underline">＋ Ajouter</button>
                </div>
                {articles.map((a, i) => (
                  <div key={i} className="flex gap-2 items-end mb-2 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <select
                        className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs text-foreground outline-none font-sans focus:border-primary w-full mb-1"
                        value=""
                        onChange={e => selectProduct(i, e.target.value)}
                      >
                        <option value="">📦 Choisir produit...</option>
                        {produits.data.map(p => <option key={p.id} value={p.id}>{p.nom} ({fmt(p.prix)})</option>)}
                      </select>
                      <input className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs text-foreground outline-none font-sans focus:border-primary w-full" placeholder="Désignation" value={a.nom} onChange={e => updateArticle(i, 'nom', e.target.value)} />
                    </div>
                    <input type="number" min="1" className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs text-foreground outline-none font-sans focus:border-primary w-16" placeholder="Qté" value={a.quantite} onChange={e => updateArticle(i, 'quantite', Number(e.target.value))} />
                    <input type="number" min="0" className="bg-background border-[1.5px] border-border rounded-lg py-2 px-2.5 text-xs text-foreground outline-none font-sans focus:border-primary w-24" placeholder="Prix" value={a.prix_unitaire} onChange={e => updateArticle(i, 'prix_unitaire', Number(e.target.value))} />
                    <span className="text-xs font-bold text-foreground w-24 text-right">{fmt(a.quantite * a.prix_unitaire)}</span>
                    {articles.length > 1 && (
                      <button onClick={() => removeLine(i)} className="text-destructive text-xs px-1">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-background border border-border rounded-lg p-3 mb-3.5">
                <div className="flex justify-between text-xs mb-1"><span>Total HT</span><span className="font-bold">{fmt(totalHT)}</span></div>
                <div className="flex justify-between text-xs mb-1"><span>TVA ({tva}%)</span><span className="font-bold">{fmt(totalTVA)}</span></div>
                <div className="flex justify-between text-sm font-black border-t border-border pt-1.5 mt-1.5"><span>Total TTC</span><span className="text-primary">{fmt(totalTTC)}</span></div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Notes</label>
                <textarea className="bg-background border-[1.5px] border-border rounded-lg py-2.5 px-3 text-sm text-foreground outline-none font-sans resize-y min-h-[60px] focus:border-primary w-full" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} maxLength={500} />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-border flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="bg-card border-[1.5px] border-border text-muted-foreground py-2 px-4 rounded-lg text-xs font-bold hover:bg-background transition-all">Annuler</button>
              <button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground border-none py-2 px-4 rounded-lg text-xs font-bold shadow-primary hover:-translate-y-px transition-all disabled:opacity-60">
                {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
