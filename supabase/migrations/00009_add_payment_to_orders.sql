-- 00009_add_payment_to_orders.sql
-- Ajout des champs pour le suivi du paiement Mobile Money (Airtel Money, Orange Money) et Cash
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_reference text;
