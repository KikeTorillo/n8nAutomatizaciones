/**
 * ====================================================================
 * GALERIA PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza una galería de fotos del evento.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MarcoFoto } from '@/components/eventos-digitales';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

const INV = THEME_FALLBACK_COLORS.invitacion;

function GaleriaPublico({ bloque, evento, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  // Editor guarda titulo_seccion/subtitulo_seccion, antes se usaba titulo/subtitulo
  const titulo = contenido.titulo_seccion || contenido.titulo || 'Galería';
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo || 'Momentos que atesoramos';

  // Usar imágenes del bloque o las del evento
  // El editor guarda array de {url, alt}, necesitamos extraer solo URLs para compatibilidad
  let imagenes = [];
  if (contenido.imagenes?.length > 0) {
    imagenes = contenido.imagenes.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
  } else if (evento?.galeria_urls?.length > 0) {
    imagenes = evento.galeria_urls;
  }

  const layout = estilos.layout || contenido.layout || 'masonry';
  const columnas = estilos.columnas || contenido.columnas || 3;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  if (imagenes.length === 0) return null;

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % imagenes.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  // Manejar teclado para lightbox
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
  };

  return (
    <section className={`py-20 ${className}`} style={{ backgroundColor: tema?.color_fondo || INV.fondo }}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className={`text-center mb-12 ${animationClass}`}>
          <h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            style={{ color: tema?.color_texto, fontFamily: tema?.fuente_titulo }}
          >
            {titulo}
          </h2>
          {subtitulo && (
            <p className="text-lg" style={{ color: tema?.color_texto_claro }}>
              {subtitulo}
            </p>
          )}
        </div>

        {/* Grid de imágenes */}
        {layout === 'masonry' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imagenes.map((url, idx) => (
              <MarcoFoto
                key={idx}
                marco={tema?.marco_fotos}
                colorPrimario={tema?.color_primario}
                colorSecundario={tema?.color_secundario}
                className={`
                  ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}
                  ${isVisible ? 'animate-scaleIn' : 'opacity-0'}
                `}
              >
                <div
                  className={`
                    relative overflow-hidden cursor-pointer group
                    ${tema?.marco_fotos === 'none' ? 'rounded-2xl' : ''}
                    ${idx === 0 ? 'aspect-square md:aspect-auto' : 'aspect-square'}
                  `}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => openLightbox(idx)}
                >
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: `${tema?.color_primario}30` }}
                  />
                </div>
              </MarcoFoto>
            ))}
          </div>
        ) : (
          /* Grid uniforme */
          <div
            className={`grid gap-4`}
            style={{
              gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
            }}
          >
            {imagenes.map((url, idx) => (
              <div
                key={idx}
                className={`relative overflow-hidden cursor-pointer group rounded-2xl aspect-square ${
                  isVisible ? 'animate-scaleIn' : 'opacity-0'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: `${tema?.color_primario}30` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <button
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
              onClick={closeLightbox}
            >
              <X className="w-8 h-8" />
            </button>
            <button
              className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <img
              src={imagenes[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
            <div className="absolute bottom-4 text-white text-sm">
              {lightboxIndex + 1} / {imagenes.length}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(GaleriaPublico);
