
-- ============================================
-- 1. CROSS-USER GUARDS + MISSING FKs
-- ============================================
-- Nettoyer d'éventuelles références orphelines avant d'ajouter les FK
UPDATE public.recus r SET client_id = NULL
  WHERE client_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = r.client_id);
UPDATE public.recus r SET facture_id = NULL
  WHERE facture_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.factures f WHERE f.id = r.facture_id);
UPDATE public.avoirs a SET client_id = NULL
  WHERE client_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = a.client_id);
UPDATE public.avoirs a SET facture_id = NULL
  WHERE facture_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.factures f WHERE f.id = a.facture_id);

ALTER TABLE public.recus
  DROP CONSTRAINT IF EXISTS recus_user_id_fkey,
  ADD CONSTRAINT recus_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.recus
  DROP CONSTRAINT IF EXISTS recus_client_id_fkey,
  ADD CONSTRAINT recus_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.recus
  DROP CONSTRAINT IF EXISTS recus_facture_id_fkey,
  ADD CONSTRAINT recus_facture_id_fkey FOREIGN KEY (facture_id) REFERENCES public.factures(id) ON DELETE SET NULL;

ALTER TABLE public.avoirs
  DROP CONSTRAINT IF EXISTS avoirs_user_id_fkey,
  ADD CONSTRAINT avoirs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.avoirs
  DROP CONSTRAINT IF EXISTS avoirs_client_id_fkey,
  ADD CONSTRAINT avoirs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.avoirs
  DROP CONSTRAINT IF EXISTS avoirs_facture_id_fkey,
  ADD CONSTRAINT avoirs_facture_id_fkey FOREIGN KEY (facture_id) REFERENCES public.factures(id) ON DELETE SET NULL;

-- Empêcher de référencer un client/facture appartenant à un autre user
CREATE OR REPLACE FUNCTION public.enforce_same_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    SELECT user_id INTO _owner FROM public.clients WHERE id = NEW.client_id;
    IF _owner IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'Client référencé invalide' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  IF NEW.facture_id IS NOT NULL THEN
    SELECT user_id INTO _owner FROM public.factures WHERE id = NEW.facture_id;
    IF _owner IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'Facture référencée invalide' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recus_same_owner ON public.recus;
CREATE TRIGGER trg_recus_same_owner BEFORE INSERT ON public.recus
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner();
DROP TRIGGER IF EXISTS trg_avoirs_same_owner ON public.avoirs;
CREATE TRIGGER trg_avoirs_same_owner BEFORE INSERT ON public.avoirs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner();

-- Pareil pour journal (déjà FK mais pas de check user)
DROP TRIGGER IF EXISTS trg_journal_same_owner ON public.journal;
CREATE TRIGGER trg_journal_same_owner BEFORE INSERT OR UPDATE ON public.journal
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner();

-- Factures: client_id doit aussi appartenir au même user
DROP TRIGGER IF EXISTS trg_factures_same_owner ON public.factures;
CREATE TRIGGER trg_factures_same_owner BEFORE INSERT OR UPDATE ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner();
DROP TRIGGER IF EXISTS trg_devis_same_owner ON public.devis;
CREATE TRIGGER trg_devis_same_owner BEFORE INSERT OR UPDATE ON public.devis
  FOR EACH ROW EXECUTE FUNCTION public.enforce_same_owner();

-- ============================================
-- 2. SOFT DELETE
-- ============================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.devis ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.journal ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.comptes_tresorerie ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Update SELECT policies to hide soft-deleted rows
DROP POLICY IF EXISTS clients_select ON public.clients;
CREATE POLICY clients_select ON public.clients FOR SELECT USING (public.is_owner(user_id) AND deleted_at IS NULL);
DROP POLICY IF EXISTS devis_select ON public.devis;
CREATE POLICY devis_select ON public.devis FOR SELECT USING (public.is_owner(user_id) AND deleted_at IS NULL);
DROP POLICY IF EXISTS produits_select ON public.produits;
CREATE POLICY produits_select ON public.produits FOR SELECT USING (public.is_owner(user_id) AND deleted_at IS NULL);
DROP POLICY IF EXISTS journal_select ON public.journal;
CREATE POLICY journal_select ON public.journal FOR SELECT USING (public.is_owner(user_id) AND deleted_at IS NULL);
DROP POLICY IF EXISTS categories_select ON public.categories;
CREATE POLICY categories_select ON public.categories FOR SELECT USING (public.is_owner(user_id) AND deleted_at IS NULL);
DROP POLICY IF EXISTS comptes_tresorerie_select ON public.comptes_tresorerie;
CREATE POLICY comptes_tresorerie_select ON public.comptes_tresorerie FOR SELECT USING (public.is_owner(user_id) AND deleted_at IS NULL);
DROP POLICY IF EXISTS factures_select ON public.factures;
CREATE POLICY factures_select ON public.factures FOR SELECT USING (public.is_owner(user_id) AND deleted_at IS NULL);

