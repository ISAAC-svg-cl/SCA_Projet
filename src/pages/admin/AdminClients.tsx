import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AdminLayout from './AdminLayout';
import { fetchClients } from '@/services/api';
import { formatDate } from '@/lib/helpers';
import type { Client } from '@/types/index';

const AdminClients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchClients(200).then(setClients).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter((c) =>
    !search.trim() ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">{clients.length} clients enregistrés</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, téléphone ou email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-4 h-4" /></button>}
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Nom', 'Téléphone', 'Email', 'Adresse', 'Date d\'inscription'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Aucun client trouvé</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{c.full_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{c.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs max-w-[180px] truncate">{c.address || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
