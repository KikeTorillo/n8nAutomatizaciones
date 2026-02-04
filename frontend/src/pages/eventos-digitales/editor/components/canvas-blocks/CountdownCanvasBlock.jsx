/**
 * ====================================================================
 * COUNTDOWN CANVAS BLOCK
 * ====================================================================
 * Bloque de cuenta regresiva para invitaciones digitales.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Countdown Canvas Block
 *
 * @param {Object} props
 * @param {Object} props.bloque - Datos del bloque
 * @param {Object} props.tema - Tema de la invitación
 */
function CountdownCanvasBlock({ bloque, tema }) {
  const contenido = bloque.contenido || {};
  const estilos = bloque.estilos || {};

  // Usar || para fallbacks (strings vacíos necesitan ||, no default de desestructuración)
  const titulo = contenido.titulo || 'Faltan';
  const fecha_objetivo = contenido.fecha_objetivo;
  const texto_finalizado = contenido.texto_finalizado || '¡Llegó el gran día!';

  // Fallback: estilos pueden venir en contenido o en estilos
  const estilo = estilos.estilo || contenido.estilo || 'cajas';
  const mostrar_segundos = estilos.mostrar_segundos ?? contenido.mostrar_segundos ?? false;

  const colorPrimario = tema?.color_primario || '#753572';

  // Estado para tiempo restante
  const [tiempoRestante, setTiempoRestante] = useState(null);

  // Calcular tiempo restante
  useEffect(() => {
    if (!fecha_objetivo) {
      setTiempoRestante(null);
      return;
    }

    const calcular = () => {
      const fecha = new Date(fecha_objetivo);
      const ahora = new Date();
      const diff = fecha - ahora;

      if (diff <= 0) {
        setTiempoRestante(null);
        return;
      }

      setTiempoRestante({
        dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [fecha_objetivo]);

  // Unidades a mostrar
  const unidades = useMemo(() => {
    const base = [
      { key: 'dias', label: 'Días' },
      { key: 'horas', label: 'Horas' },
      { key: 'minutos', label: 'Minutos' },
    ];
    if (mostrar_segundos) {
      base.push({ key: 'segundos', label: 'Segundos' });
    }
    return base;
  }, [mostrar_segundos]);

  // Renderizar unidad según estilo
  const renderUnidad = (unidad, valor) => {
    switch (estilo) {
      case 'cajas':
        return (
          <div
            key={unidad.key}
            className="p-4 md:p-6 rounded-lg bg-gray-100 dark:bg-gray-800 min-w-[80px] md:min-w-[100px]"
          >
            <span
              className="text-3xl md:text-4xl font-bold block"
              style={{ color: colorPrimario }}
            >
              {valor}
            </span>
            <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {unidad.label}
            </span>
          </div>
        );

      case 'circular':
        return (
          <div
            key={unidad.key}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center"
            style={{ border: `3px solid ${colorPrimario}` }}
          >
            <span
              className="text-2xl md:text-3xl font-bold"
              style={{ color: colorPrimario }}
            >
              {valor}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {unidad.label}
            </span>
          </div>
        );

      case 'inline':
      default:
        return (
          <div key={unidad.key} className="text-center">
            <span
              className="text-3xl md:text-4xl font-bold"
              style={{ color: colorPrimario }}
            >
              {valor}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">
              {unidad.label}
            </span>
          </div>
        );
    }
  };

  return (
    <section className="py-16 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        {/* Título */}
        <h2
          className="text-2xl md:text-3xl font-bold mb-8"
          style={{ color: colorPrimario, fontFamily: 'var(--fuente-titulos)' }}
        >
          {titulo}
        </h2>

        {/* Countdown o texto finalizado */}
        {tiempoRestante ? (
          <div
            className={cn(
              'flex justify-center gap-4 md:gap-6',
              estilo === 'inline' && 'items-end'
            )}
          >
            {unidades.map((unidad, idx) => (
              <>
                {renderUnidad(unidad, tiempoRestante[unidad.key])}
                {estilo === 'inline' && idx < unidades.length - 1 && (
                  <span
                    className="text-3xl md:text-4xl font-light"
                    style={{ color: colorPrimario }}
                  >
                    :
                  </span>
                )}
              </>
            ))}
          </div>
        ) : (
          <p
            className="text-2xl md:text-3xl font-medium"
            style={{ color: colorPrimario }}
          >
            {texto_finalizado}
          </p>
        )}
      </div>
    </section>
  );
}

export default memo(CountdownCanvasBlock);
