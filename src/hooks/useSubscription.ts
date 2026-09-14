import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback, useMemo } from 'react';

export type SubscriptionPlan = 'free' | 'pro';

export interface SubscriptionLimits {
  maxClients: number;
  maxInvoicesPerMonth: number;
  maxQuotesPerMonth: number;
  maxCategories: number;
  canExportPdf: boolean;
  fullDashboard: boolean;
}

/**
 * Offre de lancement : toutes les fonctionnalités Pro sont offertes
 * gratuitement à tous les comptes jusqu'au 31 décembre 2026 inclus.
 * (Doit rester aligné avec public.get_user_plan côté base de données.)
 */
export const PROMO_END = new Date('2026-12-31T23:59:59Z');
export const isPromoActive = () => Date.now() <= PROMO_END.getTime();

const FREE_LIMITS: SubscriptionLimits = {
  maxClients: 10,
  maxInvoicesPerMonth: 10,
  maxQuotesPerMonth: 10,
  maxCategories: 5,
  canExportPdf: false,
  fullDashboard: false,
};

const PRO_LIMITS: SubscriptionLimits = {
  maxClients: Infinity,
  maxInvoicesPerMonth: Infinity,
  maxQuotesPerMonth: Infinity,
  maxCategories: Infinity,
  canExportPdf: true,
  fullDashboard: true,
};

export function useSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['subscription', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const requestsQuery = useQuery({
    queryKey: ['subscription_requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const plan: SubscriptionPlan = useMemo(() => {
    const sub = query.data;
    if (!sub) return 'free';
    if (sub.plan === 'pro' && sub.status === 'active') {
      if (sub.expires_at && new Date(sub.expires_at) < new Date()) return 'free';
      return 'pro';
    }
    return 'free';
  }, [query.data]);

  const isExpired = useMemo(() => {
    const sub = query.data;
    if (!sub || sub.plan === 'free') return false;
    return sub.expires_at ? new Date(sub.expires_at) < new Date() : false;
  }, [query.data]);

  const daysRemaining = useMemo(() => {
    const sub = query.data;
    if (!sub?.expires_at || plan === 'free') return 0;
    const diff = new Date(sub.expires_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [query.data, plan]);

  const limits: SubscriptionLimits = plan === 'pro' ? PRO_LIMITS : FREE_LIMITS;

  const submitRequest = useCallback(async (data: {
    payment_mode: string;
    payment_reference: string;
    amount: number;
  }) => {
    if (!user) throw new Error('Non authentifié');
    const { error } = await supabase.from('subscription_requests').insert({
      user_id: user.id,
      plan: 'pro',
      payment_mode: data.payment_mode,
      payment_reference: data.payment_reference,
      amount: data.amount,
    });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['subscription_requests', user.id] });
  }, [user, qc]);

  return {
    subscription: query.data,
    isLoading: query.isLoading,
    plan,
    limits,
    isExpired,
    daysRemaining,
    requests: requestsQuery.data ?? [],
    requestsLoading: requestsQuery.isLoading,
    submitRequest,
    refetch: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['subscription_requests', user?.id] });
    },
  };
}
