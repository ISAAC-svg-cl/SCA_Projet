import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle2, Clock, XCircle, FileDown, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchOrderByNumberAndPhone, fetchInvoiceByOrderId } from '@/services/api';
import { generateInvoicePDF, generateOrderReceiptPDF } from '@/lib/pdfGenerator';
import { formatDate, formatPrice } from '@/lib/helpers';
import type { Order } from '@/types/index';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const STATUS_CONFIG: Record<string, { label: string; icon: React.FC<any>; color: string; bg: string; desc: string }> = {
  en_attente: {
    label: 'En attente',
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    desc: 'Votre commande a ete recue et est en attente de confirmation par notre equipe.',
  },
  confirme: {
    label: 'Confirmee',
    icon: CheckCircle2,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    desc: 'Votre commande a ete confirmee. Nous preparons vos articles.',
  },
  en_preparation: {
    label: 'En preparation',
    icon: Package,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    desc: 'Vos articles sont en cours de preparation dans notre magasin.',
  },
  livre: {
    label: 'Livree',
    icon: Truck,
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    desc: 'Votre commande a ete livree. Merci pour votre confiance !',
  },
  annule: {
    label: 'Annulee',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    desc: 'Cette commande a ete annulee. Contactez-nous pour plus d\'informations.',
  },
};

const STEPS = ['en_attente', 'confirme', 'en_preparation', 'livre'];

