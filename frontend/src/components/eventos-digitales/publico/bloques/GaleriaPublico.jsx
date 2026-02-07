/**
 * ====================================================================
 * GALERIA PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza una galería de fotos del evento.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState, useRef, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MarcoFoto } from '@/components/eventos-digitales';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

const INV = THEME_FALLBACK_COLORS.invitacion;

/**
 * Subcomponente Carrusel — scroll horizontal con snap, flechas y dots
 */
function GaleriaCarousel({ imagenes, tema, isVisible, onImageClick }) {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const colorPrimario = tema?.color_primario || INV.primario;

  const scrollTo = useCallback((index) => {
    const container = scrollRef.current;
    if (!container) return;
    const child = container.children[index];
    if (!child) return;
    container.scrollTo({ left: child.offsetLeft - container.offsetLeft, behavior: 'smooth' });
  }, []);

  const handlePrev = useCallback(() => {
    const prev = activeIndex > 0 ? activeIndex - 1 : imagenes.length - 1;
    scrollTo(prev);
  }, [activeIndex, imagenes.length, scrollTo]);

  const handleNext = useCallback(() => {
    const next = activeIndex < imagenes.length - 1 ? activeIndex + 1 : 0;
    scrollTo(next);
  }, [activeIndex, imagenes.length, scrollTo]);

  // Detectar imagen activa al hacer scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const scrollLeft = container.scrollLeft;
      const childWidth = container.children[0]?.offsetWidth || 1;
      const gap = 16; // gap-4 = 1rem = 16px
      const idx = Math.round(scrollLeft / (childWidth + gap));
      setActiveIndex(Math.min(idx, imagenes.length - 1));
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [imagenes.length]);

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  return (
    <div className={`relative group/carousel ${animationClass}`}>
      {/* Contenedor scroll */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`[data-carousel-scroll]::-webkit-scrollbar { display: none; }`}</style>
        {imagenes.map((url, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[75vw] sm:w-[60vw] md:w-[40vw] lg:w-[30vw] snap-center"
          >
            <MarcoFoto
              marco={tema?.marco_fotos}
              colorPrimario={colorPrimario}
              colorSecundario={tema?.color_secundario}
            >
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-xl transition-shadow duration-300"
                onClick={() => onImageClick(idx)}
              >
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: `${colorPrimario}20` }}
                />
              </div>
            </MarcoFoto>
          </div>
        ))}
      </div>

      {/* Flechas de navegación (desktop) */}
      {imagenes.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 text-gray-700 dark:text-white shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 backdrop-blur-sm"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 text-gray-700 dark:text-white shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 backdrop-blur-sm"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicadores (dots) */}
      {imagenes.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {imagenes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: idx === activeIndex ? 24 : 8,
                height: 8,
                backgroundColor: idx === activeIndex ? colorPrimario : `${colorPrimario}40`,
              }}
              aria-label={`Ir a imagen ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GaleriaPublico({ bloque, evento, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  // Editor guarda titulo_seccion/subtitulo_seccion, antes se usaba titulo/subtitulo
  const titulo = contenido.titulo_seccion || contenido.titulo || 'Galería';
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo || 'Momentos que atesoramos';

  // Usar imágenes del bloque o las del evento (filtrar inválidos)
  // El editor guarda array de {url, alt}, necesitamos extraer solo URLs para compatibilidad
  let imagenes = [];
  if (contenido.imagenes?.length > 0) {
    imagenes = contenido.imagenes.filter(Boolean).map(img => typeof img === 'string' ? img : img?.url).filter(Boolean);
  } else if (evento?.galeria_urls?.length > 0) {
    imagenes = evento.galeria_urls.filter(Boolean);
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

        {/* Galería según layout */}
        {layout === 'carousel' ? (
          <GaleriaCarousel
            imagenes={imagenes}
            tema={tema}
            isVisible={isVisible}
            onImageClick={openLightbox}
          />
        ) : layout === 'masonry' ? (
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
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
            }}
          >
            {imagenes.map((url, idx) => (
              <MarcoFoto
                key={idx}
                marco={tema?.marco_fotos}
                colorPrimario={tema?.color_primario}
                colorSecundario={tema?.color_secundario}
                className={isVisible ? 'animate-scaleIn' : 'opacity-0'}
              >
                <div
                  className="relative overflow-hidden cursor-pointer group rounded-2xl aspect-square"
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
            {imagenes[lightboxIndex] && (
              <img
                src={imagenes[lightboxIndex]}
                alt={`Foto ${lightboxIndex + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
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
