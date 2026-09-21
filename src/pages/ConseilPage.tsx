import React, { useState } from 'react';
import { Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MainLayout from '@/components/layouts/MainLayout';
import { submitStudyRequest } from '@/services/api';
import { toast } from 'sonner';

const ConseilPage: React.FC = () => {
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', need_description: '' });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.need_description.trim()) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      await submitStudyRequest({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        need_description: form.need_description,
      });
      setDone(true);
      toast.success('Demande d\'étude envoyée !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    'Je veux alimenter une pompe de 1,5 HP avec du solaire.',
    'J\'ai une boutique de 50m² à éclairer entièrement en LED.',
    'Je souhaite une autonomie de 3 jours pour ma villa.',
    'Je veux installer 10 prises et 5 interrupteurs dans ma maison neuve.',
  ];

  return (
    <MainLayout>
      <div className="hero-gradient border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <Lightbulb className="w-8 h-8 text-accent" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Conseil / Étude gratuite</h1>
          </div>
          <p className="text-secondary-foreground/70 text-lg">
            Vous ne savez pas quoi acheter ? Décrivez votre besoin, nos experts SCA vous guident.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 grid md:grid-cols-5 gap-8">
        {/* Left: examples */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-bold text-foreground text-lg">Exemples de demandes</h2>
          <div className="space-y-3">
            {examples.map((ex) => (
              <div key={ex} className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground italic cursor-pointer hover:border-accent/40 transition-colors"
                onClick={() => setForm((f) => ({ ...f, need_description: ex }))}>
                « {ex} »
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Cliquez sur un exemple pour le copier</p>

          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-6">
            <p className="text-sm font-semibold text-foreground mb-2">Pourquoi demander une étude ?</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>✅ Évitez les mauvais achats</li>
              <li>✅ Dimensionnement précis</li>
              <li>✅ Conseil d'expert gratuit</li>
              <li>✅ Réponse sous 24h</li>
            </ul>
          </div>
        </div>

        {/* Right: form */}
        <div className="md:col-span-3">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Décrivez votre besoin</CardTitle>
              <CardDescription>Les champs sont obligatoires. Réponse sous 24h.</CardDescription>
            </CardHeader>
            <CardContent>
              {done ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  <p className="font-bold text-xl mb-2">Demande reçue !</p>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                    Nos experts analysent votre besoin et vous contactent très prochainement avec une recommandation personnalisée.
                  </p>
                  <Button onClick={() => { setDone(false); setForm({ full_name: '', phone: '', email: '', need_description: '' }); }}>
                    Nouvelle demande
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cn">Nom complet *</Label>
                      <Input id="cn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Votre nom" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cp">Téléphone *</Label>
                      <Input id="cp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="085 000 00 00" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ce">Email (optionnel)</Label>
                    <Input id="ce" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cd">Décrivez votre besoin *</Label>
                    <Textarea
                      id="cd"
                      value={form.need_description}
                      onChange={(e) => setForm({ ...form, need_description: e.target.value })}
                      placeholder="Soyez précis : type d'installation, superficie, appareils à alimenter, budget estimé…"
                      rows={6}
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</> : <><Lightbulb className="w-4 h-4" />Envoyer ma demande d'étude</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ConseilPage;
