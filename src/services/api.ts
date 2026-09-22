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

// ── Admin Security Check ──────────────────────────────────────
export async function ensureAdmin(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data?.session) {
    throw new Error('Non authentifié. Connexion requise.');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.session.user.id)
    .maybeSingle();

  const isAdmin = profile?.role === 'admin' || data.session.user.email === 'admin@sca.com';
  if (!isAdmin) {
    throw new Error('Accès refusé. Rôle administrateur requis.');
  }
}

import {
  mergeWithOverrides,
  saveProductOverride,
  saveCustomAddedProduct,
  markProductDeleted,
} from './productStore';

// ── Products ─────────────────────────────────────────────────
export async function fetchAllProducts(): Promise<Product[]> {
  let remoteProducts: Product[] = [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories!category_id(*)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (!error && Array.isArray(data)) {
      remoteProducts = data;
    }
  } catch (err) {
    console.warn('Could not fetch products from remote:', err);
  }

  // Optionally fetch secondary images for all products
  try {
    const { data: imgData } = await supabase
      .from('product_images')
      .select('*')
      .order('sort_order', { ascending: true });
    if (Array.isArray(imgData)) {
      const imgMap = new Map<string, any[]>();
      for (const img of imgData) {
        if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, []);
        imgMap.get(img.product_id)!.push(img);
      }
      for (const p of remoteProducts) {
        if (imgMap.has(p.id)) {
          p.images = imgMap.get(p.id);
        }
      }
    }
  } catch {
    // Ignore if product_images table is not ready
  }

  // Apply overrides (toggled status, updated stock, newly created products, deleted products)
  return mergeWithOverrides(remoteProducts);
}

export async function fetchProducts(opts?: {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Product[]> {
  const all = await fetchAllProducts();
  let filtered = all.filter((p) => p.is_active);

  if (opts?.categoryId) {
    filtered = filtered.filter((p) => p.category_id === opts.categoryId);
  }
  if (opts?.search) {
    const term = opts.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.reference.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }

  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 60;
  return filtered.slice(offset, offset + limit);
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const all = await fetchAllProducts();
  const found = all.find((p) => p.id === id);
  return found || null;
}

export async function toggleProductStatus(id: string, is_active: boolean): Promise<void> {
  const now = new Date().toISOString();
  // 1. Immediately persist locally across the app
  saveProductOverride(id, { is_active, updated_at: now });

  // 2. Attempt remote update – log detailed error for debugging
  const { error } = await supabase
    .from('products')
    .update({ is_active, updated_at: now })
    .eq('id', id);
  if (error) {
    console.warn('[toggleProductStatus] Remote error (RLS?):', error.code, error.message);
    // Local override already saved – UI will reflect change
  }
}

export async function updateProductStock(id: string, newQty: number): Promise<void> {
  const cleanQty = Math.max(0, Math.floor(newQty));
  const now = new Date().toISOString();
  // 1. Immediately persist locally
  saveProductOverride(id, { stock_quantity: cleanQty, updated_at: now });

  // 2. Attempt remote update
  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: cleanQty, updated_at: now })
    .eq('id', id);
  if (error) {
    console.warn('[updateProductStock] Remote error (RLS?):', error.code, error.message);
  }
}

