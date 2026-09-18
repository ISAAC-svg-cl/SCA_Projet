import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, Eye, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from './AdminLayout';
import { fetchInvoices, fetchInvoiceByOrderId } from '@/services/api';
import { formatDate, formatPrice } from '@/lib/helpers';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import type { Invoice } from '@/types/index';
import { toast } from 'sonner';

const AdminInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchInvoices(100).then(setInvoices).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter((inv) =>
    !search.trim() ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (inv.clients?.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (invoice: Invoice) => {
    setPdfLoading(invoice.id);
    try {
      const full = await fetchInvoiceByOrderId(invoice.order_id);
      if (!full) { toast.error('Facture introuvable'); return; }
      generateInvoicePDF(full);
    } catch (err) {
      console.error(err);
      toast.error('Erreur PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground text-sm">{invoices.length} factures générées</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-4 h-4" /></button>}
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                {['N° Facture', 'Client', 'Commande', 'Date', 'Total', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucune facture</td></tr>
              ) : filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-primary">{inv.invoice_number}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{inv.clients?.full_name || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{inv.orders?.order_number || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{formatDate(inv.issued_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-primary">{formatPrice(inv.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(inv)}><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(inv)} disabled={pdfLoading === inv.id}>
                        {pdfLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
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
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Facture {selected?.invoice_number}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-muted-foreground">Client</p><p className="font-medium">{selected.clients?.full_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.issued_at)}</p></div>
                <div><p className="text-xs text-muted-foreground">N° Commande</p><p className="font-mono text-xs">{selected.orders?.order_number || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-primary text-lg">{formatPrice(selected.total)}</p></div>
              </div>
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleDownload(selected)}>
                <FileDown className="w-4 h-4" />Télécharger PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInvoices;