const OrderTrackingPage: React.FC = () => {
  const [orderNum, setOrderNum] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNum.trim() || !phone.trim()) {
      toast.error('Veuillez remplir le numero de commande et le telephone');
      return;
    }
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const result = await fetchOrderByNumberAndPhone(orderNum.trim(), phone.trim());
      if (result) {
        setOrder(result);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!order) return;
    setPdfLoading(true);
    try {
      const invoice = await fetchInvoiceByOrderId(order.id);
      if (invoice) {
        await generateInvoicePDF(invoice);
        toast.success('Facture telechargee');
      } else {
        await generateOrderReceiptPDF(order);
        toast.success('Recu telecharge');
      }
    } catch (err) {
      toast.error('Erreur lors du telechargement');
    } finally {
      setPdfLoading(false);
    }
  };

  const statusCfg = order ? STATUS_CONFIG[order.status] : null;
  const currentStep = order ? STEPS.indexOf(order.status) : -1;
  const isAnnule = order?.status === 'annule';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Barre superieure */}
      <div className="bg-[#0f2240] text-white px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour au site</span>
        </Link>
        <div className="flex-1" />
        <img src="/logo.png" alt="SCA" className="h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start py-10 px-4">
        <div className="w-full max-w-lg space-y-6">

          {/* Titre */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold text-[#0f2240]">Suivre ma commande</h1>
            <p className="text-slate-500 text-sm">Entrez votre numero de commande et votre telephone pour voir le statut</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="orderNum">Numero de commande</Label>
              <Input
                id="orderNum"
                placeholder="Ex : CMD-2026-0001"
                value={orderNum}
                onChange={(e) => setOrderNum(e.target.value)}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">Ce numero figure sur votre recu ou SMS de confirmation</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telephone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="Ex : 085 865 74 75"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 bg-[#0f2240] hover:bg-[#0f2240]/90" disabled={loading}>
              <Search className="w-4 h-4" />
              {loading ? 'Recherche en cours...' : 'Rechercher ma commande'}
            </Button>
          </form>

          {/* Pas trouve */}
          {notFound && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-2">
              <XCircle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="font-semibold text-red-700">Commande introuvable</p>
              <p className="text-sm text-red-600">Verifiez le numero de commande et le numero de telephone associe.</p>
              <p className="text-xs text-red-500">Contactez-nous : 085 865 74 75 / 097 528 31 55</p>
            </div>
          )}

          {/* Resultat */}
          {order && statusCfg && (
            <div className="space-y-4">
              {/* Badge statut */}
              <div className={`rounded-2xl border p-5 ${statusCfg.bg} space-y-2`}>
                <div className="flex items-center gap-3">
                  <statusCfg.icon className={`w-8 h-8 ${statusCfg.color}`} />
                  <div>
                    <p className="text-xs text-slate-500">Statut de la commande</p>
                    <p className={`text-xl font-bold ${statusCfg.color}`}>{statusCfg.label}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{statusCfg.desc}</p>
              </div>

              {/* Barre de progression (si pas annulee) */}
              {!isAnnule && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Progression</p>
                  <div className="relative">
                    {/* Ligne de fond */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200" />
                    {/* Ligne coloree */}
                    {currentStep > 0 && (
                      <div
                        className="absolute top-4 left-4 h-0.5 bg-[#0f2240] transition-all duration-500"
                        style={{ width: `${(currentStep / (STEPS.length - 1)) * (100 - 8)}%` }}
                      />
                    )}
                    <div className="relative flex justify-between">
                      {STEPS.map((step, idx) => {
                        const cfg = STATUS_CONFIG[step];
                        const done = idx <= currentStep;
                        return (
                          <div key={step} className="flex flex-col items-center gap-1.5 w-16">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-colors ${done ? 'bg-[#0f2240] border-[#0f2240] text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                              <cfg.icon className="w-4 h-4" />
                            </div>
                            <p className={`text-xs text-center leading-tight ${done ? 'text-[#0f2240] font-semibold' : 'text-slate-400'}`}>{cfg.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Details commande */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Numero</p>
                    <p className="font-mono font-semibold">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Client</p>
                    <p className="font-medium">{order.clients?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mode</p>
                    <p className="font-medium">{order.delivery_mode === 'livraison' ? 'Livraison' : 'Retrait'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Paiement</p>
                    <p className="font-semibold text-slate-800">
                      {order.payment_method === 'airtel_money' && 'Airtel Money (0975283155)'}
                      {order.payment_method === 'orange_money' && 'Orange Money (0858657475)'}
                      {(!order.payment_method || order.payment_method === 'cash') && 'Espèces à la livraison/retrait'}
                    </p>
                  </div>
                  {order.payment_reference && (
                    <div>
                      <p className="text-xs text-slate-400">Réf. transaction</p>
                      <p className="font-mono font-bold text-xs text-slate-800">{order.payment_reference}</p>
                    </div>
                  )}
                </div>

                {(order.order_items || []).length > 0 && (
                  <div className="border border-slate-100 rounded-lg overflow-hidden mt-2">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-slate-500">Article</th>
                          <th className="text-center px-3 py-2 text-slate-500">Qte</th>
                          <th className="text-right px-3 py-2 text-slate-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_items!.map((item) => (
                          <tr key={item.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{item.product_name}</td>
                            <td className="text-center px-3 py-2">{item.quantity}</td>
                            <td className="text-right px-3 py-2 font-medium">{formatPrice(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="text-right space-y-0.5 pt-1">
                  <p className="text-xs text-slate-400">Livraison : {formatPrice(order.delivery_fee)}</p>
                  <p className="font-bold text-base text-[#0f2240]">Total : {formatPrice(order.total)}</p>
                </div>
              </div>

              {/* Bouton PDF */}
              <Button
                className="w-full gap-2 bg-[#0f2240] hover:bg-[#0f2240]/90"
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
              >
                <FileDown className="w-4 h-4" />
                {pdfLoading ? 'Generation...' : 'Telecharger mon recu PDF'}
              </Button>

              {/* Contact */}
              <div className="text-center text-xs text-slate-400">
                Des questions ? Contactez-nous :
                <a href="tel:0858657475" className="ml-1 text-[#0f2240] font-medium hover:underline">085 865 74 75</a>
                {' / '}
                <a href="tel:0975283155" className="text-[#0f2240] font-medium hover:underline">097 528 31 55</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
