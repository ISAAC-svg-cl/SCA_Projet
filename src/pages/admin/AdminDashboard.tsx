import React, { useEffect, useState } from 'react';
import { Package, ShoppingBag, MessageSquare, Users, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import AdminLayout from './AdminLayout';
import { fetchDashboardStats } from '@/services/api';
import { formatPrice } from '@/lib/helpers';

interface Stats {
  todaySales: number;
  totalOrders: number;
  pendingQuotes: number;
  totalClients: number;
  totalProducts: number;
  enStock: number;
  stockFaible: number;
  rupture: number;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }> = ({
  label, value, icon: Icon, color, sub,
}) => (
  <Card className="border border-border">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-')}/10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((s) => setStats(s as Stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stockChartData = stats
    ? [
        { name: 'En stock', value: stats.enStock, fill: 'hsl(var(--success))' },
        { name: 'Stock faible', value: stats.stockFaible, fill: 'hsl(var(--warning))' },
        { name: 'Rupture', value: stats.rupture, fill: 'hsl(var(--destructive))' },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Ventes du jour" value={formatPrice(stats.todaySales)} icon={TrendingUp} color="text-success" sub="Commandes confirmées" />
              <StatCard label="Total commandes" value={stats.totalOrders} icon={ShoppingBag} color="text-primary" />
              <StatCard label="Devis en attente" value={stats.pendingQuotes} icon={MessageSquare} color="text-accent" />
              <StatCard label="Clients" value={stats.totalClients} icon={Users} color="text-foreground" />
            </div>

            {/* Stock cards */}
            <div>
              <h2 className="text-lg font-semibold mb-3">État du stock ({stats.totalProducts} produits)</h2>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border border-border bg-green-500/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">En stock</p>
                      <p className="text-xl font-bold text-green-500">{stats.enStock}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border bg-yellow-500/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/10 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stock faible</p>
                      <p className="text-xl font-bold text-yellow-500">{stats.stockFaible}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border border-border bg-destructive/5">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rupture</p>
                      <p className="text-xl font-bold text-destructive">{stats.rupture}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Stock chart */}
            <Card className="border border-border">
              <CardHeader><CardTitle className="text-base">Répartition du stock</CardTitle></CardHeader>
              <CardContent>
                <div className="w-full min-w-0 overflow-hidden" style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockChartData} barSize={48}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => [v, 'Produits']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {stockChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-muted-foreground">Impossible de charger les statistiques.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
