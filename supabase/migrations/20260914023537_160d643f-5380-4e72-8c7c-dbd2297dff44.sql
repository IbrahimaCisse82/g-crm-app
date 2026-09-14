
CREATE OR REPLACE FUNCTION public.get_user_plan(_user uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Offre de lancement : toutes les fonctionnalités Pro gratuites jusqu'au 31/12/2026
    WHEN now() <= timestamptz '2026-12-31 23:59:59+00' THEN 'pro'
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = _user
        AND s.plan = 'pro'
        AND s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > now())
    ) THEN 'pro'
    ELSE 'free'
  END
$$;
