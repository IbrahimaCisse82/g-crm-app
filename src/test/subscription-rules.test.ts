import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { FREE_LIMITS, PRO_LIMITS, isPromoActive } from '@/hooks/useSubscription';

afterEach(() => vi.useRealTimers());

describe('règles d\'abonnement', () => {
  it('plan Gratuit : 10 clients, 10 factures/mois, 10 devis/mois', () => {
    expect(FREE_LIMITS.maxClients).toBe(10);
    expect(FREE_LIMITS.maxInvoicesPerMonth).toBe(10);
    expect(FREE_LIMITS.maxQuotesPerMonth).toBe(10);
  });
  it('plan Gratuit : pas d\'export PDF, Pro : export PDF', () => {
    expect(FREE_LIMITS.canExportPdf).toBe(false);
    expect(PRO_LIMITS.canExportPdf).toBe(true);
  });
  it('offre de lancement active le 31 décembre 2026', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-31T12:00:00Z'));
    expect(isPromoActive()).toBe(true);
  });
  it('offre de lancement terminée le 1er janvier 2027', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2027-01-01T00:00:01Z'));
    expect(isPromoActive()).toBe(false);
  });
});
