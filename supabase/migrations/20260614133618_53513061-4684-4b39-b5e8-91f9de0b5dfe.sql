
-- ============================================
-- 1. PLAN HELPER + FREEMIUM LIMITS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_plan(_user uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN s.plan = 'pro'
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
    THEN 'pro'
    ELSE 'free'
  END
  FROM public.subscriptions s
  WHERE s.user_id = _user
  LIMIT 1
$$;

-- Generic guard for monthly-counted tables
CREATE OR REPLACE FUNCTION public.enforce_free_limit_monthly()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan text;
  _count int;
  _limit int := TG_ARGV[1]::int;
  _table text := TG_ARGV[0];
  _date_col text := TG_ARGV[2];
  _label text := TG_ARGV[3];
BEGIN
  _plan := COALESCE(public.get_user_plan(NEW.user_id), 'free');
  IF _plan = 'pro' THEN RETURN NEW; END IF;

  EXECUTE format(
    'SELECT count(*) FROM public.%I WHERE user_id = $1 AND date_trunc(''month'', %I) = date_trunc(''month'', CURRENT_DATE)',
    _table, _date_col
  ) INTO _count USING NEW.user_id;

  IF _count >= _limit THEN
    RAISE EXCEPTION 'Limite du plan Gratuit atteinte : % maximum % par mois. Passez à Pro pour continuer.', _limit, _label
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_free_limit_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan text;
  _count int;
  _limit int := TG_ARGV[1]::int;
  _table text := TG_ARGV[0];
  _label text := TG_ARGV[2];
BEGIN
  _plan := COALESCE(public.get_user_plan(NEW.user_id), 'free');
  IF _plan = 'pro' THEN RETURN NEW; END IF;

  EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', _table)
    INTO _count USING NEW.user_id;

  IF _count >= _limit THEN
    RAISE EXCEPTION 'Limite du plan Gratuit atteinte : % maximum %. Passez à Pro pour continuer.', _limit, _label
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_limit_clients ON public.clients;
CREATE TRIGGER trg_limit_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_limit_total('clients', '10', 'clients');

DROP TRIGGER IF EXISTS trg_limit_factures ON public.factures;
CREATE TRIGGER trg_limit_factures
  BEFORE INSERT ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_limit_monthly('factures', '5', 'date_facture', 'factures');

DROP TRIGGER IF EXISTS trg_limit_devis ON public.devis;
CREATE TRIGGER trg_limit_devis
  BEFORE INSERT ON public.devis
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_limit_monthly('devis', '5', 'date_devis', 'devis');

DROP TRIGGER IF EXISTS trg_limit_categories ON public.categories;
CREATE TRIGGER trg_limit_categories
  BEFORE INSERT ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_limit_total('categories', '5', 'catégories');

-- ============================================
-- 2. IMMUTABILITÉ DES DOCUMENTS
-- ============================================
CREATE OR REPLACE FUNCTION public.protect_paid_facture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.statut = 'Payée' THEN
      RAISE EXCEPTION 'Une facture payée ne peut pas être supprimée. Émettez un avoir pour la corriger.'
        USING ERRCODE = 'P0001';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF OLD.statut = 'Payée' THEN
    -- Allow only status transition to Annulée (via an avoir), or no-op
    IF NEW.numero IS DISTINCT FROM OLD.numero
       OR NEW.articles IS DISTINCT FROM OLD.articles
       OR NEW.montant_ht IS DISTINCT FROM OLD.montant_ht
       OR NEW.montant_tva IS DISTINCT FROM OLD.montant_tva
       OR NEW.montant_ttc IS DISTINCT FROM OLD.montant_ttc
       OR NEW.date_facture IS DISTINCT FROM OLD.date_facture
       OR NEW.client_id IS DISTINCT FROM OLD.client_id THEN
      RAISE EXCEPTION 'Une facture payée ne peut pas être modifiée. Émettez un avoir pour la corriger.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_paid_facture_upd ON public.factures;
CREATE TRIGGER trg_protect_paid_facture_upd
  BEFORE UPDATE ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.protect_paid_facture();

DROP TRIGGER IF EXISTS trg_protect_paid_facture_del ON public.factures;
CREATE TRIGGER trg_protect_paid_facture_del
  BEFORE DELETE ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.protect_paid_facture();

-- Reçus : immutables après création
CREATE OR REPLACE FUNCTION public.protect_immutable_doc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION '% : ce document est immuable et ne peut être ni modifié ni supprimé (conservation légale).', TG_TABLE_NAME
    USING ERRCODE = 'P0001';
END;
$$;

DROP TRIGGER IF EXISTS trg_recus_immutable_upd ON public.recus;
CREATE TRIGGER trg_recus_immutable_upd
  BEFORE UPDATE ON public.recus
  FOR EACH ROW EXECUTE FUNCTION public.protect_immutable_doc();
DROP TRIGGER IF EXISTS trg_recus_immutable_del ON public.recus;
CREATE TRIGGER trg_recus_immutable_del
  BEFORE DELETE ON public.recus
  FOR EACH ROW EXECUTE FUNCTION public.protect_immutable_doc();

DROP TRIGGER IF EXISTS trg_avoirs_immutable_upd ON public.avoirs;
CREATE TRIGGER trg_avoirs_immutable_upd
  BEFORE UPDATE ON public.avoirs
  FOR EACH ROW EXECUTE FUNCTION public.protect_immutable_doc();
DROP TRIGGER IF EXISTS trg_avoirs_immutable_del ON public.avoirs;
CREATE TRIGGER trg_avoirs_immutable_del
  BEFORE DELETE ON public.avoirs
  FOR EACH ROW EXECUTE FUNCTION public.protect_immutable_doc();

-- ============================================
-- 3. WEBAUTHN TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text,
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

GRANT SELECT, DELETE ON public.webauthn_credentials TO authenticated;
GRANT ALL ON public.webauthn_credentials TO service_role;

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webauthn_credentials_select"
  ON public.webauthn_credentials FOR SELECT
  USING (public.is_owner(user_id));

CREATE POLICY "webauthn_credentials_delete"
  ON public.webauthn_credentials FOR DELETE
  USING (public.is_owner(user_id));

CREATE INDEX IF NOT EXISTS idx_webauthn_cred_user ON public.webauthn_credentials(user_id);

CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('registration', 'authentication')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.webauthn_challenges TO service_role;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;
-- No client access: only edge functions (service_role) use this table

CREATE INDEX IF NOT EXISTS idx_webauthn_chal_user ON public.webauthn_challenges(user_id);
