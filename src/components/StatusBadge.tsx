export function StatusBadge({ status }: { status: string }) {
  const cls = status === 'Payée' ? 'bg-success/10 text-success'
    : status === 'Partielle' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    : status === 'En retard' ? 'bg-destructive/10 text-destructive'
    : status === 'Annulée' ? 'bg-muted-foreground/15 text-muted-foreground'
    : status === 'Accepté' ? 'bg-primary/10 text-primary'
    : status === 'Refusé' ? 'bg-destructive/10 text-destructive'
    : status === 'Converti' ? 'bg-secondary/10 text-secondary'
    : status === 'Actif' ? 'bg-success/10 text-success'
    : status === 'Prospect' ? 'bg-accent/10 text-accent'
    : status === 'Inactif' ? 'bg-muted-foreground/15 text-muted-foreground'
    : 'bg-accent/10 text-accent';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

export function PayBadge({ mode }: { mode: string }) {
  const cls = mode === 'Espèce' ? 'bg-accent/10 text-accent'
    : mode === 'Wave' ? 'bg-primary/10 text-primary'
    : mode === 'Orange Money' ? 'bg-secondary/10 text-secondary'
    : mode === 'Yas Money' ? 'bg-destructive/10 text-destructive'
    : mode === 'Virement' || mode === 'Chèque' ? 'bg-muted-foreground/15 text-muted-foreground'
    : 'bg-secondary/10 text-secondary';

  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${cls}`}>{mode || '—'}</span>;
}
