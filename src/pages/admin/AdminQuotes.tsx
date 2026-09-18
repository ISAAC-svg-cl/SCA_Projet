import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminLayout from './AdminLayout';
import { fetchQuotes, updateQuoteStatus } from '@/services/api';
import { formatDate, quoteStatusLabel } from '@/lib/helpers';
import type { Quote } from '@/types/index';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  nouveau: 'text-blue-500 border-blue-500/30 bg-blue-500/5',
  en_cours: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5',
  traite: 'text-success border-success/30 bg-success/5',
  rejete: 'text-destructive border-destructive/30 bg-destructive/5',
};

const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Quote | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchQuotes(100).then(setQuotes).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = quotes.filter((q) =>
    !search.trim() ||
    q.full_name.toLowerCase().includes(search.toLowerCase()) ||
    q.project_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatus = async (id: string, status: Quote['status']) => {
    try {
      await updateQuoteStatus(id, status);
      toast.success('Statut mis à jour');
      load();
    } catch (err) { toast.error('Erreur'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Demandes de devis</h1>
          <p className="text-muted-foreground text-sm">{quotes.length} demandes</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-4 h-4" /></button>}
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                {['N° Devis', 'Client', 'Téléphone', 'Type de projet', 'Date', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : filtered.map((q) => (
                <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{q.quote_number || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{q.full_name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{q.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs max-w-[160px] truncate">{q.project_type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground text-xs">{formatDate(q.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Select value={q.status} onValueChange={(v) => handleStatus(q.id, v as Quote['status'])}>
                      <SelectTrigger className={`h-7 text-xs w-32 border ${statusColors[q.status] || ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['nouveau', 'en_cours', 'traite', 'rejete'].map((s) => (
                          <SelectItem key={s} value={s}>{quoteStatusLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(q)}><Eye className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>Devis – {selected?.full_name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Nom</p><p className="font-medium">{selected.full_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Téléphone</p><p className="font-medium">{selected.phone}</p></div>
                {selected.email && <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selected.email}</p></div>}
                <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{selected.project_type}</p></div>
                {selected.address && <div className="col-span-2"><p className="text-xs text-muted-foreground">Adresse</p><p className="font-medium">{selected.address}</p></div>}
              </div>
              <div><p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm bg-muted/40 rounded-lg p-3 leading-relaxed">{selected.description}</p>
              </div>
              {selected.photo_urls && selected.photo_urls.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Photos ({selected.photo_urls.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.photo_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full aspect-square object-cover rounded-md" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Statut</p>
                <Badge variant="outline" className={`text-xs border ${statusColors[selected.status] || ''}`}>
                  {quoteStatusLabel(selected.status)}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuotes;
