/**
 * ====================================================================
 * CALENDARIO ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo calendario (agregar al calendario) en el canvas.
 * Botones para Google Calendar y descarga de .ics.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CalendarPlus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== HELPERS ==========

/**
 * Genera URL para Google Calendar
 */
function generarGoogleCalendarUrl({ nombre, descripcion, fecha, hora, ubicacion, url }) {
  if (!fecha) return null;

  const fechaEvento = new Date(fecha);
  const horaInicio = hora || '12:00';
  const [horas, minutos] = horaInicio.split(':').map(Number);
  fechaEvento.setHours(horas, minutos, 0, 0);

  // Evento de 4 horas por defecto
  const fechaFin = new Date(fechaEvento.getTime() + 4 * 60 * 60 * 1000);

  const formatGCal = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const detalles = descripcion
    ? `${descripcion}\n\nMás información: ${url}`
    : `Más información: ${url}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: nombre || 'Evento',
    dates: `${formatGCal(fechaEvento)}/${formatGCal(fechaFin)}`,
    details: detalles,
    location: ubicacion || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ========== COMPONENT ==========

function CalendarioElementRenderer({
  elemento,
  tema,
  evento,
  ubicaciones = [],
  slug,
  isEditing = false,
}) {
  const { contenido = {}, estilos = {} } = elemento;

  // Configuración
  const titulo = contenido.titulo || '';
  const mostrarGoogle = contenido.mostrar_google !== false;
  const mostrarIcs = contenido.mostrar_ics !== false;
  const variante = contenido.variante || 'default';
  const alineacion = contenido.alineacion || 'center';

  // Textos de botones personalizables
  const textoGoogle = contenido.texto_google || 'Google Calendar';
  const textoIcs = contenido.texto_ics || 'Descargar .ics';

  // Colores
  const colorPrimario = estilos.color_primario || tema?.color_primario || '#753572';
  const colorSecundario = estilos.color_secundario || tema?.color_secundario || '#fce7f3';
  const colorTexto = estilos.color_texto || tema?.color_texto || '#1f2937';

  // Si no hay botones activos, mostrar placeholder en edición
  if (!mostrarGoogle && !mostrarIcs) {
    if (isEditing) {
      return (
        <div className="text-center py-4 text-gray-400 text-sm">
          Activa al menos un botón de calendario
        </div>
      );
    }
    return null;
  }

  // URL actual para agregar a los detalles
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Dirección de la primera ubicación
  const ubicacionTexto = useMemo(() => {
    if (!ubicaciones || ubicaciones.length === 0) return '';
    const ub = ubicaciones[0];
    return ub?.direccion || ub?.nombre || '';
  }, [ubicaciones]);

  // URL de Google Calendar
  const googleCalendarUrl = useMemo(() => {
    if (!evento?.fecha_evento && !isEditing) return null;
    return generarGoogleCalendarUrl({
      nombre: evento?.nombre || 'Mi Evento',
      descripcion: evento?.descripcion || '',
      fecha: evento?.fecha_evento,
      hora: evento?.hora_evento,
      ubicacion: ubicacionTexto,
      url: currentUrl,
    });
  }, [evento, ubicacionTexto, currentUrl, isEditing]);

  // URL para descargar .ics
  const icsUrl = slug ? `/api/v1/public/evento/${slug}/calendario` : null;

  // Estilos de botón según variante
  const buttonStyles = useMemo(() => {
    if (variante === 'hero') {
      return {
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: 'white',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      };
    }
    if (variante === 'minimal') {
      return {
        backgroundColor: 'transparent',
        color: colorPrimario,
        border: `1px solid ${colorPrimario}`,
      };
    }
    // Default
    return {
      backgroundColor: colorSecundario,
      color: colorPrimario,
      border: `1px solid ${colorPrimario}30`,
    };
  }, [variante, colorPrimario, colorSecundario]);

  // Clases de alineación
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[alineacion];

  return (
    <div className="calendario-element w-full">
      {/* Título opcional */}
      {titulo && (
        <p
          className={cn(
            'text-base font-medium mb-3',
            alineacion === 'left' && 'text-left',
            alineacion === 'center' && 'text-center',
            alineacion === 'right' && 'text-right',
          )}
          style={{ color: variante === 'hero' ? 'white' : colorTexto }}
        >
          {titulo}
        </p>
      )}

      {/* Botones */}
      <div className={cn('flex flex-wrap gap-3', alignClass)}>
        {/* Google Calendar */}
        {mostrarGoogle && (
          <a
            href={googleCalendarUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (isEditing || !googleCalendarUrl) {
                e.preventDefault();
              }
            }}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold',
              'transition-all hover:scale-105',
              isEditing && 'cursor-default',
            )}
            style={buttonStyles}
          >
            <CalendarPlus className="w-4 h-4" />
            {textoGoogle}
          </a>
        )}

        {/* Descargar .ics */}
        {mostrarIcs && (
          <a
            href={icsUrl || '#'}
            download={slug ? `${slug}.ics` : 'evento.ics'}
            onClick={(e) => {
              if (isEditing || !icsUrl) {
                e.preventDefault();
              }
            }}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold',
              'transition-all hover:scale-105',
              isEditing && 'cursor-default',
            )}
            style={buttonStyles}
          >
            <Download className="w-4 h-4" />
            {textoIcs}
          </a>
        )}
      </div>
    </div>
  );
}

CalendarioElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      titulo: PropTypes.string,
      mostrar_google: PropTypes.bool,
      mostrar_ics: PropTypes.bool,
      variante: PropTypes.oneOf(['default', 'hero', 'minimal']),
      alineacion: PropTypes.oneOf(['left', 'center', 'right']),
      texto_google: PropTypes.string,
      texto_ics: PropTypes.string,
    }),
    estilos: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
    color_texto: PropTypes.string,
  }),
  evento: PropTypes.shape({
    nombre: PropTypes.string,
    descripcion: PropTypes.string,
    fecha_evento: PropTypes.string,
    hora_evento: PropTypes.string,
  }),
  ubicaciones: PropTypes.array,
  slug: PropTypes.string,
  isEditing: PropTypes.bool,
};

export default memo(CalendarioElementRenderer);
