-- 00007_create_realizations.sql
-- Table pour les réalisations (travaux réalisés)
CREATE TABLE IF NOT EXISTS public.realizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  project_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ajouter les colonnes au cas où la table existait déjà
ALTER TABLE public.realizations ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.realizations ADD COLUMN IF NOT EXISTS project_date text;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_realizations_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_realizations_timestamp ON public.realizations;
CREATE TRIGGER trg_update_realizations_timestamp
BEFORE UPDATE ON public.realizations
FOR EACH ROW EXECUTE FUNCTION public.update_realizations_timestamp();

-- Enable Row Level Security
ALTER TABLE public.realizations ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'realizations' AND policyname = 'admin_all_realizations') THEN
    CREATE POLICY admin_all_realizations ON public.realizations
      FOR ALL TO authenticated
      USING (get_user_role(auth.uid()) = 'admin')
      WITH CHECK (get_user_role(auth.uid()) = 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'realizations' AND policyname = 'anon_read_realizations') THEN
    CREATE POLICY anon_read_realizations ON public.realizations
      FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'realizations' AND policyname = 'auth_read_realizations') THEN
    CREATE POLICY auth_read_realizations ON public.realizations
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
