-- ============================================================
-- Migration 00004: Activation du rôle administrateur & Schéma Produits
-- À exécuter dans le Dashboard Supabase > SQL Editor
-- ============================================================

-- 1. Attribuer le rôle 'admin' au compte admin@sca.com
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@sca.com' OR id = 'fbdfc7bb-199b-46a1-b268-65362248eae1';

-- 2. Fonction de vérification de rôle infaillible pour admin@sca.com
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  u_role public.user_role;
  u_email text;
BEGIN
  SELECT email INTO u_email FROM auth.users WHERE id = uid;
  IF u_email = 'admin@sca.com' THEN
    RETURN 'admin'::public.user_role;
  END IF;
  SELECT role INTO u_role FROM public.profiles WHERE id = uid;
  RETURN COALESCE(u_role, 'user'::public.user_role);
END;
$$;

-- 3. Mise à jour du trigger pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    CASE WHEN NEW.email = 'admin@sca.com' THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE WHEN NEW.email = 'admin@sca.com' THEN 'admin'::public.user_role ELSE profiles.role END;
  RETURN NEW;
END;
$$;

-- 4. Colonne promo_price sur la table products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_price numeric(12,2) CHECK (promo_price >= 0);

-- 5. Table product_images (Multi-images pour les produits)
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_product_images" ON public.product_images;
CREATE POLICY "anon_read_product_images" ON public.product_images FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "auth_read_product_images" ON public.product_images;
CREATE POLICY "auth_read_product_images" ON public.product_images FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_product_images" ON public.product_images;
CREATE POLICY "admin_write_product_images" ON public.product_images
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
