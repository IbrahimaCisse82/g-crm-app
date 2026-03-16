import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOverdueInvoices } from '@/hooks/useOverdueNotifications';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/lib/formatDate';

export default function NotificationBell() {
  const { factures, cliName, fmt } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const overdue = getOverdueInvoices(factures.data);
  const count = overdue.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 flex items-center justify-center animate-pulse">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-card border border-border rounded-xl shadow-elevated z-[300] animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-foreground">Notifications</h4>
            {count > 0 && (
              <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                {count} en retard
              </span>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {count === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Aucune notification</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Toutes vos factures sont à jour ✨</p>
              </div>
            ) : (
              overdue.map(f => {
                const reste = f.montant_ttc - (f.montant_regle || 0);
                return (
                  <button
                    key={f.id}
                    onClick={() => { setOpen(false); navigate('/factures'); }}
                    className="w-full text-left px-4 py-3 border-b border-border hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg mt-0.5">🔴</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{f.numero}</div>
                        <div className="text-[10.5px] text-muted-foreground truncate">{cliName(f.client_id)}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-destructive font-semibold">{fmt(reste)} restant</span>
                          <span className="text-[10px] text-muted-foreground">· Échéance {formatDate(f.date_echeance || '')}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {count > 0 && (
            <div className="px-4 py-2.5 border-t border-border">
              <button
                onClick={() => { setOpen(false); navigate('/factures'); }}
                className="w-full text-center text-[11px] font-semibold text-primary hover:underline"
              >
                Voir toutes les factures →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
