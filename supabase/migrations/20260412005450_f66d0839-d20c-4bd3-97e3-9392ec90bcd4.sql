
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nom TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Dépense',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (is_owner(user_id));
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (is_owner(user_id));
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (is_owner(user_id));
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (is_owner(user_id));

-- Update handle_new_user to seed default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, company_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', '')
  );
  INSERT INTO public.entreprises (user_id, nom)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mon Entreprise')
  );
  INSERT INTO public.categories (user_id, nom, type) VALUES
    (NEW.id, 'Vente', 'Recette'),
    (NEW.id, 'Prestation', 'Recette'),
    (NEW.id, 'Loyer', 'Dépense'),
    (NEW.id, 'Fournitures', 'Dépense'),
    (NEW.id, 'Transport', 'Dépense'),
    (NEW.id, 'Salaires', 'Dépense'),
    (NEW.id, 'Impôts & Taxes', 'Dépense'),
    (NEW.id, 'Marketing', 'Dépense'),
    (NEW.id, 'Équipement', 'Dépense'),
    (NEW.id, 'Autre', 'Dépense');
  RETURN NEW;
END;
$$;
