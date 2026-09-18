import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, FileDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import AdminLayout from './AdminLayout';
import { fetchOrders, updateOrderStatus, fetchInvoiceByOrderId } from '@/services/api';
import { formatDate, formatPrice, orderStatusLabel } from '@/lib/helpers';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import type { Order } from '@/types/index';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  en_attente: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5',
  confirme: 'text-blue-500 border-blue-500/30 bg-blue-500/5',
  en_preparation: 'text-accent border-accent/30 bg-accent/5',
  livre: 'text-success border-success/30 bg-success/5',
  annule: 'text-destructive border-destructive/30 bg-destructive/5',
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchOrders(100).then(setOrders).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) =>
    !search.trim() ||
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.clients?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    try {
      await updateOrderStatus(order.id, status);
      toast.success('Statut mis à jour');
      load();
      if (selected?.id === order.id) setSelected({ ...selected, status });
    } catch (err) {
      console.error(err);
      toast.error('Erreur');
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setPdfLoading(orderId);
    try {
      const invoice = await fetchInvoiceByOrderId(orderId);
      if (!invoice) { toast.error('Facture introuvable'); return; }
      generateInvoicePDF(invoice);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Commandes</h1>
          <p className="text-muted-foreground text-sm">{orders.length} commandes</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par n° ou client…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-4 h-4" /></button>}
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                {['N° Commande', 'Client', 'Date', 'Mode', 'Total', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Chargement…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Aucune commande</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{o.clients?.full_name || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{formatDate(o.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">
                    {o.delivery_mode === 'livraison' ? '🚚 Livraison' : '🏪 Retrait'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-primary">{formatPrice(o.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v as Order['status'])}>
                      <SelectTrigger className={`h-7 text-xs w-36 border ${statusColors[o.status] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['en_attente', 'confirme', 'en_preparation', 'livre', 'annule'].map((s) => (
                          <SelectItem key={s} value={s}>{orderStatusLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(o)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadInvoice(o.id)} disabled={pdfLoading === o.id}>
                        <FileDown className={`w-3.5 h-3.5 ${pdfLoading === o.id ? 'animate-bounce' : ''}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commande {selected?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{selected.clients?.full_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Téléphone</p><p className="font-medium">{selected.clients?.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
                <div><p className="text-xs text-muted-foreground">Mode</p><p className="font-medium">{selected.delivery_mode === 'livraison' ? 'Livraison' : 'Retrait en magasin'}</p></div>
                {selected.delivery_address && <div className="col-span-2"><p className="text-xs text-muted-foreground">Adresse</p><p className="font-medium">{selected.delivery_address}</p></div>}
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2">Produit</th>
                      <th className="text-center px-3 py-2">Qté</th>
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.order_items || []).map((item) => (
                      <tr key={item.id} className="border-t border-border/50">
                        <td className="px-3 py-2">{item.product_name}</td>
                        <td className="text-center px-3 py-2">{item.quantity}</td>
                        <td className="text-right px-3 py-2 font-medium">{formatPrice(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-right">
                <p className="text-muted-foreground">Sous-total : {formatPrice(selected.subtotal)}</p>
                <p className="text-muted-foreground">Livraison : {formatPrice(selected.delivery_fee)}</p>
                <p className="font-bold text-lg text-primary">Total : {formatPrice(selected.total)}</p>
              </div>

              <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleDownloadInvoice(selected.id)}>
                <FileDown className="w-4 h-4" />Télécharger la facture PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
