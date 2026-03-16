
-- Create sequences for invoice and quote numbers
CREATE SEQUENCE IF NOT EXISTS public.facture_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.devis_seq START 1;

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.next_facture_numero()
RETURNS text
LANGUAGE sql
SET search_path = 'public'
AS $$
  SELECT 'FAC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('public.facture_seq')::text, 5, '0')
$$;

-- Function to generate next quote number
CREATE OR REPLACE FUNCTION public.next_devis_numero()
RETURNS text
LANGUAGE sql
SET search_path = 'public'
AS $$
  SELECT 'DEV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('public.devis_seq')::text, 5, '0')
$$;
