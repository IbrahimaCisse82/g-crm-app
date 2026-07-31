DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(user_id uuid, email text, full_name text, phone text, created_at timestamptz, banned_until timestamptz, is_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    p.full_name,
    p.phone,
    u.created_at,
    u.banned_until,
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin') AS is_admin
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- ---------- Corbeille (archives) ----------
CREATE OR REPLACE FUNCTION public.list_archived()
RETURNS TABLE(table_name text, id uuid, label text, sublabel text, deleted_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 'clients', c.id, c.prenom || ' ' || c.nom, coalesce(c.entreprise, c.email, ''), c.deleted_at
  FROM public.clients c WHERE c.user_id = auth.uid() AND c.deleted_at IS NOT NULL
  UNION ALL
  SELECT 'produits', p.id, p.nom, coalesce(p.type, ''), p.deleted_at
  FROM public.produits p WHERE p.user_id = auth.uid() AND p.deleted_at IS NOT NULL
  UNION ALL
  SELECT 'devis', d.id, d.numero, d.montant_ttc::text, d.deleted_at
  FROM public.devis d WHERE d.user_id = auth.uid() AND d.deleted_at IS NOT NULL
  UNION ALL
  SELECT 'factures', f.id, f.numero, f.montant_ttc::text, f.deleted_at
  FROM public.factures f WHERE f.user_id = auth.uid() AND f.deleted_at IS NOT NULL
  UNION ALL
  SELECT 'journal', j.id, j.libelle, j.type || ' · ' || j.montant::text, j.deleted_at
  FROM public.journal j WHERE j.user_id = auth.uid() AND j.deleted_at IS NOT NULL
  UNION ALL
  SELECT 'categories', k.id, k.nom, k.type, k.deleted_at
  FROM public.categories k WHERE k.user_id = auth.uid() AND k.deleted_at IS NOT NULL
  UNION ALL
  SELECT 'comptes_tresorerie', t.id, t.operateur || ' — ' || t.titulaire, t.numero, t.deleted_at
  FROM public.comptes_tresorerie t WHERE t.user_id = auth.uid() AND t.deleted_at IS NOT NULL
  ORDER BY 5 DESC
$$;

CREATE OR REPLACE FUNCTION public.restore_archived(_table text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _table NOT IN ('clients','produits','devis','factures','journal','categories','comptes_tresorerie') THEN
    RAISE EXCEPTION 'Table non autorisée';
  END IF;
  EXECUTE format('UPDATE public.%I SET deleted_at = NULL WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL', _table)
    USING _id, auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_archived(_table text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _table NOT IN ('clients','produits','devis','factures','journal','categories','comptes_tresorerie') THEN
    RAISE EXCEPTION 'Table non autorisée';
  END IF;
  EXECUTE format('DELETE FROM public.%I WHERE id = $1 AND user_id = $2 AND deleted_at IS NOT NULL', _table)
    USING _id, auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.list_archived() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.restore_archived(text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.purge_archived(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_archived() TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_archived(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_archived(text, uuid) TO authenticated;