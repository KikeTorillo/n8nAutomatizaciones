import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente de rating con estrellas
 * Soporta modo readonly y editable
 *
 * @param {number} rating - Rating actual (1-5)
 * @param {number} maxRating - Máximo rating (default: 5)
 * @param {boolean} readonly - Solo lectura (default: true)
 * @param {function} onChange - Callback al cambiar (solo si !readonly)
 * @param {string} size - Tamaño (sm, md, lg)
 * @param {boolean} showValue - Mostrar valor numérico (default: false)
 * @param {number} totalReviews - Total de reseñas (opcional, se muestra si existe)
 * @param {string} className - Clases adicionales
 *
 * @example
 * // Modo readonly con valor
 * <EstrellaRating rating={4.5} showValue totalReviews={23} />
 *
 * @example
 * // Modo editable
 * <EstrellaRating
 *   rating={rating}
 *   readonly={false}
 *   onChange={(newRating) => setRating(newRating)}
 * />
 */
function EstrellaRating({
  rating = 0,
  maxRating = 5,
  readonly = true,
  onChange,
  size = 'md',
  showValue = false,
  totalReviews,
  className,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const handleClick = (index) => {
    if (!readonly && onChange) {
      onChange(index);
    }
  };

  const handleMouseEnter = (index) => {
    if (!readonly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  // Renderizar estrellas
  const stars = Array.from({ length: maxRating }, (_, index) => {
    const starIndex = index + 1;
    const activeRating = hoverRating || rating;

    // Determinar si la estrella está llena, media o vacía
    const isFilled = activeRating >= starIndex;
    const isHalf = !isFilled && activeRating >= starIndex - 0.5;

    return (
      <div
        key={index}
        className="relative inline-block"
        onClick={() => handleClick(starIndex)}
        onMouseEnter={() => handleMouseEnter(starIndex)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Estrella base (vacía) */}
        <Star
          className={cn(
            sizes[size],
            'transition-all duration-150',
            'text-gray-300 dark:text-gray-600',
            !readonly && 'cursor-pointer hover:scale-110'
          )}
        />

        {/* Estrella llena (overlay) */}
        {(isFilled || isHalf) && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: isHalf ? '50%' : '100%' }}
          >
            <Star
              className={cn(
                sizes[size],
                'transition-all duration-150',
                'fill-yellow-400 text-yellow-400',
                !readonly && 'cursor-pointer'
              )}
            />
          </div>
        )}
      </div>
    );
  });

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Estrellas */}
      <div className="flex items-center gap-0.5">{stars}</div>

      {/* Valor numérico */}
      {showValue && rating > 0 && (
        <span className={cn('ml-2 font-medium text-gray-700 dark:text-gray-300', textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}

      {/* Total de reseñas */}
      {totalReviews !== undefined && totalReviews > 0 && (
        <span className={cn('ml-1 text-gray-500 dark:text-gray-400', textSizes[size])}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
}

export default EstrellaRating;
