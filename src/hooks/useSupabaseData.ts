import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const QUERY_LIMIT = 500;

export function useClients() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['clients', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'clients'>, 'user_id'>) => {
    const { error } = await supabase.from('clients').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: TablesUpdate<'clients'>) => {
    const { error } = await supabase.from('clients').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('clients').update({ deleted_at: new Date().toISOString() } as any).eq('id', id).is('deleted_at', null);
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
      const { data, error } = await supabase.from('factures').select('*').order('date_facture', { ascending: false }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'factures'>, 'user_id'>) => {
    const { error } = await supabase.from('factures').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: TablesUpdate<'factures'>) => {
    const { error } = await supabase.from('factures').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('factures').update({ deleted_at: new Date().toISOString() } as any).eq('id', id).is('deleted_at', null);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const nextNumero = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('next_facture_numero');
    if (error) throw error;
    return data as string;
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove, nextNumero };
}

export function useDevis() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['devis', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('devis').select('*').order('date_devis', { ascending: false }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'devis'>, 'user_id'>) => {
    const { error } = await supabase.from('devis').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: TablesUpdate<'devis'>) => {
    const { error } = await supabase.from('devis').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('devis').update({ deleted_at: new Date().toISOString() } as any).eq('id', id).is('deleted_at', null);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const nextNumero = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('next_devis_numero');
    if (error) throw error;
    return data as string;
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove, nextNumero };
}

export function useProduits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['produits', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('produits').select('*').order('nom', { ascending: true }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'produits'>, 'user_id'>) => {
    const { error } = await supabase.from('produits').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: TablesUpdate<'produits'>) => {
    const { error } = await supabase.from('produits').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('produits').update({ deleted_at: new Date().toISOString() } as any).eq('id', id).is('deleted_at', null);
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
      const { data, error } = await supabase.from('journal').select('*').order('date_operation', { ascending: false }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'journal'>, 'user_id'>) => {
    const { error } = await supabase.from('journal').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('journal').update({ deleted_at: new Date().toISOString() } as any).eq('id', id).is('deleted_at', null);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const removeByFactureId = async (factureId: string) => {
    const { error } = await supabase.from('journal').update({ deleted_at: new Date().toISOString() } as any).eq('facture_id', factureId).is('deleted_at', null);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, remove, removeByFactureId };
}

export function useComptesTresorerie() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['comptes_tresorerie', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('comptes_tresorerie').select('*').limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'comptes_tresorerie'>, 'user_id'>) => {
    const { error } = await supabase.from('comptes_tresorerie').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, values: Partial<Omit<TablesInsert<'comptes_tresorerie'>, 'user_id'>>) => {
    const { error } = await supabase.from('comptes_tresorerie').update(values).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('comptes_tresorerie').update({ deleted_at: new Date().toISOString() } as any).eq('id', id).is('deleted_at', null);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

export function useCategories() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['categories', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('nom', { ascending: true }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: { nom: string; type: string }) => {
    const { error } = await supabase.from('categories').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: { nom?: string; type?: string }) => {
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('categories').update({ deleted_at: new Date().toISOString() } as any).eq('id', id).is('deleted_at', null);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove };
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

  const upsert = async (values: TablesUpdate<'entreprises'>) => {
    if (query.data) {
      const { error } = await supabase.from('entreprises').update(values).eq('id', query.data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('entreprises').insert({ ...values, user_id: user!.id } as TablesInsert<'entreprises'>);
      if (error) throw error;
    }
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data, isLoading: query.isLoading, upsert };
}

export function useRecus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['recus', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('recus').select('*').order('date_recu', { ascending: false }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'recus'>, 'user_id'>) => {
    const { error } = await supabase.from('recus').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: TablesUpdate<'recus'>) => {
    const { error } = await supabase.from('recus').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('recus').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const nextNumero = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('next_recu_numero');
    if (error) throw error;
    return data as string;
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove, nextNumero };
}

export function useAvoirs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['avoirs', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('avoirs').select('*').order('date_avoir', { ascending: false }).limit(QUERY_LIMIT);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const add = async (row: Omit<TablesInsert<'avoirs'>, 'user_id'>) => {
    const { error } = await supabase.from('avoirs').insert({ ...row, user_id: user!.id });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const update = async (id: string, updates: TablesUpdate<'avoirs'>) => {
    const { error } = await supabase.from('avoirs').update(updates).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('avoirs').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  const nextNumero = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('next_avoir_numero');
    if (error) throw error;
    return data as string;
  };

  return { data: query.data ?? [], isLoading: query.isLoading, add, update, remove, nextNumero };
}

export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['profile', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const update = async (values: TablesUpdate<'profiles'>) => {
    const { error } = await supabase.from('profiles').update(values).eq('user_id', user!.id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: key });
  };

  return { data: query.data, isLoading: query.isLoading, update };
}

export type ArchivedRow = {
  table_name: string;
  id: string;
  label: string | null;
  sublabel: string | null;
  deleted_at: string;
};

export function useArchives() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['archives', user?.id];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_archived');
      if (error) throw error;
      return (data ?? []) as ArchivedRow[];
    },
    enabled: !!user,
  });

  const invalidateAll = () => {
    ['archives', 'clients', 'produits', 'devis', 'factures', 'journal', 'categories', 'comptes_tresorerie']
      .forEach(k => qc.invalidateQueries({ queryKey: [k, user?.id] }));
  };

  const restore = async (table: string, id: string) => {
    const { error } = await supabase.rpc('restore_archived', { _table: table, _id: id });
    if (error) throw error;
    invalidateAll();
  };

  const purge = async (table: string, id: string) => {
    const { error } = await supabase.rpc('purge_archived', { _table: table, _id: id });
    if (error) throw error;
    invalidateAll();
  };

  return { data: query.data ?? [], isLoading: query.isLoading, restore, purge, refetch: () => qc.invalidateQueries({ queryKey: key }) };
}


