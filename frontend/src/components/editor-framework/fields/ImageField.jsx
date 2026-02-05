/**
 * ImageField - Campo de imagen con Unsplash y Upload
 */
import { memo, useRef, useState } from 'react';
import { Image as ImageIcon, ImagePlus, Upload, Loader2 } from 'lucide-react';

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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="flex items-center gap-1">
          {onOpenUnsplash && (
            <button
              type="button"
              onClick={() => onOpenUnsplash?.(key)}
              disabled={uploading}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors disabled:opacity-50"
              title="Buscar en Unsplash"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Unsplash
            </button>
          )}
          {onUpload && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors disabled:opacity-50"
              title="Subir imagen"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              Subir
            </button>
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

      <div className="relative">
        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de la imagen"
          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
        />
      </div>
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
