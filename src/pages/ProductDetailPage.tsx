import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, Package, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import MainLayout from '@/components/layouts/MainLayout';
import { fetchProductById } from '@/services/api';
import { getStockStatus, stockLabel, stockBadgeClass, formatPrice } from '@/lib/helpers';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import type { Product } from '@/types/index';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProductById(id)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-muted animate-pulse rounded-lg aspect-square" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-muted animate-pulse rounded" />)}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-semibold">Produit introuvable</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/boutique">← Retour à la boutique</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status = getStockStatus(product);
  const maxQty = Math.min(product.stock_quantity, 99);

  const handleAdd = () => {
    if (status === 'rupture') return;
    addItem(product, qty);
    toast.success(`${qty}× ${product.name} ajouté${qty > 1 ? 's' : ''} au panier`);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link to="/boutique" className="hover:text-primary">Boutique</Link>
          {product.categories && (
            <>
              <span>/</span>
              <span>{product.categories.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>

        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/boutique">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour à la boutique
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted border border-border">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            {product.categories && (
              <Badge variant="secondary" className="w-fit">
                {product.categories.type === 'electricite' ? '⚡' : '☀️'} {product.categories.name}
              </Badge>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">{product.name}</h1>

            <p className="text-sm font-mono text-muted-foreground">Réf: {product.reference}</p>

            <div className="text-3xl font-bold text-primary">{formatPrice(product.price)}</div>

            <Badge variant="outline" className={`w-fit border ${stockBadgeClass(status)}`}>
              {stockLabel(status)}
            </Badge>

            {product.description && (
              <>
                <Separator />
                <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
              </>
            )}

            <Separator />

            {/* Qty selector */}
            {status !== 'rupture' && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Quantité :</span>
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-none"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-none"
                    onClick={() => setQty(Math.min(maxQty, qty + 1))}
                    disabled={qty >= maxQty}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full md:w-auto"
              onClick={handleAdd}
              disabled={status === 'rupture'}
            >
              <ShoppingCart className="w-5 h-5" />
              {status === 'rupture' ? 'Rupture de stock' : 'Ajouter au panier'}
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full md:w-auto">
              <Link to="/devis">Demander un devis pour ce produit</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetailPage;
