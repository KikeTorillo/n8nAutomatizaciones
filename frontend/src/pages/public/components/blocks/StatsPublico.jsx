import { useState, useEffect, useRef } from 'react';
import {
  Users,
  Calendar,
  Briefcase,
  Star,
  Award,
  TrendingUp,
  Heart,
  Zap,
} from 'lucide-react';

// Mapeo de iconos
const ICONS = {
  users: Users,
  calendar: Calendar,
  briefcase: Briefcase,
  star: Star,
  award: Award,
  trending: TrendingUp,
  heart: Heart,
  zap: Zap,
};

/**
 * Hook para animacion de contador
 */
function useCountAnimation(end, duration = 2000, shouldStart = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Funcion de easing (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, shouldStart]);

  return count;
}

/**
 * Componente de item de estadistica
 */
function StatItem({ stat, shouldAnimate }) {
  const { numero, prefijo = '', sufijo = '', titulo, icono = 'star' } = stat;
  const animatedValue = useCountAnimation(numero, 2000, shouldAnimate);
  const Icon = ICONS[icono] || Star;

  return (
    <div className="text-center p-6">
      {/* Icono */}
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primario) 15%, transparent)' }}
      >
        <Icon className="w-8 h-8" style={{ color: 'var(--color-primario)' }} />
      </div>

      {/* Numero */}
      <div
        className="text-4xl md:text-5xl font-bold mb-2"
        style={{ color: 'var(--color-texto)' }}
      >
        {prefijo}
        {shouldAnimate ? animatedValue : numero}
        {sufijo}
      </div>

      {/* Titulo */}
      <p className="text-gray-600">{titulo}</p>
    </div>
  );
}

/**
 * StatsPublico - Renderiza bloque de estadisticas en sitio público
 */
export default function StatsPublico({ contenido }) {
  const {
    titulo_seccion = 'Nuestros Numeros',
    subtitulo_seccion = 'Lo que hemos logrado',
    columnas = 4,
    animar = true,
    items = [],
  } = contenido;

  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  // Default items if empty
  const stats =
    items.length > 0
      ? items
      : [
          { numero: 500, sufijo: '+', titulo: 'Clientes Satisfechos', icono: 'users' },
          { numero: 10, sufijo: '', titulo: 'Anos de Experiencia', icono: 'calendar' },
          { numero: 1000, sufijo: '+', titulo: 'Proyectos Completados', icono: 'briefcase' },
          { numero: 98, sufijo: '%', titulo: 'Satisfaccion', icono: 'star' },
        ];

  // Intersection observer para trigger de animacion
  useEffect(() => {
    if (!animar) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [animar]);

  const columnasClases = {
    '2': 'grid-cols-2',
    '3': 'grid-cols-2 md:grid-cols-3',
    '4': 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-24 bg-white"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-texto)', fontFamily: 'var(--font-titulos)' }}
          >
            {titulo_seccion}
          </h2>
          <p className="text-lg text-gray-600">{subtitulo_seccion}</p>
        </div>

        {/* Grid de stats */}
        <div className={`grid gap-8 ${columnasClases[String(columnas)] || columnasClases['4']}`}>
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              stat={stat}
              shouldAnimate={isVisible}
            />
          ))}
        </div>

        {/* Linea decorativa */}
        <div className="mt-12 flex justify-center">
          <div
            className="w-24 h-1 rounded-full"
            style={{ backgroundColor: 'var(--color-primario)' }}
          />
        </div>
      </div>
    </section>
  );
}
