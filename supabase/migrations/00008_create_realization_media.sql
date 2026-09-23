-- 00008_create_realization_media.sql
-- Table pour les médias (images ou vidéos) liés aux réalisations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
    CREATE TYPE public.media_type AS ENUM ('image', 'video');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.realization_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realization_id uuid NOT NULL REFERENCES public.realizations(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type public.media_type NOT NULL,
  alt_text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour retrouver les médias d'une réalisation
CREATE INDEX IF NOT EXISTS idx_realization_media_realization_id ON public.realization_media(realization_id);

-- Enable Row Level Security
ALTER TABLE public.realization_media ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'realization_media' AND policyname = 'admin_all_realization_media') THEN
    CREATE POLICY admin_all_realization_media ON public.realization_media
      FOR ALL TO authenticated
      USING (get_user_role(auth.uid()) = 'admin')
      WITH CHECK (get_user_role(auth.uid()) = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'realization_media' AND policyname = 'anon_read_realization_media') THEN
    CREATE POLICY anon_read_realization_media ON public.realization_media
      FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'realization_media' AND policyname = 'auth_read_realization_media') THEN
    CREATE POLICY auth_read_realization_media ON public.realization_media
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
