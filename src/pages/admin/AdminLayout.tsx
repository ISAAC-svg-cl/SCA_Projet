import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, FileText, MessageSquare,
  Users, BarChart2, Menu, X, Zap, LogOut, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

const navItems = [
  { label: 'Tableau de bord', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Produits', path: '/admin/produits', icon: Package },
  { label: 'Stock', path: '/admin/stock', icon: BarChart2 },
  { label: 'Commandes', path: '/admin/commandes', icon: ShoppingBag },
  { label: 'Factures', path: '/admin/factures', icon: FileText },
  { label: 'Devis', path: '/admin/devis', icon: MessageSquare },
  { label: 'Clients', path: '/admin/clients', icon: Users },
];

const AdminNavItem: React.FC<{ item: typeof navItems[0]; active: boolean; onClick?: () => void }> = ({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
    }`}
  >
    <item.icon className="w-4 h-4 shrink-0" />
    <span className="truncate">{item.label}</span>
    {active && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
  </Link>
);

const AdminSidebarContent: React.FC<{ onNav?: () => void }> = ({ onNav }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnecté');
    navigate('/admin');
  };

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img
          src="/logo.png?v=3"
          alt="SCA"
          className="w-10 h-10 object-contain"
        />
        <div>
          <p className="font-bold text-sidebar-foreground text-sm">SCA Admin</p>
          <p className="text-xs text-sidebar-foreground/50">Gestion</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <AdminNavItem
            key={item.path}
            item={item}
            active={location.pathname === item.path}
            onClick={onNav}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors"
        >
          <Zap className="w-4 h-4" />
          Voir le site
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive/80 hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { navigate('/admin'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).maybeSingle();
      const isAdmin = profile?.role === 'admin' || data.session.user.email === 'admin@sca.com';
      if (!isAdmin) { await supabase.auth.signOut(); navigate('/admin'); return; }
      setChecking(false);
    });
  }, [navigate]);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border">
        <AdminSidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AdminSidebarContent onNav={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-sm text-foreground">
            {navItems.find((n) => n.path === location.pathname)?.label || 'Administration'}
          </span>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
