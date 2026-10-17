import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search, X, Eye, Loader2, Plus, FileDown, Trash2, Phone,
  MessageCircle, UserPlus, RefreshCw, Calculator, Trash, Edit3,
  Copy, ShoppingCart, Mail, Printer, ExternalLink, Calendar,
  Building, MapPin, CheckCircle, Clock, AlertTriangle, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AdminLayout from './AdminLayout';
import {
  fetchQuotes, createQuote, updateQuote, deleteQuote,
  duplicateQuote, convertQuoteToOrder, fetchClients
} from '@/services/api';
import { formatDate, quoteStatusLabel } from '@/lib/helpers';
import { generateQuotePDF } from '@/lib/pdfGenerator';
import type { Quote, QuoteItem, Client, QuoteStatus } from '@/types/index';
import { toast } from 'sonner';

const STATUS_LIST: QuoteStatus[] = [
  'brouillon',
  'envoye',
  'accepte',
  'refuse',
  'expire',
];

const statusColors: Record<string, string> = {
  brouillon: 'text-slate-600 border-slate-300 bg-slate-100 dark:bg-slate-900 dark:text-slate-400',
  envoye: 'text-blue-600 border-blue-400/40 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
  accepte: 'text-emerald-700 border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
  refuse: 'text-rose-600 border-rose-400/40 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
  expire: 'text-amber-700 border-amber-400/40 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  nouveau: 'text-blue-600 border-blue-400/40 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
  en_cours: 'text-amber-600 border-amber-400/40 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
  traite: 'text-emerald-600 border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
  rejete: 'text-rose-600 border-rose-400/40 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
};

const projectTypeOptions = [
  'Installation électrique résidentielle',
  'Installation électrique commerciale / industrielle',
  'Système solaire résidentiel & hybride',
  'Système solaire commercial / pompage',
  'Rénovation & Mise aux normes électriques',
  'Tableau électrique, Câblage & Disjoncteurs',
  'Maintenance, Dépannage & Visite technique',
  'Éclairage public / Éclairage architectural',
  'Fourniture de matériel électrique au comptoir',
  'Autre projet sur mesure',
];

const unitOptions = ['pièce', 'mètre', 'rouleau', 'boîte', 'forfait', 'jour', 'heure', 'ensemble', 'kit'];

const PRESET_QUICK_ITEMS = [
  { label: 'Panneau Solaire', designation: 'Panneau Solaire Monocristallin 450W / 550W', unit: 'pièce', description: 'Module photovoltaïque haute performance' },
  { label: 'Batterie Solaire', designation: 'Batterie Solaire Cycle Profond (GEL / Lithium)', unit: 'pièce', description: 'Stockage d\'énergie solaire' },
  { label: 'Onduleur Hybride', designation: 'Onduleur Solaire Hybride Pure Sinus MPPT', unit: 'pièce', description: 'Conversion et gestion de charge solaire' },
  { label: 'Câbles Électriques', designation: 'Câble Électrique Cuivre VOB / TH', unit: 'mètre', description: 'Câblage d\'alimentation et raccordement' },
  { label: 'Disjoncteur / Différentiel', designation: 'Disjoncteur Divisionnaire / Différentiel', unit: 'pièce', description: 'Protection contre surintensités et courts-circuits' },
  { label: 'Tableau Électrique', designation: 'Tableau de Distribution Électrique & Coffret', unit: 'ensemble', description: 'Coffret étanche équipé avec borniers et peignes' },
  { label: 'Prises & Interrupteurs', designation: 'Prises de courant & Interrupteurs muraux', unit: 'pièce', description: 'Appareillage électrique encastré ou en saillie' },
  { label: 'Main-d\'œuvre & Montage', designation: 'Main-d\'œuvre qualifiée & Installation technique', unit: 'forfait', description: 'Exécution des travaux par l\'équipe d\'ingénieurs et techniciens SCA' },
  { label: 'Transport / Déplacement', designation: 'Transport du matériel & Déplacement sur chantier', unit: 'forfait', description: 'Logistique et acheminement sur le site des travaux' },
];

