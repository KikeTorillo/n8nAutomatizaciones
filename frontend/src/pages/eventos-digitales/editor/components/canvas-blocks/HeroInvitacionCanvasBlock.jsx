/**
 * ====================================================================
 * HERO INVITACION CANVAS BLOCK
 * ====================================================================
 * Versión fiel a HeroPublico - Sin animaciones para no distraer en edición.
 *
 * Diferencias con HeroPublico:
 * - Sin animaciones CSS (fadeIn, scaleIn, stagger)
 * - Alturas compactas para facilitar edición en canvas
 * - Soporta edición inline con InlineText
 * - Sin scroll indicator
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Sincronizar con HeroPublico (gradiente, decoraciones, calendario)
 */

import { memo } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineText } from '@/components/editor-framework';
import {
  PatronFondo,
  DecoracionEsquinas,
  StickersDecorativos,
  IconoPrincipal,
  TituloTematico,
  AddToCalendar,
} from '@/components/eventos-digitales';

/**
 * Hero Invitación Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 * @param {Object} props.evento - Datos del evento
 * @param {boolean} props.isEditing - Si está en modo inline editing
 * @param {Function} props.onContentChange - Callback al cambiar contenido
 */
function HeroInvitacionCanvasBlock({ bloque, tema, evento, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Datos del bloque con fallbacks del evento
  const titulo = contenido.titulo || evento?.nombre || 'Título del Evento';
  const subtitulo = contenido.subtitulo || evento?.descripcion || '';
  const imagen_url = contenido.imagen_url || evento?.portada_url;
  const imagen_posicion = contenido.imagen_posicion || 'center';
  const alineacion = contenido.alineacion || estilos.alineacion || 'center';
  const mostrar_calendario = contenido.mostrar_calendario !== false;
  const mostrar_fecha = estilos.mostrar_fecha !== false;
  const mostrar_hora = estilos.mostrar_hora !== false;

  // Overlay - usar ?? para permitir 0
  const imagen_overlay = contenido.imagen_overlay ?? estilos.imagen_overlay ?? 0.3;
  const tipo_overlay = contenido.tipo_overlay || 'uniforme';
  const color_overlay = contenido.color_overlay || '#000000';
  const altura = contenido.altura || estilos.altura || 'full';

  // Helper para convertir hex a rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
      : '0,0,0';
  };
  const overlayRgb = hexToRgb(color_overlay);

  // Colores del tema
  const colorFondo = tema?.color_fondo || '#fdf2f8';
  const colorPrimario = tema?.color_primario || '#753572';
  const colorSecundario = tema?.color_secundario || '#fce7f3';

  // Detectar si hay imagen
  const tieneImagenFondo = !!imagen_url;

  // Clases de altura (compactas para el canvas)
  const alturaClasses = {
    auto: 'min-h-[250px]',
    medium: 'min-h-[350px]',
    full: 'min-h-[450px]',
  };

  const alignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <section
      className={cn(
        'relative flex flex-col',
        alturaClasses[altura] || alturaClasses.full
      )}
    >
      {/* ========== BACKGROUND ========== */}
      {tieneImagenFondo ? (
        <div className="absolute inset-0">
          <img
            src={imagen_url}
            alt={titulo}
            className="w-full h-full object-cover"
            style={{ objectPosition: imagen_posicion }}
          />
          {/* Overlay - Uniforme o Gradiente según configuración */}
          <div
            className="absolute inset-0"
            style={{
              background: tipo_overlay === 'gradiente'
                ? `linear-gradient(to bottom, rgba(${overlayRgb},${imagen_overlay}) 0%, rgba(${overlayRgb},${imagen_overlay + 0.1}) 40%, ${colorFondo}dd 80%, ${colorFondo} 100%)`
                : `rgba(${overlayRgb},${imagen_overlay})`,
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

      {/* ========== ELEMENTOS DECORATIVOS DEL TEMA ========== */}
      <PatronFondo
        patron={tema?.patron_fondo}
        opacidad={tema?.patron_opacidad}
        colorPrimario={colorPrimario}
      />
      <DecoracionEsquinas tipo={tema?.decoracion_esquinas} />
      <StickersDecorativos stickers={tema?.stickers} />

      {/* ========== CONTENIDO ========== */}
      <div className={cn(
        'relative flex-1 flex flex-col justify-center px-4 py-12',
        alignClasses[alineacion]
      )}>
        {/* Ícono Principal */}
        {tema?.icono_principal && tema.icono_principal !== 'none' && (
          <div className="mb-4">
            <IconoPrincipal
              icono={tema.icono_principal}
              colorPrimario={colorPrimario}
            />
          </div>
        )}

        {/* Subtítulo (arriba del título) */}
        {isEditing ? (
          <InlineText
            value={contenido.subtitulo || ''}
            onChange={(v) => onContentChange?.({ subtitulo: v })}
            placeholder="Escribe el subtítulo..."
            as="p"
            className="text-lg md:text-xl max-w-2xl mb-4 font-light italic"
            style={{
              color: tieneImagenFondo ? 'white' : tema?.color_texto_claro,
              textShadow: tieneImagenFondo ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
            }}
          />
        ) : (
          subtitulo && (
            <p
              className="text-lg md:text-xl max-w-2xl mb-4 font-light italic"
              style={{
                color: tieneImagenFondo ? 'white' : tema?.color_texto_claro,
                textShadow: tieneImagenFondo ? '0 2px 10px rgba(0,0,0,0.8)' : 'none',
              }}
            >
              {subtitulo}
            </p>
          )
        )}

        {/* Título Principal */}
        {isEditing ? (
          <InlineText
            value={contenido.titulo || ''}
            onChange={(v) => onContentChange?.({ titulo: v })}
            placeholder="Escribe el título..."
            as="h1"
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{
              fontFamily: tema?.fuente_titulo,
              color: tieneImagenFondo ? 'white' : tema?.color_texto,
              textShadow: tieneImagenFondo ? '0 4px 20px rgba(0,0,0,0.9)' : 'none',
            }}
          />
        ) : (
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{
              fontFamily: tema?.fuente_titulo,
              color: tieneImagenFondo ? 'white' : tema?.color_texto,
              textShadow: tieneImagenFondo ? '0 4px 20px rgba(0,0,0,0.9)' : 'none',
            }}
          >
            <TituloTematico
              efecto={tema?.efecto_titulo}
              colorPrimario={colorPrimario}
              colorSecundario={colorSecundario}
            >
              {titulo}
            </TituloTematico>
          </h1>
        )}

        {/* Fecha con Iconos */}
        {(mostrar_fecha || mostrar_hora) && evento?.fecha_evento && (
          <div
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-sm mb-6"
            style={{
              backgroundColor: tieneImagenFondo ? 'rgba(0,0,0,0.4)' : colorSecundario,
              border: `1px solid ${tieneImagenFondo ? 'rgba(255,255,255,0.3)' : colorPrimario}20`,
            }}
          >
            {mostrar_fecha && (
              <>
                <Calendar
                  className="w-5 h-5"
                  style={{ color: tieneImagenFondo ? 'white' : colorPrimario }}
                />
                <span
                  className="font-semibold"
                  style={{
                    color: tieneImagenFondo ? 'white' : tema?.color_texto,
                    textShadow: tieneImagenFondo ? '0 1px 3px rgba(0,0,0,0.6)' : 'none',
                  }}
                >
                  {new Date(evento.fecha_evento).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
            {mostrar_fecha && mostrar_hora && evento?.hora_evento && (
              <div
                className="w-px h-6"
                style={{
                  backgroundColor: tieneImagenFondo ? 'rgba(255,255,255,0.4)' : colorPrimario,
                }}
              />
            )}
            {mostrar_hora && evento?.hora_evento && (
              <>
                <Clock
                  className="w-5 h-5"
                  style={{ color: tieneImagenFondo ? 'white' : colorPrimario }}
                />
                <span
                  className="font-semibold"
                  style={{
                    color: tieneImagenFondo ? 'white' : tema?.color_texto,
                    textShadow: tieneImagenFondo ? '0 1px 3px rgba(0,0,0,0.6)' : 'none',
                  }}
                >
                  {evento.hora_evento}
                </span>
              </>
            )}
          </div>
        )}

        {/* Botones de Calendario */}
        {mostrar_calendario && evento?.fecha_evento && (
          <AddToCalendar
            evento={evento}
            slug={evento?.slug}
            tema={tema}
            tieneImagenFondo={tieneImagenFondo}
            variant="hero"
          />
        )}
      </div>
    </section>
  );
}

export default memo(HeroInvitacionCanvasBlock);
