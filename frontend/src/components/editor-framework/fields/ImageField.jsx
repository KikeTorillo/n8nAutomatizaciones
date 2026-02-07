/**
 * ImageField - Campo de imagen con Unsplash y Upload
 */
import { memo, useRef, useState, useId } from 'react';
import { Image as ImageIcon, ImagePlus, Upload, Loader2, Link, X } from 'lucide-react';
import { Input } from '@/components/ui/atoms';
import { Label } from '@/components/ui/atoms';
import { Button } from '@/components/ui/atoms';

function ImageField({
  field,
  label: labelProp,
  fieldKey,
  value,
  onChange,
  onOpenUnsplash,
  onUpload,
  isUploading = false,
}) {
  // Soporta tanto {field} como props directos {label, fieldKey}
  const label = field?.label ?? labelProp;
  const key = field?.key ?? fieldKey ?? 'image';
  const fileInputRef = useRef(null);
  const [localUploading, setLocalUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fieldId = useId();

  const uploading = isUploading || localUploading;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      return;
    }

    setLocalUploading(true);
    try {
      const url = await onUpload(file, key);
      // Sincronizar el form local con la URL subida
      if (url && onChange) onChange(url);
    } finally {
      setLocalUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    onChange('');
    setShowUrlInput(false);
  };

  return (
    <div>
      <Label label={label} htmlFor={fieldId} className="mb-2" />

      {/* Preview de imagen */}
      {value && (
        <div className="relative group/preview mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover transition-transform duration-300 group-hover/preview:scale-105"
            onError={(e) => (e.target.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/20 transition-colors duration-200" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover/preview:opacity-100 hover:bg-red-500 transition-all duration-200 scale-75 group-hover/preview:scale-100"
            title="Quitar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Botones de acción (estilo galería) */}
      <div className="flex items-center gap-2">
        {onOpenUnsplash && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenUnsplash?.(key)}
            disabled={uploading}
            className="flex-1 text-xs"
          >
            <ImagePlus className="w-3.5 h-3.5 mr-1" />
            Unsplash
          </Button>
        )}
        {onUpload && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 text-xs"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1" />
            )}
            Subir
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1 text-xs"
        >
          <Link className="w-3.5 h-3.5 mr-1" />
          URL
        </Button>
      </div>

      {/* Input URL (toggle) */}
      {showUrlInput && (
        <div className="mt-2">
          <Input
            id={fieldId}
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
          />
        </div>
      )}
    </div>
  );
}

export default memo(ImageField);
