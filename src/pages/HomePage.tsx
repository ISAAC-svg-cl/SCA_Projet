import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Wrench, Zap, Sun, Shield, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layouts/MainLayout';
import ProductCard from '@/components/ProductCard';
import { fetchProducts, fetchReviews } from '@/services/api';
import type { Product, Review } from '@/types/index';
import { StarRating } from '@/components/ProductCard';

// ── Hero ─────────────────────────────────────────────────────
const Hero: React.FC = () => (
  <section className="hero-gradient sca-bolt-bg relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary uppercase tracking-widest">SCA</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 text-balance">
          Votre partenaire en{' '}
          <span className="gradient-text">électricité et solutions solaires</span>
        </h1>
        <p className="text-secondary-foreground/70 text-lg mb-2">
          Électricité générale • Solutions solaires • Matériel électrique
        </p>
        <p className="text-secondary-foreground/50 text-sm mb-8">
          Disponibilité · Qualité · Accessibilité — Haut-Katanga, RDC
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Link to="/boutique">
              <ShoppingCart className="w-4 h-4" />
              Voir nos produits
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10 gap-2">
            <Link to="/services">
              <Wrench className="w-4 h-4" />
              Demander un service
            </Link>
          </Button>
        </div>
      </div>
      <div className="hidden md:flex justify-center">
        <div className="relative flex items-center justify-center">
          <img
            src="/logo.png?v=3"
            alt="SCA Logo"
            className="w-56 h-56 object-contain drop-shadow-2xl"
          />
          <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground rounded-lg px-3 py-2 text-xs font-semibold shadow-lg">
            Haut-Katanga, RDC
          </div>
        </div>
      </div>
    </div>
    <div className="section-divider" />
  </section>
);

// ── Stats ────────────────────────────────────────────────────
const stats = [
  { label: 'Produits disponibles', value: '200+', icon: ShoppingCart },
  { label: 'Services assurés', value: '8+', icon: Wrench },
  { label: 'Clients satisfaits', value: '500+', icon: Star },
  { label: 'Années d\'expérience', value: '5+', icon: Shield },
];

// ── Services overview ─────────────────────────────────────────
const servicesData = [
  {
    icon: Zap,
    title: 'Électricité Générale',
    items: ['Installation', 'Dépannage', 'Branchement', 'Rénovation', 'Maintenance'],
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Sun,
    title: 'Solutions Solaires',
    items: ['Étude & Dimensionnement', 'Installation', 'Maintenance', 'Dépannage'],
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: ShoppingCart,
    title: 'Vente de Matériel',
    items: ['Câbles', 'Disjoncteurs', 'Panneaux solaires', 'Batteries & Onduleurs'],
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

// ── Homepage ──────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts({ limit: 6 }), fetchReviews()])
      .then(([prods, revs]) => { setFeaturedProducts(prods); setReviews(revs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <Hero />

      {/* Stats */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center gap-2">
              <s.icon className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services overview */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold sca-heading-accent mb-6">
            Nos Services
          </h2>
          <p className="text-muted-foreground">Des solutions complètes pour tous vos besoins électriques et solaires.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {servicesData.map((svc) => (
            <Card key={svc.title} className="border border-border hover:border-primary/40 transition-colors">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${svc.bg} flex items-center justify-center mb-4`}>
                  <svc.icon className={`w-6 h-6 ${svc.color}`} />
                </div>
                <h3 className="font-bold text-foreground mb-3">{svc.title}</h3>
                <ul className="space-y-1.5">
                  {svc.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="ghost" size="sm" className="mt-4 text-primary hover:text-primary/80 p-0 h-auto">
                  <Link to="/services">En savoir plus →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-muted/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold sca-heading-accent mb-6">
                Produits Vedettes
              </h2>
              <p className="text-muted-foreground">Matériel électrique et solaire de qualité.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/boutique">Voir tout →</Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-lg aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA banner */}
      <section className="hero-gradient">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 text-center">
          <Sun className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-balance">
            Vous ne savez pas quoi choisir ?
          </h2>
          <p className="text-secondary-foreground/70 mb-8 max-w-xl mx-auto">
            Décrivez votre projet et nos experts SCA vous proposent une étude personnalisée et gratuite.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/conseil">Demander une étude gratuite</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10">
              <Link to="/devis">Demander un devis</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-bold sca-heading-accent mb-10">
            Avis de nos clients
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.slice(0, 6).map((r) => (
              <Card key={r.id} className="border border-border">
                <CardContent className="p-5">
                  <StarRating rating={r.rating} />
                  <p className="text-sm text-muted-foreground mt-3 italic leading-relaxed">
                    "{r.comment}"
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-3">— {r.author_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </MainLayout>
  );
};

export default HomePage;
