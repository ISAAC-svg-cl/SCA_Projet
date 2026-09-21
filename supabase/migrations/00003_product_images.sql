-- ============================================================
-- 00003_product_images.sql
-- Add promo_price and product_images table for multi-image support
-- ============================================================

-- 1. Add promo_price column to products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'promo_price'
  ) THEN
    ALTER TABLE public.products ADD COLUMN promo_price numeric(12,2) CHECK (promo_price >= 0);
  END IF;
END $$;

-- 2. Create product_images table
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index on product_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Policies for product_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'anon_read_product_images'
  ) THEN
    CREATE POLICY "anon_read_product_images" ON public.product_images FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'auth_read_product_images'
  ) THEN
    CREATE POLICY "auth_read_product_images" ON public.product_images FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'admin_write_product_images'
  ) THEN
    CREATE POLICY "admin_write_product_images" ON public.product_images
      FOR ALL TO authenticated USING (get_user_role(auth.uid()) = 'admin');
  END IF;
END $$;
