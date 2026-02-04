/**
 * ====================================================================
 * AGREGAR CALENDARIO PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza los botones de agregar al calendario en vista pública.
 * Reutiliza el componente AddToCalendar existente.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarPlus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Genera URL para Google Calendar
 * @param {Object} params
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
 * AgregarCalendarioPublico - Bloque de agregar al calendario
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.evento - Datos del evento
 * @param {Object} props.tema - Tema de la invitación
 * @param {Array} props.ubicaciones - Ubicaciones del evento
 * @param {boolean} props.isVisible - Si está visible (para animaciones)
 */
function AgregarCalendarioPublico({
  bloque,
  evento,
  tema,
  ubicaciones = [],
  isVisible,
  className = '',
}) {
  const { slug } = useParams();
  const { contenido = {}, estilos = {} } = bloque;

  // Configuración del bloque
  const titulo = contenido.titulo || '';
  const mostrarGoogle = contenido.mostrar_google !== false;
  const mostrarIcs = contenido.mostrar_ics !== false;
  const variante = estilos.variante || contenido.variante || 'default';
  const alineacion = estilos.alineacion || contenido.alineacion || 'center';

  // Si no hay fecha, no renderizar
  if (!evento?.fecha_evento) return null;

  // Si no hay botones activos, no renderizar
  if (!mostrarGoogle && !mostrarIcs) return null;

  // URL actual para agregar a los detalles
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Dirección de la primera ubicación
  const ubicacionTexto = useMemo(() => {
    if (!ubicaciones || ubicaciones.length === 0) return '';
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

  // Colores del tema
  const colorPrimario = tema?.color_primario || '#753572';
  const colorSecundario = tema?.color_secundario || '#fce7f3';
  const colorTexto = tema?.color_texto || '#1f2937';
  const colorFondo = tema?.color_fondo || '#fdf2f8';

  // Estilos de botón según variante
  const buttonStyles = useMemo(() => {
    if (variante === 'hero') {
      return {
        backgroundColor: 'rgba(0,0,0,0.4)',
        color: 'white',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
      };
    }
    if (variante === 'minimal') {
      return {
        backgroundColor: 'transparent',
        color: colorPrimario,
        border: `1px solid ${colorPrimario}`,
      };
    }
    return {
      backgroundColor: colorSecundario,
      color: colorPrimario,
      border: `1px solid ${colorPrimario}30`,
    };
  }, [variante, colorPrimario, colorSecundario]);

  // Clases de alineación
  const alignClass = {
    left: 'justify-start text-left',
    center: 'justify-center text-center',
    right: 'justify-end text-right',
  }[alineacion];

  const animationClass = isVisible ? 'animate-fadeIn' : 'opacity-0';

  return (
    <section
      className={cn('py-8 px-4', animationClass, className)}
      style={{
        backgroundColor: variante === 'hero' ? colorPrimario : colorFondo,
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* Título opcional */}
        {titulo && (
          <p
            className={`text-base font-medium mb-4 ${alignClass.split(' ')[1]}`}
            style={{
              color: variante === 'hero' ? 'white' : colorTexto,
            }}
          >
            {titulo}
          </p>
        )}

        {/* Botones */}
        <div className={`flex flex-wrap gap-3 ${alignClass.split(' ')[0]}`}>
          {/* Google Calendar */}
          {mostrarGoogle && googleCalendarUrl && (
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={buttonStyles}
            >
              <CalendarPlus className="w-4 h-4" />
              Google Calendar
            </a>
          )}

          {/* Descargar .ics */}
          {mostrarIcs && icsUrl && (
            <a
              href={icsUrl}
              download={`${slug}.ics`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={buttonStyles}
            >
              <Download className="w-4 h-4" />
              Descargar .ics
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(AgregarCalendarioPublico);
