
-- Helper function for ownership check
CREATE OR REPLACE FUNCTION public.is_owner(row_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = row_user_id
$$;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================== PROFILES =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  company_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (public.is_owner(user_id));
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================== ENTREPRISE (company settings per user) =====================
CREATE TABLE public.entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nom TEXT NOT NULL DEFAULT '',
  adresse TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  ninea TEXT DEFAULT '',
  rccm TEXT DEFAULT '',
  slogan TEXT DEFAULT '',
  tva NUMERIC NOT NULL DEFAULT 18,
  devise TEXT NOT NULL DEFAULT 'FCFA',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.entreprises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entreprises_select" ON public.entreprises FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "entreprises_insert" ON public.entreprises FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "entreprises_update" ON public.entreprises FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "entreprises_delete" ON public.entreprises FOR DELETE USING (public.is_owner(user_id));
CREATE TRIGGER update_entreprises_updated_at BEFORE UPDATE ON public.entreprises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== CLIENTS =====================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prenom TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  telephone TEXT DEFAULT '',
  entreprise TEXT DEFAULT '',
  statut TEXT NOT NULL DEFAULT 'Actif' CHECK (statut IN ('Actif', 'Prospect', 'Inactif')),
  adresse TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (public.is_owner(user_id));
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== PRODUITS =====================
CREATE TABLE public.produits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  type TEXT DEFAULT 'Service',
  prix NUMERIC NOT NULL DEFAULT 0,
  unite TEXT DEFAULT 'forfait',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produits_select" ON public.produits FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "produits_insert" ON public.produits FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "produits_update" ON public.produits FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "produits_delete" ON public.produits FOR DELETE USING (public.is_owner(user_id));
CREATE TRIGGER update_produits_updated_at BEFORE UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== FACTURES =====================
CREATE TABLE public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  articles JSONB NOT NULL DEFAULT '[]',
  montant_ht NUMERIC NOT NULL DEFAULT 0,
  montant_tva NUMERIC NOT NULL DEFAULT 0,
  montant_ttc NUMERIC NOT NULL DEFAULT 0,
  mode_paiement TEXT DEFAULT '',
  compte_mm TEXT DEFAULT '',
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  date_echeance DATE,
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('Payée', 'En attente', 'En retard', 'Annulée')),
  notes TEXT DEFAULT '',
  montant_regle NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "factures_select" ON public.factures FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "factures_insert" ON public.factures FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "factures_update" ON public.factures FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "factures_delete" ON public.factures FOR DELETE USING (public.is_owner(user_id));
CREATE TRIGGER update_factures_updated_at BEFORE UPDATE ON public.factures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== DEVIS =====================
CREATE TABLE public.devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  articles JSONB NOT NULL DEFAULT '[]',
  montant_ht NUMERIC NOT NULL DEFAULT 0,
  montant_tva NUMERIC NOT NULL DEFAULT 0,
  montant_ttc NUMERIC NOT NULL DEFAULT 0,
  date_devis DATE NOT NULL DEFAULT CURRENT_DATE,
  validite_jours INTEGER NOT NULL DEFAULT 30,
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'Accepté', 'Refusé', 'Expiré', 'Converti')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devis_select" ON public.devis FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "devis_insert" ON public.devis FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "devis_update" ON public.devis FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "devis_delete" ON public.devis FOR DELETE USING (public.is_owner(user_id));
CREATE TRIGGER update_devis_updated_at BEFORE UPDATE ON public.devis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== MOBILE MONEY (Trésorerie) =====================
CREATE TABLE public.comptes_tresorerie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  operateur TEXT NOT NULL,
  titulaire TEXT NOT NULL DEFAULT '',
  numero TEXT NOT NULL DEFAULT '',
  solde NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comptes_tresorerie ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comptes_tresorerie_select" ON public.comptes_tresorerie FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "comptes_tresorerie_insert" ON public.comptes_tresorerie FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "comptes_tresorerie_update" ON public.comptes_tresorerie FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "comptes_tresorerie_delete" ON public.comptes_tresorerie FOR DELETE USING (public.is_owner(user_id));
CREATE TRIGGER update_comptes_tresorerie_updated_at BEFORE UPDATE ON public.comptes_tresorerie FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== JOURNAL =====================
CREATE TABLE public.journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Recette', 'Dépense')),
  date_operation DATE NOT NULL DEFAULT CURRENT_DATE,
  libelle TEXT NOT NULL,
  categorie TEXT DEFAULT '',
  montant NUMERIC NOT NULL DEFAULT 0,
  mode_paiement TEXT DEFAULT '',
  compte TEXT DEFAULT '',
  facture_id UUID REFERENCES public.factures(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_select" ON public.journal FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "journal_insert" ON public.journal FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "journal_update" ON public.journal FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "journal_delete" ON public.journal FOR DELETE USING (public.is_owner(user_id));
