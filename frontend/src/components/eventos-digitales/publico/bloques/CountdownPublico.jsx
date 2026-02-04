/**
 * ====================================================================
 * COUNTDOWN PUBLICO - BLOQUE DE INVITACIÓN
 * ====================================================================
 * Renderiza la cuenta regresiva hacia el evento.
 *
 * @version 1.0.0
 * @since 2026-02-03
 */

import { memo, useState, useEffect } from 'react';

function CountdownPublico({ bloque, evento, tema, isVisible, className = '' }) {
  const { contenido = {}, estilos = {} } = bloque;

  const titulo = contenido.titulo || 'Faltan';
  const fechaObjetivo = contenido.fecha_objetivo || evento?.fecha_evento;
  const horaObjetivo = contenido.hora_objetivo || evento?.hora_evento;

  const mostrarDias = estilos.mostrar_dias !== false;
  const mostrarHoras = estilos.mostrar_horas !== false;
  const mostrarMinutos = estilos.mostrar_minutos !== false;
  // Fallback: el editor guarda mostrar_segundos en contenido
  const mostrarSegundos = (estilos.mostrar_segundos ?? contenido.mostrar_segundos) !== false;

  // Mapeo de valores de estilo: editor usa cajas/inline/circular, público usaba cards/minimal/circles
  const estiloRaw = estilos.estilo || contenido.estilo || 'cards';
  const estiloMap = {
    cajas: 'cards',
    inline: 'minimal',
    circular: 'circles',
    // Compatibilidad con valores antiguos
    cards: 'cards',
    minimal: 'minimal',
    circles: 'circles',
  };
  const estilo = estiloMap[estiloRaw] || 'cards';

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!fechaObjetivo) return;

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
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [fechaObjetivo, horaObjetivo]);

  const items = [
    { value: countdown.days, label: 'Días', show: mostrarDias },
    { value: countdown.hours, label: 'Horas', show: mostrarHoras },
    { value: countdown.minutes, label: 'Min', show: mostrarMinutos },
    { value: countdown.seconds, label: 'Seg', show: mostrarSegundos },
  ].filter((item) => item.show);

  const animationClass = isVisible ? 'animate-fadeInUp' : 'opacity-0';

  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Título */}
        {titulo && (
          <h2
            className={`text-2xl sm:text-3xl font-bold text-center mb-8 ${animationClass}`}
            style={{
              fontFamily: tema?.fuente_titulo,
              color: tema?.color_texto,
            }}
          >
            {titulo}
          </h2>
        )}

        {/* Countdown */}
        {estilo === 'cards' ? (
          <div className={`grid grid-cols-${items.length} gap-3 sm:gap-6 max-w-lg mx-auto ${animationClass}`}>
            {items.map((item, idx) => (
              <div
                key={item.label}
                className="text-center p-4 rounded-2xl"
                style={{
                  backgroundColor: tema?.color_secundario + '40',
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                <div
                  className="text-4xl sm:text-5xl md:text-6xl font-bold mb-1"
                  style={{
                    fontFamily: tema?.fuente_titulo,
                    color: tema?.color_primario,
                  }}
                >
                  {String(item.value).padStart(2, '0')}
                </div>
                <div
                  className="text-xs sm:text-sm uppercase tracking-wider font-medium"
                  style={{ color: tema?.color_texto_claro }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        ) : estilo === 'minimal' ? (
          <div className={`flex items-center justify-center gap-2 sm:gap-4 ${animationClass}`}>
            {items.map((item, idx) => (
              <div key={item.label} className="flex items-baseline gap-1">
                <span
                  className="text-5xl sm:text-6xl md:text-7xl font-bold"
                  style={{
                    fontFamily: tema?.fuente_titulo,
                    color: tema?.color_primario,
                  }}
                >
                  {String(item.value).padStart(2, '0')}
                </span>
                <span
                  className="text-sm uppercase tracking-wider"
                  style={{ color: tema?.color_texto_claro }}
                >
                  {item.label.charAt(0)}
                </span>
                {idx < items.length - 1 && (
                  <span
                    className="text-3xl mx-2"
                    style={{ color: tema?.color_primario }}
                  >
                    :
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Estilo círculos */
          <div className={`flex items-center justify-center gap-4 sm:gap-8 ${animationClass}`}>
            {items.map((item, idx) => (
              <div
                key={item.label}
                className="flex flex-col items-center"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: tema?.color_secundario,
                    border: `3px solid ${tema?.color_primario}`,
                  }}
                >
                  <span
                    className="text-3xl sm:text-4xl md:text-5xl font-bold"
                    style={{
                      fontFamily: tema?.fuente_titulo,
                      color: tema?.color_primario,
                    }}
                  >
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <span
                  className="text-xs sm:text-sm uppercase tracking-wider mt-2 font-medium"
                  style={{ color: tema?.color_texto_claro }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(CountdownPublico);
