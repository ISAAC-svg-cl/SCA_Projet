import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingCart, ChevronLeft, Truck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layouts/MainLayout';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/helpers';
import { createOrder } from '@/services/api';
import { toast } from 'sonner';
import type { DeliveryMode } from '@/types/index';

const DELIVERY_FEE = 5;

const CartPage: React.FC = () => {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('livraison');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', address: '', notes: '',
  });

  const deliveryFee = deliveryMode === 'livraison' ? DELIVERY_FEE : 0;
  const grandTotal = total + deliveryFee;

  const handleOrder = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error('Veuillez remplir votre nom et téléphone');
      return;
    }
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product.id,
        product_name: i.product.name,
        product_reference: i.product.reference,
        unit_price: i.product.price,
        quantity: i.quantity,
        total: i.quantity * i.product.price,
      }));
      const result = await createOrder(
        { full_name: form.full_name, phone: form.phone, email: form.email || null, address: form.address || null },
        orderItems,
        {
          delivery_mode: deliveryMode,
          delivery_address: deliveryMode === 'livraison' ? form.address : undefined,
          subtotal: total,
          delivery_fee: deliveryFee,
          total: grandTotal,
          notes: form.notes || undefined,
        }
      );
      setOrderId(result.orderId);
      setOrderNumber(result.orderNumber);
      clearCart();
      setStep('confirmed');
      toast.success('Commande confirmée !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la commande. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Empty cart ──
  if (count === 0 && step !== 'confirmed') {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <ShoppingCart className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-40" />
          <h1 className="text-2xl font-bold mb-3">Votre panier est vide</h1>
          <p className="text-muted-foreground mb-8">Découvrez notre catalogue de matériel électrique et solaire.</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/boutique">Voir nos produits</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // ── Confirmed ──
  if (step === 'confirmed') {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Commande confirmée !</h1>
          <p className="text-muted-foreground mb-2">
            Votre commande <span className="font-bold text-foreground">{orderNumber}</span> a été enregistrée.
          </p>
          <p className="text-muted-foreground mb-8 text-sm">
            Notre équipe vous contactera sous peu pour confirmer les détails.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/boutique">Continuer mes achats</Link>
            </Button>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/boutique"><ChevronLeft className="w-4 h-4 mr-1" />Continuer mes achats</Link>
        </Button>

        <h1 className="text-2xl font-bold mb-8">
          {step === 'cart' ? `Mon Panier (${count})` : 'Finaliser la commande'}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: items or checkout form */}
          <div className="lg:col-span-2 space-y-4">
            {step === 'cart' ? (
              <>
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 bg-card border border-border rounded-lg p-4 items-center">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product.reference}</p>
                      <p className="text-sm font-bold text-primary mt-1">{formatPrice(item.product.price)}</p>
                    </div>
                    <div className="flex items-center border border-border rounded-md shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(item.product.id, item.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(item.product.id, item.quantity + 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="w-20 text-right font-bold text-sm text-foreground shrink-0">
                      {formatPrice(item.quantity * item.product.price)}
                    </p>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 shrink-0" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </>
            ) : (
              /* Checkout form */
              <Card className="border border-border">
                <CardHeader><CardTitle>Vos informations</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jean Dupont" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="085 000 00 00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optionnel)</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Mode de récupération *</Label>
                    <RadioGroup value={deliveryMode} onValueChange={(v) => setDeliveryMode(v as DeliveryMode)} className="grid sm:grid-cols-2 gap-3">
                      <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${deliveryMode === 'livraison' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <RadioGroupItem value="livraison" id="livraison" />
                        <div>
                          <div className="flex items-center gap-2 font-medium text-sm">
                            <Truck className="w-4 h-4 text-primary" /> Livraison
                          </div>
                          <p className="text-xs text-muted-foreground">+{formatPrice(DELIVERY_FEE)}</p>
                        </div>
                      </label>
                      <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${deliveryMode === 'retrait' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <RadioGroupItem value="retrait" id="retrait" />
                        <div>
                          <div className="flex items-center gap-2 font-medium text-sm">
                            <Store className="w-4 h-4 text-accent" /> Retrait en magasin
                          </div>
                          <p className="text-xs text-muted-foreground">Gratuit</p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  {deliveryMode === 'livraison' && (
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse de livraison *</Label>
                      <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Votre adresse complète" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Instructions particulières…" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: summary */}
          <div className="space-y-4">
            <Card className="border border-border sticky top-24">
              <CardHeader><CardTitle>Récapitulatif</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((i) => (
                  <div key={i.product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate flex-1 min-w-0 pr-2">{i.product.name} ×{i.quantity}</span>
                    <span className="font-medium shrink-0">{formatPrice(i.quantity * i.product.price)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{deliveryMode === 'retrait' ? 'Gratuit' : formatPrice(DELIVERY_FEE)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(grandTotal)}</span>
                </div>

                {step === 'cart' ? (
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2" onClick={() => setStep('checkout')}>
                    Passer la commande →
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleOrder} disabled={submitting}>
                      {submitting ? 'Traitement…' : '✓ Confirmer la commande'}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setStep('cart')}>
                      ← Modifier le panier
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CartPage;
