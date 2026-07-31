import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useArchives } from '@/hooks/useSupabaseData';
import { formatDate } from '@/lib/formatDate';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { exportPortabilityZip } from '@/utils/exportPortability';
import { Archive, RotateCcw, Trash2, Download, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const TABLE_LABELS: Record<string, string> = {
  clients: 'Client',
  produits: 'Produit / Service',
  devis: 'Devis',
  factures: 'Facture',
  journal: 'Écriture journal',
  categories: 'Catégorie',
  comptes_tresorerie: 'Compte trésorerie',
};

export default function ArchivesPage() {
  const { clients, produits, factures, devis, recus, avoirs, journal, comptes, categories, entreprise } = useApp();
  const archives = useArchives();
  const [filter, setFilter] = useState('all');
  const [purgeTarget, setPurgeTarget] = useState<{ table: string; id: string; label: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const rows = archives.data.filter(r => filter === 'all' || r.table_name === filter);

  const handleRestore = async (table: string, id: string) => {
    try {
      await archives.restore(table, id);
      toast.success('Élément restauré');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
  };

  const handlePurge = async () => {
    if (!purgeTarget) return;
    try {
      await archives.purge(purgeTarget.table, purgeTarget.id);
      toast.success('Élément supprimé définitivement');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erreur'); }
    setPurgeTarget(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPortabilityZip({
        entreprise: entreprise.data as unknown as Record<string, unknown>,
        clients: clients.data as unknown as Record<string, unknown>[],
        produits: produits.data as unknown as Record<string, unknown>[],
        factures: factures.data as unknown as Record<string, unknown>[],
        devis: devis.data as unknown as Record<string, unknown>[],
        recus: recus.data as unknown as Record<string, unknown>[],
        avoirs: avoirs.data as unknown as Record<string, unknown>[],
        journal: journal.data as unknown as Record<string, unknown>[],
        comptes: comptes.data as unknown as Record<string, unknown>[],
        categories: categories.data as unknown as Record<string, unknown>[],
      }, entreprise.data?.nom || 'mon-entreprise');
      toast.success('Archive ZIP téléchargée');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Portabilité */}
      <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4 flex-wrap">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h2 className="font-bold text-foreground">Portabilité de mes données</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Téléchargez l'intégralité de vos données (CSV + JSON) dans une archive ZIP — droit à la portabilité, loi n° 2008-12.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="gradient-primary text-primary-foreground py-2 px-4 rounded-lg text-xs font-bold shadow-primary disabled:opacity-50 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> {exporting ? 'Préparation…' : 'Exporter en ZIP'}
        </button>
      </div>

      {/* Corbeille */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
          <Archive className="w-4 h-4 text-primary" />
          <h3 className="font-extrabold text-sm text-foreground flex-1">Corbeille ({archives.data.length})</h3>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-background border-[1.5px] border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground outline-none"
          >
            <option value="all">Tous les types</option>
            {Object.entries(TABLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {archives.isLoading ? (
          <div className="text-center py-10 text-sm text-muted-foreground">Chargement…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Archive className="w-10 h-10 mx-auto opacity-30 mb-2" />
            <div className="text-sm">La corbeille est vide</div>
          </div>
        ) : rows.map(r => (
          <div key={`${r.table_name}-${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{r.label || '—'}</div>
              <div className="text-[10.5px] text-muted-foreground truncate">
                {TABLE_LABELS[r.table_name] || r.table_name}
                {r.sublabel ? ` · ${r.sublabel}` : ''} · archivé le {formatDate(r.deleted_at)}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handleRestore(r.table_name, r.id)}
                className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-primary hover:text-primary transition-all"
                title="Restaurer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPurgeTarget({ table: r.table_name, id: r.id, label: r.label || '' })}
                className="bg-background border-[1.5px] border-border text-muted-foreground px-2 py-1 rounded-md text-xs hover:border-destructive hover:text-destructive transition-all"
                title="Supprimer définitivement"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!purgeTarget}
        onOpenChange={() => setPurgeTarget(null)}
        title={`Supprimer définitivement "${purgeTarget?.label}" ?`}
        description="Cette action est irréversible. L'élément sera effacé de la base de données."
        onConfirm={handlePurge}
        confirmLabel="Supprimer définitivement"
      />
    </div>
  );
}
