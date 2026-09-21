-- ============================================================
-- Migration 00005 : Correction définitive RLS Admin
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Mettre à jour le profil admin@sca.com ─────────────────
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  -- Chercher par email dans auth.users
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'admin@sca.com' LIMIT 1;

  IF admin_uid IS NOT NULL THEN
    -- Mettre à jour ou créer le profil
    INSERT INTO public.profiles (id, email, role)
    VALUES (admin_uid, 'admin@sca.com', 'admin'::public.user_role)
    ON CONFLICT (id) DO UPDATE
      SET role = 'admin'::public.user_role,
          email = EXCLUDED.email;

    RAISE NOTICE 'Profil admin mis à jour pour uid: %', admin_uid;
  ELSE
    RAISE WARNING 'Utilisateur admin@sca.com introuvable dans auth.users';
  END IF;
END;
$$;

-- ── 2. Remplacer get_user_role pour vérifier AUSSI par email ──
-- Cette version vérifie d'abord si l'email est admin@sca.com
-- sans dépendre uniquement de profiles.role (contournement sûr)
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  u_email text;
  u_role  public.user_role;
BEGIN
  -- Vérifier l'email depuis auth.users (plus fiable que profiles)
  SELECT email INTO u_email FROM auth.users WHERE id = uid;

  IF u_email = 'admin@sca.com' THEN
    RETURN 'admin'::public.user_role;
  END IF;

  -- Fallback: lire depuis profiles
  SELECT role INTO u_role FROM public.profiles WHERE id = uid;
  RETURN COALESCE(u_role, 'user'::public.user_role);
END;
$$;

-- ── 3. Recréer les politiques products pour l'admin ───────────
DROP POLICY IF EXISTS "admin_write_products" ON public.products;
CREATE POLICY "admin_write_products" ON public.products
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ── 4. Recréer la politique product_images pour l'admin ───────
DROP POLICY IF EXISTS "admin_write_product_images" ON public.product_images;
CREATE POLICY "admin_write_product_images" ON public.product_images
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ── 5. Recréer la politique categories pour l'admin ──────────
DROP POLICY IF EXISTS "admin_write_categories" ON public.categories;
CREATE POLICY "admin_write_categories" ON public.categories
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ── 6. S'assurer que le trigger sync admin lors de reconnexion ─
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

-- ── 7. Vérification finale ────────────────────────────────────
-- (Décommenter pour vérifier après exécution)
-- SELECT u.email, p.role
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- WHERE u.email = 'admin@sca.com';
