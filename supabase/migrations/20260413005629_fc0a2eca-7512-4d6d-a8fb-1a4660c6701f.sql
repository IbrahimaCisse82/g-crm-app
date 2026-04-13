
-- Table subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_reference text,
  payment_mode text,
  amount numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (is_owner(user_id));
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT WITH CHECK (is_owner(user_id));
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE USING (is_owner(user_id));

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table subscription_requests
CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'pro',
  payment_mode text NOT NULL,
  payment_reference text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_requests_select" ON public.subscription_requests FOR SELECT USING (is_owner(user_id));
CREATE POLICY "sub_requests_insert" ON public.subscription_requests FOR INSERT WITH CHECK (is_owner(user_id));

-- Update handle_new_user to create free subscription
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
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;
