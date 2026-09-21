-- ============================================================
-- S.C.A COURANT ALTERNATIF - SCRIPT COMPLET D'INSTALLATION BASE
-- Ce script configure TOUTE la base de données de A à Z en 1 seule fois.
-- Copiez tout ce fichier dans Supabase Dashboard > SQL Editor et cliquez sur "Run".
-- ============================================================

-- ── 1. Types ENUM ─────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('user', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_status') THEN
    CREATE TYPE public.stock_status AS ENUM ('en_stock', 'stock_faible', 'rupture');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('en_attente', 'confirme', 'en_preparation', 'livre', 'annule');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_mode') THEN
    CREATE TYPE public.delivery_mode AS ENUM ('livraison', 'retrait');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
    CREATE TYPE public.quote_status AS ENUM ('nouveau', 'en_cours', 'traite', 'rejete');
  END IF;
END $$;

-- ── 2. Tables ─────────────────────────────────────────────────

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('electricite', 'solaire')),
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  reference text UNIQUE NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  promo_price numeric(12,2) CHECK (promo_price >= 0),
  stock_quantity int NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  stock_threshold int NOT NULL DEFAULT 5,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'en_attente',
  delivery_mode public.delivery_mode NOT NULL DEFAULT 'livraison',
  delivery_address text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  product_reference text NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  total numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id uuid UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  total numeric(12,2) NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- QUOTES
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  client_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  project_type text NOT NULL,
  description text NOT NULL,
  status public.quote_status NOT NULL DEFAULT 'nouveau',
  estimated_amount numeric(12,2),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- STUDY REQUESTS
CREATE TABLE IF NOT EXISTS public.study_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  need_description text NOT NULL,
  status text NOT NULL DEFAULT 'nouveau',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_requests ENABLE ROW LEVEL SECURITY;

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ── 3. Séquences & Numérotations auto ─────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.order_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.quote_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'CMD-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('public.order_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_order_number ON public.orders;
CREATE TRIGGER trg_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'FAC-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('public.invoice_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_invoice_number ON public.invoices;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := 'DEV-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('public.quote_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_quote_number ON public.quotes;
CREATE TRIGGER trg_quote_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number();

-- ── 4. Rôle Admin & Trigger Auth ──────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  u_email text;
  u_role  public.user_role;
BEGIN
  SELECT email INTO u_email FROM auth.users WHERE id = uid;
  IF u_email = 'admin@sca.com' THEN
    RETURN 'admin'::public.user_role;
  END IF;
  SELECT role INTO u_role FROM public.profiles WHERE id = uid;
  RETURN COALESCE(u_role, 'user'::public.user_role);
END;
$$;

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
    CASE WHEN NEW.email = 'admin@sca.com'
      THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN NEW.email = 'admin@sca.com'
      THEN 'admin'::public.user_role
      ELSE profiles.role
    END;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mettre à jour profil admin si l'utilisateur existe déjà
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sca.com' LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (admin_uid, 'admin@sca.com', 'admin'::public.user_role)
    ON CONFLICT (id) DO UPDATE SET role = 'admin'::public.user_role, email = EXCLUDED.email;
  END IF;
END $$;

-- ── 5. Politiques RLS (Sécurité) ──────────────────────────────

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Categories
DROP POLICY IF EXISTS "anon_read_categories" ON public.categories;
CREATE POLICY "anon_read_categories" ON public.categories FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_categories" ON public.categories;
CREATE POLICY "auth_read_categories" ON public.categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_categories" ON public.categories;
CREATE POLICY "admin_write_categories" ON public.categories FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Products
DROP POLICY IF EXISTS "anon_read_products" ON public.products;
CREATE POLICY "anon_read_products" ON public.products FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_products" ON public.products;
CREATE POLICY "auth_read_products" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_products" ON public.products;
CREATE POLICY "admin_write_products" ON public.products FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Product Images
DROP POLICY IF EXISTS "anon_read_product_images" ON public.product_images;
CREATE POLICY "anon_read_product_images" ON public.product_images FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_read_product_images" ON public.product_images;
CREATE POLICY "auth_read_product_images" ON public.product_images FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_write_product_images" ON public.product_images;
CREATE POLICY "admin_write_product_images" ON public.product_images FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- Clients
DROP POLICY IF EXISTS "anon_insert_clients" ON public.clients;
CREATE POLICY "anon_insert_clients" ON public.clients FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_select_clients" ON public.clients;
CREATE POLICY "anon_select_clients" ON public.clients FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_all_clients" ON public.clients;
CREATE POLICY "auth_all_clients" ON public.clients FOR ALL TO authenticated USING (true);

-- Orders
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
CREATE POLICY "anon_insert_orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;
CREATE POLICY "anon_select_orders" ON public.orders FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_all_orders" ON public.orders;
CREATE POLICY "auth_all_orders" ON public.orders FOR ALL TO authenticated USING (true);

