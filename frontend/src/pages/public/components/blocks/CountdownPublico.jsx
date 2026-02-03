import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Calcula el tiempo restante hasta la fecha objetivo
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
 * Componente de unidad de tiempo
 */
function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center mb-2 shadow-lg"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primario) 20%, transparent)' }}
      >
        <span
          className="text-3xl md:text-4xl font-bold"
          style={{ color: 'var(--color-primario)' }}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-sm text-gray-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/**
 * CountdownPublico - Renderiza bloque de contador regresivo en sitio público
 */
export default function CountdownPublico({ contenido }) {
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

  // Estilos de fondo
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
      {/* Overlay para fondos de imagen */}
      {fondo_tipo === 'imagen' && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Icono */}
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primario) 30%, transparent)' }}
          >
            <Clock className="w-8 h-8" style={{ color: 'var(--color-primario)' }} />
          </div>
        </div>

        {/* Titulo */}
        <div className="text-center mb-8">
          <h2
            className="text-3xl md:text-5xl font-bold mb-4"
            style={{ color: color_texto, fontFamily: 'var(--font-titulos)' }}
          >
            {titulo}
          </h2>
          <p
            className="text-lg md:text-xl opacity-90"
            style={{ color: color_texto }}
          >
            {subtitulo}
          </p>
        </div>

        {/* Contador */}
        {timeRemaining.finished ? (
          <div className="text-center">
            <p
              className="text-2xl md:text-3xl font-bold"
              style={{ color: 'var(--color-primario)' }}
            >
              {texto_finalizado}
            </p>
          </div>
        ) : (
          <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
            {mostrar_dias && (
              <TimeUnit value={timeRemaining.dias} label="Dias" />
            )}
            {mostrar_horas && (
              <TimeUnit value={timeRemaining.horas} label="Horas" />
            )}
            {mostrar_minutos && (
              <TimeUnit value={timeRemaining.minutos} label="Minutos" />
            )}
            {mostrar_segundos && (
              <TimeUnit value={timeRemaining.segundos} label="Segundos" />
            )}
          </div>
        )}

        {/* Boton CTA */}
        {boton_texto && (
          <div className="text-center mt-10">
            <a
              href={boton_url || '#'}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primario)' }}
            >
              {boton_texto}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
