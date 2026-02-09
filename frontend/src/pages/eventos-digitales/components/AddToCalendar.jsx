/**
 * ====================================================================
 * ADD TO CALENDAR - COMPONENTE REUTILIZABLE
 * ====================================================================
 * Genera botones para agregar evento a Google Calendar y descargar .ics
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { CalendarPlus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Genera URL para Google Calendar
 * @param {Object} params
 * @param {string} params.nombre - Nombre del evento
 * @param {string} params.descripcion - Descripción del evento
 * @param {string} params.fecha - Fecha del evento (YYYY-MM-DD)
 * @param {string} params.hora - Hora del evento (HH:mm)
 * @param {string} params.ubicacion - Dirección de la ubicación
 * @param {string} params.url - URL de la invitación
 * @returns {string} URL de Google Calendar
 */
function generarGoogleCalendarUrl({ nombre, descripcion, fecha, hora, ubicacion, url }) {
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
    text: nombre,
    dates: `${formatGCal(fechaEvento)}/${formatGCal(fechaFin)}`,
    details: detalles,
    location: ubicacion || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * AddToCalendar - Botones para agregar a calendario
 *
 * @param {Object} props
 * @param {Object} props.evento - Datos del evento
 * @param {string} props.evento.nombre - Nombre del evento
 * @param {string} props.evento.descripcion - Descripción
 * @param {string} props.evento.fecha_evento - Fecha (YYYY-MM-DD)
 * @param {string} props.evento.hora_evento - Hora (HH:mm)
 * @param {string} props.slug - Slug del evento (para .ics)
 * @param {Array} props.ubicaciones - Array de ubicaciones del evento
 * @param {Object} props.tema - Tema de colores
 * @param {boolean} props.tieneImagenFondo - Si hay imagen de fondo (para contraste)
 * @param {string} props.variant - Variante de estilo: 'default' | 'minimal' | 'hero'
 * @param {string} props.className - Clases adicionales
 */
function AddToCalendar({
  evento,
  slug,
  ubicaciones = [],
  tema = {},
  tieneImagenFondo = false,
  variant = 'default',
  className = '',
}) {
  // URL actual para agregar a los detalles
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Dirección de la primera ubicación
  const ubicacionTexto = useMemo(() => {
    if (ubicaciones.length === 0) return '';
    const ub = ubicaciones[0];
    return ub.direccion || ub.nombre || '';
  }, [ubicaciones]);

  // URL de Google Calendar
  const googleCalendarUrl = useMemo(() => {
    if (!evento?.fecha_evento) return null;
    return generarGoogleCalendarUrl({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fecha: evento.fecha_evento,
      hora: evento.hora_evento,
      ubicacion: ubicacionTexto,
      url: currentUrl,
    });
  }, [evento, ubicacionTexto, currentUrl]);

  // URL para descargar .ics
  const icsUrl = slug ? `/api/v1/public/evento/${slug}/calendario` : null;

  // No renderizar si no hay fecha
  if (!evento?.fecha_evento) return null;

  // Estilos base según variante
  const buttonStyles = useMemo(() => {
    if (variant === 'hero' || tieneImagenFondo) {
      return {
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: 'white',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
      };
    }
    return {
      backgroundColor: tema.color_secundario || '#fce7f3',
      color: tema.color_primario || '#753572',
      border: `1px solid ${tema.color_primario || '#753572'}30`,
    };
  }, [variant, tieneImagenFondo, tema]);

  const buttonClasses = cn(
    'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105',
    className
  );

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {/* Google Calendar */}
      {googleCalendarUrl && (
        <a
          href={googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses}
          style={buttonStyles}
        >
          <CalendarPlus className="w-4 h-4" />
          Google Calendar
        </a>
      )}

      {/* Descargar .ics */}
      {icsUrl && (
        <a
          href={icsUrl}
          download={`${slug}.ics`}
          className={buttonClasses}
          style={buttonStyles}
        >
          <Download className="w-4 h-4" />
          Descargar .ics
        </a>
      )}
    </div>
  );
}

export default memo(AddToCalendar);
