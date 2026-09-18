// SCA types
export type UserRole = 'user' | 'admin';
export type StockStatus = 'en_stock' | 'stock_faible' | 'rupture';
export type OrderStatus = 'en_attente' | 'confirme' | 'en_preparation' | 'livre' | 'annule';
export type DeliveryMode = 'livraison' | 'retrait';
export type QuoteStatus = 'nouveau' | 'en_cours' | 'traite' | 'rejete';

export interface Profile {
  id: string; email: string | null; phone: string | null;
  full_name: string | null; role: UserRole; created_at: string;
}
export interface Category {
  id: string; name: string; slug: string; description: string | null;
  type: 'electricite' | 'solaire'; icon: string | null; sort_order: number; created_at: string;
}
export interface Product {
  id: string; category_id: string; name: string; description: string | null;
  reference: string; price: number; stock_quantity: number; stock_threshold: number;
  image_url: string | null; is_active: boolean; created_at: string; updated_at: string;
  categories?: Category;
}
export interface Client {
  id: string; full_name: string; phone: string; email: string | null;
  address: string | null; profile_id: string | null; created_at: string;
}
export interface Order {
  id: string; order_number: string; client_id: string; profile_id: string | null;
  status: OrderStatus; delivery_mode: DeliveryMode; delivery_address: string | null;
  subtotal: number; delivery_fee: number; total: number; notes: string | null;
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
export interface Quote {
  id: string; quote_number: string; full_name: string; phone: string; email: string | null;
  project_type: string; description: string; address: string | null;
  photo_urls: string[] | null; status: QuoteStatus; admin_notes: string | null;
  created_at: string; updated_at: string;
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
