import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Star, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export interface ManagedImage {
  id?: string;
  url: string;
  isPrimary: boolean;
  file?: File;
}

interface ProductImageUploaderProps {
  images: ManagedImage[];
  onChange: (images: ManagedImage[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 5;

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
  maxFiles = 5,
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Format non supporté (${file.name}). Formats acceptés : JPG, PNG, WEBP.`;
    }
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return `Le fichier "${file.name}" dépasse la taille maximale autorisée de ${maxSizeMb} Mo.`;
    }
    return null;
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
      const cleanFileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(cleanFileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        console.warn('Supabase storage upload fallback to local URL:', error.message);
        return URL.createObjectURL(file);
      }

      const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(data.path);
      return publicData?.publicUrl || URL.createObjectURL(file);
    } catch {
      return URL.createObjectURL(file);
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (images.length + fileList.length > maxFiles) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${maxFiles} images.`);
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
      const newItems: ManagedImage[] = [];
      for (const file of validFiles) {
        const url = await uploadFileToStorage(file);
        newItems.push({
          url,
          isPrimary: images.length === 0 && newItems.length === 0,
          file,
        });
      }

      onChange([...images, ...newItems]);
      toast.success(`${validFiles.length} image(s) importée(s)`);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du traitement de l\'image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFileToStorage(file);
      const updated = [...images];
      updated[replacingIndex] = {
        ...updated[replacingIndex],
        url,
        file,
      };
      onChange(updated);
      toast.success('Image remplacée avec succès');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du remplacement de l\'image');
    } finally {
      setUploading(false);
      setReplacingIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const setPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
    toast.info('Image principale mise à jour');
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
    toast.success('Image retirée');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Images du produit
        </label>
        <span className="text-xs text-muted-foreground">
          {images.length} / {maxFiles} images (Max {maxSizeMb} Mo par fichier)
        </span>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        multiple
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFile}
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
      />

      {/* Drop Zone */}
      {images.length < maxFiles && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[0.99]'
              : 'border-border hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {uploading ? 'Importation en cours…' : 'Cliquez pour importer ou glissez-déposez ici'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Formats acceptés : <span className="font-semibold text-foreground/80">JPG, PNG, WEBP</span> (max {maxSizeMb} Mo)
            </p>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`group relative rounded-lg border overflow-hidden bg-card transition-all ${
                img.isPrimary
                  ? 'border-primary ring-2 ring-primary/20 shadow-md'
                  : 'border-border hover:border-border/80'
              }`}
            >
              {/* Aspect Ratio Container */}
              <div className="aspect-square w-full bg-muted overflow-hidden relative">
                <img
                  src={img.url}
                  alt={`Aperçu ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Primary Badge */}
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 shadow">
                      ★ Principale
                    </Badge>
                  </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 text-xs shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      title="Supprimer cette image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {!img.isPrimary && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="w-full h-7 text-[11px] font-medium bg-white/90 hover:bg-white text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(idx);
                        }}
                      >
                        <Star className="w-3 h-3 mr-1 text-amber-500 fill-amber-500" />
                        Principale
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-[11px] font-medium bg-black/40 hover:bg-black/60 text-white border-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplacingIndex(idx);
                        replaceInputRef.current?.click();
                      }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Remplacer
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-2 p-3 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Aucune image sélectionnée. Ajoutez au moins une image principale pour présenter le produit.</span>
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
