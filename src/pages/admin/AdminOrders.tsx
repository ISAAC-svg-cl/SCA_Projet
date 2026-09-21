import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, FileDown, Eye, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AdminLayout from './AdminLayout';
import {
  fetchOrders, updateOrderStatus, fetchInvoiceByOrderId,
  fetchOrderById, deleteOrder,
} from '@/services/api';
import { formatDate, formatPrice, orderStatusLabel } from '@/lib/helpers';
import { generateInvoicePDF, generateOrderReceiptPDF } from '@/lib/pdfGenerator';
import type { Order } from '@/types/index';
import { toast } from 'sonner';

const STATUS_LIST = ['en_attente', 'confirme', 'en_preparation', 'livre', 'annule'] as const;

const statusColors: Record<string, string> = {
  en_attente:    'text-yellow-600 border-yellow-400/40 bg-yellow-50',
  confirme:      'text-blue-600 border-blue-400/40 bg-blue-50',
  en_preparation:'text-orange-600 border-orange-400/40 bg-orange-50',
  livre:         'text-green-700 border-green-400/40 bg-green-50',
  annule:        'text-red-600 border-red-400/40 bg-red-50',
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchOrders(200).then(setOrders).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search.trim() ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (o.clients?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.clients?.phone || '').includes(search);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (order: Order, status: Order['status']) => {
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Statut mis a jour : ${orderStatusLabel(status)}`);
      load();
      if (selected?.id === order.id) setSelected({ ...selected, status });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise a jour du statut');
    }
  };

  const handleDownloadPDF = async (orderId: string) => {
    setPdfLoading(orderId);
    try {
      const invoice = await fetchInvoiceByOrderId(orderId);
      if (invoice) {
        await generateInvoicePDF(invoice);
        toast.success('Facture PDF telechargee');
        return;
      }
      let order = orders.find((o) => o.id === orderId);
      if (!order || !order.order_items || order.order_items.length === 0) {
        order = (await fetchOrderById(orderId)) || order;
      }
      if (order) {
        await generateOrderReceiptPDF(order);
        toast.success('Recu PDF telecharge');
      } else {
        toast.error('Commande introuvable');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du telechargement du document');
    } finally {
      setPdfLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteOrder(deleteId);
      toast.success('Commande supprimee avec succes');
      if (selected?.id === deleteId) setSelected(null);
      setDeleteId(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const counts = STATUS_LIST.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Commandes</h1>
            <p className="text-muted-foreground text-sm">{orders.length} commandes au total</p>
          </div>
          <Button variant="outline" size="icon" onClick={load} className="h-9 w-9" title="Actualiser">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
          >
            Toutes ({orders.length})
          </button>
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? `${statusColors[s]} border-current` : 'border-border hover:bg-muted'}`}
            >
              {orderStatusLabel(s)} ({counts[s] || 0})
            </button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="N de commande, client ou telephone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                {['N Commande', 'Client', 'Tel.', 'Date', 'Mode', 'Total', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Aucune commande</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold">{o.order_number}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{o.clients?.full_name || '...'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{o.clients?.phone || '...'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{formatDate(o.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">
                    {o.delivery_mode === 'livraison' ? 'Livraison' : 'Retrait'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-primary">{formatPrice(o.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v as Order['status'])}>
                      <SelectTrigger className={`h-7 text-xs w-40 border font-medium ${statusColors[o.status] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_LIST.map((s) => (
                          <SelectItem key={s} value={s}>{orderStatusLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir detail" onClick={() => setSelected(o)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Telecharger PDF" onClick={() => handleDownloadPDF(o.id)} disabled={pdfLoading === o.id}>
                        <FileDown className={`w-3.5 h-3.5 ${pdfLoading === o.id ? 'animate-bounce' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Supprimer" onClick={() => setDeleteId(o.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commande {selected?.order_number}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{selected.clients?.full_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Telephone</p><p className="font-medium">{selected.clients?.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
                <div><p className="text-xs text-muted-foreground">Mode</p><p className="font-medium">{selected.delivery_mode === 'livraison' ? 'Livraison' : 'Retrait en magasin'}</p></div>
                {selected.delivery_address && <div className="col-span-2"><p className="text-xs text-muted-foreground">Adresse</p><p className="font-medium">{selected.delivery_address}</p></div>}
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Modifier le statut</p>
                  <Select value={selected.status} onValueChange={(v) => handleStatusChange(selected, v as Order['status'])}>
                    <SelectTrigger className={`h-8 text-sm border font-medium ${statusColors[selected.status] || ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_LIST.map((s) => (
                        <SelectItem key={s} value={s}>{orderStatusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-3 py-2">Produit</th>
                      <th className="text-center px-3 py-2">Qte</th>
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
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => handleDownloadPDF(selected.id)}
                  disabled={pdfLoading === selected.id}
                >
                  <FileDown className="w-4 h-4" />
                  {pdfLoading === selected.id ? 'Generation...' : 'Telecharger PDF'}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => { setDeleteId(selected.id); setSelected(null); }}
                >
                  <Trash2 className="w-4 h-4" />Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. La commande, ses articles et la facture associee seront definitivement supprimes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminOrders;
