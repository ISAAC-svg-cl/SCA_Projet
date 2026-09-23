import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Calendar, Film, Image as ImageIcon, ChevronRight,
  Zap, ArrowRight, Play, Maximize2, X, ChevronLeft, RefreshCw
} from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchRealizationsWithMedia, RealizationWithMedia } from '@/services/api';

const RealizationsPage: React.FC = () => {
  const [realizations, setRealizations] = useState<RealizationWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRealization, setSelectedRealization] = useState<RealizationWithMedia | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const data = await fetchRealizationsWithMedia();
        setRealizations(data || []);
      } catch (e) {
        console.warn('Erreur chargement réalisations:', e);
        setRealizations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const openLightbox = (realization: RealizationWithMedia, index: number = 0) => {
    setSelectedRealization(realization);
    setActiveMediaIndex(index);
  };

  const nextMedia = () => {
    if (!selectedRealization?.media) return;
    setActiveMediaIndex((prev) => (prev + 1) % selectedRealization.media!.length);
  };

  const prevMedia = () => {
    if (!selectedRealization?.media) return;
    setActiveMediaIndex((prev) => (prev - 1 + selectedRealization.media!.length) % selectedRealization.media!.length);
  };

  return (
    <MainLayout>
      {/* Hero section */}
      <section className="bg-secondary text-secondary-foreground py-16 px-4 md:px-8 border-b border-border">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-xs px-3 py-1">
            Excellence & Savoir-faire
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
            Nos Réalisations & Travaux
          </h1>
          <p className="text-secondary-foreground/80 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Découvrez nos chantiers d'électricité générale, installations solaires photovoltaïques,
            câblages industriels et alimentations de secours réalisés pour nos clients à Lubumbashi et dans tout le Haut-Katanga.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <Link to="/devis">
                Demander un devis pour votre projet <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border text-white hover:bg-secondary-foreground/10">
              <Link to="/services">
                Explorer nos services
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des réalisations…</p>
          </div>
        ) : realizations.length === 0 ? (
          <div className="py-20 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Aucune réalisation publiée pour le moment</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Les photos et vidéos de nos travaux récents et installations solaires seront publiées ici très prochainement par l'administrateur.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/devis">Demander un devis pour votre projet</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/services">Découvrir nos services</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Tous les projets réalisés</h2>
                <p className="text-xs text-muted-foreground">
                  Cliquez sur un projet pour visualiser l'ensemble des photos et vidéos.
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {realizations.length} réalisation{realizations.length > 1 ? 's' : ''} disponible{realizations.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {realizations.map((realization) => {
                const mediaItems = realization.media || [];
                const firstMedia = mediaItems[0];
                const imageCount = mediaItems.filter((m) => m.media_type === 'image').length;
                const videoCount = mediaItems.filter((m) => m.media_type === 'video').length;

                return (
                  <Card
                    key={realization.id}
                    className="overflow-hidden border border-border group hover:shadow-xl transition-all duration-300 flex flex-col bg-card"
                  >
                    {/* Media thumbnail */}
                    <div
                      className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
                      onClick={() => openLightbox(realization, 0)}
                    >
                      {firstMedia ? (
                        firstMedia.media_type === 'video' ? (
                          <div className="w-full h-full relative bg-black flex items-center justify-center">
                            <video
                              src={firstMedia.media_url}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                              <div className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 ml-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full relative">
                            <img
                              src={firstMedia.media_url}
                              alt={realization.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-black/60 text-white rounded-full p-2.5 backdrop-blur-sm">
                                <Maximize2 className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/5">
                          <Zap className="w-12 h-12 text-primary/40" />
                        </div>
                      )}

                      {/* Media Badges */}
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                        {imageCount > 0 && (
                          <Badge variant="secondary" className="bg-black/75 text-white border-0 text-[11px] backdrop-blur-sm flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-primary" /> {imageCount} photo{imageCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {videoCount > 0 && (
                          <Badge variant="secondary" className="bg-black/75 text-white border-0 text-[11px] backdrop-blur-sm flex items-center gap-1">
                            <Film className="w-3 h-3 text-accent" /> {videoCount} vidéo{videoCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Meta: Location and Date */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                          {realization.location && (
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {realization.location}
                            </span>
                          )}
                          {realization.project_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-accent" />
                              {new Date(realization.project_date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                          {realization.title}
                        </h3>

                        {realization.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                            {realization.description}
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary p-0 hover:bg-transparent font-medium flex items-center gap-1"
                          onClick={() => openLightbox(realization, 0)}
                        >
                          Voir les détails & médias <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {selectedRealization && (
        <Dialog open={!!selectedRealization} onOpenChange={(open) => !open && setSelectedRealization(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
            <div className="flex flex-col max-h-[90vh]">
              {/* Media viewer */}
              <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                {selectedRealization.media && selectedRealization.media.length > 0 ? (
                  (() => {
                    const currentMedia = selectedRealization.media[activeMediaIndex];
                    if (currentMedia.media_type === 'video') {
                      return (
                        <video
                          key={currentMedia.media_url}
                          src={currentMedia.media_url}
                          controls
                          autoPlay
                          className="w-full h-full max-h-[60vh] object-contain"
                        />
                      );
                    }
                    return (
                      <img
                        key={currentMedia.media_url}
                        src={currentMedia.media_url}
                        alt={currentMedia.alt_text || selectedRealization.title}
                        className="w-full h-full max-h-[60vh] object-contain"
                      />
                    );
                  })()
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-2 text-primary" />
                    Aucun média disponible
                  </div>
                )}

                {/* Navigation arrows */}
                {selectedRealization.media && selectedRealization.media.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full h-9 w-9"
                      onClick={prevMedia}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white rounded-full h-9 w-9"
                      onClick={nextMedia}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Thumbnails row */}
              {selectedRealization.media && selectedRealization.media.length > 1 && (
                <div className="flex gap-2 p-3 bg-muted/40 overflow-x-auto border-b border-border">
                  {selectedRealization.media.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-16 h-12 rounded overflow-hidden shrink-0 border-2 transition-all ${
                        activeMediaIndex === idx ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      {item.media_type === 'video' ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <Film className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Project details */}
              <div className="p-6 space-y-3 overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {selectedRealization.title}
                  </DialogTitle>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {selectedRealization.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {selectedRealization.location}
                      </span>
                    )}
                    {selectedRealization.project_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-accent" /> {selectedRealization.project_date}
                      </span>
                    )}
                  </div>
                </div>

                {selectedRealization.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedRealization.description}
                  </p>
                )}

                <div className="pt-3 border-t border-border flex justify-end">
                  <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link to="/devis">
                      Solliciter un travail similaire →
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
};

export default RealizationsPage;
