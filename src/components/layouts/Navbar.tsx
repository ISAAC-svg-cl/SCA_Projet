import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Zap, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

const navLinks = [
  { label: 'Accueil', path: '/' },
  { label: 'Quincaillerie', path: '/boutique' },
  { label: 'Services', path: '/services' },
  { label: 'Réalisations', path: '/realisations' },
  { label: 'Devis', path: '/devis' },
  { label: 'Suivi Commande', path: '/suivi-commande' },
  { label: 'Contact', path: '/contact' },
];

const Navbar: React.FC = () => {
  const { count } = useCart();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-secondary shadow-md">
      {/* Top strip */}
      <div className="bg-primary hidden md:flex items-center justify-end px-6 py-1 text-xs text-primary-foreground gap-4">
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 085 865 74 75</span>
        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 097 528 31 55</span>
      </div>

      {/* Main nav */}
      <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/logo.png?v=5"
            alt="Logo SCA"
            className="h-10 w-10 object-contain drop-shadow-sm"
          />
          <div className="hidden sm:block">
            <p className="font-bold text-primary-foreground text-sm leading-tight">SCA</p>
            <p className="text-xs text-secondary-foreground/70 leading-tight">Courant Alternatif</p>
          </div>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(link.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-secondary-foreground/80 hover:bg-secondary-foreground/10 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/admin" className="px-4 py-2 text-sm font-medium text-secondary-foreground/60 hover:text-white transition-colors">
            Admin
          </Link>
        </nav>

        {/* Cart + mobile menu */}
        <div className="flex items-center gap-2">
          <Link to="/panier">
            <Button variant="ghost" size="icon" className="relative text-secondary-foreground/80 hover:text-white hover:bg-secondary-foreground/10">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full">
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
            </Button>
          </Link>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-secondary-foreground/80 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
                <img
                  src="/logo.png?v=5"
                  alt="SCA"
                  className="h-12 w-12 object-contain drop-shadow-sm"
                />
                <div>
                  <p className="font-bold text-sidebar-foreground">SCA</p>
                  <p className="text-xs text-sidebar-foreground/60">Courant Alternatif</p>
                </div>
              </div>
              <nav className="flex flex-col p-4 gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
                >
                  Administration
                </Link>
              </nav>
              <div className="p-4 border-t border-sidebar-border mt-auto">
                <p className="text-xs text-sidebar-foreground/50 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-sidebar-primary" />
                  Haut-Katanga, RDC
                </p>
                <p className="text-xs text-sidebar-foreground/50 mt-1">085 865 74 75</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
