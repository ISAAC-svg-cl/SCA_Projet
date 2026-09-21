
-- ============================================================
-- SEED: Products with local images
-- ============================================================
INSERT INTO public.products (category_id, name, description, reference, price, stock_quantity, stock_threshold, image_url) VALUES
  -- Câbles
  ('11111111-0001-0001-0001-000000000001', 'Câble électrique 2.5mm² (bobine 100m)', 'Câble cuivre souple 2.5mm², idéal pour installations domestiques et industrielles', 'SCA-CAB25', 45.00, 85, 10, '/uploads/products/cable-electrique.jpg'),
  ('11111111-0001-0001-0001-000000000001', 'Câble électrique 6mm² (bobine 50m)', 'Câble cuivre rigide 6mm², pour circuits puissants et tableaux', 'SCA-CAB06', 38.00, 60, 8, '/uploads/products/cable-rigide.jpg'),
  -- Disjoncteurs
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 16A unipolaire', 'Protection contre surcharges et courts-circuits, 16A, calibre DIN', 'SCA-DIS16', 3.50, 120, 15, '/uploads/products/disjoncteur.jpg'),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 20A unipolaire', 'Protection haute gamme, 20A, compatible tableau standard', 'SCA-DIS20', 4.00, 95, 15, '/uploads/products/disjoncteur.jpg'),
  ('11111111-0001-0001-0001-000000000002', 'Disjoncteur 32A bipolaire', 'Protection bipolaire 32A, pour circuits spéciaux', 'SCA-DIS32', 7.50, 45, 8, '/uploads/products/disjoncteur.jpg'),
  -- Interrupteurs & Prises
  ('11111111-0001-0001-0001-000000000003', 'Interrupteur simple blanc', 'Interrupteur va-et-vient, finition blanche, encastrable', 'SCA-INT01', 1.80, 200, 20, '/uploads/products/interrupteur-prise.jpg'),
  ('11111111-0001-0001-0001-000000000003', 'Prise 2P+T 16A', 'Prise de courant avec terre, 16A, norme locale', 'SCA-PRI01', 2.20, 180, 20, '/uploads/products/interrupteur-prise.jpg'),
  -- Ampoules
  ('11111111-0001-0001-0001-000000000004', 'Ampoule LED 9W E27 blanc froid', 'Ampoule LED économique 9W, équivalent 60W incandescent', 'SCA-AMP09', 2.50, 0, 10, '/uploads/products/ampoule-led.jpg'),
  ('11111111-0001-0001-0001-000000000004', 'Ampoule LED 18W E27 blanc chaud', 'Haute luminosité, durée de vie 25000h', 'SCA-AMP18', 3.80, 3, 5, '/uploads/products/ampoule-led.jpg'),
  -- Tableaux électriques
  ('11111111-0001-0001-0001-000000000005', 'Tableau électrique 12 modules', 'Coffret de distribution 12 modules, encastrable', 'SCA-TAB12', 18.00, 30, 5, '/uploads/products/tableau-electrique.jpg'),
  ('11111111-0001-0001-0001-000000000005', 'Tableau électrique 24 modules', 'Coffret de distribution 24 modules, saillie ou encastré', 'SCA-TAB24', 28.00, 20, 3, '/uploads/products/tableau-electrique.jpg'),
  -- Panneaux solaires
  ('11111111-0002-0002-0002-000000000001', 'Panneau solaire monocristallin 250W', 'Rendement élevé 21%, idéal pour systèmes résidentiels', 'SCA-PAN250', 120.00, 40, 5, '/uploads/products/panneau-solaire.jpg'),
  ('11111111-0002-0002-0002-000000000001', 'Panneau solaire polycristallin 400W', 'Grande puissance 400W, pour installations industrielles', 'SCA-PAN400', 185.00, 25, 3, '/uploads/products/panneau-solaire.jpg'),
  -- Batteries
  ('11111111-0002-0002-0002-000000000002', 'Batterie AGM 100Ah 12V', 'Batterie sans entretien, décharge profonde, cycle long', 'SCA-BAT100', 95.00, 15, 3, '/uploads/products/batterie-agm.jpg'),
  ('11111111-0002-0002-0002-000000000002', 'Batterie AGM 200Ah 12V', 'Haute capacité pour autonomie maximale', 'SCA-BAT200', 175.00, 8, 2, '/uploads/products/batterie-agm.jpg'),
  -- Onduleurs
  ('11111111-0002-0002-0002-000000000003', 'Onduleur solaire 1000W 12V/220V', 'Onduleur pur sinus 1000W, efficacité 95%', 'SCA-OND1K', 85.00, 12, 2, '/uploads/products/onduleur-solaire.jpg'),
  ('11111111-0002-0002-0002-000000000003', 'Onduleur solaire 3000W 24V/220V', 'Onduleur puissant 3000W, avec chargeur intégré', 'SCA-OND3K', 210.00, 6, 2, '/uploads/products/onduleur-solaire.jpg');
