/**
 * ====================================================================
 * HERO INVITACION ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo hero_invitacion en el canvas.
 * Muestra la portada principal de la invitación.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { Calendar, Clock } from 'lucide-react';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

function HeroInvitacionElementRenderer({
  elemento,
  tema,
  customData: evento,
  isEditing = false,
}) {
  const { contenido = {} } = elemento;

  // Usar contenido del elemento o defaults del evento
  const titulo = contenido.titulo || evento?.nombre || 'Título del Evento';
  const subtitulo = contenido.subtitulo || evento?.descripcion || '';
  const imagenUrl = contenido.imagen_url || evento?.portada_url;
  const imagenPosicion = contenido.imagen_posicion || 'center';
  const alineacion = contenido.alineacion || 'center';
  const overlayOpacidad = contenido.imagen_overlay ?? 0.3;
  const tipoOverlay = contenido.tipo_overlay || 'uniforme';
  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorOverlay = contenido.color_overlay || INV.overlay;
  const mostrarCalendario = contenido.mostrar_calendario !== false;
  const mostrarFecha = contenido.mostrar_fecha !== false;
  const mostrarHora = contenido.mostrar_hora !== false;
  const altura = contenido.altura || 'full';

  // Helper para convertir hex a rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
      : '0,0,0';
  };
  const overlayRgb = hexToRgb(colorOverlay);

  const tieneImagenFondo = !!imagenUrl;

  // Estilos del tema
  const colorPrimario = tema?.color_primario || INV.primario;
  const colorSecundario = tema?.color_secundario || INV.secundario;
  const colorTexto = tema?.color_texto || INV.texto;
  const colorTextoClaro = tema?.color_texto_claro || INV.textoClaro;
  const fuenteTitulo = tema?.fuente_titulos || 'inherit';

  // Clases de alineación
  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  // Altura mínima según configuración
  const minHeightClass = altura === 'full' ? 'min-h-[400px]' : altura === 'medium' ? 'min-h-[300px]' : 'min-h-[200px]';

  return (
    <div className={`hero-invitacion-element relative ${minHeightClass} w-full flex flex-col overflow-hidden rounded-lg`}>
      {/* Background Image */}
      {imagenUrl ? (
        <div className="absolute inset-0">
          <img
            src={imagenUrl}
            alt={titulo}
            className="w-full h-full object-cover"
            style={{ objectPosition: imagenPosicion }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: tipoOverlay === 'gradiente'
                ? `linear-gradient(to bottom, rgba(${overlayRgb},${overlayOpacidad}) 0%, rgba(${overlayRgb},${overlayOpacidad + 0.1}) 40%, ${colorSecundario}dd 80%, ${colorSecundario} 100%)`
                : `rgba(${overlayRgb},${overlayOpacidad})`,
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: contenido.color_fondo_hero || colorSecundario,
          }}
        />
      )}

      {/* Content */}
      <div className={`relative flex-1 flex flex-col ${alignClasses[alineacion]} justify-center px-4 py-10`}>
        {/* Subtítulo */}
        {subtitulo && (
          <p
            className="text-sm sm:text-base max-w-lg mb-3 font-light italic"
            style={{
              color: tieneImagenFondo ? 'white' : colorTextoClaro,
              textShadow: tieneImagenFondo ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
            }}
          >
            {subtitulo}
          </p>
        )}

        {/* Título */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight"
          style={{
            fontFamily: fuenteTitulo,
            color: tieneImagenFondo ? 'white' : colorTexto,
            textShadow: tieneImagenFondo ? '0 4px 20px rgba(0,0,0,0.9)' : 'none',
          }}
        >
          {titulo}
        </h1>

        {/* Fecha y hora (si hay evento y están habilitadas) */}
        {(mostrarFecha || mostrarHora) && evento?.fecha_evento && (
          <div
            className="inline-flex items-center gap-2 sm:gap-4 px-4 py-2 rounded-full backdrop-blur-sm mb-4"
            style={{
              backgroundColor: tieneImagenFondo ? 'rgba(0,0,0,0.4)' : colorSecundario,
              border: `1px solid ${tieneImagenFondo ? 'rgba(255,255,255,0.3)' : colorPrimario}20`,
            }}
          >
            {mostrarFecha && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" style={{ color: tieneImagenFondo ? 'white' : colorPrimario }} />
                <span
                  className="text-sm font-medium"
                  style={{
                    color: tieneImagenFondo ? 'white' : colorTexto,
                  }}
                >
                  {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {mostrarFecha && mostrarHora && evento?.hora_evento && (
              <div
                className="w-px h-4"
                style={{ backgroundColor: tieneImagenFondo ? 'rgba(255,255,255,0.4)' : colorPrimario }}
              />
            )}
            {mostrarHora && evento?.hora_evento && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" style={{ color: tieneImagenFondo ? 'white' : colorPrimario }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: tieneImagenFondo ? 'white' : colorTexto }}
                >
                  {evento.hora_evento}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Indicador de calendario */}
        {mostrarCalendario && evento?.fecha_evento && (
          <div className="flex items-center gap-2 text-xs" style={{ color: tieneImagenFondo ? 'rgba(255,255,255,0.7)' : colorTextoClaro }}>
            <Calendar className="w-3 h-3" />
            <span>Botones de calendario visibles en vista pública</span>
          </div>
        )}
      </div>

      {/* Editor mode indicator */}
      {isEditing && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
          Portada
        </div>
      )}
    </div>
  );
}

HeroInvitacionElementRenderer.propTypes = {
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
    nombre: PropTypes.string,
    descripcion: PropTypes.string,
    fecha_evento: PropTypes.string,
    hora_evento: PropTypes.string,
    portada_url: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
};

export default memo(HeroInvitacionElementRenderer);
