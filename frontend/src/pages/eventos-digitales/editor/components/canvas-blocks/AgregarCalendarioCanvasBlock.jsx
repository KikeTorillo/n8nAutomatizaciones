/**
 * ====================================================================
 * AGREGAR CALENDARIO CANVAS BLOCK
 * ====================================================================
 * Preview del bloque Agregar al Calendario en el canvas del editor.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo } from 'react';
import { CalendarPlus, Download } from 'lucide-react';

/**
 * AgregarCalendarioCanvasBlock - Preview del bloque en el canvas
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 * @param {Object} props.evento - Datos del evento (para fecha)
 */
function AgregarCalendarioCanvasBlock({ bloque, tema, evento }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  const titulo = contenido.titulo || '';
  const mostrarGoogle = contenido.mostrar_google !== false;
  const mostrarIcs = contenido.mostrar_ics !== false;
  const variante = estilos.variante || contenido.variante || 'default';
  const alineacion = estilos.alineacion || contenido.alineacion || 'center';

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
        border: '1px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(10px)',
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

  // Si no hay botones activos, mostrar placeholder
  const sinBotones = !mostrarGoogle && !mostrarIcs;

  // Verificar si hay fecha en el evento
  const tieneFecha = evento?.fecha_evento;

  return (
    <section
      className="py-8 px-4"
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
          {mostrarGoogle && (
            <span
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-default"
              style={buttonStyles}
            >
              <CalendarPlus className="w-4 h-4" />
              Google Calendar
            </span>
          )}
          {mostrarIcs && (
            <span
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold cursor-default"
              style={buttonStyles}
            >
              <Download className="w-4 h-4" />
              Descargar .ics
            </span>
          )}
        </div>

        {/* Mensaje si no hay botones */}
        {sinBotones && (
          <p
            className="text-sm italic text-center"
            style={{ color: variante === 'hero' ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}
          >
            Activa al menos un botón en el panel de propiedades
          </p>
        )}

        {/* Advertencia si no hay fecha */}
        {!tieneFecha && (
          <p
            className="text-xs mt-3 text-center"
            style={{ color: variante === 'hero' ? 'rgba(255,255,255,0.5)' : '#9ca3af' }}
          >
            ⚠️ El evento no tiene fecha configurada
          </p>
        )}
      </div>
    </section>
  );
}

export default memo(AgregarCalendarioCanvasBlock);
