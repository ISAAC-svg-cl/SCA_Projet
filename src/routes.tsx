import React from 'react';
import type { ReactNode } from 'react';

import HomePage from './pages/HomePage';
import BoutiquePage from './pages/BoutiquePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import ServicesPage from './pages/ServicesPage';
import DevisPage from './pages/DevisPage';
import ContactPage from './pages/ContactPage';
import ConseilPage from './pages/ConseilPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminStock from './pages/admin/AdminStock';
import AdminOrders from './pages/admin/AdminOrders';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminQuotes from './pages/admin/AdminQuotes';
import AdminClients from './pages/admin/AdminClients';
import OrderTrackingPage from './pages/OrderTrackingPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  // ── Public pages ─────────────────────────────────────────────
  { name: 'Accueil',      path: '/',                element: <HomePage />,        public: true },
  { name: 'Boutique',     path: '/boutique',        element: <BoutiquePage />,    public: true },
  { name: 'Produit',      path: '/produit/:id',     element: <ProductDetailPage />, public: true },
  { name: 'Panier',       path: '/panier',          element: <CartPage />,        public: true },
  { name: 'Services',     path: '/services',        element: <ServicesPage />,    public: true },
  { name: 'Devis',        path: '/devis',           element: <DevisPage />,       public: true },
  { name: 'Contact',      path: '/contact',         element: <ContactPage />,     public: true },
  { name: 'Conseil',      path: '/conseil',         element: <ConseilPage />,     public: true },
  { name: 'Suivi commande', path: '/suivi-commande', element: <OrderTrackingPage />, public: true },

  // ── Admin ─────────────────────────────────────────────────────
  { name: 'Admin Login',    path: '/admin',                 element: <AdminLoginPage />,  public: true },
  { name: 'Dashboard',      path: '/admin/dashboard',       element: <AdminDashboard />,  public: false },
  { name: 'Produits Admin', path: '/admin/produits',        element: <AdminProducts />,   public: false },
  { name: 'Stock Admin',    path: '/admin/stock',           element: <AdminStock />,      public: false },
  { name: 'Commandes Admin',path: '/admin/commandes',       element: <AdminOrders />,     public: false },
  { name: 'Factures Admin', path: '/admin/factures',        element: <AdminInvoices />,   public: false },
  { name: 'Devis Admin',    path: '/admin/devis',           element: <AdminQuotes />,     public: false },
  { name: 'Clients Admin',  path: '/admin/clients',         element: <AdminClients />,    public: false },
];
