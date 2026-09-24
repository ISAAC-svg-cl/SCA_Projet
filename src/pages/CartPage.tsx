import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingCart, ChevronLeft, Truck, Store, Smartphone, Banknote, Copy, Check, ShieldCheck } from 'lucide-react';
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
import type { DeliveryMode, PaymentMethod } from '@/types/index';
import airtelLogo from '@/assets/icons/airtel_money.webp';
import orangeLogo from '@/assets/icons/orange_money.webp';
import especesLogo from '@/assets/icons/especes_pro.svg';

const DELIVERY_FEE = 5;

const CartPage: React.FC = () => {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('livraison');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('airtel_money');
  const [paymentReference, setPaymentReference] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', address: '', notes: '',
  });

  const deliveryFee = deliveryMode === 'livraison' ? DELIVERY_FEE : 0;
  const grandTotal = total + deliveryFee;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(text);
    toast.success(`Numéro ${text} copié !`);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

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
          payment_method: paymentMethod,
          payment_reference: paymentReference.trim() || undefined,
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

          <div className="my-6 p-4 rounded-lg border bg-muted/30 text-left text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mode de règlement :</span>
              <span className="font-semibold text-foreground flex items-center gap-2">
                {paymentMethod === 'airtel_money' && (
                  <>
                    <img src={airtelLogo} alt="Airtel Money" className="w-5 h-5 object-contain" />
                    <span>Airtel Money (0975283155) - RDC (Haut-Katanga)</span>
                  </>
                )}
                {paymentMethod === 'orange_money' && (
                  <>
                    <img src={orangeLogo} alt="Orange Money" className="w-5 h-5 object-contain" />
                    <span>Orange Money (0858657475) - RDC (Haut-Katanga)</span>
                  </>
                )}
                {paymentMethod === 'cash' && (
                  <>
                    <img src={especesLogo} alt="Espèces" className="w-5 h-5 object-contain" />
                    <span>Espèces à la livraison / retrait</span>
                  </>
                )}
              </span>
            </div>
            {paymentReference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Réf. transaction :</span>
                <span className="font-mono font-medium text-foreground">{paymentReference}</span>
              </div>
            )}
            {paymentMethod !== 'cash' && (
              <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                Titulaire du compte récepteur : <strong className="text-foreground">Juniace Kitungwa</strong>
              </p>
            )}
          </div>

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

                  <Separator />

                  {/* Mode de paiement */}
                  <div className="space-y-3">
                    <Label className="font-semibold text-base">Mode de paiement *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Bouton Airtel Money */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('airtel_money')}
                        className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 text-center cursor-pointer ${
                          paymentMethod === 'airtel_money'
                            ? 'border-red-600 bg-red-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="h-9 w-full flex items-center justify-center">
                          <img
                            src={airtelLogo}
                            alt="Airtel Money"
                            className="max-h-8 max-w-[95px] object-contain"
                          />
                        </div>
                        <div className="mt-1.5">
                          <p className="font-bold text-xs text-foreground">
                            Airtel Money
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            RDC (Haut-Katanga)
                          </p>
                        </div>
                      </button>

                      {/* Bouton Orange Money */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('orange_money')}
                        className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 text-center cursor-pointer ${
                          paymentMethod === 'orange_money'
                            ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="h-9 w-full flex items-center justify-center">
                          <img
                            src={orangeLogo}
                            alt="Orange Money"
                            className="max-h-8 max-w-[95px] object-contain"
                          />
                        </div>
                        <div className="mt-1.5">
                          <p className="font-bold text-xs text-foreground">
                            Orange Money
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            RDC (Haut-Katanga)
                          </p>
                        </div>
                      </button>

                      {/* Bouton Espèces */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 text-center cursor-pointer ${
                          paymentMethod === 'cash'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="h-9 w-full flex items-center justify-center">
                          <img
                            src={especesLogo}
                            alt="Espèces"
                            className="max-h-8 max-w-[95px] object-contain"
                          />
                        </div>
                        <div className="mt-1.5">
                          <p className="font-bold text-xs text-foreground">
                            Espèces
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            À la réception
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Instructions Airtel Money */}
                    {paymentMethod === 'airtel_money' && (
                      <div className="bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-3.5 mt-3 text-sm">
                        {/* En-tête avec montant et conversion CDF */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-red-200/70 dark:border-red-900/60">
                          <div>
                            <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Montant total à transférer</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-xl font-bold text-foreground">{formatPrice(grandTotal)}</span>
                              <span className="text-xs text-muted-foreground font-medium">
                                (≈ {(grandTotal * 2850).toLocaleString('fr-FR')} FC au taux de 2 850 FC/$)
                              </span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                            Airtel Money RDC
                          </span>
                        </div>

                        {/* Coordonnées destinataire */}
                        <div className="grid sm:grid-cols-2 gap-3 bg-white dark:bg-background/80 p-3 rounded-lg border border-red-100 dark:border-red-900/40">
                          <div>
                            <p className="text-xs text-muted-foreground">Numéro Airtel Money récepteur :</p>
                            <p className="font-mono font-bold text-lg text-red-600 tracking-wide mt-0.5">0975283155</p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-muted-foreground">Bénéficiaire vérifié :</p>
                              <p className="font-semibold text-sm text-foreground">Juniace Kitungwa</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs mt-1.5 h-7 gap-1.5 border-red-200 hover:bg-red-50"
                              onClick={() => handleCopy('0975283155')}
                            >
                              {copiedNumber === '0975283155' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedNumber === '0975283155' ? 'Copié !' : 'Copier le numéro'}
                            </Button>
                          </div>
                        </div>

                        {/* Guide 3 étapes simples */}
                        <div className="space-y-1 text-xs text-muted-foreground bg-white/60 dark:bg-background/40 p-2.5 rounded-lg border border-red-100/60">
                          <p className="font-semibold text-foreground text-xs mb-1">Étapes pour valider votre commande :</p>
                          <p>1. Composez <strong>*501#</strong> ou ouvrez l'application Airtel Money et transférez <strong>{formatPrice(grandTotal)}</strong> au <strong>0975283155</strong>.</p>
                          <p>2. Vérifiez que le nom affiché est bien <strong>Juniace Kitungwa</strong> avant de confirmer avec votre code PIN.</p>
                          <p>3. Entrez la référence / ID reçue par SMS ci-dessous (ou confirmez directement votre commande).</p>
                        </div>

                        {/* Champ Référence */}
                        <div className="pt-1 border-t border-red-200/60 dark:border-red-900/60">
                          <Label htmlFor="payment_ref_airtel" className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>ID / Référence de transaction Airtel :</span>
                            <span className="text-[11px] text-muted-foreground font-normal">Optionnel avant validation</span>
                          </Label>
                          <Input
                            id="payment_ref_airtel"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Ex : TXN123456789 ou numéro de confirmation"
                            className="mt-1.5 bg-background font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Instructions Orange Money */}
                    {paymentMethod === 'orange_money' && (
                      <div className="bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-xl p-4 space-y-3.5 mt-3 text-sm">
                        {/* En-tête avec montant et conversion CDF */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-orange-200/70 dark:border-orange-900/60">
                          <div>
                            <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Montant total à transférer</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-xl font-bold text-foreground">{formatPrice(grandTotal)}</span>
                              <span className="text-xs text-muted-foreground font-medium">
                                (≈ {(grandTotal * 2850).toLocaleString('fr-FR')} FC au taux de 2 850 FC/$)
                              </span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Orange Money RDC
                          </span>
                        </div>

                        {/* Coordonnées destinataire */}
                        <div className="grid sm:grid-cols-2 gap-3 bg-white dark:bg-background/80 p-3 rounded-lg border border-orange-100 dark:border-orange-900/40">
                          <div>
                            <p className="text-xs text-muted-foreground">Numéro Orange Money récepteur :</p>
                            <p className="font-mono font-bold text-lg text-orange-600 tracking-wide mt-0.5">0858657475</p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                            <div className="text-left sm:text-right">
                              <p className="text-xs text-muted-foreground">Bénéficiaire vérifié :</p>
                              <p className="font-semibold text-sm text-foreground">Juniace Kitungwa</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs mt-1.5 h-7 gap-1.5 border-orange-200 hover:bg-orange-50"
                              onClick={() => handleCopy('0858657475')}
                            >
                              {copiedNumber === '0858657475' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedNumber === '0858657475' ? 'Copié !' : 'Copier le numéro'}
                            </Button>
                          </div>
                        </div>

                        {/* Guide 3 étapes simples */}
                        <div className="space-y-1 text-xs text-muted-foreground bg-white/60 dark:bg-background/40 p-2.5 rounded-lg border border-orange-100/60">
                          <p className="font-semibold text-foreground text-xs mb-1">Étapes pour valider votre commande :</p>
                          <p>1. Composez <strong>*144#</strong> ou ouvrez l'application Orange Money et transférez <strong>{formatPrice(grandTotal)}</strong> au <strong>0858657475</strong>.</p>
                          <p>2. Vérifiez que le nom affiché est bien <strong>Juniace Kitungwa</strong> avant de confirmer avec votre code PIN.</p>
                          <p>3. Entrez la référence / ID reçue par SMS ci-dessous (ou confirmez directement votre commande).</p>
                        </div>

                        {/* Champ Référence */}
                        <div className="pt-1 border-t border-orange-200/60 dark:border-orange-900/60">
                          <Label htmlFor="payment_ref_orange" className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>ID / Référence de transaction Orange :</span>
                            <span className="text-[11px] text-muted-foreground font-normal">Optionnel avant validation</span>
                          </Label>
                          <Input
                            id="payment_ref_orange"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Ex : MP240... ou numéro de confirmation"
                            className="mt-1.5 bg-background font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Instructions Cash */}
                    {paymentMethod === 'cash' && (
                      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 space-y-3 mt-3 text-sm">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-emerald-200/70 dark:border-emerald-900/60">
                          <div>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Règlement à la livraison ou au comptoir</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-xl font-bold text-foreground">{formatPrice(grandTotal)}</span>
                              <span className="text-xs text-muted-foreground font-medium">
                                (ou ≈ {(grandTotal * 2850).toLocaleString('fr-FR')} FC)
                              </span>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            💵 Espèces acceptées
                          </span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>Paiement direct en mains propres au livreur ou lors du retrait en magasin à Lubumbashi.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>Devises acceptées : <strong>Dollars américains (USD)</strong> ou <strong>Francs Congolais (CDF)</strong> au taux officiel du jour.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>Un reçu officiel vous sera remis immédiatement lors de l'encaissement.</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {/* Badge réassurance */}
                    <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Transactions vérifiées directement par notre équipe • Aucun frais caché</span>
                    </div>
                  </div>

                  <Separator />

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
