import { useState, useEffect } from 'react';

/**
 * Componente de countdown para eventos
 * Muestra días, horas, minutos y segundos hasta el evento
 */
export default function EventoCountdown({
  fechaEvento,
  horaEvento,
  tema,
  tieneImagenFondo,
  className = '',
  getAnimationClass,
}) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!fechaEvento) return;

    const updateCountdown = () => {
      const eventDate = new Date(fechaEvento);
      if (horaEvento) {
        const [hours, minutes] = horaEvento.split(':');
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
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [fechaEvento, horaEvento]);

  const items = [
    { value: countdown.days, label: 'Días' },
    { value: countdown.hours, label: 'Horas' },
    { value: countdown.minutes, label: 'Min' },
    { value: countdown.seconds, label: 'Seg' },
  ];

  return (
    <div className={`grid grid-cols-4 gap-3 sm:gap-6 max-w-lg mx-auto ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-1"
            style={{
              fontFamily: tema.fuente_titulo,
              color: tieneImagenFondo ? 'white' : tema.color_primario,
              textShadow: tieneImagenFondo ? '0 4px 30px rgba(0,0,0,1), 0 2px 10px rgba(0,0,0,0.9)' : 'none'
            }}
          >
            {String(item.value).padStart(2, '0')}
          </div>
          <div
            className="text-xs sm:text-sm uppercase tracking-wider font-medium"
            style={{
              color: tieneImagenFondo ? 'white' : tema.color_texto_claro,
              textShadow: tieneImagenFondo ? '0 1px 4px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
