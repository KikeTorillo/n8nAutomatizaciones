/**
 * ====================================================================
 * COUNTDOWN CANVAS BLOCK
 * ====================================================================
 * Bloque de contador regresivo para eventos/ofertas en el canvas WYSIWYG.
 */

import { memo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { InlineText } from '../InlineEditor';

/**
 * Calculate time remaining
 */
function calculateTimeRemaining(targetDate) {
  const now = new Date().getTime();
  const target = new Date(targetDate).getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, finished: true };
  }

  return {
    dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
    horas: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutos: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    segundos: Math.floor((difference % (1000 * 60)) / 1000),
    finished: false,
  };
}

/**
 * Time Unit Component
 */
function TimeUnit({ value, label, colorPrimario }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center mb-2 shadow-lg"
        style={{ backgroundColor: `${colorPrimario}20` }}
      >
        <span
          className="text-3xl md:text-4xl font-bold"
          style={{ color: colorPrimario }}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/**
 * Countdown Canvas Block
 */
function CountdownCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
  const {
    titulo = 'Gran Inauguracion',
    subtitulo = 'No te pierdas este evento especial',
    fecha_objetivo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    mostrar_dias = true,
    mostrar_horas = true,
    mostrar_minutos = true,
    mostrar_segundos = true,
    texto_finalizado = 'El evento ha comenzado!',
    fondo_tipo = 'color',
    fondo_valor = '#1F2937',
    color_texto = '#FFFFFF',
    boton_texto = '',
    boton_url = '',
  } = contenido;

  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(fecha_objetivo)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(fecha_objetivo));
    }, 1000);

    return () => clearInterval(timer);
  }, [fecha_objetivo]);

  const colorPrimario = tema?.color_primario || '#753572';

  // Background styles
  const backgroundStyle =
    fondo_tipo === 'imagen'
      ? {
          backgroundImage: `url(${fondo_valor})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : fondo_tipo === 'gradiente'
      ? { background: fondo_valor }
      : { backgroundColor: fondo_valor };

  return (
    <section
      className="py-20 px-6 relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Overlay for image backgrounds */}
      {fondo_tipo === 'imagen' && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colorPrimario}30` }}
          >
            <Clock className="w-8 h-8" style={{ color: colorPrimario }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          {isEditing ? (
            <>
              <InlineText
                value={titulo}
                onChange={(value) => onContentChange({ titulo: value })}
                placeholder="Titulo del evento"
                className="text-3xl md:text-5xl font-bold mb-4 block"
                style={{ color: color_texto }}
                as="h2"
              />
              <InlineText
                value={subtitulo}
                onChange={(value) => onContentChange({ subtitulo: value })}
                placeholder="Subtitulo"
                className="text-lg md:text-xl block opacity-90"
                style={{ color: color_texto }}
                as="p"
              />
            </>
          ) : (
            <>
              <h2
                className="text-3xl md:text-5xl font-bold mb-4"
                style={{ color: color_texto, fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo}
              </h2>
              <p className="text-lg md:text-xl opacity-90" style={{ color: color_texto }}>
                {subtitulo}
              </p>
            </>
          )}
        </div>

        {/* Countdown */}
        {timeRemaining.finished ? (
          <div className="text-center">
            <p
              className="text-2xl md:text-3xl font-bold"
              style={{ color: colorPrimario }}
            >
              {texto_finalizado}
            </p>
          </div>
        ) : (
          <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
            {mostrar_dias && (
              <TimeUnit
                value={timeRemaining.dias}
                label="Dias"
                colorPrimario={colorPrimario}
              />
            )}
            {mostrar_horas && (
              <TimeUnit
                value={timeRemaining.horas}
                label="Horas"
                colorPrimario={colorPrimario}
              />
            )}
            {mostrar_minutos && (
              <TimeUnit
                value={timeRemaining.minutos}
                label="Minutos"
                colorPrimario={colorPrimario}
              />
            )}
            {mostrar_segundos && (
              <TimeUnit
                value={timeRemaining.segundos}
                label="Segundos"
                colorPrimario={colorPrimario}
              />
            )}
          </div>
        )}

        {/* CTA Button */}
        {boton_texto && (
          <div className="text-center mt-10">
            <a
              href={boton_url || '#'}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colorPrimario }}
            >
              {boton_texto}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(CountdownCanvasBlock);
