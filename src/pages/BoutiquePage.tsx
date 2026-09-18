import React, { useEffect, useState, useCallback } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { fetchCategories, fetchProducts } from '@/services/api';
import type { Category, Product } from '@/types/index';

const BoutiquePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    fetchProducts({
      categoryId: selectedCat !== 'all' ? selectedCat : undefined,
      search: search.trim() || undefined,
      limit: 60,
    })
      .then((prods) => {
        const filtered = selectedType !== 'all'
          ? prods.filter((p) => p.categories?.type === selectedType)
          : prods;
        setProducts(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCat, selectedType, search]);

  useEffect(() => { load(); }, [load]);

  const electriciteCategories = categories.filter((c) => c.type === 'electricite');
  const solaireCategories = categories.filter((c) => c.type === 'solaire');

  return (
    <MainLayout>
      {/* Header */}
      <div className="hero-gradient border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
          <h1 className="text-3xl font-bold text-white mb-2">Catalogue</h1>
          <p className="text-secondary-foreground/70">Matériel électrique et solutions solaires</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={load} className="shrink-0">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Rechercher
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="md:w-56 shrink-0">
            <div className="bg-card border border-border rounded-lg p-4 sticky top-24">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Filtres
              </h2>

              {/* All */}
              <Button
                variant={selectedCat === 'all' && selectedType === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start mb-2"
                onClick={() => { setSelectedCat('all'); setSelectedType('all'); }}
              >
                Tous les produits
              </Button>

              {/* Électricité group */}
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mt-4 mb-2 px-2">
                ⚡ Électricité
              </p>
              <Button
                variant={selectedType === 'electricite' && selectedCat === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start mb-1"
                onClick={() => { setSelectedType('electricite'); setSelectedCat('all'); }}
              >
                Tout — Électricité
              </Button>
              {electriciteCategories.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedCat === c.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start mb-1 text-xs"
                  onClick={() => { setSelectedCat(c.id); setSelectedType('electricite'); }}
                >
                  {c.name}
                </Button>
              ))}

              {/* Solaire group */}
              <p className="text-xs font-semibold text-accent uppercase tracking-widest mt-4 mb-2 px-2">
                ☀️ Solaire
              </p>
              <Button
                variant={selectedType === 'solaire' && selectedCat === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="w-full justify-start mb-1"
                onClick={() => { setSelectedType('solaire'); setSelectedCat('all'); }}
              >
                Tout — Solaire
              </Button>
              {solaireCategories.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedCat === c.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start mb-1 text-xs"
                  onClick={() => { setSelectedCat(c.id); setSelectedType('solaire'); }}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Chargement…' : `${products.length} produit${products.length !== 1 ? 's' : ''}`}
              </p>
              {selectedCat !== 'all' && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCat('all')}>
                  {categories.find((c) => c.id === selectedCat)?.name} ×
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-muted animate-pulse rounded-lg aspect-[3/4]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Aucun produit trouvé</p>
                <p className="text-sm">Essayez une autre recherche ou catégorie</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BoutiquePage;
