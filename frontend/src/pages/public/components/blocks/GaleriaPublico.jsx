import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * GaleriaPublico - Renderiza bloque de galería de imágenes en sitio público
 */
export default function GaleriaPublico({ contenido }) {
  const {
    titulo = '',
    subtitulo = '',
    imagenes = [],
    columnas = 3,
    espaciado = 'normal',
  } = contenido;

  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  const columnasClases = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  const espaciadoClases = {
    ninguno: 'gap-0',
    pequeno: 'gap-2',
    normal: 'gap-4',
    grande: 'gap-6',
  };

  const openLightbox = (index) => setLightbox({ open: true, index });
  const closeLightbox = () => setLightbox({ open: false, index: 0 });

  const navigate = (direction) => {
    const newIndex = lightbox.index + direction;
    if (newIndex >= 0 && newIndex < imagenes.length) {
      setLightbox({ ...lightbox, index: newIndex });
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        {(titulo || subtitulo) && (
          <div className="text-center mb-12">
            {subtitulo && (
              <span
                className="text-sm font-medium uppercase tracking-wider mb-2 block"
                style={{ color: 'var(--color-primario)' }}
              >
                {subtitulo}
              </span>
            )}
            {titulo && (
              <h2
                className="text-3xl sm:text-4xl font-bold"
                style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
              >
                {titulo}
              </h2>
            )}
          </div>
        )}

        {/* Grid de imágenes */}
        <div className={`grid grid-cols-1 ${columnasClases[columnas] || columnasClases[3]} ${espaciadoClases[espaciado] || espaciadoClases.normal}`}>
          {imagenes.map((imagen, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={imagen.url || imagen}
                alt={imagen.alt || `Imagen ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox.open && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {lightbox.index > 0 && (
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          <img
            src={imagenes[lightbox.index]?.url || imagenes[lightbox.index]}
            alt={imagenes[lightbox.index]?.alt || ''}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />

          {lightbox.index < imagenes.length - 1 && (
            <button
              onClick={() => navigate(1)}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {lightbox.index + 1} / {imagenes.length}
          </div>
        </div>
      )}
    </section>
  );
}