-- Order Items
DROP POLICY IF EXISTS "anon_insert_order_items" ON public.order_items;
CREATE POLICY "anon_insert_order_items" ON public.order_items FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_select_order_items" ON public.order_items;
CREATE POLICY "anon_select_order_items" ON public.order_items FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_all_order_items" ON public.order_items;
CREATE POLICY "auth_all_order_items" ON public.order_items FOR ALL TO authenticated USING (true);

-- Invoices
DROP POLICY IF EXISTS "anon_read_invoices" ON public.invoices;
CREATE POLICY "anon_read_invoices" ON public.invoices FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_all_invoices" ON public.invoices;
CREATE POLICY "auth_all_invoices" ON public.invoices FOR ALL TO authenticated USING (true);

-- Quotes
DROP POLICY IF EXISTS "anon_insert_quotes" ON public.quotes;
CREATE POLICY "anon_insert_quotes" ON public.quotes FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_select_quotes" ON public.quotes;
CREATE POLICY "anon_select_quotes" ON public.quotes FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "auth_all_quotes" ON public.quotes;
CREATE POLICY "auth_all_quotes" ON public.quotes FOR ALL TO authenticated USING (true);

-- Study requests & Reviews
DROP POLICY IF EXISTS "anon_insert_study" ON public.study_requests;
CREATE POLICY "anon_insert_study" ON public.study_requests FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "auth_all_study" ON public.study_requests;
CREATE POLICY "auth_all_study" ON public.study_requests FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_read_reviews" ON public.reviews;
CREATE POLICY "anon_read_reviews" ON public.reviews FOR SELECT TO anon USING (is_published = true);
DROP POLICY IF EXISTS "auth_all_reviews" ON public.reviews;
CREATE POLICY "auth_all_reviews" ON public.reviews FOR ALL TO authenticated USING (true);

