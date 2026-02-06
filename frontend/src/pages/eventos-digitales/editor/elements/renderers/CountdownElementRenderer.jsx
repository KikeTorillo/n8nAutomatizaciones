/**
 * ====================================================================
 * COUNTDOWN ELEMENT RENDERER
 * ====================================================================
 * Renderiza elementos de tipo countdown (cuenta regresiva) en el canvas.
 * Soporta variantes: cajas, inline, circular.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { THEME_FALLBACK_COLORS } from '@/lib/uiConstants';

// ========== COMPONENT ==========

function CountdownElementRenderer({
  elemento,
  tema,
  evento,
  isEditing = false,
}) {
  const { contenido = {}, estilos = {} } = elemento;

  // Configuración
  const titulo = contenido.titulo || '';
  // Siempre usar fecha/hora del evento (configurada al crear el evento)
  const fechaObjetivo = evento?.fecha_evento;
  const horaObjetivo = evento?.hora_evento;
  const textoFinalizado = contenido.texto_finalizado || '¡Es hoy!';

  // Opciones de visualización
  const mostrarDias = contenido.mostrar_dias !== false;
  const mostrarHoras = contenido.mostrar_horas !== false;
  const mostrarMinutos = contenido.mostrar_minutos !== false;
  const mostrarSegundos = contenido.mostrar_segundos !== false;

  // Variante visual
  const variante = contenido.variante || 'cajas';

  // Estilos
  const INV = THEME_FALLBACK_COLORS.invitacion;
  const colorPrimario = estilos.color_primario || tema?.color_primario || INV.primario;
  const colorSecundario = estilos.color_secundario || tema?.color_secundario || INV.secundario;
  const colorTexto = estilos.color_texto || tema?.color_texto || INV.texto;
  const colorTextoClaro = estilos.color_texto_claro || tema?.color_texto_claro || INV.textoClaro;
  const fuenteTitulo = estilos.fuente_titulo || tema?.fuente_titulos || 'inherit';

  // Estado del countdown
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isFinalizado, setIsFinalizado] = useState(false);

  useEffect(() => {
    if (!fechaObjetivo) {
      // En modo edición, mostrar valores de ejemplo
      if (isEditing) {
        setCountdown({ days: 30, hours: 12, minutes: 45, seconds: 30 });
      }
      return;
    }

    const updateCountdown = () => {
      const eventDate = new Date(fechaObjetivo);
      if (horaObjetivo) {
        const [hours, minutes] = horaObjetivo.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }
      const now = new Date();
      const diff = eventDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds });
        setIsFinalizado(false);
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsFinalizado(true);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [fechaObjetivo, horaObjetivo, isEditing]);

  // Items a mostrar
  const items = useMemo(() => [
    { value: countdown.days, label: 'Días', show: mostrarDias },
    { value: countdown.hours, label: 'Horas', show: mostrarHoras },
    { value: countdown.minutes, label: 'Min', show: mostrarMinutos },
    { value: countdown.seconds, label: 'Seg', show: mostrarSegundos },
  ].filter((item) => item.show), [countdown, mostrarDias, mostrarHoras, mostrarMinutos, mostrarSegundos]);

  // Si ya finalizó
  if (isFinalizado && !isEditing) {
    return (
      <div className="countdown-element text-center py-4">
        <p
          className="text-2xl font-bold"
          style={{ color: colorPrimario, fontFamily: fuenteTitulo }}
        >
          {textoFinalizado}
        </p>
      </div>
    );
  }

  return (
    <div className="countdown-element w-full">
      {/* Título */}
      {titulo && (
        <h3
          className="text-xl font-medium text-center mb-4"
          style={{ color: colorTexto, fontFamily: fuenteTitulo }}
        >
          {titulo}
        </h3>
      )}

      {/* Variante: Cajas */}
      {variante === 'cajas' && (
        <div className={cn('grid gap-2 sm:gap-4', `grid-cols-${items.length}`)}>
          {items.map((item) => (
            <div
              key={item.label}
              className="text-center p-3 sm:p-4 rounded-xl"
              style={{ backgroundColor: colorSecundario + '60' }}
            >
              <div
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1"
                style={{ fontFamily: fuenteTitulo, color: colorPrimario }}
              >
                {String(item.value).padStart(2, '0')}
              </div>
              <div
                className="text-xs sm:text-sm uppercase tracking-wider font-medium"
                style={{ color: colorTextoClaro }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Variante: Inline */}
      {variante === 'inline' && (
        <div className="flex items-center justify-center gap-1 sm:gap-3">
          {items.map((item, idx) => (
            <div key={item.label} className="flex items-baseline gap-0.5">
              <span
                className="text-4xl sm:text-5xl md:text-6xl font-bold"
                style={{ fontFamily: fuenteTitulo, color: colorPrimario }}
              >
                {String(item.value).padStart(2, '0')}
              </span>
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: colorTextoClaro }}
              >
                {item.label.charAt(0)}
              </span>
              {idx < items.length - 1 && (
                <span
                  className="text-2xl mx-1"
                  style={{ color: colorPrimario }}
                >
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Variante: Circular */}
      {variante === 'circular' && (
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: colorSecundario,
                  border: `3px solid ${colorPrimario}`,
                }}
              >
                <span
                  className="text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{ fontFamily: fuenteTitulo, color: colorPrimario }}
                >
                  {String(item.value).padStart(2, '0')}
                </span>
              </div>
              <span
                className="text-xs sm:text-sm uppercase tracking-wider mt-2 font-medium"
                style={{ color: colorTextoClaro }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

CountdownElementRenderer.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      titulo: PropTypes.string,
      // fecha/hora se toman de evento.fecha_evento/hora_evento
      variante: PropTypes.oneOf(['cajas', 'inline', 'circular']),
      mostrar_dias: PropTypes.bool,
      mostrar_horas: PropTypes.bool,
      mostrar_minutos: PropTypes.bool,
      mostrar_segundos: PropTypes.bool,
      texto_finalizado: PropTypes.string,
    }),
    estilos: PropTypes.object,
  }).isRequired,
  tema: PropTypes.shape({
    color_primario: PropTypes.string,
    color_secundario: PropTypes.string,
    color_texto: PropTypes.string,
    color_texto_claro: PropTypes.string,
    fuente_titulos: PropTypes.string,
  }),
  evento: PropTypes.shape({
    fecha_evento: PropTypes.string,
    hora_evento: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
};

export default memo(CountdownElementRenderer);
