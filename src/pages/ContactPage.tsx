import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layouts/MainLayout';
import { submitStudyRequest } from '@/services/api';
import { toast } from 'sonner';

const ContactPage: React.FC = () => {
  const [studyForm, setStudyForm] = useState({ full_name: '', phone: '', email: '', need_description: '' });
  const [studyDone, setStudyDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studyForm.full_name.trim() || !studyForm.phone.trim() || !studyForm.need_description.trim()) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      await submitStudyRequest({
        full_name: studyForm.full_name,
        phone: studyForm.phone,
        email: studyForm.email || null,
        need_description: studyForm.need_description,
      });
      setStudyDone(true);
      toast.success('Demande d\'étude envoyée !');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="hero-gradient border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Contact</h1>
          <p className="text-secondary-foreground/70 text-lg">Nous sommes disponibles pour vous aider</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid md:grid-cols-2 gap-10">
        {/* Left – contact info + map */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold sca-heading-accent mb-6">Nos coordonnées</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: MapPin, label: 'Adresse', value: 'Haut-Katanga, République Démocratique du Congo', href: undefined, color: 'text-primary' },
              { icon: Phone, label: 'Téléphone 1', value: '085 865 74 75', href: 'tel:+243858657475', color: 'text-accent' },
              { icon: Phone, label: 'Téléphone 2', value: '097 528 31 55', href: 'tel:+243975283155', color: 'text-accent' },
              { icon: MessageCircle, label: 'WhatsApp', value: 'Discuter sur WhatsApp', href: 'https://wa.me/243858657475', color: 'text-success' },
              { icon: Mail, label: 'Email', value: 'contact@sca-katanga.com', href: 'mailto:contact@sca-katanga.com', color: 'text-primary' },
            ].map((item) => (
              <Card key={item.label} className="border border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <item.icon className={`w-5 h-5 mt-0.5 shrink-0 ${item.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                        className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick contact buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <a href="tel:+243858657475"><Phone className="w-4 h-4" />Appeler SCA</a>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href="https://wa.me/243858657475" target="_blank" rel="noreferrer">
                <MessageCircle className="w-4 h-4 text-success" />WhatsApp
              </a>
            </Button>
          </div>

          {/* Google Maps embed */}
          <div className="rounded-lg overflow-hidden border border-border shadow-sm">
            <iframe
              width="100%"
              height="280"
              frameBorder="0"
              style={{ border: 0 }}
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed/v1/place?key=AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0&q=Haut-Katanga,+Democratic+Republic+of+the+Congo&language=fr&region=cd"
              allowFullScreen
              title="Localisation SCA – Haut-Katanga, RDC"
            />
          </div>
        </div>

        {/* Right – Study request form */}
        <div>
          <Card className="border border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle>Je ne sais pas quoi acheter</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Décrivez votre besoin, SCA vous conseille gratuitement</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studyDone ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-14 h-14 text-success mx-auto mb-4" />
                  <p className="font-semibold text-foreground text-lg mb-2">Demande reçue !</p>
                  <p className="text-muted-foreground text-sm mb-6">
                    Notre équipe analyse votre besoin et vous contacte sous 24h avec une recommandation personnalisée.
                  </p>
                  <Button variant="outline" onClick={() => { setStudyDone(false); setStudyForm({ full_name: '', phone: '', email: '', need_description: '' }); }}>
                    Faire une autre demande
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleStudy} className="space-y-4">
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-muted-foreground">
                    <strong className="text-foreground">Exemple :</strong> « Je veux alimenter une pompe de 1,5 HP avec du solaire » ou « J'ai besoin d'installer 3 prises dans ma boutique. »
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="study_name">Nom complet *</Label>
                      <Input id="study_name" value={studyForm.full_name} onChange={(e) => setStudyForm({ ...studyForm, full_name: e.target.value })} placeholder="Votre nom" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="study_phone">Téléphone *</Label>
                      <Input id="study_phone" value={studyForm.phone} onChange={(e) => setStudyForm({ ...studyForm, phone: e.target.value })} placeholder="085 000 00 00" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="study_email">Email (optionnel)</Label>
                    <Input id="study_email" type="email" value={studyForm.email} onChange={(e) => setStudyForm({ ...studyForm, email: e.target.value })} placeholder="email@exemple.com" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="study_desc">Décrivez votre besoin *</Label>
                    <Textarea
                      id="study_desc"
                      value={studyForm.need_description}
                      onChange={(e) => setStudyForm({ ...studyForm, need_description: e.target.value })}
                      placeholder="Ex : Je veux alimenter ma maison avec l'énergie solaire, surface 80m², 4 pièces…"
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</> : <><Lightbulb className="w-4 h-4" />Demander une étude gratuite</>}
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

export default ContactPage;
