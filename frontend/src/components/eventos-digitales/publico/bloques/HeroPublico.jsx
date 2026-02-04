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
import {
  PatronFondo,
  DecoracionEsquinas,
  StickersDecorativos,
  IconoPrincipal,
  TituloTematico,
} from '@/components/eventos-digitales';

function HeroPublico({
  bloque,
  evento,
  invitado,
  tema,
  onScrollToContent,
  className = '',
}) {
  const { contenido = {}, estilos = {} } = bloque;

  // Usar contenido del bloque o defaults del evento
  const titulo = contenido.titulo || evento?.nombre || 'Título del Evento';
  const subtitulo = contenido.subtitulo || evento?.descripcion || '';
  const imagenUrl = contenido.imagen_url || evento?.portada_url || tema?.imagen_fondo;
  const fechaTexto = contenido.fecha_texto;

  // Estilos - Fallback: editor guarda 'imagen_overlay', antes se usaba 'overlay_opacidad'
  const alineacion = estilos.alineacion || contenido.alineacion || 'center';
  const overlayOpacidad = estilos.overlay_opacidad ?? contenido.imagen_overlay ?? 0.5;
  const mostrarFecha = estilos.mostrar_fecha !== false;
  const mostrarHora = estilos.mostrar_hora !== false;

  // Detectar si hay imagen de fondo para ajustar contraste
  const tieneImagenFondo = !!imagenUrl;

  // Clases de alineación
  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <section
      className={`relative min-h-screen flex flex-col ${className}`}
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
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, rgba(0,0,0,${overlayOpacidad}) 0%, rgba(0,0,0,${overlayOpacidad + 0.1}) 40%, ${tema?.color_fondo || '#fdf2f8'}dd 80%, ${tema?.color_fondo || '#fdf2f8'} 100%)`,
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${tema?.color_secundario || '#fce7f3'} 0%, ${tema?.color_fondo || '#fdf2f8'} 100%)`,
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
        {(mostrarFecha || mostrarHora) && (evento?.fecha_evento || fechaTexto) && (
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
                  {fechaTexto ||
                    new Date(evento?.fecha_evento).toLocaleDateString('es-ES', {
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
