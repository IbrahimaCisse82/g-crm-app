import { useEffect, useRef, useCallback } from 'react';
import type { Tables } from '@/integrations/supabase/types';

type Facture = Tables<'factures'>;

interface UseOverdueNotificationsOptions {
  factures: Facture[];
  enabled: boolean;
  cliName: (id: string | null) => string;
  fmt: (n: number) => string;
}

export function getOverdueInvoices(factures: Facture[]): Facture[] {
  const today = new Date().toISOString().slice(0, 10);
  return factures.filter(
    f =>
      (f.statut === 'En attente' || f.statut === 'Partielle') &&
      f.date_echeance &&
      f.date_echeance < today
  );
}

export function useOverdueNotifications({ factures, enabled, cliName, fmt }: UseOverdueNotificationsOptions) {
  const notifiedRef = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  useEffect(() => {
    if (!enabled || notifiedRef.current || factures.length === 0) return;

    const overdue = getOverdueInvoices(factures);
    if (overdue.length === 0) return;

    notifiedRef.current = true;

    // Send browser push notification
    (async () => {
      const granted = await requestPermission();
      if (!granted) return;

      if (overdue.length === 1) {
        const f = overdue[0];
        new Notification('🧾 Facture en retard', {
          body: `${f.numero} — ${cliName(f.client_id)} — ${fmt(f.montant_ttc - (f.montant_regle || 0))} restant`,
          icon: '/pwa-icon-192.png',
          tag: 'overdue-invoices',
        });
      } else {
        const total = overdue.reduce((s, f) => s + (f.montant_ttc - (f.montant_regle || 0)), 0);
        new Notification(`🧾 ${overdue.length} factures en retard`, {
          body: `Total impayé : ${fmt(total)}`,
          icon: '/pwa-icon-192.png',
          tag: 'overdue-invoices',
        });
      }
    })();
  }, [factures, enabled, cliName, fmt, requestPermission]);

  return { getOverdueInvoices: () => getOverdueInvoices(factures), requestPermission };
}
