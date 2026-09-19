import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import AdminLayout from './AdminLayout';
import { fetchAllProducts, fetchCategories, upsertProduct, deleteProduct } from '@/services/api';
import { getStockStatus, stockLabel, stockBadgeClass, formatPrice } from '@/lib/helpers';
import type { Product, Category } from '@/types/index';
import { toast } from 'sonner';
import { supabase } from '@/supabaseClient';

const emptyForm = {
  name: '', reference: '', description: '', category_id: '',
  price: '', stock_quantity: '', stock_threshold: '', image_url: '', is_active: true,
};

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  // New state for image file selection
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchAllProducts(), fetchCategories()])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name, reference: p.reference, description: p.description || '',
      category_id: p.category_id, price: String(p.price),
      stock_quantity: String(p.stock_quantity), stock_threshold: String(p.stock_threshold),
      image_url: p.image_url || '', is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.reference.trim() || !form.category_id || !form.price) {
      toast.error('Remplissez les champs obligatoires'); return;
    }
    setSaving(true);
    try {
      // If a new image file is selected, upload it first
      let uploadedImageUrl = form.image_url.trim() || null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error } = await supabase.storage
          .from('product-images')
          .upload(fileName, selectedFile);
        if (error) {
          console.error('Upload error:', error);
          toast.error('Erreur lors de l\'upload de l\'image');
          setSaving(false);
          return;
        }
        // Public URL (adjust if you use a custom domain)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        uploadedImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
      }

      await upsertProduct({
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        reference: form.reference.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity) || 0,
        stock_threshold: parseInt(form.stock_threshold) || 5,
        image_url: uploadedImageUrl,
        is_active: form.is_active,
      });
      toast.success(editingId ? 'Produit mis à jour' : 'Produit créé');
      setDialogOpen(false);
      // Reset selected file after successful save
      setSelectedFile(null);
      load();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      toast.success('Produit supprimé');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Gestion des produits</h1>
            <p className="text-muted-foreground text-sm">{products.length} produits au total</p>
          </div>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0">
            <Plus className="w-4 h-4" />Nouveau produit
          </Button>
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
                {['Réf', 'Produit', 'Catégorie', 'Prix', 'Stock', 'État', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Aucun produit trouvé</td></tr>
              ) : filtered.map((p) => {
                const status = getStockStatus(p);
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{p.reference}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" /> : <Package className="w-8 h-8 text-muted-foreground" />}
                        <span className="font-medium max-w-[180px] truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{p.categories?.name || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-primary">{formatPrice(p.price)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">{p.stock_quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant="outline" className={`text-xs border ${stockBadgeClass(status)}`}>{stockLabel(status)}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => setDeleteId(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" />
              </div>
              <div className="space-y-2">
                <Label>Référence *</Label>
                <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="SCA-REF001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.type === 'electricite' ? '⚡' : '☀️'} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix ($) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Seuil alerte</Label>
                <Input type="number" min="0" value={form.stock_threshold} onChange={(e) => setForm({ ...form, stock_threshold: e.target.value })} placeholder="5" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL image</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
              {/* File upload for new image */}
              <Label className="mt-2">Uploader une image</Label>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                // Show a preview if possible
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setForm({ ...form, image_url: reader.result as string });
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enregistrement…</> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminProducts;
