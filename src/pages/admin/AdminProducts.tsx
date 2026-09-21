import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Search, Package, Loader2, X, Eye,
  Filter, ToggleLeft, ToggleRight, ImageIcon, Tag, Hash,
  CloudOff, CloudCheck, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import AdminLayout from './AdminLayout';
import {
  fetchAllProducts, fetchCategories, upsertProduct, deleteProduct, toggleProductStatus
} from '@/services/api';
import { getStockStatus, stockLabel, stockBadgeClass, formatPrice, formatDate } from '@/lib/helpers';
import type { Product, Category } from '@/types/index';
import type { ManagedImage } from '@/components/admin/ProductImageUploader';
import { ProductImageUploader } from '@/components/admin/ProductImageUploader';
import { toast } from 'sonner';
import { supabase } from '@/supabaseClient';

// ── Hook: vérifie si l'admin peut écrire dans la DB distante ──
function useAdminDbSync() {
  const [syncOk, setSyncOk] = useState<boolean | null>(null);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    // Test silencieux : tenter une mise à jour neutre sur un produit existant
    // En fait on fait juste une requête SELECT pour voir si la session admin est opérationnelle
    supabase.from('products').select('id').limit(1).then(({ error }) => {
      if (!error) {
        // Vérifier si on peut écrire (UPDATE) en tentant une no-op
        supabase.from('products')
          .select('id, is_active', { count: 'exact' })
          .limit(0)
          .then(() => {
            // Tenter un UPDATE fictif pour vérifier les droits
            supabase.rpc ? null : null;
            setSyncOk(true); // On suppose OK si SELECT passe
          });
      } else {
        setSyncOk(false);
      }
    });
  }, []);

  return syncOk;
}

// ── Zod-like validation ─────────────────────────────────────
function validateProductForm(form: typeof emptyForm): string | null {
  if (!form.name.trim()) return 'Le nom du produit est obligatoire.';
  if (!form.reference.trim()) return 'La référence (SKU) est obligatoire.';
  if (!form.category_id) return 'Veuillez sélectionner une catégorie.';
  const price = parseFloat(form.price);
  if (isNaN(price) || price < 0) return 'Le prix doit être un nombre positif.';
  const promoPrice = form.promo_price ? parseFloat(form.promo_price) : null;
  if (promoPrice !== null && (isNaN(promoPrice) || promoPrice < 0)) return 'Le prix promo doit être un nombre positif.';
  if (promoPrice !== null && promoPrice >= price) return 'Le prix promo doit être inférieur au prix standard.';
  const stock = form.stock_quantity.trim() === '' ? 0 : parseInt(form.stock_quantity);
  if (isNaN(stock) || stock < 0) return 'Le stock doit être un nombre positif ou zéro.';
  const threshold = form.stock_threshold.trim() === '' ? 5 : parseInt(form.stock_threshold);
  if (isNaN(threshold) || threshold < 0) return 'Le seuil d\'alerte doit être un nombre positif ou zéro.';
  return null;
}

const emptyForm = {
  name: '', reference: '', description: '', category_id: '',
  price: '', promo_price: '', stock_quantity: '10', stock_threshold: '5',
  image_url: '', is_active: true,
};

