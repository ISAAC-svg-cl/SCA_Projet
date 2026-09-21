import type { Product } from '@/types/index';

const STORAGE_KEY = 'sca_product_overrides_v1';
const ADDED_PRODUCTS_KEY = 'sca_added_products_v1';
const DELETED_IDS_KEY = 'sca_deleted_products_v1';

export interface ProductOverrides {
  [id: string]: Partial<Product>;
}

export function getProductOverrides(): ProductOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProductOverride(id: string, updates: Partial<Product>): void {
  try {
    const current = getProductOverrides();
    current[id] = { ...(current[id] || {}), ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('sca:products-updated', { detail: { id, updates } }));
  } catch (e) {
    console.warn('Could not save product override:', e);
  }
}

export function getCustomAddedProducts(): Product[] {
  try {
    const raw = localStorage.getItem(ADDED_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomAddedProduct(product: Product): void {
  try {
    const list = getCustomAddedProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...product };
    } else {
      list.unshift(product);
    }
    localStorage.setItem(ADDED_PRODUCTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('sca:products-updated', { detail: { product } }));
  } catch (e) {
    console.warn('Could not save custom product:', e);
  }
}

export function getDeletedProductIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markProductDeleted(id: string): void {
  try {
    const list = getDeletedProductIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(list));
    }
    const added = getCustomAddedProducts().filter((p) => p.id !== id);
    localStorage.setItem(ADDED_PRODUCTS_KEY, JSON.stringify(added));
    window.dispatchEvent(new CustomEvent('sca:products-updated', { detail: { deletedId: id } }));
  } catch (e) {
    console.warn('Could not mark product deleted:', e);
  }
}

/**
 * Merge remote Supabase products with local overrides and custom added products
 */
export function mergeWithOverrides(remoteProducts: Product[]): Product[] {
  const overrides = getProductOverrides();
  const deletedIds = getDeletedProductIds();
  const customAdded = getCustomAddedProducts();

  const result: Product[] = [];
  for (const p of remoteProducts) {
    if (deletedIds.includes(p.id)) continue;
    const ov = overrides[p.id];
    if (ov) {
      result.push({ ...p, ...ov });
    } else {
      result.push(p);
    }
  }

  for (const cp of customAdded) {
    if (deletedIds.includes(cp.id)) continue;
    const ov = overrides[cp.id];
    const finalProduct = ov ? { ...cp, ...ov } : cp;
    const existingIdx = result.findIndex((p) => p.id === finalProduct.id);
    if (existingIdx >= 0) {
      result[existingIdx] = finalProduct;
    } else {
      result.unshift(finalProduct);
    }
  }

  return result;
}
