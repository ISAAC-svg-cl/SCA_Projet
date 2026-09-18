import { supabase } from '@/db/supabase';
import type {
  Category, Product, Order, OrderItem, Client, Quote,
  StudyRequest, Review, Invoice, QuoteStatus
} from '@/types/index';

// ── Categories ──────────────────────────────────────────────
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true })
    .limit(100);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ── Products ─────────────────────────────────────────────────
export async function fetchProducts(opts?: {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  let q = supabase
    .from('products')
    .select('*, categories!category_id(*)')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(opts?.limit ?? 60);

  if (opts?.categoryId) q = q.eq('category_id', opts.categoryId);
  if (opts?.search) q = q.ilike('name', `%${opts.search}%`);
  if (opts?.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 60) - 1);

  const { data, error } = await q;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories!category_id(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ── Admin: all products ───────────────────────────────────────
export async function fetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories!category_id(*)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function upsertProduct(product: Partial<Product> & { category_id: string; name: string; reference: string; price: number }): Promise<void> {
  const payload = { ...product, updated_at: new Date().toISOString() };
  const { error } = product.id
    ? await supabase.from('products').update(payload).eq('id', product.id)
    : await supabase.from('products').insert(payload);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ── Orders ───────────────────────────────────────────────────
export async function createOrder(
  client: Omit<Client, 'id' | 'created_at' | 'profile_id'>,
  items: Array<{ product_id: string; product_name: string; product_reference: string; unit_price: number; quantity: number; total: number }>,
  orderMeta: { delivery_mode: 'livraison' | 'retrait'; delivery_address?: string; subtotal: number; delivery_fee: number; total: number; notes?: string }
): Promise<{ orderId: string; orderNumber: string }> {
  // 1. Create client
  const { data: clientData, error: clientErr } = await supabase
    .from('clients')
    .insert({ full_name: client.full_name, phone: client.phone, email: client.email || null, address: client.address || null })
    .select('id')
    .maybeSingle();
  if (clientErr) throw clientErr;
  const clientId = clientData!.id;

  // 2. Create order
  const { data: orderData, error: orderErr } = await supabase
    .from('orders')
    .insert({
      client_id: clientId,
      delivery_mode: orderMeta.delivery_mode,
      delivery_address: orderMeta.delivery_address || null,
      subtotal: orderMeta.subtotal,
      delivery_fee: orderMeta.delivery_fee,
      total: orderMeta.total,
      notes: orderMeta.notes || null,
      order_number: '',
    })
    .select('id, order_number')
    .maybeSingle();
  if (orderErr) throw orderErr;
  const orderId = orderData!.id;
  const orderNumber = orderData!.order_number;

  // 3. Create order items
  const orderItems = items.map((i) => ({ ...i, order_id: orderId }));
  const { error: itemErr } = await supabase.from('order_items').insert(orderItems);
  if (itemErr) throw itemErr;

  // 4. Confirm order (triggers stock decrement + invoice creation)
  const { error: confirmErr } = await supabase
    .from('orders')
    .update({ status: 'confirme' })
    .eq('id', orderId);
  if (confirmErr) throw confirmErr;

  return { orderId, orderNumber };
}

export async function fetchOrders(limit = 50, offset = 0): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, clients!client_id(*), order_items(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ── Invoices ─────────────────────────────────────────────────
export async function fetchInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, orders!order_id(*, clients!client_id(*), order_items(*))')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchInvoices(limit = 50, offset = 0): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients!client_id(*), orders!order_id(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ── Quotes ───────────────────────────────────────────────────
export async function submitQuote(quote: Omit<Quote, 'id' | 'quote_number' | 'status' | 'admin_notes' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase.from('quotes').insert({ ...quote, quote_number: '' });
  if (error) throw error;
}

export async function fetchQuotes(limit = 50, offset = 0): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updateQuoteStatus(id: string, status: QuoteStatus, admin_notes?: string): Promise<void> {
  const { error } = await supabase
    .from('quotes')
    .update({ status, admin_notes: admin_notes || null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ── Study Requests ────────────────────────────────────────────
export async function submitStudyRequest(req: Omit<StudyRequest, 'id' | 'status' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('study_requests').insert(req);
  if (error) throw error;
}

export async function fetchStudyRequests(limit = 50): Promise<StudyRequest[]> {
  const { data, error } = await supabase
    .from('study_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ── Reviews ───────────────────────────────────────────────────
export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ── Clients ───────────────────────────────────────────────────
export async function fetchClients(limit = 50, offset = 0): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ── Dashboard Stats ───────────────────────────────────────────
export async function fetchDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);
  const [ordersToday, totalOrders, pendingQuotes, clients, products] = await Promise.all([
    supabase.from('orders').select('total', { count: 'exact' }).gte('created_at', today).eq('status', 'confirme'),
    supabase.from('orders').select('id', { count: 'exact' }),
    supabase.from('quotes').select('id', { count: 'exact' }).eq('status', 'nouveau'),
    supabase.from('clients').select('id', { count: 'exact' }),
    supabase.from('products').select('id, stock_quantity, stock_threshold', { count: 'exact' }),
  ]);

  const todaySales = (ordersToday.data || []).reduce((s: number, o: { total: number }) => s + (o.total || 0), 0);
  const prods = Array.isArray(products.data) ? products.data : [];
  const enStock = prods.filter((p) => p.stock_quantity > p.stock_threshold).length;
  const stockFaible = prods.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.stock_threshold).length;
  const rupture = prods.filter((p) => p.stock_quantity === 0).length;

  return {
    todaySales,
    totalOrders: totalOrders.count || 0,
    pendingQuotes: pendingQuotes.count || 0,
    totalClients: clients.count || 0,
    totalProducts: products.count || 0,
    enStock,
    stockFaible,
    rupture,
  };
}
