import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Video, Trash2, AlertCircle, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export interface ManagedMedia {
  id?: string;
  url: string;
  type: 'image' | 'video';
  alt?: string;
  file?: File;
}

interface RealizationMediaUploaderProps {
  media: ManagedMedia[];
  onChange: (media: ManagedMedia[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const DEFAULT_MAX_SIZE_MB = 50; // supporte les vidéos moyennes

export const RealizationMediaUploader: React.FC<RealizationMediaUploaderProps> = ({
  media,
  onChange,
  maxFiles = 10,
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const getMediaType = (file: File): 'image' | 'video' | null => {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image';
    if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video';
    return null;
  };

  const validateFile = (file: File): string | null => {
    const type = getMediaType(file);
    if (!type) {
      return `Format non supporté (${file.name}). Acceptés : JPG, PNG, WEBP, MP4, WEBM, MOV.`;
    }
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return `Le fichier "${file.name}" dépasse la taille limite de ${maxSizeMb} Mo.`;
    }
    return null;
  };

  const uploadFileToStorage = async (file: File): Promise<{ url: string; type: 'image' | 'video' }> => {
    const mediaType = getMediaType(file) || 'image';
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'webp');
      const cleanFileName = `realiz_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      // Essayer d'abord le bucket realization-media, sinon fallback product-images
      let bucketName = 'realization-media';
      let uploadRes = await supabase.storage.from(bucketName).upload(cleanFileName, file, { cacheControl: '3600', upsert: true });

      if (uploadRes.error) {
        // Fallback sur product-images qui existe déjà
        bucketName = 'product-images';
        uploadRes = await supabase.storage.from(bucketName).upload(cleanFileName, file, { cacheControl: '3600', upsert: true });
      }

      if (uploadRes.error) {
        console.warn('Storage upload fallback to local ObjectURL:', uploadRes.error.message);
        return { url: URL.createObjectURL(file), type: mediaType };
      }

      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(uploadRes.data.path);
      return {
        url: publicData?.publicUrl || URL.createObjectURL(file),
        type: mediaType,
      };
    } catch {
      return { url: URL.createObjectURL(file), type: mediaType };
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (media.length + fileList.length > maxFiles) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${maxFiles} médias.`);
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      validFiles.push(file);
    }

    setUploading(true);
    try {
      const newItems: ManagedMedia[] = [];
      for (const file of validFiles) {
        const result = await uploadFileToStorage(file);
        newItems.push({
          url: result.url,
          type: result.type,
          file,
        });
      }

      onChange([...media, ...newItems]);
      toast.success(`${newItems.length} fichier(s) ajouté(s)`);
    } catch (err: any) {
      toast.error(`Erreur d'upload : ${err.message || 'Échec du traitement'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = media.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[140px] ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />

        <div className="flex items-center gap-2 mb-2 text-primary">
          <UploadCloud className="w-8 h-8" />
          <Film className="w-6 h-6 text-accent" />
        </div>

        <p className="font-medium text-sm text-foreground">
          {uploading ? 'Téléversement en cours…' : 'Glissez-déposez vos photos et vidéos ici, ou cliquez pour parcourir'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Photos (JPG, PNG, WEBP) ou Vidéos (MP4, WEBM) • Jusqu'à {maxFiles} fichiers (max {maxSizeMb} Mo par fichier)
        </p>
      </div>

      {/* Grille des médias */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {media.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-lg border border-border overflow-hidden bg-card shadow-sm aspect-video flex items-center justify-center"
            >
              {item.type === 'video' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <Video className="w-8 h-8 text-white drop-shadow" />
                  </div>
                  <Badge className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5">
                    Vidéo
                  </Badge>
                </div>
              ) : (
                <div className="relative w-full h-full bg-muted">
                  <img
                    src={item.url}
                    alt={item.alt || `Média ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-1.5 left-1.5 bg-primary/80 text-white text-[10px] px-1.5 py-0.5">
                    Photo
                  </Badge>
                </div>
              )}

              {/* Bouton de suppression */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 rounded-full shadow"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  title="Supprimer ce média"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
