/**
 * ====================================================================
 * GALERIA CANVAS BLOCK
 * ====================================================================
 * Bloque de galería de imágenes para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState } from 'react';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Galería Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 * @param {Array} props.galeria - Galería del evento
 */
function GaleriaCanvasBlock({ bloque, tema, galeria = [] }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo_seccion = contenido.titulo_seccion || 'Galería';
  const subtitulo_seccion = contenido.subtitulo_seccion;
  const usar_galeria_evento = contenido.usar_galeria_evento ?? true;
  const imagenes = contenido.imagenes || [];

  // Fallback: estilos pueden venir en contenido o en estilos
  const layout = estilos.layout || contenido.layout || 'grid';
  const columnas = estilos.columnas || contenido.columnas || 3;

  const colorPrimario = tema?.color_primario || '#753572';
  const colorFondo = tema?.color_fondo || '#FFFFFF';
  const colorTextoClaro = tema?.color_texto_claro || '#6b7280';

  // Imágenes a mostrar
  const imagenesAMostrar = usar_galeria_evento && galeria.length > 0
    ? galeria
    : imagenes;

  // Estado para lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : imagenesAMostrar.length - 1));
  const nextImage = () => setLightboxIndex((prev) => (prev < imagenesAMostrar.length - 1 ? prev + 1 : 0));

  // Columnas CSS grid
  const columnasClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <section className="py-20 px-6" style={{ backgroundColor: colorFondo }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
          >
            {titulo_seccion}
          </h2>
          {subtitulo_seccion && (
            <p className="max-w-2xl mx-auto" style={{ color: colorTextoClaro }}>
              {subtitulo_seccion}
            </p>
          )}
        </div>

        {/* Galería */}
        {imagenesAMostrar.length > 0 ? (
          <>
            {layout === 'carousel' ? (
              // Carrusel
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                  {imagenesAMostrar.map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-64 md:w-80 snap-center cursor-pointer"
                      onClick={() => openLightbox(idx)}
                    >
                      <div className="aspect-[4/3] rounded-lg overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.alt || `Imagen ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Grid o Masonry
              <div
                className={cn(
                  'grid gap-4',
                  columnasClass[columnas] || columnasClass[3]
                )}
              >
                {imagenesAMostrar.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(idx)}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `Imagen ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
              <div
                className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                onClick={closeLightbox}
              >
                {/* Close button */}
                <button
                  className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={closeLightbox}
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Navigation */}
                <button
                  className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                {/* Image */}
                <img
                  src={imagenesAMostrar[lightboxIndex].url}
                  alt={imagenesAMostrar[lightboxIndex].alt || ''}
                  className="max-w-[90vw] max-h-[90vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                  {lightboxIndex + 1} / {imagenesAMostrar.length}
                </div>
              </div>
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
