import { type Product, type StockStatus } from '@/types/index';

export function getStockStatus(product: Product): StockStatus {
  if (product.stock_quantity === 0) return 'rupture';
  if (product.stock_quantity <= product.stock_threshold) return 'stock_faible';
  return 'en_stock';
}

export function stockLabel(status: StockStatus): string {
  const labels: Record<StockStatus, string> = {
    en_stock: 'En stock',
    stock_faible: 'Stock faible',
    rupture: 'Rupture de stock',
  };
  return labels[status];
}

export function stockBadgeClass(status: StockStatus): string {
  const classes: Record<StockStatus, string> = {
    en_stock: 'badge-en-stock',
    stock_faible: 'badge-stock-faible',
    rupture: 'badge-rupture',
  };
  return classes[status];
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2)} $`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function orderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    confirme: 'Confirmé',
    en_preparation: 'En préparation',
    livre: 'Livré',
    annule: 'Annulé',
  };
  return labels[status] || status;
}

export function quoteStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    nouveau: 'Nouveau',
    en_cours: 'En cours',
    traite: 'Traité',
    rejete: 'Rejeté',
  };
  return labels[status] || status;
}