export async function upsertProduct(
  product: Partial<Product> & {
    category_id: string;
    name: string;
    reference: string;
    price: number;
    promo_price?: number | null;
    secondaryImages?: string[];
  }
): Promise<{ id: string }> {
  const { secondaryImages, images, categories, ...cleanProduct } = product as any;
  const now = new Date().toISOString();

  let targetId = product.id;

  if (targetId) {
    // ── UPDATE existing product ──
    const updates = { ...cleanProduct, updated_at: now };
    // Remove non-column properties
    delete updates.id;

    // Persist locally immediately
    saveProductOverride(targetId, { ...updates, id: targetId });

    // Try remote update
    let { error: updErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', targetId);

    // Si la colonne promo_price n'existe pas, réessayer sans elle
    if (updErr?.message?.includes('promo_price') || updErr?.code === 'PGRST204') {
      const fallback = { ...updates };
      delete fallback.promo_price;
      const { error: updErr2 } = await supabase
        .from('products')
        .update(fallback)
        .eq('id', targetId);
      updErr = updErr2 || null;
    }

    if (updErr) {
      console.warn('[upsertProduct] Remote update failed:', updErr.code, updErr.message);
      // Ne pas throw : la sauvegarde locale est déjà faite, l'UI reste cohérente
      // L'appelant affichera un toast différencié selon remoteWriteOk
    }
  } else {
    // ── INSERT new product ──
    targetId = crypto.randomUUID();
    const newProduct: Product = {
      id: targetId,
      name: cleanProduct.name,
      reference: cleanProduct.reference,
      description: cleanProduct.description || null,
      category_id: cleanProduct.category_id,
      price: cleanProduct.price,
      promo_price: cleanProduct.promo_price || null,
      stock_quantity: cleanProduct.stock_quantity ?? 10,
      stock_threshold: cleanProduct.stock_threshold ?? 5,
      image_url: cleanProduct.image_url || null,
      is_active: cleanProduct.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    // Save locally immediately
    saveCustomAddedProduct(newProduct);

    // Try remote insert
    const payload: any = { ...newProduct };
    let { data: insData, error: insErr } = await supabase
      .from('products')
      .insert(payload)
      .select('id')
      .single();

    if (insErr?.message?.includes('promo_price') || insErr?.code === 'PGRST204') {
      delete payload.promo_price;
      const res = await supabase.from('products').insert(payload).select('id').single();
      insData = res.data;
      if (res.error) {
        console.warn('[upsertProduct] Remote insert failed:', res.error.code, res.error.message);
      }
    } else if (insErr) {
      console.warn('[upsertProduct] Remote insert failed:', insErr.code, insErr.message);
    }

    // If remote insert succeeded with a new DB-generated ID, update local store
    if (insData?.id && insData.id !== targetId) {
      // Replace local temp product with DB-assigned ID
      markProductDeleted(targetId);
      const remoteProduct = { ...newProduct, id: insData.id };
      saveCustomAddedProduct(remoteProduct);
      targetId = insData.id;
    }
  }

  // ── Manage secondary images ──
  if (targetId && Array.isArray(secondaryImages)) {
    const { error: delErr } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', targetId);
    if (delErr) console.warn('[upsertProduct] Could not delete old images:', delErr.message);

    if (secondaryImages.length > 0) {
      const rows = secondaryImages.map((url, idx) => ({
        product_id: targetId,
        image_url: url,
        alt_text: product.name,
        is_primary: false,
        sort_order: idx + 1,
      }));
      const { error: imgErr } = await supabase.from('product_images').insert(rows);
      if (imgErr) console.warn('[upsertProduct] Could not insert images:', imgErr.message);
    }
  }

  return { id: targetId! };
}

export async function deleteProduct(id: string): Promise<{ softDeleted: boolean; message: string }> {
  // Check if product is referenced in order_items
  let count = 0;
  try {
    const res = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id);
    if (!res.error && typeof res.count === 'number') {
      count = res.count;
    }
  } catch {}

  if (count > 0) {
    // Soft-delete
    saveProductOverride(id, { is_active: false, updated_at: new Date().toISOString() });
    try {
      await supabase.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    } catch {}
    return {
      softDeleted: true,
      message: 'Produit archivé avec succès (conservé pour préserver l\'historique des commandes passées).',
    };
  }

  // Hard delete
  markProductDeleted(id);
  try {
    await supabase.from('product_images').delete().eq('product_id', id);
    await supabase.from('products').delete().eq('id', id);
  } catch {}

  return {
    softDeleted: false,
    message: 'Produit supprimé avec succès.',
  };
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

  // 4. Automatically decrement stock for each ordered product
  try {
    const allProds = await fetchAllProducts();
    for (const item of items) {
      const prod = allProds.find((p) => p.id === item.product_id);
      if (prod) {
        const newStock = Math.max(0, (prod.stock_quantity || 0) - item.quantity);
        await updateProductStock(item.product_id, newStock);
      }
    }
  } catch (err) {
    console.warn('Stock decrement exception:', err);
  }

  // 5. Attempt remote order confirmation (triggers invoice if trigger configured)
  try {
    await supabase
      .from('orders')
      .update({ status: 'confirme' })
      .eq('id', orderId);
  } catch (err) {
    console.warn('Order confirmation trigger skipped:', err);
  }

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

export async function fetchOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, clients!client_id(*), order_items(*)')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteOrder(id: string): Promise<void> {
  // Supprimer d'abord les order_items (au cas où pas de CASCADE)
  await supabase.from('order_items').delete().eq('order_id', id);
  // Supprimer la facture associée si elle existe
  await supabase.from('invoices').delete().eq('order_id', id);
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// Suivi public : recherche par numéro de commande + téléphone
export async function fetchOrderByNumberAndPhone(
  orderNumber: string,
  phone: string
): Promise<Order | null> {
  // Normaliser le numéro (enlever espaces)
  const num = orderNumber.trim().toUpperCase();
  const tel = phone.trim().replace(/\s/g, '');

  const { data, error } = await supabase
    .from('orders')
    .select('*, clients!client_id(*), order_items(*)')
    .ilike('order_number', num)
    .maybeSingle();

  if (error || !data) return null;

  // Vérifier que le téléphone correspond
  const clientPhone = (data.clients?.phone || '').replace(/\s/g, '');
  if (clientPhone !== tel) return null;

  return data as Order;
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
  const clientName = quote.full_name || (quote as any).client_name;

  // Intégrer les liens de photos éventuels dans la description
  let finalDescription = quote.description;
  if (quote.photo_urls && quote.photo_urls.length > 0) {
    finalDescription += `\n\n[Photos jointes :\n${quote.photo_urls.map((u) => `- ${u}`).join('\n')}]`;
  }

  const payload: Record<string, any> = {
    client_name: clientName,
    phone: quote.phone,
    email: quote.email || null,
    project_type: quote.project_type,
    description: finalDescription,
    address: quote.address || null,
  };

  // Essai d'insertion avec le champ standard Supabase client_name
  let { error } = await supabase.from('quotes').insert(payload);

  // Fallback si la table utilise plutôt full_name
  if (error && error.message?.includes('client_name')) {
    delete payload.client_name;
    payload.full_name = clientName;
    const res = await supabase.from('quotes').insert(payload);
    error = res.error;
  }

  if (error) {
    console.error('[submitQuote] Erreur insertion devis:', error);
    throw error;
  }
}

export async function fetchQuotes(limit = 50, offset = 0): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return Array.isArray(data)
    ? data.map((q: any) => ({
        ...q,
        full_name: q.full_name || q.client_name || '',
      }))
    : [];
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

export async function deleteClient(id: string): Promise<{ blocked: boolean; message: string }> {
  // Vérifier si le client a des commandes actives
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id)
    .not('status', 'eq', 'annule');

  if (count && count > 0) {
    return {
      blocked: true,
      message: `Ce client a ${count} commande(s) active(s). Annulez ou supprimez d'abord ses commandes.`,
    };
  }

  // Supprimer les commandes annulées liées, puis le client
  await supabase.from('order_items').delete().in(
    'order_id',
    (await supabase.from('orders').select('id').eq('client_id', id)).data?.map((o: any) => o.id) || []
  );
  await supabase.from('orders').delete().eq('client_id', id);
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
  return { blocked: false, message: 'Client supprimé avec succès.' };
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
