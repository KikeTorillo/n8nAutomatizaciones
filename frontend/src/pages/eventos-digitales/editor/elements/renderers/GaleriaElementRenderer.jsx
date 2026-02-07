/**
 * ====================================================================
 * GALERIA ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo galeria en el canvas.
 * Muestra una galería de fotos con diferentes layouts.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

function GaleriaElementRenderer({
  elemento,
  tema,
  customData: evento,
  isEditing = false,
}) {
  const { contenido = {} } = elemento;

  const titulo = contenido.titulo_seccion || contenido.titulo || 'Galería';
  const subtitulo = contenido.subtitulo_seccion || contenido.subtitulo || '';
  const layout = contenido.layout || 'grid';
  const columnas = contenido.columnas || 3;

  // Usar imágenes del elemento o las del evento
  let imagenes = [];
  if (contenido.imagenes?.length > 0) {
    imagenes = contenido.imagenes.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
  } else if (evento?.galeria_urls?.length > 0) {
    imagenes = evento.galeria_urls;
  }

  // Estilos del tema
  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.secundario;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const fuenteTitulo = tema?.fuente_titulos || 'inherit';

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    if (!isEditing) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => setLightboxOpen(false);
  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % imagenes.length);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);

  // Mostrar placeholder si no hay imágenes en modo edición
  if (imagenes.length === 0) {
    if (isEditing) {
      return (
        <div className="galeria-element w-full py-6">
          <div className="text-center mb-6">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: colorTexto, fontFamily: fuenteTitulo }}
            >
              {titulo}
            </h2>
            {subtitulo && (
              <p className="text-sm" style={{ color: colorTextoClaro }}>{subtitulo}</p>
            )}
          </div>
          <div
            className="text-center py-8 rounded-xl"
            style={{ backgroundColor: colorSecundario + '30' }}
          >
            <Images className="w-10 h-10 mx-auto mb-2" style={{ color: colorPrimario }} />
            <p className="text-sm" style={{ color: colorTextoClaro }}>
              Las fotos de la galería se mostrarán aquí
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="galeria-element w-full py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: colorTexto, fontFamily: fuenteTitulo }}
        >
          {titulo}
        </h2>
        {subtitulo && (
          <p className="text-sm" style={{ color: colorTextoClaro }}>{subtitulo}</p>
        )}
      </div>

      {/* Grid de imágenes */}
      {layout === 'masonry' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imagenes.slice(0, 6).map((url, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden cursor-pointer group rounded-lg ${
                idx === 0 ? 'sm:col-span-2 sm:row-span-2' : ''
              } ${idx === 0 ? 'aspect-square sm:aspect-auto' : 'aspect-square'}`}
              onClick={() => openLightbox(idx)}
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: `${colorPrimario}30` }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(columnas, 4)}, minmax(0, 1fr))` }}
        >
          {imagenes.slice(0, columnas * 2).map((url, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden cursor-pointer group rounded-lg aspect-square"
              onClick={() => openLightbox(idx)}
            >
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ backgroundColor: `${colorPrimario}30` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Indicador de más fotos */}
      {imagenes.length > 6 && (
        <p className="text-center text-xs mt-3" style={{ color: colorTextoClaro }}>
          +{imagenes.length - 6} fotos más
        </p>
      )}

      {/* Lightbox (solo si no está en modo edición) */}
      {lightboxOpen && !isEditing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>
          <button
            className="absolute left-4 text-white p-2 hover:bg-white/20 rounded-full"
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={imagenes[lightboxIndex]}
            alt={`Foto ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[85vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white p-2 hover:bg-white/20 rounded-full"
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 text-white text-sm">
            {lightboxIndex + 1} / {imagenes.length}
          </div>
        </div>
      )}
    </div>
  );
}

GaleriaElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
    color_texto: PropTypes.string,
    color_texto_claro: PropTypes.string,
    fuente_titulos: PropTypes.string,
  }),
  customData: PropTypes.shape({
    galeria_urls: PropTypes.array,
  }),
  isEditing: PropTypes.bool,
};

export default memo(GaleriaElementRenderer);
