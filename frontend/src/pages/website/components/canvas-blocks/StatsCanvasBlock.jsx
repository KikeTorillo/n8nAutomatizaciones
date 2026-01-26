/**
 * ====================================================================
 * STATS CANVAS BLOCK
 * ====================================================================
 * Bloque de estadisticas/numeros animados para el canvas WYSIWYG.
 */

import { memo, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
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
import { InlineText } from '../InlineEditor';

// Icon mapping
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
 * Animated counter hook
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

      // Easing function (ease-out)
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
 * Stat Item Component
 */
function StatItem({ stat, index, tema, isEditing, onUpdate, shouldAnimate }) {
  const { numero, prefijo = '', sufijo = '', titulo, icono = 'star' } = stat;
  const animatedValue = useCountAnimation(numero, 2000, shouldAnimate);
  const colorPrimario = tema?.color_primario || '#753572';
  const Icon = ICONS[icono] || Star;

  return (
    <div className="text-center p-6">
      {/* Icon */}
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${colorPrimario}15` }}
      >
        <Icon className="w-8 h-8" style={{ color: colorPrimario }} />
      </div>

      {/* Number */}
      <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
        {prefijo}
        {shouldAnimate ? animatedValue : numero}
        {sufijo}
      </div>

      {/* Label */}
      {isEditing ? (
        <InlineText
          value={titulo}
          onChange={(value) => onUpdate(index, 'titulo', value)}
          placeholder="Titulo"
          className="text-gray-600 dark:text-gray-400 block"
        />
      ) : (
        <p className="text-gray-600 dark:text-gray-400">{titulo}</p>
      )}
    </div>
  );
}

/**
 * Stats Canvas Block
 */
function StatsCanvasBlock({ bloque, tema, isEditing, onContentChange }) {
  const contenido = bloque.contenido || {};
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

  // Intersection observer for animation trigger
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

  /**
   * Update a single stat
   */
  const updateItem = (index, field, value) => {
    const newItems = [...stats];
    newItems[index] = { ...newItems[index], [field]: value };
    onContentChange({ items: newItems });
  };

  const colorPrimario = tema?.color_primario || '#753572';

  return (
    <section
      ref={sectionRef}
      className="py-16 px-6 bg-white dark:bg-gray-800"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          {isEditing ? (
            <>
              <InlineText
                value={titulo_seccion}
                onChange={(value) => onContentChange({ titulo_seccion: value })}
                placeholder="Titulo de seccion"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white block mb-4"
                as="h2"
              />
              <InlineText
                value={subtitulo_seccion}
                onChange={(value) => onContentChange({ subtitulo_seccion: value })}
                placeholder="Subtitulo"
                className="text-lg text-gray-600 dark:text-gray-400 block"
                as="p"
              />
            </>
          ) : (
            <>
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                style={{ fontFamily: 'var(--fuente-titulos)' }}
              >
                {titulo_seccion}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{subtitulo_seccion}</p>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div
          className={cn(
            'grid gap-8',
            columnas === 2 && 'grid-cols-2',
            columnas === 3 && 'grid-cols-2 md:grid-cols-3',
            columnas === 4 && 'grid-cols-2 md:grid-cols-4'
          )}
        >
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              stat={stat}
              index={index}
              tema={tema}
              isEditing={isEditing}
              onUpdate={updateItem}
              shouldAnimate={isVisible}
            />
          ))}
        </div>

        {/* Decorative line */}
        <div className="mt-12 flex justify-center">
          <div
            className="w-24 h-1 rounded-full"
            style={{ backgroundColor: colorPrimario }}
          />
        </div>
      </div>
    </section>
  );
}

export default memo(StatsCanvasBlock);
