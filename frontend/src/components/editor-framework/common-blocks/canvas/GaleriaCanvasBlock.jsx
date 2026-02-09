/**
 * ====================================================================
 * GALERIA CANVAS BLOCK (Compartido)
 * ====================================================================
 * Renderer de galería compartido entre Website e Invitaciones.
 */

import { memo, useState } from 'react';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineText } from '../../inline';
import { getThemeColors } from '../../utils/themeColors';

/**
 * Lightbox — Modal fullscreen para navegación de imágenes
 */
function Lightbox({ imagenes, index, onClose, onPrev, onNext }) {
  if (index === null || !imagenes[index]) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <button
        className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button
        className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        <ChevronRight className="w-8 h-8" />
      </button>
      <img
        src={imagenes[index].url}
        alt={imagenes[index].alt || ''}
        loading="lazy"
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
        {index + 1} / {imagenes.length}
      </div>
    </div>
  );
}

/**
 * GaleriaCanvasBlock compartido
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema del editor
 * @param {boolean} [props.isEditing] - Modo edición inline
 * @param {Function} [props.onContentChange] - Callback cambio contenido
 * @param {'website'|'invitacion'} [props.fallbackContext='website'] - Contexto fallback
 * @param {Array} [props.imagenes] - Override de imágenes (eventos pasa galería del evento)
 * @param {boolean} [props.showLightbox] - Activar lightbox
 * @param {Function} [props.renderImageWrapper] - Slot para MarcoFoto: (children, img, tema) => node
 * @param {boolean} [props.showCaptions] - Mostrar captions hover
 * @param {number} [props.emptyPlaceholders] - Número de placeholders vacíos (0 = mensaje)
 */
function GaleriaCanvasBlock({
  bloque,
  tema,
  isEditing,
  onContentChange,
  fallbackContext = 'website',
  imagenes: imagenesProp,
  showLightbox = false,
  renderImageWrapper,
  showCaptions = false,
  emptyPlaceholders = 0,
}) {
  const colors = getThemeColors(tema, fallbackContext);
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  const titulo_seccion = contenido.titulo_seccion || (fallbackContext === 'website' ? 'Nuestra Galería' : 'Galería');
  const subtitulo_seccion = contenido.subtitulo_seccion;
  const layout = estilos.layout || contenido.layout || 'grid';
  const columnas = estilos.columnas || contenido.columnas || 3;

  // Imágenes a mostrar
  const imagenesContenido = contenido.imagenes || [];
  const imagenesBase = imagenesProp || imagenesContenido;
  const imagenesValidas = imagenesBase.filter(img => img && img.url);

  // Placeholders para cuando no hay imágenes
  const imagenesRender = imagenesValidas.length > 0
    ? imagenesValidas
    : emptyPlaceholders > 0
    ? Array.from({ length: emptyPlaceholders }, (_, i) => ({ url: '', alt: `Imagen ${i + 1}`, caption: '' }))
    : [];

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const openLightbox = (idx) => showLightbox && setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : imagenesRender.length - 1));
  const nextImage = () => setLightboxIndex((prev) => (prev < imagenesRender.length - 1 ? prev + 1 : 0));

  // Grid columns
  const gridCols = fallbackContext === 'invitacion'
    ? { 2: 'grid-cols-2', 3: 'grid-cols-2 md:grid-cols-3', 4: 'grid-cols-2 md:grid-cols-4' }
    : { 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' };

  // Section style
  const sectionStyle = fallbackContext === 'invitacion' ? { backgroundColor: colors.fondo } : undefined;
  const sectionClass = fallbackContext === 'invitacion' ? 'py-20 px-6' : 'py-16 px-6 bg-gray-50 dark:bg-gray-900';

  const renderImage = (imagen, idx) => {
    const imgContent = imagen.url ? (
      <div
        className={cn(
          'overflow-hidden rounded-lg',
          showLightbox && 'cursor-pointer group',
          layout !== 'masonry' && 'aspect-square'
        )}
        onClick={() => openLightbox(idx)}
      >
        <img
          src={imagen.url}
          alt={imagen.alt || `Imagen ${idx + 1}`}
          loading="lazy"
          className={cn(
            'w-full h-full object-cover',
            showLightbox && 'group-hover:scale-110 transition-transform duration-300'
          )}
        />
      </div>
    ) : (
      <div
        className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-lg',
          layout !== 'masonry' ? 'aspect-square' : 'min-h-[200px]'
        )}
      >
        <ImageIcon className="w-12 h-12 text-gray-400" />
      </div>
    );

    const wrapped = renderImageWrapper
      ? renderImageWrapper(imgContent, imagen, tema)
      : imgContent;

    return (
      <div
        key={idx}
        className={cn(
          'relative',
          layout === 'carousel' && (fallbackContext === 'invitacion' ? 'flex-shrink-0 w-64 md:w-80 snap-center' : 'min-w-[280px] snap-center'),
          layout === 'masonry' && idx % 3 === 0 && 'row-span-2'
        )}
      >
        {wrapped}
        {/* Caption overlay (website) */}
        {showCaptions && imagen.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
            <p className="text-white text-sm">{imagen.caption}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={sectionClass} style={sectionStyle}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {titulo_seccion && (
          <div className="text-center mb-12">
            {isEditing ? (
              <InlineText
                value={titulo_seccion}
                onChange={(value) => onContentChange?.({ titulo_seccion: value })}
                placeholder="Título de sección"
                className="text-3xl md:text-4xl font-bold block"
                style={fallbackContext === 'invitacion'
                  ? { color: colors.primario, fontFamily: 'var(--fuente-titulos)' }
                  : undefined
                }
                as="h2"
              />
            ) : (
              <h2
                className={cn(
                  'text-3xl md:text-4xl font-bold',
                  fallbackContext === 'invitacion' ? 'mb-4' : 'text-gray-900 dark:text-white'
                )}
                style={fallbackContext === 'invitacion'
                  ? { color: colors.primario, fontFamily: 'var(--fuente-titulos)' }
                  : { fontFamily: 'var(--fuente-titulos)' }
                }
              >
                {titulo_seccion}
              </h2>
            )}
            {subtitulo_seccion && (
              <p className="max-w-2xl mx-auto" style={{ color: colors.textoClaro }}>
                {subtitulo_seccion}
              </p>
            )}
          </div>
        )}

        {/* Gallery */}
        {imagenesRender.length > 0 ? (
          <>
            {layout === 'carousel' ? (
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
                {imagenesRender.map((img, idx) => renderImage(img, idx))}
              </div>
            ) : (
              <div
                className={cn(
                  'grid gap-4',
                  gridCols[columnas] || gridCols[3],
                  layout === 'masonry' && 'masonry-cols'
                )}
              >
                {imagenesRender.map((img, idx) => renderImage(img, idx))}
              </div>
            )}

            {/* Lightbox */}
            {showLightbox && (
              <Lightbox
                imagenes={imagenesRender}
                index={lightboxIndex}
                onClose={closeLightbox}
                onPrev={prevImage}
                onNext={nextImage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay imágenes en la galería</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(GaleriaCanvasBlock);
