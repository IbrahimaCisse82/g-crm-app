ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS account_closed_at timestamptz;

CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  UPDATE public.profiles SET deletion_requested_at = _now
   WHERE user_id = auth.uid() AND account_closed_at IS NULL;
  INSERT INTO public.audit_log(user_id, action, table_name, after)
   VALUES (auth.uid(), 'account_deletion_requested', 'profiles', jsonb_build_object('requested_at', _now));
  RETURN _now + interval '30 days';
END $$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  UPDATE public.profiles SET deletion_requested_at = NULL
   WHERE user_id = auth.uid() AND account_closed_at IS NULL;
  INSERT INTO public.audit_log(user_id, action, table_name)
   VALUES (auth.uid(), 'account_deletion_cancelled', 'profiles');
END $$;

-- Fermeture après 30 jours : données personnelles anonymisées, pièces fiscales conservées 10 ans
CREATE OR REPLACE FUNCTION public.close_expired_accounts()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n integer;
BEGIN
  WITH closed AS (
    UPDATE public.profiles
       SET account_closed_at = now(), full_name = 'Compte supprimé',
           phone = NULL, address = NULL, avatar_url = NULL
     WHERE deletion_requested_at IS NOT NULL AND account_closed_at IS NULL
       AND deletion_requested_at < now() - interval '30 days'
    RETURNING user_id)
  SELECT count(*) INTO _n FROM closed;
  RETURN _n;
END $$;

REVOKE EXECUTE ON FUNCTION public.close_expired_accounts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated;