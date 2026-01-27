/**
 * FeatureCard - Card reutilizable para features/módulos/beneficios
 *
 * Variantes:
 * - default: Card con hover y borde
 * - centered: Icono y texto centrado (beneficios)
 * - compact: Versión más pequeña
 */
import { cn } from '@/lib/utils';

export function FeatureCard({
  icon: Icon,
  title,
  description,
  variant = 'default',
  className,
}) {
  const isCentered = variant === 'centered';

  return (
    <div
      className={cn(
        'p-6 bg-white dark:bg-gray-800 rounded-2xl transition-all duration-300',
        variant === 'default' && 'border border-gray-100 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-xl group',
        isCentered && 'text-center',
        className
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
          variant === 'default' && 'bg-primary-600 group-hover:scale-110 transition-transform',
          isCentered && 'w-14 h-14 mx-auto bg-primary-100 dark:bg-primary-900/40'
        )}
      >
        <Icon
          className={cn(
            'w-6 h-6',
            isCentered ? 'w-7 h-7 text-primary-600 dark:text-primary-400' : 'text-white'
          )}
        />
      </div>
      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-white mb-2',
          variant === 'default' ? 'text-xl' : 'text-lg'
        )}
      >
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
