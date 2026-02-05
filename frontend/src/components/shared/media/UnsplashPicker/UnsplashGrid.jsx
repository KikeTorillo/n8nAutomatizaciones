/**
 * ====================================================================
 * UNSPLASH GRID
 * ====================================================================
 * Grid de imagenes de Unsplash con lazy loading.
 */

import { memo } from 'react';
import { Loader2, Download, ExternalLink, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Grid de imagenes de Unsplash
 *
 * @param {Object} props
 * @param {Array} props.images - Lista de imagenes
 * @param {boolean} props.isLoading - Si esta cargando
 * @param {Function} props.onSelect - Callback al seleccionar imagen
 * @param {string} props.selectedId - ID de imagen seleccionada
 * @param {boolean} props.isDownloading - Si se esta descargando
 */
function UnsplashGrid({
  images = [],
  isLoading = false,
  onSelect,
  selectedId = null,
  isDownloading = false,
}) {
  if (isLoading && images.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Busca imagenes para ver resultados
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((image, index) => (
          <ImageCard
            key={image.id}
            image={image}
            index={index}
            isSelected={selectedId === image.id}
            isDownloading={isDownloading && selectedId === image.id}
            onSelect={() => onSelect?.(image)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Tarjeta de imagen individual
 */
const ImageCard = memo(function ImageCard({
  image,
  index,
  isSelected,
  isDownloading,
  onSelect,
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onSelect}
      disabled={isDownloading}
      className={cn(
        'group relative aspect-square rounded-lg overflow-hidden',
        'border-2 transition-all',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600',
        isDownloading && 'opacity-50 cursor-wait'
      )}
    >
      {/* Imagen */}
      <img
        src={image.urls.small}
        alt={image.alt_description || 'Unsplash image'}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Overlay con info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Fotografo */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="flex items-center gap-1.5 text-white text-xs">
            <User className="w-3 h-3" />
            <span className="truncate">{image.user.name}</span>
          </div>
        </div>

        {/* Icono de seleccion */}
        <div className="absolute top-2 right-2">
          {isDownloading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Download className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      {/* Badge de seleccion */}
      {isSelected && !isDownloading && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs font-medium rounded">
          Seleccionada
        </div>
      )}
    </motion.button>
  );
});

export default memo(UnsplashGrid);
