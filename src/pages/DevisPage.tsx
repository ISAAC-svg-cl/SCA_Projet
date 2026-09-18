import React, { useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MainLayout from '@/components/layouts/MainLayout';
import { submitQuote } from '@/services/api';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

const projectTypes = [
  'Installation électrique résidentielle',
  'Installation électrique commerciale',
  'Rénovation électrique',
  'Système solaire résidentiel',
  'Système solaire commercial',
  'Maintenance / Dépannage',
  'Tableau électrique',
  'Éclairage',
  'Autre',
];

const toHex = (s: string) =>
  Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, '0')).join('');

const DevisPage: React.FC = () => {
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', project_type: '',
    description: '', address: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setPhotos(files);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of photos) {
      const dot = file.name.lastIndexOf('.');
      const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
      const ext = dot > 0 ? file.name.slice(dot) : '';
      const safeName = `${toHex(stem)}${ext}`;
      const path = `devis/${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage
        .from('quote-photos')
        .upload(path, file, { contentType: file.type });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('quote-photos').getPublicUrl(data.path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.project_type || !form.description.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setUploading(true);
    try {
      const photoUrls = photos.length > 0 ? await uploadPhotos() : null;
      await submitQuote({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        project_type: form.project_type,
        description: form.description,
        address: form.address || null,
        photo_urls: photoUrls,
      });
      setSubmitted(true);
      toast.success('Votre demande de devis a été envoyée !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Demande envoyée !</h1>
          <p className="text-muted-foreground mb-8">
            Votre demande de devis a bien été reçue. L'équipe SCA vous contactera dans les 24h.
          </p>
          <Button onClick={() => { setSubmitted(false); setForm({ full_name: '', phone: '', email: '', project_type: '', description: '', address: '' }); setPhotos([]); }}>
            Faire une autre demande
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="hero-gradient border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <h1 className="text-3xl font-bold text-white mb-3">Demander un Devis</h1>
          <p className="text-secondary-foreground/70">Décrivez votre projet, SCA vous répond sous 24h.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Formulaire de devis
            </CardTitle>
            <CardDescription>Les champs marqués * sont obligatoires</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom complet *</Label>
                  <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Votre nom" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="085 000 00 00" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
              </div>

              <div className="space-y-2">
                <Label>Type de projet *</Label>
                <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir un type de projet" /></SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description du projet *</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez votre projet en détail : type de travaux, superficie, équipements souhaités…"
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse / Zone</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Quartier, commune, ville…" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Photos du projet (optionnel, max 5)</Label>
                <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
                  <input id="photos" type="file" multiple accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  <label htmlFor="photos" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {photos.length > 0
                        ? `${photos.length} photo${photos.length > 1 ? 's' : ''} sélectionnée${photos.length > 1 ? 's' : ''}`
                        : 'Cliquez pour ajouter des photos'}
                    </p>
                  </label>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={uploading}>
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</> : <><FileText className="w-4 h-4" />Envoyer ma demande de devis</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DevisPage;
