import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Eye, Calendar, MapPin, Film, Image as ImageIcon,
  Check, X, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import AdminLayout from './AdminLayout';
import {
  fetchRealizationsWithMedia,
  createRealization,
  updateRealization,
  deleteRealization,
  syncRealizationMedia,
  RealizationWithMedia
} from '@/services/api';
import { RealizationMediaUploader, ManagedMedia } from '@/components/admin/RealizationMediaUploader';
import { toast } from 'sonner';

export const AdminRealizations: React.FC = () => {
  const [realizations, setRealizations] = useState<RealizationWithMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentRealization, setCurrentRealization] = useState<RealizationWithMedia | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [projectDate, setProjectDate] = useState('');
  const [mediaList, setMediaList] = useState<ManagedMedia[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchRealizationsWithMedia();
      setRealizations(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Impossible de charger les réalisations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setCurrentRealization(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setProjectDate(new Date().toISOString().slice(0, 10));
    setMediaList([]);
    setIsModalOpen(true);
  };

  const openEditModal = (r: RealizationWithMedia) => {
    setCurrentRealization(r);
    setTitle(r.title);
    setDescription(r.description || '');
    setLocation(r.location || '');
    setProjectDate(r.project_date || '');
    setMediaList(
      (r.media || []).map((m) => ({
        id: m.id,
        url: m.media_url,
        type: m.media_type,
        alt: m.alt_text || '',
      }))
    );
    setIsModalOpen(true);
  };

  const openDeleteModal = (r: RealizationWithMedia) => {
    setCurrentRealization(r);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    setSaving(true);
    try {
      let realizationId: string;

      if (currentRealization) {
        // Update
        const updated = await updateRealization(currentRealization.id, {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          project_date: projectDate || null,
        });
        realizationId = updated.id;
        toast.success('Réalisation mise à jour');
      } else {
        // Create
        const created = await createRealization({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          project_date: projectDate || null,
        });
        realizationId = created.id;
        toast.success('Réalisation créée avec succès');
      }

      // Synchroniser les médias
      await syncRealizationMedia(
        realizationId,
        mediaList.map((m) => ({
          url: m.url,
          type: m.type,
          alt: m.alt,
        }))
      );

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Erreur : ${err.message || 'Impossible d\'enregistrer'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentRealization) return;
    setSaving(true);
    try {
      await deleteRealization(currentRealization.id);
      toast.success('Réalisation supprimée avec succès');
      setIsDeleteDialogOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Erreur lors de la suppression : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Réalisations</h1>
            <p className="text-sm text-muted-foreground">
              Ajoutez, modifiez et présentez vos travaux, chantiers, installations solaires et électriques.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle réalisation
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : realizations.length === 0 ? (
          <Card className="border-dashed p-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
            <h3 className="text-lg font-semibold text-foreground">Aucune réalisation enregistrée</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
              Vous n'avez pas encore ajouté de chantiers ou travaux. Créez-en un pour présenter vos réalisations aux clients.
            </p>
            <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter une réalisation
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {realizations.map((r) => {
              const imagesCount = (r.media || []).filter((m) => m.media_type === 'image').length;
              const videosCount = (r.media || []).filter((m) => m.media_type === 'video').length;
              const firstMedia = r.media?.[0];

              return (
                <Card key={r.id} className="overflow-hidden border border-border flex flex-col hover:shadow-md transition-shadow">
                  {/* Media preview */}
                  <div className="relative aspect-video bg-muted border-b border-border overflow-hidden">
                    {firstMedia ? (
                      firstMedia.media_type === 'video' ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center">
                          <video src={firstMedia.media_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Film className="w-8 h-8 text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={firstMedia.media_url}
                          alt={r.title}
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-10 h-10 opacity-30" />
                      </div>
                    )}

                    {/* Media badges */}
                    <div className="absolute bottom-2 left-2 flex gap-1.5">
                      {imagesCount > 0 && (
                        <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> {imagesCount}
                        </Badge>
                      )}
                      {videosCount > 0 && (
                        <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0 flex items-center gap-1">
                          <Film className="w-3 h-3" /> {videosCount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base text-foreground line-clamp-1">{r.title}</h3>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 mb-2 text-xs text-muted-foreground">
                        {r.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> {r.location}
                          </span>
                        )}
                        {r.project_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-accent" /> {r.project_date}
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-2">
                          {r.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex items-center gap-1"
                        onClick={() => openEditModal(r)}
                      >
                        <Edit className="w-3.5 h-3.5" /> Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-xs flex items-center gap-1"
                        onClick={() => openDeleteModal(r)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal Création / Modification */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {currentRealization ? 'Modifier la réalisation' : 'Ajouter une nouvelle réalisation'}
              </DialogTitle>
              <DialogDescription>
                Renseignez les détails du chantier ou du projet réalisé par SCA.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du projet / chantier *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Installation solaire 10 kVA pour villa"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Lieu / Ville</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex : Lubumbashi, Golf Meteo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDate">Date de réalisation</Label>
                  <Input
                    id="projectDate"
                    type="date"
                    value={projectDate}
                    onChange={(e) => setProjectDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description des travaux</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détaillez le travail effectué : puissance installée, type d'onduleur, panneaux solaires, tableau électrique, câblage, etc."
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label className="font-semibold">Photos et vidéos du chantier</Label>
                <RealizationMediaUploader
                  media={mediaList}
                  onChange={setMediaList}
                  maxFiles={12}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-border gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saving}>
                  {saving ? 'Enregistrement…' : currentRealization ? 'Enregistrer les modifications' : 'Créer la réalisation'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Suppression */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" /> Confirmer la suppression
              </DialogTitle>
              <DialogDescription>
                Êtes-vous certain de vouloir supprimer définitivement la réalisation{' '}
                <strong>"{currentRealization?.title}"</strong> ainsi que toutes ses photos et vidéos associées ?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving ? 'Suppression…' : 'Supprimer définitivement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRealizations;
