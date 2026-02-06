/**
 * ImageField - Campo de imagen con Unsplash y Upload
 */
import { memo, useRef, useState, useId } from 'react';
import { Image as ImageIcon, ImagePlus, Upload, Loader2 } from 'lucide-react';
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
      await onUpload(file, key);
    } finally {
      setLocalUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label label={label} htmlFor={fieldId} />
        <div className="flex items-center gap-1">
          {onOpenUnsplash && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenUnsplash?.(key)}
              disabled={uploading}
              className="h-auto px-2 py-1 text-xs"
              title="Buscar en Unsplash"
            >
              <ImagePlus className="w-3.5 h-3.5 mr-1" />
              Unsplash
            </Button>
          )}
          {onUpload && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-auto px-2 py-1 text-xs"
              title="Subir imagen"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1" />
              )}
              Subir
            </Button>
          )}
        </div>
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Input
        id={fieldId}
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="URL de la imagen"
        prefix={<ImageIcon className="w-4 h-4 text-gray-400" />}
      />
      {value && (
        <img
          src={value}
          alt="Preview"
          className="mt-2 w-full h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
          onError={(e) => (e.target.style.display = 'none')}
        />
      )}
    </div>
  );
}

export default memo(ImageField);
