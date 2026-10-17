// SCA types
export type UserRole = 'user' | 'admin';
export type StockStatus = 'en_stock' | 'stock_faible' | 'rupture';
export type OrderStatus = 'en_attente' | 'confirme' | 'en_preparation' | 'livre' | 'annule';
export type DeliveryMode = 'livraison' | 'retrait';
export type QuoteStatus =
  | 'brouillon'
  | 'envoye'
  | 'accepte'
  | 'refuse'
  | 'expire'
  | 'nouveau'
  | 'en_cours'
  | 'traite'
  | 'rejete';
export type PaymentMethod = 'airtel_money' | 'orange_money' | 'cash';

export interface Profile {
  id: string; email: string | null; phone: string | null;
  full_name: string | null; role: UserRole; created_at: string;
}
export interface Category {
  id: string; name: string; slug: string; description: string | null;
  type: 'electricite' | 'solaire'; icon: string | null; sort_order: number; created_at: string;
}
export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Realization {
  id: string;
  title: string;
  description: string | null;
  location?: string | null;
  project_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RealizationMedia {
  id: string;
  realization_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  alt_text?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  reference: string;
  price: number;
  promo_price?: number | null;
  stock_quantity: number;
  stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category;
  images?: ProductImage[];
}
export interface Client {
  id: string; full_name: string; phone: string; email: string | null;
  address: string | null; profile_id: string | null; created_at: string;
}
export interface Order {
  id: string; order_number: string; client_id: string; profile_id: string | null;
  status: OrderStatus; delivery_mode: DeliveryMode; delivery_address: string | null;
  subtotal: number; delivery_fee: number; total: number; notes: string | null;
  payment_method?: PaymentMethod | null;
  payment_reference?: string | null;
  created_at: string; updated_at: string;
  clients?: Client; order_items?: OrderItem[];
}
export interface OrderItem {
  id: string; order_id: string; product_id: string; product_name: string;
  product_reference: string; unit_price: number; quantity: number; total: number; created_at: string;
  products?: Product;
}
export interface Invoice {
  id: string; invoice_number: string; order_id: string; client_id: string;
  total: number; issued_at: string; created_at: string;
  orders?: Order; clients?: Client;
}
export interface QuoteItem {
  id?: string;
  reference?: string;
  designation: string;
  description?: string;
  unit?: string; // pcs, m, rouleau, forfait, jour, etc.
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: string;
  quote_number: string;
  full_name: string;
  phone: string;
  email: string | null;
  project_type: string;
  description: string;
  address: string | null;
  work_location?: string | null; // Lieu spécifique des travaux
  currency?: 'USD' | 'CDF';
  items?: QuoteItem[];
  subtotal?: number;
  discount?: number;
  discount_type?: 'percent' | 'fixed';
  transport_fee?: number;
  total_amount?: number;
  payment_terms?: string | null;
  execution_delay?: string | null;
  validity_days?: number;
  observations?: string | null;
  responsible_name?: string; // Ingénieur Juniace Atanaz
  converted_order_id?: string | null;
  photo_urls: string[] | null;
  status: QuoteStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface StudyRequest {
  id: string; full_name: string; phone: string; email: string | null;
  need_description: string; status: string; created_at: string;
}
export interface Review {
  id: string; author_name: string; rating: number; comment: string;
  is_published: boolean; created_at: string;
}
export interface CartItem { product: Product; quantity: number; }
