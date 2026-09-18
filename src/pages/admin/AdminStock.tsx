import React, { useEffect, useState, useCallback } from 'react';
import { Package, AlertTriangle, XCircle, CheckCircle2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AdminLayout from './AdminLayout';
import { fetchAllProducts } from '@/services/api';
import { supabase } from '@/db/supabase';
import { getStockStatus, stockLabel, stockBadgeClass, formatPrice } from '@/lib/helpers';
import type { Product } from '@/types/index';
import { toast } from 'sonner';

const AdminStock: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'en_stock' | 'stock_faible' | 'rupture'>('all');
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchAllProducts().then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    const status = getStockStatus(p);
    const matchFilter = filter === 'all' || status === filter;
    const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all: products.length,
    en_stock: products.filter((p) => getStockStatus(p) === 'en_stock').length,
    stock_faible: products.filter((p) => getStockStatus(p) === 'stock_faible').length,
    rupture: products.filter((p) => getStockStatus(p) === 'rupture').length,
  };

  const handleStockChange = (id: string, val: string) => {
    setEditing({ ...editing, [id]: val });
  };

  const handleStockSave = async (product: Product) => {
    const newQty = parseInt(editing[product.id] ?? String(product.stock_quantity));
    if (isNaN(newQty) || newQty < 0) { toast.error('Quantité invalide'); return; }
    setSaving(product.id);
    try {
      const { error } = await supabase.from('products').update({ stock_quantity: newQty, updated_at: new Date().toISOString() }).eq('id', product.id);
      if (error) throw error;
      toast.success(`Stock mis à jour : ${product.name}`);
      load();
      setEditing((prev) => { const n = { ...prev }; delete n[product.id]; return n; });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(null);
    }
  };

  const filterButtons: Array<{ key: typeof filter; label: string; icon: React.ElementType; color: string }> = [
    { key: 'all', label: 'Tous', icon: Package, color: 'text-foreground' },
    { key: 'en_stock', label: 'En stock', icon: CheckCircle2, color: 'text-green-500' },
    { key: 'stock_faible', label: 'Stock faible', icon: AlertTriangle, color: 'text-yellow-500' },
    { key: 'rupture', label: 'Rupture', icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Gestion du stock</h1>
          <p className="text-muted-foreground text-sm">Suivez et mettez à jour les niveaux de stock</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filterButtons.map(({ key, label, icon: Icon, color }) => (
            <Card
              key={key}
              className={`border cursor-pointer transition-colors ${filter === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              onClick={() => setFilter(key)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{counts[key]}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>

        {/* Table */}
        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Réf', 'Produit', 'Prix', 'Stock actuel', 'Seuil', 'État', 'Modifier'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Chargement…</td></tr>
              ) : filtered.map((p) => {
                const status = getStockStatus(p);
                const editVal = editing[p.id] ?? String(p.stock_quantity);
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{p.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium max-w-[200px] truncate">{p.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary font-bold">{formatPrice(p.price)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center font-semibold">{p.stock_quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-muted-foreground">{p.stock_threshold}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant="outline" className={`text-xs border ${stockBadgeClass(status)}`}>{stockLabel(status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={editVal}
                          onChange={(e) => handleStockChange(p.id, e.target.value)}
                          className="w-20 h-8 text-center px-2"
                        />
                        <Button
                          size="sm"
                          className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => handleStockSave(p)}
                          disabled={saving === p.id}
                        >
                          {saving === p.id ? '…' : 'OK'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStock;
