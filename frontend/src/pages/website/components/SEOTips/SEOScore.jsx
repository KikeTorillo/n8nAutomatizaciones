/**
 * ====================================================================
 * SEO SCORE
 * ====================================================================
 * Circulo de puntuacion SEO con animacion.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Componente de score circular
 *
 * @param {Object} props
 * @param {number} props.score - Score de 0 a 100
 * @param {string} props.nivel - 'excelente' | 'bueno' | 'mejorable' | 'bajo'
 * @param {number} props.size - Tamano del circulo (default: 100)
 */
function SEOScore({ score = 0, nivel = 'bajo', size = 100 }) {
  // Calcular circunferencia y offset
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Colores por nivel
  const colores = {
    excelente: {
      stroke: '#10B981',
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
    },
    bueno: {
      stroke: '#3B82F6',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
    },
    mejorable: {
      stroke: '#F59E0B',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
    },
    bajo: {
      stroke: '#EF4444',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const config = colores[nivel] || colores.bajo;

  // Labels por nivel
  const labels = {
    excelente: 'Excelente',
    bueno: 'Bueno',
    mejorable: 'Mejorable',
    bajo: 'Bajo',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Circulo */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn('text-2xl font-bold', config.text)}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            SEO
          </span>
        </div>
      </div>

      {/* Label */}
      <div className={cn('mt-2 px-3 py-1 rounded-full text-xs font-medium', config.bg, config.text)}>
        {labels[nivel]}
      </div>
    </div>
  );
}

export default memo(SEOScore);
