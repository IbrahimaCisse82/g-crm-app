interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (p: number) => void;
}

export function PaginationControls({ page, totalPages, totalItems, hasNext, hasPrev, nextPage, prevPage }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-border flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{totalItems} résultat{totalItems > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={prevPage}
          disabled={!hasPrev}
          className="bg-background border border-border text-muted-foreground px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
        >
          ← Préc
        </button>
        <span className="text-xs font-bold text-foreground px-2">{page} / {totalPages}</span>
        <button
          onClick={nextPage}
          disabled={!hasNext}
          className="bg-background border border-border text-muted-foreground px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
        >
          Suiv →
        </button>
      </div>
    </div>
  );
}
