import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types/index';
import { getStockStatus, stockLabel, stockBadgeClass, formatPrice } from '@/lib/helpers';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const status = getStockStatus(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === 'rupture') return;
    addItem(product, 1);
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <Link to={`/produit/${product.id}`} className="block">
      <div className="product-card bg-card border border-border rounded-lg overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {/* Stock badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className={`text-xs border ${stockBadgeClass(status)}`}>
              {stockLabel(status)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          <p className="text-xs text-muted-foreground font-mono">{product.reference}</p>
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 flex-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
            <div className="flex items-baseline gap-1.5">
              {product.promo_price ? (
                <>
                  <span className="text-lg font-bold text-primary">{formatPrice(product.promo_price)}</span>
                  <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
                </>
              ) : (
                <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.preventDefault(); }}
                asChild
              >
                <Link to={`/produit/${product.id}`}>
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 bg-primary hover:bg-primary/90"
                onClick={handleAdd}
                disabled={status === 'rupture'}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

// Star rating component
export const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sz} ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
    </div>
  );
};
