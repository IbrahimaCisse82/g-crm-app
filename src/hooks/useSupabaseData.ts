import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Simple typed hooks for each table

export function useClients() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['clients', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: { prenom: string; nom: string; email?: string; telephone?: string; entreprise?: string; statut?: string; adresse?: string; notes?: string }) => {
    const { error } = await supabase.from('clients').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('clients').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

export function useFactures() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['factures', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('factures').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Record<string, any>) => {
    const { error } = await supabase.from('factures').insert({ ...row, user_id: user!.id } as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('factures').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('factures').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

export function useDevis() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['devis', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('devis').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Record<string, any>) => {
    const { error } = await supabase.from('devis').insert({ ...row, user_id: user!.id } as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('devis').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('devis').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

export function useProduits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['produits', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('produits').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Record<string, any>) => {
    const { error } = await supabase.from('produits').insert({ ...row, user_id: user!.id } as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase.from('produits').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('produits').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

export function useJournal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['journal', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('journal').select('*').order('date_operation', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Record<string, any>) => {
    const { error } = await supabase.from('journal').insert({ ...row, user_id: user!.id } as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('journal').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, remove };
}

export function useComptesTresorerie() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['comptes_tresorerie', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('comptes_tresorerie').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Record<string, any>) => {
    const { error } = await supabase.from('comptes_tresorerie').insert({ ...row, user_id: user!.id } as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('comptes_tresorerie').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, remove };
}

export function useEntreprise() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['entreprises', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('entreprises').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsert = async (values: Record<string, any>) => {
    if (query.data) {
      const { error } = await supabase.from('entreprises').update(values).eq('id', query.data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('entreprises').insert({ ...values, user_id: user!.id });
      if (error) throw error;
    }
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data, isLoading: query.isLoading, upsert };
}