-- ── 6. Données de départ (Catégories & Produits & Avis) ─────────
INSERT INTO public.categories (id, name, slug, type, icon, sort_order) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Câbles', 'cables', 'electricite', 'cable', 1),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteurs', 'disjoncteurs', 'electricite', 'zap', 2),
  ('11111111-0001-0001-0001-000000000003', 'Interrupteurs & Prises', 'interrupteurs-prises', 'electricite', 'toggle-left', 3),
  ('11111111-0001-0001-0001-000000000004', 'Ampoules', 'ampoules', 'electricite', 'lightbulb', 4),
  ('11111111-0001-0001-0001-000000000005', 'Tableaux Électriques', 'tableaux', 'electricite', 'grid', 5),
  ('11111111-0001-0001-0001-000000000006', 'Contacteurs & Relais', 'contacteurs-relais', 'electricite', 'cpu', 6),
  ('11111111-0001-0001-0001-000000000007', 'Gaines & Connecteurs', 'gaines-connecteurs', 'electricite', 'plug', 7),
  ('11111111-0002-0002-0002-000000000001', 'Panneaux Solaires', 'panneaux-solaires', 'solaire', 'sun', 1),
  ('11111111-0002-0002-0002-000000000002', 'Batteries', 'batteries', 'solaire', 'battery', 2),
  ('11111111-0002-0002-0002-000000000003', 'Onduleurs', 'onduleurs', 'solaire', 'activity', 3),
  ('11111111-0002-0002-0002-000000000004', 'MPPT & Régulateurs', 'mppt', 'solaire', 'sliders', 4),
  ('11111111-0002-0002-0002-000000000005', 'Câbles & Protections Solaires', 'cables-solaires', 'solaire', 'shield', 5),
  ('11111111-0002-0002-0002-000000000006', 'Connecteurs MC4 & Structures', 'mc4-structures', 'solaire', 'tool', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (category_id, name, description, reference, price, stock_quantity, stock_threshold, image_url) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Câble électrique 2.5mm² (bobine 100m)', 'Câble cuivre souple 2.5mm², idéal pour installations domestiques et industrielles', 'SCA-CAB25', 45.00, 85, 10, '/uploads/products/cable-electrique.jpg'),
  ('11111111-0001-0001-0001-000000000001', 'Câble électrique 6mm² (bobine 50m)', 'Câble cuivre rigide 6mm², pour circuits puissants et tableaux', 'SCA-CAB06', 38.00, 60, 8, '/uploads/products/cable-rigide.jpg'),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 16A unipolaire', 'Protection contre surcharges et courts-circuits, 16A, calibre DIN', 'SCA-DIS16', 3.50, 120, 15, '/uploads/products/disjoncteur.jpg'),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 20A unipolaire', 'Protection haute gamme, 20A, compatible tableau standard', 'SCA-DIS20', 4.00, 95, 15, '/uploads/products/disjoncteur.jpg'),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 32A bipolaire', 'Protection bipolaire 32A, pour circuits spéciaux', 'SCA-DIS32', 7.50, 45, 8, '/uploads/products/disjoncteur.jpg'),
  ('11111111-0001-0001-0001-000000000003', 'Interrupteur simple blanc', 'Interrupteur va-et-vient, finition blanche, encastrable', 'SCA-INT01', 1.80, 200, 20, '/uploads/products/interrupteur-prise.jpg'),
  ('11111111-0001-0001-0001-000000000003', 'Prise 2P+T 16A', 'Prise de courant avec terre, 16A, norme locale', 'SCA-PRI01', 2.20, 180, 20, '/uploads/products/interrupteur-prise.jpg'),
  ('11111111-0001-0001-0001-000000000004', 'Ampoule LED 9W E27 blanc froid', 'Ampoule LED économique 9W, équivalent 60W incandescent', 'SCA-AMP09', 2.50, 0, 10, '/uploads/products/ampoule-led.jpg'),
  ('11111111-0001-0001-0001-000000000004', 'Ampoule LED 18W E27 blanc chaud', 'Haute luminosité, durée de vie 25000h', 'SCA-AMP18', 3.80, 3, 5, '/uploads/products/ampoule-led.jpg'),
  ('11111111-0001-0001-0001-000000000005', 'Tableau électrique 12 modules', 'Coffret de distribution 12 modules, encastrable', 'SCA-TAB12', 18.00, 30, 5, '/uploads/products/tableau-electrique.jpg'),
  ('11111111-0001-0001-0001-000000000005', 'Tableau électrique 24 modules', 'Coffret de distribution 24 modules, saillie ou encastré', 'SCA-TAB24', 28.00, 20, 3, '/uploads/products/tableau-electrique.jpg'),
  ('11111111-0002-0002-0002-000000000001', 'Panneau solaire monocristallin 250W', 'Rendement élevé 21%, idéal pour systèmes résidentiels', 'SCA-PAN250', 120.00, 40, 5, '/uploads/products/panneau-solaire.jpg'),
  ('11111111-0002-0002-0002-000000000001', 'Panneau solaire polycristallin 400W', 'Grande puissance 400W, pour installations industrielles', 'SCA-PAN400', 185.00, 25, 3, '/uploads/products/panneau-solaire.jpg'),
  ('11111111-0002-0002-0002-000000000002', 'Batterie AGM 100Ah 12V', 'Batterie sans entretien, décharge profonde, cycle long', 'SCA-BAT100', 95.00, 15, 3, '/uploads/products/batterie-agm.jpg'),
  ('11111111-0002-0002-0002-000000000002', 'Batterie AGM 200Ah 12V', 'Haute capacité pour autonomie maximale', 'SCA-BAT200', 175.00, 8, 2, '/uploads/products/batterie-agm.jpg'),
  ('11111111-0002-0002-0002-000000000003', 'Onduleur solaire 1000W 12V/220V', 'Onduleur pur sinus 1000W, efficacité 95%', 'SCA-OND1K', 85.00, 12, 2, '/uploads/products/onduleur-solaire.jpg'),
  ('11111111-0002-0002-0002-000000000003', 'Onduleur solaire 3000W 24V/220V', 'Onduleur puissant 3000W, avec chargeur intégré', 'SCA-OND3K', 210.00, 6, 2, '/uploads/products/onduleur-solaire.jpg')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO public.reviews (author_name, rating, comment, is_published) VALUES
  ('Jean-Pierre M.', 5, 'Très bon travail et intervention rapide. Je recommande SCA pour tout travail électrique.', true),
  ('Marie K.', 5, 'Installation solaire parfaite. L''équipe est professionnelle et les prix sont compétitifs.', true),
  ('Alphonse B.', 4, 'Bonne qualité du matériel et livraison dans les délais. Service client très réactif.', true),
  ('Esperance N.', 5, 'SCA a résolu notre problème électrique rapidement. Matériel de qualité, je suis très satisfait.', true),
  ('Prosper L.', 5, 'Installation d''un système solaire pour ma maison. Travail impeccable, équipe sérieuse.', true),
  ('Chantal M.', 4, 'Bon rapport qualité-prix. Les techniciens sont compétents et ponctuels.', true)
ON CONFLICT DO NOTHING;

-- ── 7. Storage Buckets ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-photos', 'quote-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "auth_all_product_images" ON storage.objects;
CREATE POLICY "auth_all_product_images" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_read_quote_photos" ON storage.objects;
CREATE POLICY "public_read_quote_photos" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'quote-photos');
DROP POLICY IF EXISTS "anon_upload_quote_photos" ON storage.objects;
CREATE POLICY "anon_upload_quote_photos" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'quote-photos');
DROP POLICY IF EXISTS "auth_all_quote_photos" ON storage.objects;
CREATE POLICY "auth_all_quote_photos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'quote-photos');

-- ── 8. Permissions d'accès aux rôles ──────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

