import { useState } from 'react';
import { Camera, X, Loader2, ImagePlus, GripVertical } from 'lucide-react';
import { useUploadArchivo } from '@/hooks/utils';
import { useToast } from '@/hooks/utils';

/**
 * Componente para editar galería de imágenes del Marketplace
 * Permite subir, eliminar y reordenar hasta 10 imágenes
 */
function GaleriaEditor({ imagenes = [], onChange, maxImagenes = 10 }) {
  const toast = useToast();
  const uploadMutation = useUploadArchivo();
  const [uploadingIndex, setUploadingIndex] = useState(null);

  // Handler para subir nueva imagen
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar que no exceda el máximo
    if (imagenes.length + files.length > maxImagenes) {
      toast.warning(`Solo puedes tener máximo ${maxImagenes} imágenes en la galería`);
      return;
    }

    // Subir cada archivo
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} supera el límite de 5MB`);
        continue;
      }

      try {
        setUploadingIndex(imagenes.length);
        const resultado = await uploadMutation.mutateAsync({
          file,
          folder: 'marketplace/galeria',
          isPublic: true,
        });
        const url = resultado?.url || resultado;
        onChange([...imagenes, url]);
      } catch (error) {
        toast.error(`Error al subir ${file.name}`);
      } finally {
        setUploadingIndex(null);
      }
    }

    // Limpiar input
    e.target.value = '';
  };

  // Handler para eliminar imagen
  const handleEliminar = (index) => {
    const nuevasImagenes = imagenes.filter((_, i) => i !== index);
    onChange(nuevasImagenes);
  };

  return (
    <div className="space-y-4">
      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Imágenes existentes */}
        {imagenes.map((url, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
          >
            <img
              src={url}
              alt={`Galería ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
              }}
            />
            {/* Overlay con acciones */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleEliminar(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Número de imagen */}
            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </div>
        ))}

        {/* Placeholder de carga */}
        {uploadingIndex !== null && (
          <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <Loader2 className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
        )}

        {/* Botón para agregar más */}
        {imagenes.length < maxImagenes && uploadingIndex === null && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
            <ImagePlus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-1" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Agregar</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="sr-only"
              disabled={uploadMutation.isPending}
            />
          </label>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {imagenes.length} de {maxImagenes} imágenes
        </span>
        <span>PNG, JPG o WEBP. Máximo 5MB cada una.</span>
      </div>
    </div>
  );
}

export default GaleriaEditor;