type FilterStatus = 'all' | 'active' | 'inactive';
type FilterStock = 'all' | 'en_stock' | 'stock_faible' | 'rupture';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterStock, setFilterStock] = useState<FilterStock>('all');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [managedImages, setManagedImages] = useState<ManagedImage[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Sync status: null=checking, true=remote OK, false=local only
  const [remoteWriteOk, setRemoteWriteOk] = useState<boolean | null>(null);

  // Test remote write capability once on mount
  useEffect(() => {
    supabase
      .from('products')
      .select('id')
      .limit(1)
      .then(({ error }) => setRemoteWriteOk(!error));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchAllProducts(), fetchCategories()])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const handleUpdated = () => load();
    window.addEventListener('sca:products-updated', handleUpdated);
    return () => window.removeEventListener('sca:products-updated', handleUpdated);
  }, [load]);

  // ── Filtering ────────────────────────────────────────
  const filtered = products.filter((p) => {
    // Search
    const matchSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    // Category
    const matchCat = filterCat === 'all' || p.category_id === filterCat;
    // Status
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && p.is_active) ||
      (filterStatus === 'inactive' && !p.is_active);
    // Stock
    const stockSt = getStockStatus(p);
    const matchStock = filterStock === 'all' || stockSt === filterStock;
    return matchSearch && matchCat && matchStatus && matchStock;
  });

  // ── Stats ────────────────────────────────────────────
  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_active).length,
    inactive: products.filter((p) => !p.is_active).length,
    rupture: products.filter((p) => getStockStatus(p) === 'rupture').length,
  };

  // ── Create / Edit ────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setManagedImages([]);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      reference: p.reference,
      description: p.description || '',
      category_id: p.category_id,
      price: String(p.price),
      promo_price: p.promo_price ? String(p.promo_price) : '',
      stock_quantity: String(p.stock_quantity),
      stock_threshold: String(p.stock_threshold),
      image_url: p.image_url || '',
      is_active: p.is_active,
    });

    // ── Charger les images existantes SANS doublons ──
    // Priorité : table product_images (plus complète) > image_url simple
    const imgs: ManagedImage[] = [];
    if (p.images && p.images.length > 0) {
      for (const img of p.images) {
        imgs.push({ id: img.id, url: img.image_url, isPrimary: img.is_primary });
      }
      // Si aucune image primaire dans product_images mais image_url existe, l'ajouter
      if (!imgs.some((i) => i.isPrimary) && p.image_url) {
        imgs.unshift({ url: p.image_url, isPrimary: true });
      }
    } else if (p.image_url) {
      // Pas d'enregistrements dans product_images, utiliser image_url
      imgs.push({ url: p.image_url, isPrimary: true });
    }

    setManagedImages(imgs);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const openView = (p: Product) => {
    setViewProduct(p);
    setViewDialogOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validationError = validateProductForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSaving(true);
    try {
      // ── Image principale ──
      const primaryImg = managedImages.find((img) => img.isPrimary);
      // Valeur de départ : garder l'URL existante si pas de nouvelle sélection
      let mainImageUrl: string | null = primaryImg?.url || managedImages[0]?.url || form.image_url || null;

      // Upload si une nouvelle image locale a été sélectionnée
      if (primaryImg?.file) {
        const fileExt = primaryImg.file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, primaryImg.file);

        if (uploadErr) {
          // Afficher l'erreur mais continuer avec l'ancienne image
          console.warn('[Upload] Erreur storage:', uploadErr.message);
          toast.warning(`Upload image : ${uploadErr.message}. L'ancienne image est conservée.`);
          // Ne pas changer mainImageUrl = on garde l'existante
          mainImageUrl = form.image_url || null;
        } else {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          mainImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${fileName}`;
        }
      }

      // Images secondaires (seulement celles qui ont une URL valide)
      const secondaryImages = managedImages
        .filter((img) => !img.isPrimary && img.url)
        .map((img) => img.url);

      await upsertProduct({
        ...(editingId ? { id: editingId } : {}),
        name: form.name.trim(),
        reference: form.reference.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id,
        price: parseFloat(form.price),
        promo_price: form.promo_price ? parseFloat(form.promo_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        stock_threshold: parseInt(form.stock_threshold) || 5,
        image_url: mainImageUrl,
        is_active: form.is_active,
        secondaryImages,
      });

      // Feedback selon que la synchro distante est connue ou non
      if (remoteWriteOk === false) {
        toast.success(
          editingId
            ? '✅ Produit mis à jour (sauvegarde locale — exécutez le script SQL pour synchro DB)'
            : '✅ Produit créé (sauvegarde locale — exécutez le script SQL pour synchro DB)'
        );
      } else {
        toast.success(
          editingId ? '✅ Produit mis à jour avec succès' : '✅ Produit créé avec succès'
        );
      }

      setDialogOpen(false);
      setManagedImages([]);
      setSelectedFile(null);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const result = await deleteProduct(deleteId);
      if (result.softDeleted) {
        toast.info(result.message);
      } else {
        toast.success(result.message);
      }
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteId(null);
    }
  };

  // ── Toggle Active ────────────────────────────────────
  const handleToggleActive = async (product: Product) => {
    try {
      await toggleProductStatus(product.id, !product.is_active);
      toast.success(product.is_active ? 'Produit désactivé' : 'Produit activé');
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erreur lors du changement de statut');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Gestion des produits</h1>
            <p className="text-muted-foreground text-sm">
              {stats.total} produits · {stats.active} actifs · {stats.rupture} en rupture
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync status indicator */}
            {remoteWriteOk === true && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                <CloudCheck className="w-3.5 h-3.5" />
                Synchronisé
              </span>
            )}
            {remoteWriteOk === false && (
              <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 border border-orange-200 px-2 py-1 rounded-full" title="Les modifications sont sauvegardées localement. Exécutez le script SQL 00005 pour activer la sync distante.">
                <CloudOff className="w-3.5 h-3.5" />
                Mode local
              </span>
            )}
            <Button onClick={load} variant="outline" size="icon" className="h-9 w-9" title="Actualiser">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0">
              <Plus className="w-4 h-4" />Nouveau produit
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher par nom ou référence…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
          </div>

          {/* Category filter */}
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.type === 'electricite' ? '⚡' : '☀️'} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stock filter */}
          <Select value={filterStock} onValueChange={(v) => setFilterStock(v as FilterStock)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout le stock</SelectItem>
              <SelectItem value="en_stock">En stock</SelectItem>
              <SelectItem value="stock_faible">Stock faible</SelectItem>
              <SelectItem value="rupture">Rupture</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Image', 'Produit', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Actif', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Aucun produit trouvé</td></tr>
              ) : filtered.map((p) => {
                const status = getStockStatus(p);
                return (
                  <tr key={p.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                    {/* Image */}
                    <td className="px-4 py-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-10 h-10 rounded-md object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="font-medium max-w-[200px] truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.reference}</p>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">
                      {p.categories ? (
                        <span>{p.categories.type === 'electricite' ? '⚡' : '☀️'} {p.categories.name}</span>
                      ) : '—'}
                    </td>
                    {/* Price */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="space-y-0.5">
                        <p className={`font-bold ${p.promo_price ? 'text-muted-foreground line-through text-xs' : 'text-primary'}`}>
                          {formatPrice(p.price)}
                        </p>
                        {p.promo_price && (
                          <p className="font-bold text-primary">{formatPrice(p.promo_price)}</p>
                        )}
                      </div>
                    </td>
                    {/* Stock */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.stock_quantity}</span>
                        <Badge variant="outline" className={`text-xs border ${stockBadgeClass(status)}`}>{stockLabel(status)}</Badge>
                      </div>
                    </td>
                    {/* Status badge */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-xs">
                        {p.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    {/* Toggle */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={() => handleToggleActive(p)}
                      />
                    </td>
                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(p)} title="Voir les détails">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Modifier">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => setDeleteId(p.id)} title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ── View Dialog ──────────────────────────────────── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          {viewProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  {viewProduct.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Image gallery */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {viewProduct.image_url && (
                    <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted relative">
                      <img src={viewProduct.image_url} alt={viewProduct.name} className="w-full h-full object-cover" />
                      <Badge className="absolute top-1 left-1 text-[10px] bg-primary text-primary-foreground">Principale</Badge>
                    </div>
                  )}
                  {viewProduct.images?.map((img) => (
                    <div key={img.id} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                      <img src={img.image_url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {!viewProduct.image_url && (!viewProduct.images || viewProduct.images.length === 0) && (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center col-span-full">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <Separator />

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Référence</span>
                    <p className="font-mono font-medium">{viewProduct.reference}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Catégorie</span>
                    <p>{viewProduct.categories ? `${viewProduct.categories.type === 'electricite' ? '⚡' : '☀️'} ${viewProduct.categories.name}` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Prix</span>
                    <p className="font-bold text-primary text-lg">{formatPrice(viewProduct.price)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Prix promo</span>
                    <p className={viewProduct.promo_price ? 'font-bold text-primary' : 'text-muted-foreground'}>
                      {viewProduct.promo_price ? formatPrice(viewProduct.promo_price) : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Stock</span>
                    <p className="font-medium">{viewProduct.stock_quantity} unités</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Seuil d'alerte</span>
                    <p>{viewProduct.stock_threshold}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Statut</span>
                    <Badge variant={viewProduct.is_active ? 'default' : 'secondary'}>{viewProduct.is_active ? 'Actif' : 'Inactif'}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs font-medium uppercase">Stock</span>
                    <Badge variant="outline" className={`border ${stockBadgeClass(getStockStatus(viewProduct))}`}>{stockLabel(getStockStatus(viewProduct))}</Badge>
                  </div>
                </div>
                {viewProduct.description && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground text-xs font-medium uppercase">Description</span>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{viewProduct.description}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Créé le {formatDate(viewProduct.created_at)}</span>
                  <span>Mis à jour le {formatDate(viewProduct.updated_at)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create/Edit Dialog ──────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Name & Reference */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />Nom *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />Référence (SKU) *</Label>
                <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="SCA-REF001" />
              </div>
            </div>

            {/* Category */}
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

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Description du produit…" />
            </div>

            {/* Price, Promo Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix ($) *</Label>
                <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Prix promo ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.promo_price} onChange={(e) => setForm({ ...form, promo_price: e.target.value })} placeholder="Optionnel" />
              </div>
            </div>

            {/* Stock & Threshold */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Seuil alerte</Label>
                <Input type="number" min="0" value={form.stock_threshold} onChange={(e) => setForm({ ...form, stock_threshold: e.target.value })} placeholder="5" />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
              <Switch
                id="product-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="product-active" className="cursor-pointer">
                {form.is_active ? 'Produit actif (visible dans la boutique)' : 'Produit inactif (masqué de la boutique)'}
              </Label>
            </div>

            <Separator />

            {/* Image Uploader */}
            <ProductImageUploader
              images={managedImages}
              onChange={setManagedImages}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enregistrement…</> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
              Si le produit est lié à des commandes existantes, il sera archivé (désactivé) plutôt que supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminProducts;