const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<Quote | null>(null);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Suppression
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Formulaire Devis (Création & Modification)
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientMode, setClientMode] = useState<'new' | 'existing'>('new');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    work_location: '',
    project_type: 'Système solaire résidentiel & hybride',
    custom_project_type: '',
    description: '',
    currency: 'USD' as 'USD' | 'CDF',
    discount: 0,
    transport_fee: 0,
    payment_terms: '60% à la commande, solde après réalisation / réception.',
    execution_delay: '3 à 7 jours ouvrés après confirmation.',
    validity_days: 30,
    observations: '',
    responsible_name: 'Ingénieur Juniace Atanaz',
    status: 'brouillon' as QuoteStatus,
  });

  const [items, setItems] = useState<QuoteItem[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    fetchQuotes(200)
      .then(setQuotes)
      .catch((err) => {
        console.error(err);
        toast.error('Erreur lors du chargement des devis');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadClients = async () => {
    if (clients.length === 0) {
      try {
        const list = await fetchClients(100);
        setClients(list);
      } catch (e) {
        console.warn('Impossible de charger les clients:', e);
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingQuoteId(null);
    setForm({
      full_name: '',
      phone: '',
      email: '',
      address: '',
      work_location: '',
      project_type: 'Système solaire résidentiel & hybride',
      custom_project_type: '',
      description: '',
      currency: 'USD',
      discount: 0,
      transport_fee: 0,
      payment_terms: '60% à la commande, solde après réalisation / réception.',
      execution_delay: '3 à 7 jours ouvrés après confirmation.',
      validity_days: 30,
      observations: '',
      responsible_name: 'Ingénieur Juniace Atanaz',
      status: 'brouillon',
    });
    setItems([
      { reference: 'MAT-01', designation: '', description: '', unit: 'pièce', quantity: 1, unit_price: 0, total: 0 }
    ]);
    setClientMode('new');
    setFormOpen(true);
    loadClients();
  };

  const handleOpenEdit = (quote: Quote) => {
    setEditingQuoteId(quote.id);
    setForm({
      full_name: quote.full_name || '',
      phone: quote.phone || '',
      email: quote.email || '',
      address: quote.address || '',
      work_location: quote.work_location || '',
      project_type: projectTypeOptions.includes(quote.project_type)
        ? quote.project_type
        : 'Autre projet sur mesure',
      custom_project_type: projectTypeOptions.includes(quote.project_type) ? '' : quote.project_type,
      description: quote.description || '',
      currency: quote.currency || 'USD',
      discount: quote.discount || 0,
      transport_fee: quote.transport_fee || 0,
      payment_terms: quote.payment_terms || '60% à la commande, solde après réalisation / réception.',
      execution_delay: quote.execution_delay || '3 à 7 jours ouvrés après confirmation.',
      validity_days: quote.validity_days || 30,
      observations: quote.observations || '',
      responsible_name: quote.responsible_name || 'Ingénieur Juniace Atanaz',
      status: quote.status || 'brouillon',
    });

    if (quote.items && quote.items.length > 0) {
      setItems(quote.items.map((it) => ({ ...it })));
    } else {
      setItems([
        { reference: 'MAT-01', designation: '', description: '', unit: 'pièce', quantity: 1, unit_price: 0, total: 0 }
      ]);
    }

    setClientMode('new');
    setFormOpen(true);
    loadClients();
  };

  const handleSelectExistingClient = (clientId: string) => {
    const c = clients.find((client) => client.id === clientId);
    if (c) {
      setForm((prev) => ({
        ...prev,
        full_name: c.full_name || '',
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        work_location: c.address || prev.work_location,
      }));
    }
  };

  // Gestion des lignes de matériel / prestations
  const handleAddItem = () => {
    const nextIdx = items.length + 1;
    const ref = `MAT-${nextIdx < 10 ? '0' : ''}${nextIdx}`;
    setItems((prev) => [
      ...prev,
      { reference: ref, designation: '', description: '', unit: 'pièce', quantity: 1, unit_price: 0, total: 0 }
    ]);
  };

  const handleAddPresetItem = (preset: { designation: string; unit: string; description?: string }) => {
    const nextIdx = items.length + 1;
    const ref = `MAT-${nextIdx < 10 ? '0' : ''}${nextIdx}`;
    setItems((prev) => [
      ...prev,
      {
        reference: ref,
        designation: preset.designation,
        description: preset.description || '',
        unit: preset.unit || 'pièce',
        quantity: 1,
        unit_price: 0,
        total: 0
      }
    ]);
    toast.success(`Ajouté : ${preset.designation}`);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof QuoteItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const updatedItem = { ...copy[idx], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = Number(field === 'quantity' ? value : updatedItem.quantity) || 0;
        const pu = Number(field === 'unit_price' ? value : updatedItem.unit_price) || 0;
        updatedItem.total = qty * pu;
      }
      copy[idx] = updatedItem;
      return copy;
    });
  };

  // Calculs financiers
  const subtotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.total) || (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)), 0);
  }, [items]);

  const discountAmount = useMemo(() => Number(form.discount) || 0, [form.discount]);
  const transportFee = useMemo(() => Number(form.transport_fee) || 0, [form.transport_fee]);
  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + transportFee);
  }, [subtotal, discountAmount, transportFee]);

  const currencySymbol = form.currency === 'CDF' ? 'FC' : '$';

  // Soumission du devis (création ou mise à jour)
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error('Le nom complet du client est obligatoire');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Le numéro de téléphone du client est obligatoire');
      return;
    }

    const finalProjectType =
      form.project_type === 'Autre projet sur mesure'
        ? form.custom_project_type.trim() || 'Projet sur mesure'
        : form.project_type;

    const validItems = items
      .filter((it) => it.designation.trim())
      .map((it) => ({
        ...it,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      }));

    let autoDesc = form.description.trim();
    if (validItems.length > 0 && !autoDesc) {
      autoDesc = `Devis chiffré comprenant ${validItems.length} poste(s) de fournitures et prestations.`;
    }

    setSubmitting(true);
    try {
      if (editingQuoteId) {
        // Modification
        const updated = await updateQuote(editingQuoteId, {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          work_location: form.work_location.trim() || null,
          project_type: finalProjectType,
          description: autoDesc,
          currency: form.currency,
          items: validItems,
          subtotal,
          discount: discountAmount,
          transport_fee: transportFee,
          total_amount: totalAmount,
          payment_terms: form.payment_terms.trim() || null,
          execution_delay: form.execution_delay.trim() || null,
          validity_days: Number(form.validity_days) || 30,
          observations: form.observations.trim() || null,
          responsible_name: form.responsible_name.trim() || 'Ingénieur Juniace Atanaz',
          status: form.status,
        });

        toast.success(`Devis ${updated.quote_number} modifié avec succès !`);
        if (selected?.id === editingQuoteId) setSelected(updated);
      } else {
        // Création
        const created = await createQuote({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          work_location: form.work_location.trim() || null,
          project_type: finalProjectType,
          description: autoDesc,
          currency: form.currency,
          items: validItems,
          subtotal,
          discount: discountAmount,
          transport_fee: transportFee,
          total_amount: totalAmount,
          payment_terms: form.payment_terms.trim() || null,
          execution_delay: form.execution_delay.trim() || null,
          validity_days: Number(form.validity_days) || 30,
          observations: form.observations.trim() || null,
          responsible_name: form.responsible_name.trim() || 'Ingénieur Juniace Atanaz',
          status: form.status,
        });

        toast.success(`Devis ${created.quote_number} créé avec succès pour ${created.full_name} !`);
      }

      setFormOpen(false);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erreur lors de l\'enregistrement du devis');
    } finally {
      setSubmitting(false);
    }
  };

  // Duplication
  const handleDuplicate = async (quote: Quote) => {
    try {
      const duplicated = await duplicateQuote(quote.id);
      toast.success(`Devis dupliqué avec succès : ${duplicated.quote_number}`);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erreur lors de la duplication');
    }
  };

  // Conversion en commande
  const handleConvertToOrder = async (quote: Quote) => {
    setConvertingId(quote.id);
    try {
      const res = await convertQuoteToOrder(quote);
      toast.success(`Devis ${quote.quote_number} validé et converti en commande N° ${res.orderNumber} !`);
      load();
      if (selected?.id === quote.id) {
        setSelected({ ...quote, status: 'accepte', converted_order_id: res.orderId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erreur lors de la conversion en commande');
    } finally {
      setConvertingId(null);
    }
  };

  // Statut rapide
  const handleStatusChange = async (id: string, status: QuoteStatus) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : null));

    try {
      await updateQuote(id, { status });
      toast.success(`Statut mis à jour : ${quoteStatusLabel(status)}`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour du statut');
      load();
    }
  };

  // Téléchargement PDF
  const handleDownloadPDF = async (quote: Quote) => {
    setPdfLoading(quote.id);
    try {
      await generateQuotePDF(quote);
      toast.success(`Devis ${quote.quote_number} téléchargé`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération du devis PDF');
    } finally {
      setPdfLoading(null);
    }
  };

  // Suppression
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteQuote(deleteId);
      toast.success('Devis supprimé avec succès');
      if (selected?.id === deleteId) setSelected(null);
      setDeleteId(null);
      load();
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // Envoi WhatsApp & Email
  const getWhatsAppLink = (quote: Quote) => {
    let clean = quote.phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '243' + clean.slice(1);
    else if (!clean.startsWith('243')) clean = '243' + clean;

    const curr = quote.currency === 'CDF' ? 'FC' : '$';
    const total = quote.total_amount ? `${quote.total_amount.toFixed(2)} ${curr}` : 'sur étude';

    const text = encodeURIComponent(
      `Bonjour ${quote.full_name},\n\n` +
      `La Société du Courant Alternatif (SCA) vous transmet votre Devis N° ${quote.quote_number}.\n` +
      `• Projet : ${quote.project_type}\n` +
      `• Montant total estimé : ${total}\n` +
      `• Validité de l'offre : ${quote.validity_days || 30} jours\n\n` +
      `Direction Technique : Ingénieur Juniace Atanaz\n` +
      `SCA — « Disponibilité • Qualité • Accessibilité »\n` +
      `Tél : 085 865 74 75 / 097 528 31 55`
    );
    return `https://wa.me/${clean}?text=${text}`;
  };

  const getEmailLink = (quote: Quote) => {
    const curr = quote.currency === 'CDF' ? 'FC' : '$';
    const total = quote.total_amount ? `${quote.total_amount.toFixed(2)} ${curr}` : 'sur étude';
    const subject = encodeURIComponent(`SCA — Devis N° ${quote.quote_number} - ${quote.project_type}`);
    const body = encodeURIComponent(
      `Bonjour ${quote.full_name},\n\n` +
      `Veuillez trouver ci-dessous le résumé de votre devis établi par la Société du Courant Alternatif (SCA) :\n\n` +
      `N° Devis : ${quote.quote_number}\n` +
      `Projet : ${quote.project_type}\n` +
      `Lieu des travaux : ${quote.work_location || quote.address || 'Selon convenance'}\n` +
      `Montant total : ${total}\n` +
      `Conditions de règlement : ${quote.payment_terms || '60% à la commande, solde à la livraison.'}\n` +
      `Délai d'exécution : ${quote.execution_delay || '3 à 7 jours ouvrés.'}\n\n` +
      `Nous restons à votre entière disposition pour toute visite technique sur terrain ou validation.\n\n` +
      `Cordialement,\n` +
      `Ingénieur Juniace Atanaz\n` +
      `Société du Courant Alternatif (SCA)\n` +
      `Tél : 085 865 74 75 / 097 528 31 55`
    );
    return `mailto:${quote.email || ''}?subject=${subject}&body=${body}`;
  };

  // Filtrage
  const filtered = quotes.filter((q) => {
    const term = search.toLowerCase().trim();
    const matchSearch =
      !term ||
      (q.quote_number && q.quote_number.toLowerCase().includes(term)) ||
      q.full_name.toLowerCase().includes(term) ||
      q.phone.includes(term) ||
      (q.email && q.email.toLowerCase().includes(term)) ||
      q.project_type.toLowerCase().includes(term) ||
      (q.work_location && q.work_location.toLowerCase().includes(term));

    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = useMemo(() => {
    return {
      all: quotes.length,
      brouillon: quotes.filter((q) => q.status === 'brouillon').length,
      envoye: quotes.filter((q) => q.status === 'envoye' || q.status === 'en_cours' || q.status === 'nouveau').length,
      accepte: quotes.filter((q) => q.status === 'accepte' || q.status === 'traite').length,
      refuse: quotes.filter((q) => q.status === 'refuse' || q.status === 'rejete').length,
      expire: quotes.filter((q) => q.status === 'expire').length,
    };
  }, [quotes]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* En-tête de page */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Gestion des devis</h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                Espace Admin
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Créez des devis chiffrés personnalisés, gérez les fournitures et prestations, exportez en PDF officiel et convertissez en commande.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={handleOpenCreate} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              Nouveau devis professionnel
            </Button>
          </div>
        </div>

        {/* Onglets de filtre de statut */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
            className="text-xs h-8"
          >
            Tous <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">{counts.all}</Badge>
          </Button>
          <Button
            variant={filterStatus === 'brouillon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('brouillon')}
            className="text-xs h-8 text-slate-700 dark:text-slate-300"
          >
            Brouillons <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">{counts.brouillon}</Badge>
          </Button>
          <Button
            variant={filterStatus === 'envoye' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('envoye')}
            className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Envoyés / En cours <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] bg-blue-100 text-blue-700">{counts.envoye}</Badge>
          </Button>
          <Button
            variant={filterStatus === 'accepte' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('accepte')}
            className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            Acceptés <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] bg-emerald-100 text-emerald-700">{counts.accepte}</Badge>
          </Button>
          <Button
            variant={filterStatus === 'refuse' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('refuse')}
            className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Refusés <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] bg-rose-100 text-rose-700">{counts.refuse}</Badge>
          </Button>
          <Button
            variant={filterStatus === 'expire' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('expire')}
            className="text-xs h-8 text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            Expirés <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] bg-amber-100 text-amber-700">{counts.expire}</Badge>
          </Button>
        </div>

        {/* Recherche */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par N° devis, client, téléphone, lieu des travaux…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tableau principal des devis */}
        <div className="w-full max-w-full overflow-x-auto bg-card rounded-lg border border-border shadow-sm">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['N° Devis', 'Client & Contact', 'Projet & Chantier', 'Lignes', 'Montant Total', 'Émission', 'Statut', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    <p className="text-xs text-muted-foreground mt-2">Chargement des devis SCA…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Aucun devis trouvé</p>
                    <p className="text-xs mt-1">Créez votre premier devis professionnel avec le bouton ci-dessus.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => {
                  const currSym = q.currency === 'CDF' ? 'FC' : '$';
                  const totalFormatted = q.total_amount
                    ? `${q.total_amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${currSym}`
                    : 'Sur étude';

                  return (
                    <tr
                      key={q.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      {/* N° Devis */}
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-primary">
                        {q.quote_number || '—'}
                      </td>

                      {/* Client */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{q.full_name}</span>
                          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {q.phone}
                          </span>
                        </div>
                      </td>

                      {/* Projet & Chantier */}
                      <td className="whitespace-nowrap px-4 py-3 max-w-[220px]">
                        <p className="text-xs font-medium truncate" title={q.project_type}>{q.project_type}</p>
                        {q.work_location && (
                          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0 text-primary" />
                            {q.work_location}
                          </p>
                        )}
                      </td>

                      {/* Nombre de lignes */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-center">
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {q.items ? q.items.length : 1} art.
                        </Badge>
                      </td>

                      {/* Montant total */}
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-sm text-foreground">
                        {totalFormatted}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(q.created_at)}
                      </td>

                      {/* Statut modifiable */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <Select
                          value={q.status}
                          onValueChange={(v) => handleStatusChange(q.id, v as QuoteStatus)}
                        >
                          <SelectTrigger className={`h-7 text-xs w-36 border font-medium ${statusColors[q.status] || ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_LIST.map((s) => (
                              <SelectItem key={s} value={s}>
                                {quoteStatusLabel(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            title="Consulter les détails"
                            onClick={() => setSelected(q)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            title="Modifier ce devis"
                            onClick={() => handleOpenEdit(q)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            title="Télécharger le devis PDF officiel"
                            disabled={pdfLoading === q.id}
                            onClick={() => handleDownloadPDF(q)}
                          >
                            {pdfLoading === q.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <FileDown className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-primary"
                            title="Dupliquer ce devis"
                            onClick={() => handleDuplicate(q)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {q.converted_order_id ? (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800">
                              Converti
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Convertir en commande"
                              disabled={convertingId === q.id}
                              onClick={() => handleConvertToOrder(q)}
                            >
                              {convertingId === q.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShoppingCart className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            title="Supprimer"
                            onClick={() => setDeleteId(q.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRÉATION / ÉDITION DE DEVIS */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[92dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editingQuoteId ? 'Modifier le devis' : 'Créer un devis professionnel SCA'}
            </DialogTitle>
            <DialogDescription>
              Établissez une proposition chiffrée avec toutes les fournitures, matériels, main-d'œuvre et conditions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveQuote} className="space-y-6 pt-2">
            {/* 1. SECTION CLIENT & CHANTIER */}
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  1. Informations Client & Chantier
                </h3>

                {!editingQuoteId && (
                  <div className="flex text-xs bg-muted/60 p-0.5 rounded-md">
                    <button
                      type="button"
                      onClick={() => setClientMode('new')}
                      className={`px-2.5 py-1 rounded-sm ${clientMode === 'new' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
                    >
                      Nouveau client
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientMode('existing')}
                      className={`px-2.5 py-1 rounded-sm ${clientMode === 'existing' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
                    >
                      Client enregistré ({clients.length})
                    </button>
                  </div>
                )}
              </div>

              {clientMode === 'existing' && !editingQuoteId && (
                <div className="space-y-1.5 p-2.5 bg-muted/30 rounded-md">
                  <Label className="text-xs">Sélectionner un client dans la base</Label>
                  <Select onValueChange={handleSelectExistingClient}>
                    <SelectTrigger className="text-xs bg-card">
                      <SelectValue placeholder="Choisir un client…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.full_name} — {c.phone} {c.address ? `(${c.address})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nom complet du client <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Ex: Juniace Kitungwa"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Téléphone <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Ex: 085 865 74 75"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Adresse e-mail (optionnel)</Label>
                  <Input
                    type="email"
                    placeholder="client@domaine.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2 md:col-span-1">
                  <Label className="text-xs">Adresse physique du client</Label>
                  <Input
                    placeholder="Ex: Av. Kamanyola N° 12, Lubumbashi"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-medium text-foreground">
                    Lieu des travaux / Localisation du chantier
                  </Label>
                  <Input
                    placeholder="Ex: Chantier Villa Golf Météo, Lubumbashi (ou idem adresse)"
                    value={form.work_location}
                    onChange={(e) => setForm({ ...form, work_location: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. SECTION FOURNITURES & PRESTATIONS (ILLIMITÉES) */}
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    2. Lignes de Fournitures, Matériels & Prestations
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Ajoutez autant de lignes que nécessaire : câbles, disjoncteurs, panneaux solaires, batteries, main-d'œuvre, déplacement…
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Devise :</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => setForm({ ...form, currency: v as 'USD' | 'CDF' })}
                  >
                    <SelectTrigger className="h-7 text-xs w-24 font-bold text-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="CDF">CDF (FC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2.5">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/20 border border-border/70 rounded-lg space-y-2 relative group hover:border-border transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground">Poste #{idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-destructive/70 hover:text-destructive text-xs gap-1"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash className="w-3 h-3" />
                        Supprimer
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Référence</Label>
                        <Input
                          placeholder="Réf"
                          value={it.reference || ''}
                          onChange={(e) => handleItemChange(idx, 'reference', e.target.value)}
                          className="text-xs font-mono h-8"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <Label className="text-[10px] text-muted-foreground">Désignation de la fourniture / prestation <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder="Ex: Panneau solaire monocristallin 450W"
                          value={it.designation}
                          onChange={(e) => handleItemChange(idx, 'designation', e.target.value)}
                          required
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Unité</Label>
                        <Select
                          value={it.unit || 'pièce'}
                          onValueChange={(v) => handleItemChange(idx, 'unit', v)}
                        >
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-1">
                        <Label className="text-[10px] text-muted-foreground">Qté</Label>
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="text-xs h-8 text-center font-mono"
                        />
                      </div>
                      <div className="sm:col-span-1.5">
                        <Label className="text-[10px] text-muted-foreground">P.U. ({currencySymbol})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={it.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          className="text-xs h-8 text-right font-mono"
                        />
                      </div>
                      <div className="sm:col-span-1.5 flex flex-col justify-end">
                        <Label className="text-[10px] text-muted-foreground text-right">Total</Label>
                        <div className="text-xs font-bold font-mono text-primary text-right py-1.5">
                          {((Number(it.quantity) || 0) * (Number(it.unit_price) || 0)).toFixed(2)} {currencySymbol}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Input
                        placeholder="Description complémentaire / Spécification technique (optionnel)"
                        value={it.description || ''}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="text-[11px] h-7 bg-card text-muted-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter une ligne personnalisée
                  </Button>
                </div>

                {/* Suggestions d'ajout rapide de matériels & prestations */}
                <div className="p-2.5 bg-muted/40 rounded-lg border border-border/60 space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    ⚡ Ajout rapide de fournitures & prestations SCA :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_QUICK_ITEMS.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleAddPresetItem(preset)}
                        className="text-[11px] px-2.5 py-1 bg-card hover:bg-primary/10 border border-border/80 hover:border-primary/40 rounded-md text-foreground transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-2.5 h-2.5 text-primary" />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Récapitulatif et totaux */}
              <div className="border-t border-border pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-3 max-w-sm w-full">
                  <div>
                    <Label className="text-[11px]">Remise commerciale ({currencySymbol})</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">Transport / Déplacement ({currencySymbol})</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.transport_fee}
                      onChange={(e) => setForm({ ...form, transport_fee: Number(e.target.value) })}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                </div>

                <div className="text-right space-y-1 w-full sm:w-auto">
                  <div className="text-xs text-muted-foreground">
                    Sous-total : <span className="font-mono font-medium">{subtotal.toFixed(2)} {currencySymbol}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="text-xs text-rose-600">
                      Remise : <span className="font-mono font-medium">- {discountAmount.toFixed(2)} {currencySymbol}</span>
                    </div>
                  )}
                  {transportFee > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Transport / Déplacement : <span className="font-mono font-medium">+ {transportFee.toFixed(2)} {currencySymbol}</span>
                    </div>
                  )}
                  <div className="text-base font-bold text-primary pt-1 border-t border-border">
                    TOTAL GÉNÉRAL : <span className="font-mono text-lg ml-1">{totalAmount.toFixed(2)} {currencySymbol}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SECTION CONDITIONS CONTRACTUELLES & DÉTAILS */}
            <div className="border border-border rounded-lg p-4 bg-card space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5 border-b border-border pb-2">
                <Clock className="w-3.5 h-3.5" />
                3. Conditions contractuelles, Délais & Responsable SCA
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Conditions de règlement</Label>
                  <Input
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Délai d'exécution</Label>
                  <Input
                    value={form.execution_delay}
                    onChange={(e) => setForm({ ...form, execution_delay: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Durée de validité (jours)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.validity_days}
                    onChange={(e) => setForm({ ...form, validity_days: Number(e.target.value) })}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Responsable émetteur SCA</Label>
                  <Input
                    value={form.responsible_name}
                    onChange={(e) => setForm({ ...form, responsible_name: e.target.value })}
                    className="text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Statut du devis</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as QuoteStatus })}
                  >
                    <SelectTrigger className={`text-xs ${statusColors[form.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_LIST.map((s) => (
                        <SelectItem key={s} value={s}>{quoteStatusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type de projet global</Label>
                  <Select
                    value={form.project_type}
                    onValueChange={(v) => setForm({ ...form, project_type: v })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Observations techniques & Notes de réalisation</Label>
                <Textarea
                  rows={2}
                  placeholder="Précisions sur les normes électriques, garanties sur les matériels solaires, accès au chantier…"
                  value={form.observations}
                  onChange={(e) => setForm({ ...form, observations: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {editingQuoteId ? 'Enregistrer les modifications' : 'Générer & Enregistrer le devis'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CONSULTATION DÉTAILLÉE D'UN DEVIS */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-lg flex items-center gap-2">
                  Devis N° {selected?.quote_number}
                  {selected && (
                    <Badge variant="outline" className={`text-xs ${statusColors[selected.status]}`}>
                      {quoteStatusLabel(selected.status)}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Émis le {selected ? formatDate(selected.created_at) : ''} • Responsable : {selected?.responsible_name || 'Ingénieur Juniace Atanaz'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 text-sm pt-2">
              {/* Actions rapides de diffusion */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border">
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5 text-xs h-8 bg-primary text-primary-foreground"
                  disabled={pdfLoading === selected.id}
                  onClick={() => handleDownloadPDF(selected)}
                >
                  {pdfLoading === selected.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  Télécharger Devis PDF
                </Button>

                <a
                  href={getWhatsAppLink(selected)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Partager sur WhatsApp
                </a>

                {selected.email && (
                  <a
                    href={getEmailLink(selected)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Envoyer par Email
                  </a>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => handleOpenEdit(selected)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modifier
                </Button>

                {!selected.converted_order_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    disabled={convertingId === selected.id}
                    onClick={() => handleConvertToOrder(selected)}
                  >
                    {convertingId === selected.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-3.5 h-3.5" />
                    )}
                    Convertir en commande
                  </Button>
                )}
              </div>

              {/* Fiche Client & Chantier */}
              <div className="border border-border rounded-lg p-4 bg-card grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Client</span>
                  <span className="font-bold text-sm text-foreground">{selected.full_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Téléphone</span>
                  <span className="font-semibold font-mono text-foreground">{selected.phone}</span>
                </div>
                {selected.email && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Email</span>
                    <span className="font-medium text-foreground">{selected.email}</span>
                  </div>
                )}
                {selected.address && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Adresse Client</span>
                    <span className="font-medium text-foreground">{selected.address}</span>
                  </div>
                )}
                {selected.work_location && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[11px]">Lieu du chantier / Travaux</span>
                    <span className="font-semibold text-primary">{selected.work_location}</span>
                  </div>
                )}
              </div>

              {/* Tableau des matériels et prestations */}
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="p-3 bg-muted/40 border-b border-border font-bold text-xs flex justify-between">
                  <span>Détail des fournitures & prestations ({selected.items?.length || 1} poste(s))</span>
                  <span>Devise : {selected.currency || 'USD'}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground">
                        <th className="p-2 text-left">Réf</th>
                        <th className="p-2 text-left">Désignation</th>
                        <th className="p-2 text-center">Unité</th>
                        <th className="p-2 text-center">Qté</th>
                        <th className="p-2 text-right">P.U.</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items && selected.items.length > 0 ? (
                        selected.items.map((it, i) => (
                          <tr key={i} className="border-b border-border/40">
                            <td className="p-2 font-mono text-muted-foreground">{it.reference || '—'}</td>
                            <td className="p-2">
                              <span className="font-medium">{it.designation}</span>
                              {it.description && <p className="text-[10px] text-muted-foreground">{it.description}</p>}
                            </td>
                            <td className="p-2 text-center">{it.unit || 'pièce'}</td>
                            <td className="p-2 text-center font-mono">{it.quantity}</td>
                            <td className="p-2 text-right font-mono">{Number(it.unit_price).toFixed(2)}</td>
                            <td className="p-2 text-right font-mono font-bold text-primary">{Number(it.total).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-3 text-muted-foreground">
                            {selected.description}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Synthèse financière */}
                <div className="p-3 bg-muted/20 border-t border-border flex justify-end">
                  <div className="text-right space-y-1 text-xs">
                    {selected.subtotal !== undefined && (
                      <p className="text-muted-foreground">
                        Sous-total : <span className="font-mono">{selected.subtotal.toFixed(2)} {selected.currency === 'CDF' ? 'FC' : '$'}</span>
                      </p>
                    )}
                    {selected.discount ? (
                      <p className="text-rose-600">
                        Remise : <span className="font-mono">- {selected.discount.toFixed(2)} {selected.currency === 'CDF' ? 'FC' : '$'}</span>
                      </p>
                    ) : null}
                    {selected.transport_fee ? (
                      <p className="text-muted-foreground">
                        Transport : <span className="font-mono">+ {selected.transport_fee.toFixed(2)} {selected.currency === 'CDF' ? 'FC' : '$'}</span>
                      </p>
                    ) : null}
                    <p className="text-sm font-bold text-primary pt-1 border-t border-border">
                      TOTAL : <span className="font-mono text-base">{selected.total_amount ? selected.total_amount.toFixed(2) : (selected.subtotal || 0).toFixed(2)} {selected.currency === 'CDF' ? 'FC' : '$'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditions contractuelles */}
              <div className="border border-border rounded-lg p-3 bg-card text-xs space-y-1.5">
                <p><span className="font-semibold text-muted-foreground">Conditions de règlement :</span> {selected.payment_terms || '60% à la commande, solde à la livraison.'}</p>
                <p><span className="font-semibold text-muted-foreground">Délai d'exécution :</span> {selected.execution_delay || '3 à 7 jours ouvrés.'}</p>
                <p><span className="font-semibold text-muted-foreground">Durée de validité :</span> {selected.validity_days || 30} jours</p>
                {selected.observations && (
                  <p><span className="font-semibold text-muted-foreground">Observations :</span> {selected.observations}</p>
                )}
                {selected.converted_order_id && (
                  <p className="text-emerald-700 font-semibold pt-1">
                    ✓ Converti en commande active dans le système SCA.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DE SUPPRESSION */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis sera définitivement supprimé de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminQuotes;
