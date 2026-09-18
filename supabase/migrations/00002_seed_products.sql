
-- ============================================================
-- SEED: Products with real images
-- ============================================================
INSERT INTO public.products (category_id, name, description, reference, price, stock_quantity, stock_threshold, image_url) VALUES
  -- Câbles
  ('11111111-0001-0001-0001-000000000001', 'Câble électrique 2.5mm² (bobine 100m)', 'Câble cuivre souple 2.5mm², idéal pour installations domestiques et industrielles', 'SCA-CAB25', 45.00, 85, 10, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3f201f5d-86f4-460c-92a1-b6423f49cf7c.jpg'),
  ('11111111-0001-0001-0001-000000000001', 'Câble électrique 6mm² (bobine 50m)', 'Câble cuivre rigide 6mm², pour circuits puissants et tableaux', 'SCA-CAB06', 38.00, 60, 8, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3f201f5d-86f4-460c-92a1-b6423f49cf7c.jpg'),
  -- Disjoncteurs
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 16A unipolaire', 'Protection contre surcharges et courts-circuits, 16A, calibre DIN', 'SCA-DIS16', 3.50, 120, 15, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_adc695de-f9e9-44ec-a8c2-d8fd0d65f536.jpg'),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 20A unipolaire', 'Protection haute gamme, 20A, compatible tableau standard', 'SCA-DIS20', 4.00, 95, 15, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_adc695de-f9e9-44ec-a8c2-d8fd0d65f536.jpg'),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 32A bipolaire', 'Protection bipolaire 32A, pour circuits spéciaux', 'SCA-DIS32', 7.50, 45, 8, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_adc695de-f9e9-44ec-a8c2-d8fd0d65f536.jpg'),
  -- Interrupteurs & Prises
  ('11111111-0001-0001-0001-000000000003', 'Interrupteur simple blanc', 'Interrupteur va-et-vient, finition blanche, encastrable', 'SCA-INT01', 1.80, 200, 20, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_10f4d596-6c40-41a5-946a-1f147d0421ab.jpg'),
  ('11111111-0001-0001-0001-000000000003', 'Prise 2P+T 16A', 'Prise de courant avec terre, 16A, norme locale', 'SCA-PRI01', 2.20, 180, 20, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_10f4d596-6c40-41a5-946a-1f147d0421ab.jpg'),
  -- Ampoules
  ('11111111-0001-0001-0001-000000000004', 'Ampoule LED 9W E27 blanc froid', 'Ampoule LED économique 9W, équivalent 60W incandescent', 'SCA-AMP09', 2.50, 0, 10, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1f9c4461-85af-48c2-806a-949feb082564.jpg'),
  ('11111111-0001-0001-0001-000000000004', 'Ampoule LED 18W E27 blanc chaud', 'Haute luminosité, durée de vie 25000h', 'SCA-AMP18', 3.80, 3, 5, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_1f9c4461-85af-48c2-806a-949feb082564.jpg'),
  -- Tableaux électriques
  ('11111111-0001-0001-0001-000000000005', 'Tableau électrique 12 modules', 'Coffret de distribution 12 modules, encastrable', 'SCA-TAB12', 18.00, 30, 5, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3fec27ed-686b-48a1-b675-235adbaabef4.jpg'),
  ('11111111-0001-0001-0001-000000000005', 'Tableau électrique 24 modules', 'Coffret de distribution 24 modules, saillie ou encastré', 'SCA-TAB24', 28.00, 20, 3, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3fec27ed-686b-48a1-b675-235adbaabef4.jpg'),
  -- Panneaux solaires
  ('11111111-0002-0002-0002-000000000001', 'Panneau solaire monocristallin 250W', 'Rendement élevé 21%, idéal pour systèmes résidentiels', 'SCA-PAN250', 120.00, 40, 5, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f563ce34-d175-4cbd-bbb9-e2a8360f3828.jpg'),
  ('11111111-0002-0002-0002-000000000001', 'Panneau solaire polycristallin 400W', 'Grande puissance 400W, pour installations industrielles', 'SCA-PAN400', 185.00, 25, 3, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f563ce34-d175-4cbd-bbb9-e2a8360f3828.jpg'),
  -- Batteries
  ('11111111-0002-0002-0002-000000000002', 'Batterie AGM 100Ah 12V', 'Batterie sans entretien, décharge profonde, cycle long', 'SCA-BAT100', 95.00, 15, 3, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_94de03ee-0227-4fd9-98e2-0f984d3324a2.jpg'),
  ('11111111-0002-0002-0002-000000000002', 'Batterie AGM 200Ah 12V', 'Haute capacité pour autonomie maximale', 'SCA-BAT200', 175.00, 8, 2, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_94de03ee-0227-4fd9-98e2-0f984d3324a2.jpg'),
  -- Onduleurs
  ('11111111-0002-0002-0002-000000000003', 'Onduleur solaire 1000W 12V/220V', 'Onduleur pur sinus 1000W, efficacité 95%', 'SCA-OND1K', 85.00, 12, 2, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_09c8ae23-0529-4e86-aae6-7473f091f2eb.jpg'),
  ('11111111-0002-0002-0002-000000000003', 'Onduleur solaire 3000W 24V/220V', 'Onduleur puissant 3000W, avec chargeur intégré', 'SCA-OND3K', 210.00, 6, 2, 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_09c8ae23-0529-4e86-aae6-7473f091f2eb.jpg');
