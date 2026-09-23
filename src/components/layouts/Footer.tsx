import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => (
  <footer className="bg-secondary text-secondary-foreground mt-16">
    <div className="section-divider" />
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
      {/* Brand */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/logo.png?v=5"
            alt="SCA"
            className="h-12 w-12 object-contain drop-shadow-sm"
          />
          <div>
            <p className="font-bold text-white">SCA</p>
            <p className="text-xs text-secondary-foreground/60">Société du Courant Alternatif</p>
          </div>
        </div>
        <p className="text-sm text-secondary-foreground/70 leading-relaxed">
          Votre partenaire de confiance en électricité générale et solutions solaires au Haut-Katanga.
        </p>
        <div className="flex items-center gap-1 mt-3 text-xs text-secondary-foreground/50">
          <Zap className="w-3 h-3 text-primary" />
          Disponibilité · Qualité · Accessibilité
        </div>
      </div>

      {/* Navigation */}
      <div>
        <h3 className="font-semibold text-white mb-4">Navigation</h3>
        <ul className="space-y-2 text-sm text-secondary-foreground/70">
          {[
            { label: 'Accueil', path: '/' },
            { label: 'Quincaillerie', path: '/boutique' },
            { label: 'Nos services', path: '/services' },
            { label: 'Nos réalisations', path: '/realisations' },
            { label: 'Demander un devis', path: '/devis' },
            { label: 'Suivre ma commande', path: '/suivi-commande' },
            { label: 'Conseil / Étude', path: '/conseil' },
            { label: 'Contact', path: '/contact' },
          ].map((l) => (
            <li key={l.path}>
              <Link to={l.path} className="hover:text-primary transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-semibold text-white mb-4">Contact</h3>
        <ul className="space-y-3 text-sm text-secondary-foreground/70">
          <li className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            Haut-Katanga, République Démocratique du Congo
          </li>
          <li className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <a href="tel:+243858657475" className="hover:text-primary transition-colors">085 865 74 75</a>
          </li>
          <li className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary shrink-0" />
            <a href="tel:+243975283155" className="hover:text-primary transition-colors">097 528 31 55</a>
          </li>
          <li className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary shrink-0" />
            <a href="https://wa.me/243858657475" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
              WhatsApp SCA
            </a>
          </li>
          <li className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary shrink-0" />
            <a href="mailto:contact@sca-katanga.com" className="hover:text-primary transition-colors">
              contact@sca-katanga.com
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-secondary-foreground/10 px-4 md:px-8 py-4 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-secondary-foreground/40">
      <span>© {new Date().getFullYear()} SCA – Société du Courant Alternatif. Tous droits réservés.</span>
      <span>Haut-Katanga, RDC</span>
    </div>
  </footer>
);

export default Footer;
