
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.stock_status AS ENUM ('en_stock', 'stock_faible', 'rupture');
CREATE TYPE public.order_status AS ENUM ('en_attente', 'confirme', 'en_preparation', 'livre', 'annule');
CREATE TYPE public.delivery_mode AS ENUM ('livraison', 'retrait');
CREATE TYPE public.quote_status AS ENUM ('nouveau', 'en_cours', 'traite', 'rejete');

-- ============================================================
-- PROFILES (Auth sync)
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
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

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  reference text UNIQUE NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  stock_quantity int NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  stock_threshold int NOT NULL DEFAULT 5,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Computed stock status
CREATE OR REPLACE FUNCTION public.get_stock_status(qty int, threshold int)
RETURNS public.stock_status
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN qty = 0 THEN 'rupture'::public.stock_status
    WHEN qty <= threshold THEN 'stock_faible'::public.stock_status
    ELSE 'en_stock'::public.stock_status
  END;
$$;

-- ============================================================
-- CLIENTS (non-auth orders)
-- ============================================================
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
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

-- Auto-generate order number
CREATE SEQUENCE public.order_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.order_number := 'CMD-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('public.order_seq')::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
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

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id uuid UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  total numeric(12,2) NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE public.invoice_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.invoice_number := 'FAC-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('public.invoice_seq')::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION public.generate_invoice_number();

-- ============================================================
-- QUOTES (Devis)
-- ============================================================
CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  project_type text NOT NULL,
  description text NOT NULL,
  address text,
  photo_urls text[],
  status public.quote_status NOT NULL DEFAULT 'nouveau',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE public.quote_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.quote_number := 'DEV-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('public.quote_seq')::text, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_quote_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW WHEN (NEW.quote_number IS NULL OR NEW.quote_number = '')
  EXECUTE FUNCTION public.generate_quote_number();

-- ============================================================
-- STUDY REQUESTS (Conseil/Étude)
-- ============================================================
CREATE TABLE public.study_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  need_description text NOT NULL,
  status text NOT NULL DEFAULT 'nouveau',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REVIEWS (Avis clients)
-- ============================================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRIGGER: Auth → Profiles sync
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (NEW.id, NEW.email, NEW.phone, 'user'::public.user_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: Decrement stock on order confirmed
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirme' AND OLD.status != 'confirme' THEN
    UPDATE public.products p
    SET stock_quantity = GREATEST(0, p.stock_quantity - oi.quantity),
        updated_at = now()
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order();

-- ============================================================
-- TRIGGER: Auto-create invoice when order is confirmed
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_invoice_on_confirm()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirme' AND OLD.status != 'confirme' THEN
    INSERT INTO public.invoices (order_id, client_id, total)
    VALUES (NEW.id, NEW.client_id, NEW.total)
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_invoice
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.create_invoice_on_confirm();

-- ============================================================
-- RLS HELPER
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = uid;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- profiles
CREATE POLICY "admin_all_profiles" ON public.profiles
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "user_own_profile_select" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "user_own_profile_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

-- categories (public read, admin write)
CREATE POLICY "anon_read_categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_categories" ON public.categories
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- products (public read, admin write)
CREATE POLICY "anon_read_products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_write_products" ON public.products
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- clients (anon/auth can insert, admin reads all)
CREATE POLICY "anon_insert_clients" ON public.clients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_clients" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "auth_insert_clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_read_own_clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_clients" ON public.clients
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- orders (anon/auth can insert, admin manages all)
CREATE POLICY "anon_insert_orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_orders" ON public.orders FOR SELECT TO anon USING (true);
CREATE POLICY "auth_insert_orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_select_orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_orders" ON public.orders
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- order_items
CREATE POLICY "anon_insert_order_items" ON public.order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_order_items" ON public.order_items FOR SELECT TO anon USING (true);
CREATE POLICY "auth_insert_order_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_select_order_items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_order_items" ON public.order_items
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- invoices
CREATE POLICY "anon_read_invoices" ON public.invoices FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read_invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_invoices" ON public.invoices
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- quotes (anyone can submit, admin manages)
CREATE POLICY "anon_insert_quotes" ON public.quotes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_quotes" ON public.quotes FOR SELECT TO anon USING (true);
CREATE POLICY "auth_insert_quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_select_quotes" ON public.quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_quotes" ON public.quotes
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- study_requests
CREATE POLICY "anon_insert_study" ON public.study_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_study" ON public.study_requests FOR SELECT TO anon USING (true);
CREATE POLICY "auth_insert_study" ON public.study_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_select_study" ON public.study_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_study" ON public.study_requests
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- reviews (public read, admin manages)
CREATE POLICY "anon_read_reviews" ON public.reviews FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "auth_read_reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_all_reviews" ON public.reviews
  FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================
-- STORAGE BUCKET for product images & quote photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('quote-photos', 'quote-photos', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "public_read_product_images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'product-images');
CREATE POLICY "admin_write_product_images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND get_user_role(auth.uid()) = 'admin');
CREATE POLICY "admin_delete_product_images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND get_user_role(auth.uid()) = 'admin');
CREATE POLICY "anon_upload_quote_photos" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'quote-photos');
CREATE POLICY "auth_upload_quote_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'quote-photos');
CREATE POLICY "public_read_quote_photos" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'quote-photos');

-- ============================================================
-- SEED: Categories
-- ============================================================
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
  ('11111111-0002-0002-0002-000000000006', 'Connecteurs MC4 & Structures', 'mc4-structures', 'solaire', 'tool', 6);

-- ============================================================
-- SEED: Reviews
-- ============================================================
INSERT INTO public.reviews (author_name, rating, comment, is_published) VALUES
  ('Jean-Pierre M.', 5, 'Très bon travail et intervention rapide. Je recommande SCA pour tout travail électrique.', true),
  ('Marie K.', 5, 'Installation solaire parfaite. L''équipe est professionnelle et les prix sont compétitifs.', true),
  ('Alphonse B.', 4, 'Bonne qualité du matériel et livraison dans les délais. Service client très réactif.', true),
  ('Esperance N.', 5, 'SCA a résolu notre problème électrique rapidement. Matériel de qualité, je suis très satisfait.', true),
  ('Prosper L.', 5, 'Installation d''un système solaire pour ma maison. Travail impeccable, équipe sérieuse.', true),
  ('Chantal M.', 4, 'Bon rapport qualité-prix. Les techniciens sont compétents et ponctuels.', true);