-- Reviser le trigger d'immutabilité pour autoriser deleted_at sur factures non-payées
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
    -- Bloquer toute modification métier; deleted_at également interdit sur facture payée
    IF NEW.numero IS DISTINCT FROM OLD.numero
       OR NEW.articles IS DISTINCT FROM OLD.articles
       OR NEW.montant_ht IS DISTINCT FROM OLD.montant_ht
       OR NEW.montant_tva IS DISTINCT FROM OLD.montant_tva
       OR NEW.montant_ttc IS DISTINCT FROM OLD.montant_ttc
       OR NEW.date_facture IS DISTINCT FROM OLD.date_facture
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      RAISE EXCEPTION 'Une facture payée ne peut pas être modifiée ni archivée. Émettez un avoir pour la corriger.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- 3. AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name text NOT NULL,
  record_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select_own ON public.audit_log
  FOR SELECT USING (public.is_owner(user_id));
-- Pas de INSERT/UPDATE/DELETE policy : seul le trigger SECURITY DEFINER écrit

CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON public.audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _rid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _uid := OLD.user_id;
    _rid := OLD.id;
  ELSE
    _uid := NEW.user_id;
    _rid := NEW.id;
  END IF;

  INSERT INTO public.audit_log (user_id, action, table_name, record_id, before, after)
  VALUES (
    _uid,
    TG_OP,
    TG_TABLE_NAME,
    _rid,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_factures ON public.factures;
CREATE TRIGGER trg_audit_factures AFTER INSERT OR UPDATE OR DELETE ON public.factures
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
DROP TRIGGER IF EXISTS trg_audit_recus ON public.recus;
CREATE TRIGGER trg_audit_recus AFTER INSERT OR UPDATE OR DELETE ON public.recus
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
DROP TRIGGER IF EXISTS trg_audit_avoirs ON public.avoirs;
CREATE TRIGGER trg_audit_avoirs AFTER INSERT OR UPDATE OR DELETE ON public.avoirs
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
DROP TRIGGER IF EXISTS trg_audit_journal ON public.journal;
CREATE TRIGGER trg_audit_journal AFTER INSERT OR UPDATE OR DELETE ON public.journal
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
DROP TRIGGER IF EXISTS trg_audit_subscriptions ON public.subscriptions;
CREATE TRIGGER trg_audit_subscriptions AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================
-- 4. PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_user ON public.clients(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_factures_user_date ON public.factures(user_id, date_facture DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_factures_client ON public.factures(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_factures_statut ON public.factures(user_id, statut) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_devis_user_date ON public.devis(user_id, date_devis DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_devis_client ON public.devis(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_produits_user ON public.produits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal(user_id, date_operation DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_journal_facture ON public.journal(facture_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comptes_user ON public.comptes_tresorerie(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recus_user_date ON public.recus(user_id, date_recu DESC);
CREATE INDEX IF NOT EXISTS idx_recus_facture ON public.recus(facture_id);
CREATE INDEX IF NOT EXISTS idx_recus_client ON public.recus(client_id);
CREATE INDEX IF NOT EXISTS idx_avoirs_user_date ON public.avoirs(user_id, date_avoir DESC);
CREATE INDEX IF NOT EXISTS idx_avoirs_facture ON public.avoirs(facture_id);
CREATE INDEX IF NOT EXISTS idx_avoirs_client ON public.avoirs(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_requests_user_status ON public.subscription_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_entreprises_user ON public.entreprises(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_counters_lookup ON public.document_counters(user_id, doc_type, year);
