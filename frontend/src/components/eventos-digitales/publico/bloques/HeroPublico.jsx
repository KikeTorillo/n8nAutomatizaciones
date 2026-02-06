/**
 * ====================================================================
 * HERO PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza el hero/portada de la invitación en vista pública.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

const INV = THEME_FALLBACK_COLORS.invitacion;
import {
  PatronFondo,
  DecoracionEsquinas,
  StickersDecorativos,
  IconoPrincipal,
  TituloTematico,
  AddToCalendar,
} from '@/components/eventos-digitales';

function HeroPublico({
  bloque,
  evento,
  invitado,
  tema,
  onScrollToContent,
  className = '',
}) {
  const { slug } = useParams();
  const { contenido = {}, estilos = {} } = bloque;

  // Usar contenido del bloque o defaults del evento
  const titulo = contenido.titulo || evento?.nombre || 'Título del Evento';
  const subtitulo = contenido.subtitulo || evento?.descripcion || '';
  const imagenUrl = contenido.imagen_url || evento?.portada_url || tema?.imagen_fondo;
  const imagenPosicion = contenido.imagen_posicion || 'center';

  // Estilos - Fallback: editor guarda 'imagen_overlay', antes se usaba 'overlay_opacidad'
  const alineacion = estilos.alineacion || contenido.alineacion || 'center';
  const overlayOpacidad = contenido.imagen_overlay ?? estilos.overlay_opacidad ?? 0.3;
  const tipoOverlay = contenido.tipo_overlay || 'uniforme';
  const colorOverlay = contenido.color_overlay || INV.overlay;
  const mostrarFecha = estilos.mostrar_fecha !== false;
  const mostrarHora = estilos.mostrar_hora !== false;
  const mostrarCalendario = contenido.mostrar_calendario !== false;

  // Helper para convertir hex a rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
      : '0,0,0';
  };
  const overlayRgb = hexToRgb(colorOverlay);

  // Altura de sección (full, medium, auto)
  const altura = estilos.altura || contenido.altura || 'full';

  // Detectar si hay imagen de fondo para ajustar contraste
  const tieneImagenFondo = !!imagenUrl;

  // Clases de alineación
  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  // Clases de altura
  const heightClasses = {
    full: 'min-h-screen',
    medium: 'min-h-[50vh]',
    auto: 'min-h-0 py-16',
  };

  return (
    <section
      className={`relative ${heightClasses[altura] || heightClasses.full} flex flex-col ${className}`}
      style={{
        '--hero-overlay': overlayOpacidad,
      }}
    >
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
                ? `linear-gradient(to bottom, rgba(${overlayRgb},${overlayOpacidad}) 0%, rgba(${overlayRgb},${overlayOpacidad + 0.1}) 40%, ${tema?.color_fondo || INV.fondoHero}dd 80%, ${tema?.color_fondo || INV.fondoHero} 100%)`
                : `rgba(${overlayRgb},${overlayOpacidad})`,
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: contenido.color_fondo_hero || tema?.color_secundario || INV.secundario,
          }}
        />
      )}

      {/* Patrón de fondo temático */}
      <PatronFondo
        patron={tema?.patron_fondo}
        opacidad={tema?.patron_opacidad}
        colorPrimario={tema?.color_primario}
      />

      {/* Decoraciones de esquinas */}
      <DecoracionEsquinas tipo={tema?.decoracion_esquinas} />

      {/* Stickers flotantes */}
      <StickersDecorativos stickers={tema?.stickers} />

      {/* Hero Content */}
      <div className={`relative flex-1 flex flex-col ${alignClasses[alineacion]} justify-center px-4 py-20`}>
        {/* Ícono principal temático */}
        {tema?.icono_principal !== 'none' && (
          <div className="mb-6 animate-fadeInUp">
            <IconoPrincipal
              icono={tema?.icono_principal}
              colorPrimario={tema?.color_primario}
            />
          </div>
        )}

        {/* Saludo personalizado al invitado */}
        {invitado && (
          <p
            className="text-lg sm:text-xl mb-2 animate-fadeInUp"
            style={{
              color: tieneImagenFondo ? 'white' : tema?.color_primario,
              textShadow: tieneImagenFondo
                ? '0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,1)'
                : 'none',
            }}
          >
            Querido/a <span className="font-semibold">{invitado.nombre}</span>
          </p>
        )}

        {/* Subtítulo/descripción */}
        {subtitulo && (
          <p
            className="text-lg sm:text-xl md:text-2xl max-w-2xl mb-6 font-light italic animate-fadeInUp stagger-1"
            style={{
              color: tieneImagenFondo ? 'white' : tema?.color_texto_claro,
              textShadow: tieneImagenFondo
                ? '0 2px 20px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,1)'
                : 'none',
            }}
          >
            {subtitulo}
          </p>
        )}

        {/* Título principal */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight animate-fadeInUp stagger-2"
          style={{
            fontFamily: tema?.fuente_titulo,
            color: tieneImagenFondo ? 'white' : tema?.color_texto,
            textShadow: tieneImagenFondo
              ? '0 4px 40px rgba(0,0,0,1), 0 2px 15px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.8)'
              : 'none',
          }}
        >
          <TituloTematico
            efecto={tema?.efecto_titulo}
            colorPrimario={tema?.color_primario}
            colorSecundario={tema?.color_secundario}
          >
            {titulo}
          </TituloTematico>
        </h1>

        {/* Fecha y hora */}
        {(mostrarFecha || mostrarHora) && evento?.fecha_evento && (
          <div
            className="inline-flex items-center gap-3 sm:gap-6 px-6 sm:px-10 py-4 sm:py-5 rounded-full backdrop-blur-sm mb-8 animate-scaleIn stagger-3"
            style={{
              backgroundColor: tieneImagenFondo ? 'rgba(0,0,0,0.4)' : tema?.color_secundario,
              border: `1px solid ${tieneImagenFondo ? 'rgba(255,255,255,0.3)' : tema?.color_primario}20`,
              boxShadow: tieneImagenFondo ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {mostrarFecha && (
              <div className="flex items-center gap-2">
                <Calendar
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: tieneImagenFondo ? 'white' : tema?.color_primario }}
                />
                <span
                  className="text-base sm:text-lg font-semibold"
                  style={{
                    color: tieneImagenFondo ? 'white' : tema?.color_texto,
                    textShadow: tieneImagenFondo ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
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
                className="w-px h-8"
                style={{
                  backgroundColor: tieneImagenFondo ? 'rgba(255,255,255,0.4)' : tema?.color_primario,
                }}
              />
            )}
            {mostrarHora && evento?.hora_evento && (
              <div className="flex items-center gap-2">
                <Clock
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  style={{ color: tieneImagenFondo ? 'white' : tema?.color_primario }}
                />
                <span
                  className="text-base sm:text-lg font-semibold"
                  style={{
                    color: tieneImagenFondo ? 'white' : tema?.color_texto,
                    textShadow: tieneImagenFondo ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
                  }}
                >
                  {evento.hora_evento}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botones Agregar al Calendario */}
        {mostrarCalendario && evento?.fecha_evento && (
          <div className="animate-fadeInUp stagger-4">
            <AddToCalendar
              evento={evento}
              slug={slug}
              ubicaciones={evento?.ubicaciones}
              tema={tema}
              tieneImagenFondo={tieneImagenFondo}
              variant="hero"
            />
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      {onScrollToContent && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
          onClick={onScrollToContent}
        >
          <ChevronDown
            className="w-8 h-8"
            style={{
              color: tieneImagenFondo ? 'white' : tema?.color_primario,
              filter: tieneImagenFondo ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' : 'none',
            }}
          />
        </div>
      )}
    </section>
  );
}

export default memo(HeroPublico);
