
-- DGI mentions: client NINEA, régime fiscal vendeur, TVA par ligne (jsonb), BRS 5%, conditions/pénalités
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ninea text;

ALTER TABLE public.entreprises 
  ADD COLUMN IF NOT EXISTS regime_fiscal text DEFAULT 'Réel',
  ADD COLUMN IF NOT EXISTS conditions_paiement_defaut text,
  ADD COLUMN IF NOT EXISTS penalites_retard_defaut text DEFAULT 'En cas de retard de paiement, une pénalité égale à 1,5 fois le taux d''intérêt légal sera appliquée (article 446 du COCC).';

ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS retenue_source_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS montant_retenue numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_a_payer numeric,
  ADD COLUMN IF NOT EXISTS conditions_paiement text,
  ADD COLUMN IF NOT EXISTS penalites_retard text,
  ADD COLUMN IF NOT EXISTS date_livraison date;
