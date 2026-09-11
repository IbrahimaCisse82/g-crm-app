
-- 0. Correctif : enforce_same_owner doit tolérer les tables sans facture_id/client_id
CREATE OR REPLACE FUNCTION public.enforce_same_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
  _rec jsonb := to_jsonb(NEW);
  _client uuid;
  _facture uuid;
BEGIN
  _client := NULLIF(_rec->>'client_id', '')::uuid;
  _facture := NULLIF(_rec->>'facture_id', '')::uuid;

  IF _client IS NOT NULL THEN
    SELECT user_id INTO _owner FROM public.clients WHERE id = _client;
    IF _owner IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'Client référencé invalide' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF _facture IS NOT NULL THEN
    SELECT user_id INTO _owner FROM public.factures WHERE id = _facture;
    IF _owner IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'Facture référencée invalide' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 1. AVOIRS
UPDATE public.avoirs SET facture_id = NULL WHERE facture_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.factures f WHERE f.id = avoirs.facture_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.avoirs WHERE facture_id IS NULL) THEN
    ALTER TABLE public.avoirs ALTER COLUMN facture_id SET NOT NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.validate_avoir_facture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _owner uuid;
BEGIN
  IF NEW.facture_id IS NULL THEN
    RAISE EXCEPTION 'Un avoir doit être rattaché à une facture source.' USING ERRCODE = 'P0001';
  END IF;
  SELECT user_id INTO _owner FROM public.factures WHERE id = NEW.facture_id;
  IF _owner IS NULL THEN
    RAISE EXCEPTION 'Facture source introuvable.' USING ERRCODE = 'P0001';
  END IF;
  IF _owner <> NEW.user_id THEN
    RAISE EXCEPTION 'La facture source ne vous appartient pas.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_avoir_facture ON public.avoirs;
CREATE TRIGGER trg_validate_avoir_facture
  BEFORE INSERT ON public.avoirs
  FOR EACH ROW EXECUTE FUNCTION public.validate_avoir_facture();

CREATE OR REPLACE FUNCTION public.apply_avoir_to_facture()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ttc numeric; _regle numeric; _new_regle numeric;
BEGIN
  SELECT montant_ttc, COALESCE(montant_regle, 0) INTO _ttc, _regle
    FROM public.factures WHERE id = NEW.facture_id;
  _new_regle := LEAST(_ttc, _regle + NEW.montant_ttc);

  UPDATE public.factures
     SET montant_regle = _new_regle,
         statut = CASE
           WHEN _new_regle >= _ttc THEN 'Payée'
           WHEN _new_regle > 0 THEN 'Partielle'
           ELSE statut
         END
   WHERE id = NEW.facture_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_avoir_to_facture ON public.avoirs;
CREATE TRIGGER trg_apply_avoir_to_facture
  AFTER INSERT ON public.avoirs
  FOR EACH ROW EXECUTE FUNCTION public.apply_avoir_to_facture();

-- 2. QUOTAS FREE
DROP TRIGGER IF EXISTS trg_limit_factures ON public.factures;
CREATE TRIGGER trg_limit_factures
  BEFORE INSERT ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_limit_monthly('factures', '10', 'date_facture', 'factures');

DROP TRIGGER IF EXISTS trg_limit_devis ON public.devis;
CREATE TRIGGER trg_limit_devis
  BEFORE INSERT ON public.devis
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_limit_monthly('devis', '10', 'date_devis', 'devis');

DROP TRIGGER IF EXISTS trg_limit_clients ON public.clients;
CREATE TRIGGER trg_limit_clients
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.enforce_free_limit_total('clients', '10', 'clients');

-- 3. SLA 24h
ALTER TABLE public.subscription_requests
  ADD COLUMN IF NOT EXISTS admin_deadline timestamptz;

UPDATE public.subscription_requests
   SET admin_deadline = created_at + interval '24 hours'
 WHERE admin_deadline IS NULL;

CREATE OR REPLACE FUNCTION public.set_request_deadline()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.admin_deadline := COALESCE(NEW.admin_deadline, COALESCE(NEW.created_at, now()) + interval '24 hours');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_request_deadline ON public.subscription_requests;
CREATE TRIGGER trg_request_deadline
  BEFORE INSERT ON public.subscription_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_request_deadline();

-- 4. TARIFS
CREATE TABLE IF NOT EXISTS public.plan_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL,
  billing_period text NOT NULL DEFAULT 'monthly',
  price_fcfa integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan, billing_period)
);

GRANT SELECT ON public.plan_pricing TO anon;
GRANT SELECT ON public.plan_pricing TO authenticated;
GRANT ALL ON public.plan_pricing TO service_role;

ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_pricing_read ON public.plan_pricing;
CREATE POLICY plan_pricing_read ON public.plan_pricing FOR SELECT USING (true);

DROP POLICY IF EXISTS plan_pricing_admin_write ON public.plan_pricing;
CREATE POLICY plan_pricing_admin_write ON public.plan_pricing FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_plan_pricing_updated_at ON public.plan_pricing;
CREATE TRIGGER trg_plan_pricing_updated_at
  BEFORE UPDATE ON public.plan_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.plan_pricing (plan, billing_period, price_fcfa)
VALUES ('free', 'monthly', 0), ('pro', 'monthly', 5000), ('pro', 'yearly', 50000)
ON CONFLICT (plan, billing_period) DO NOTHING;

-- 5. created_by
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_by := COALESCE(NEW.created_by, auth.uid(), NEW.user_id);
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','produits','categories','factures','devis','journal','recus','avoirs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by uuid', t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_created_by ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_set_created_by BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_created_by()', t);
  END LOOP;
END $$;
