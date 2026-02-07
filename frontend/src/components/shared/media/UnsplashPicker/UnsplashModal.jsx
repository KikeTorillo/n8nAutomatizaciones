/**
 * ====================================================================
 * UNSPLASH MODAL
 * ====================================================================
 * Modal para buscar y seleccionar imagenes de Unsplash.
 */

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui';
import UnsplashGrid from './UnsplashGrid';
import { useUnsplashSearch } from './useUnsplashSearch';

// Sugerencias de busqueda por industria
const SEARCH_SUGGESTIONS = {
  salon: ['salon beauty', 'hair styling', 'spa', 'makeup', 'nails'],
  restaurante: ['restaurant', 'food', 'chef cooking', 'dining', 'cafe'],
  consultorio: ['medical office', 'healthcare', 'doctor', 'clinic', 'wellness'],
  gym: ['fitness', 'gym workout', 'exercise', 'training', 'sport'],
  tienda: ['shopping', 'retail store', 'products', 'boutique', 'fashion'],
  agencia: ['office', 'creative team', 'marketing', 'business meeting', 'startup'],
  ecommerce: ['online shopping', 'e-commerce', 'delivery', 'package', 'cart'],
  educacion: ['education', 'learning', 'classroom', 'students', 'books'],
  inmobiliaria: ['real estate', 'house', 'apartment', 'interior design', 'architecture'],
  legal: ['law office', 'legal', 'courthouse', 'justice', 'professional'],
  veterinaria: ['pet', 'veterinary', 'dog', 'cat', 'animal care'],
  automotriz: ['car', 'automotive', 'garage', 'mechanic', 'vehicle'],
  hotel: ['hotel', 'hospitality', 'travel', 'resort', 'vacation'],
  eventos: ['event', 'wedding', 'party', 'celebration', 'catering'],
  fotografia: ['photography', 'camera', 'portrait', 'studio', 'creative'],
  construccion: ['construction', 'architecture', 'building', 'renovation', 'engineering'],
  coaching: ['coaching', 'motivation', 'success', 'leadership', 'personal growth'],
  finanzas: ['finance', 'investment', 'money', 'business', 'growth'],
  marketing: ['marketing', 'branding', 'social media', 'advertising', 'digital'],
  tecnologia: ['technology', 'software', 'computer', 'innovation', 'startup'],
  default: ['business', 'professional', 'modern', 'team', 'office'],
};

/**
 * Modal de Unsplash
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal esta abierto
 * @param {Function} props.onClose - Callback para cerrar
 * @param {Function} props.onSelect - Callback al seleccionar imagen (recibe URL)
 * @param {string} props.industria - Industria para sugerencias
 */
function UnsplashModal({ isOpen, onClose, onSelect, industria = 'default' }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const {
    query,
    page,
    images,
    totalPages,
    totalResults,
    isLoading,
    isDownloading,
    handleSearch,
    handleNextPage,
    handlePrevPage,
    handleDownload,
  } = useUnsplashSearch();

  // Obtener sugerencias para la industria
  const suggestions = SEARCH_SUGGESTIONS[industria] || SEARCH_SUGGESTIONS.default;

  // Manejar seleccion de imagen
  const handleImageSelect = useCallback(
    async (image) => {
      setSelectedImage(image);

      try {
        const url = await handleDownload(image);
        onSelect?.(url);
        toast.success('Imagen agregada');
        onClose?.();
      } catch (error) {
        toast.error('Error al descargar imagen');
        setSelectedImage(null);
      }
    },
    [handleDownload, onSelect, onClose]
  );

  // Reset al cerrar
  const handleClose = useCallback(() => {
    setSelectedImage(null);
    handleSearch('');
    onClose?.();
  }, [handleSearch, onClose]);

  // Renderizar via portal a body para evitar quedar detrás de Vaul Drawer,
  // y desactivar FocusTrap para evitar conflicto con el focus management de Vaul
  return createPortal(
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="xl"
      showCloseButton={false}
      disableFocusTrap
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Buscar Imagenes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Imagenes gratuitas de Unsplash
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar imagenes..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          {/* Sugerencias */}
          {!query && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Sugerencias:
              </span>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Resultados info */}
          {query && totalResults > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalResults.toLocaleString()} resultados para "{query}"
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <UnsplashGrid
            images={images}
            isLoading={isLoading}
            onSelect={handleImageSelect}
            selectedId={selectedImage?.id}
            isDownloading={isDownloading}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handlePrevPage}
              disabled={page <= 1}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                page > 1
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-400 cursor-not-allowed'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pagina {page} de {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={page >= totalPages}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                page < totalPages
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-400 cursor-not-allowed'
              )}
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer - Unsplash attribution */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <a
            href="https://unsplash.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Imagenes de Unsplash
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Modal>,
    document.body
  );
}

export default UnsplashModal;
