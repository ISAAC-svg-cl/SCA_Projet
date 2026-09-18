import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Sun, ChevronRight, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layouts/MainLayout';

const electricServices = [
  { title: 'Installation électrique', desc: 'Mise en place de nouveaux circuits, prises et interrupteurs selon les normes.' },
  { title: 'Dépannage', desc: 'Intervention rapide pour résoudre tout problème électrique urgent.' },
  { title: 'Branchement', desc: 'Raccordement au réseau SNEL et mise en service.' },
  { title: 'Rénovation', desc: 'Remise aux normes et modernisation de vos installations existantes.' },
  { title: 'Recherche de panne', desc: 'Diagnostic précis et localisation de défauts électriques.' },
  { title: 'Maintenance préventive', desc: 'Entretien régulier pour garantir la fiabilité de vos installations.' },
  { title: 'Tableau électrique', desc: 'Installation et mise à niveau de tableaux de distribution.' },
  { title: 'Éclairage', desc: 'Conception et installation de systèmes d\'éclairage LED économiques.' },
];

const solarServices = [
  { title: 'Étude solaire', desc: 'Analyse de vos besoins et faisabilité d\'un système solaire.' },
  { title: 'Dimensionnement', desc: 'Calcul précis de la puissance et capacité nécessaires.' },
  { title: 'Installation solaire', desc: 'Pose de panneaux, batteries et onduleurs par nos techniciens.' },
  { title: 'Maintenance solaire', desc: 'Entretien et nettoyage régulier pour optimiser le rendement.' },
  { title: 'Dépannage solaire', desc: 'Diagnostic et réparation de systèmes photovoltaïques.' },
  { title: 'Gestion des panneaux', desc: 'Monitoring et optimisation de la production solaire.' },
  { title: 'Batteries & stockage', desc: 'Installation de systèmes de stockage d\'énergie.' },
  { title: 'Onduleurs', desc: 'Installation et configuration d\'onduleurs pur sinus.' },
];

const ServicesPage: React.FC = () => {
  return (
    <MainLayout>
      {/* Header */}
      <div className="hero-gradient border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Nos Services</h1>
          <p className="text-secondary-foreground/70 text-lg">
            Expertise complète en électricité générale et solutions solaires
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-16">
        {/* Electrical services */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold sca-heading-accent">Services Électriques</h2>
              <p className="text-muted-foreground text-sm mt-5">Installations, dépannage et maintenance</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {electricServices.map((svc) => (
              <Card key={svc.title} className="border border-border hover:border-primary/40 transition-colors h-full">
                <CardContent className="p-5 h-full flex flex-col">
                  <ChevronRight className="w-4 h-4 text-primary mb-2" />
                  <h3 className="font-semibold text-foreground text-sm mb-2">{svc.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{svc.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Solar services */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Sun className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold sca-heading-accent">Solutions Solaires</h2>
              <p className="text-muted-foreground text-sm mt-5">Énergie photovoltaïque pour votre indépendance</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {solarServices.map((svc) => (
              <Card key={svc.title} className="border border-border hover:border-accent/40 transition-colors h-full">
                <CardContent className="p-5 h-full flex flex-col">
                  <ChevronRight className="w-4 h-4 text-accent mb-2" />
                  <h3 className="font-semibold text-foreground text-sm mb-2">{svc.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{svc.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-muted/40 rounded-xl p-8 text-center border border-border">
          <h2 className="text-2xl font-bold mb-3">Prêt à démarrer votre projet ?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Contactez SCA pour une intervention rapide ou demandez un devis gratuit pour vos travaux.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Link to="/devis"><FileText className="w-4 h-4" />Demander un devis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <a href="tel:+243858657475"><Phone className="w-4 h-4" />Appeler maintenant</a>
            </Button>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default ServicesPage;
