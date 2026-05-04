
-- 1. Compteur annuel par utilisateur/type
CREATE TABLE public.document_counters (
  user_id uuid NOT NULL,
  doc_type text NOT NULL,
  year integer NOT NULL,
  last_value integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, doc_type, year)
);

ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY counters_select ON public.document_counters FOR SELECT USING (is_owner(user_id));
CREATE POLICY counters_insert ON public.document_counters FOR INSERT WITH CHECK (is_owner(user_id));
CREATE POLICY counters_update ON public.document_counters FOR UPDATE USING (is_owner(user_id));

-- Fonction générique
CREATE OR REPLACE FUNCTION public.next_doc_numero(_doc_type text, _prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _year integer := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  _next integer;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.document_counters (user_id, doc_type, year, last_value)
  VALUES (_user, _doc_type, _year, 1)
  ON CONFLICT (user_id, doc_type, year)
  DO UPDATE SET last_value = public.document_counters.last_value + 1
  RETURNING last_value INTO _next;

  RETURN _prefix || '-' || _year::text || '-' || LPAD(_next::text, 5, '0');
END;
$$;

-- Remplacer les fonctions existantes (FAC, DEV) pour utiliser le compteur annuel
CREATE OR REPLACE FUNCTION public.next_facture_numero()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.next_doc_numero('facture', 'FAC')
$$;

CREATE OR REPLACE FUNCTION public.next_devis_numero()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.next_doc_numero('devis', 'DEV')
$$;

CREATE OR REPLACE FUNCTION public.next_recu_numero()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.next_doc_numero('recu', 'REC')
$$;

CREATE OR REPLACE FUNCTION public.next_avoir_numero()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.next_doc_numero('avoir', 'AVO')
$$;

-- Initialiser les compteurs avec les valeurs existantes pour ne pas casser l'historique
INSERT INTO public.document_counters (user_id, doc_type, year, last_value)
SELECT user_id, 'facture', EXTRACT(YEAR FROM CURRENT_DATE)::int, COUNT(*)
FROM public.factures
WHERE numero LIKE 'FAC-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-%'
GROUP BY user_id
ON CONFLICT DO NOTHING;

INSERT INTO public.document_counters (user_id, doc_type, year, last_value)
SELECT user_id, 'devis', EXTRACT(YEAR FROM CURRENT_DATE)::int, COUNT(*)
FROM public.devis
WHERE numero LIKE 'DEV-' || EXTRACT(YEAR FROM CURRENT_DATE)::text || '-%'
GROUP BY user_id
ON CONFLICT DO NOTHING;

-- 2. Reçus
CREATE TABLE public.recus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero text NOT NULL,
  client_id uuid,
  facture_id uuid,
  date_recu date NOT NULL DEFAULT CURRENT_DATE,
  montant numeric NOT NULL DEFAULT 0,
  mode_paiement text NOT NULL DEFAULT 'Espèce',
  reference text DEFAULT '',
  description text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recus ENABLE ROW LEVEL SECURITY;
CREATE POLICY recus_select ON public.recus FOR SELECT USING (is_owner(user_id));
CREATE POLICY recus_insert ON public.recus FOR INSERT WITH CHECK (is_owner(user_id));
CREATE POLICY recus_update ON public.recus FOR UPDATE USING (is_owner(user_id));
CREATE POLICY recus_delete ON public.recus FOR DELETE USING (is_owner(user_id));

CREATE TRIGGER trg_recus_updated_at
BEFORE UPDATE ON public.recus
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Avoirs
CREATE TABLE public.avoirs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero text NOT NULL,
  client_id uuid,
  facture_id uuid,
  date_avoir date NOT NULL DEFAULT CURRENT_DATE,
  articles jsonb NOT NULL DEFAULT '[]'::jsonb,
  montant_ht numeric NOT NULL DEFAULT 0,
  montant_tva numeric NOT NULL DEFAULT 0,
  montant_ttc numeric NOT NULL DEFAULT 0,
  motif text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.avoirs ENABLE ROW LEVEL SECURITY;
CREATE POLICY avoirs_select ON public.avoirs FOR SELECT USING (is_owner(user_id));
CREATE POLICY avoirs_insert ON public.avoirs FOR INSERT WITH CHECK (is_owner(user_id));
CREATE POLICY avoirs_update ON public.avoirs FOR UPDATE USING (is_owner(user_id));
CREATE POLICY avoirs_delete ON public.avoirs FOR DELETE USING (is_owner(user_id));

CREATE TRIGGER trg_avoirs_updated_at
BEFORE UPDATE ON public.avoirs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Onboarding
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
