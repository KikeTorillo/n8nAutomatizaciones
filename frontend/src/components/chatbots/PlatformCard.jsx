import { cn } from '@/lib/utils';

/**
 * Tarjeta de selección de plataforma
 *
 * @param {Object} props
 * @param {string} props.platform - ID de la plataforma (telegram, whatsapp, etc)
 * @param {string} props.name - Nombre visible de la plataforma
 * @param {string} props.description - Descripción breve
 * @param {React.ReactNode} props.icon - Ícono de la plataforma
 * @param {string} props.color - Color del tema (blue, green, pink, etc)
 * @param {boolean} props.available - Si la plataforma está disponible
 * @param {boolean} props.selected - Si está seleccionada
 * @param {Function} props.onClick - Función al hacer click
 */
function PlatformCard({
  platform,
  name,
  description,
  icon,
  color = 'blue',
  available = true,
  selected = false,
  onClick,
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-primary-100 dark:bg-primary-900/40',
      text: 'text-primary-600 dark:text-primary-400',
      border: 'border-primary-600 dark:border-primary-500',
      bgSelected: 'bg-primary-50 dark:bg-primary-900/20',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-600 dark:border-green-500',
      bgSelected: 'bg-green-50 dark:bg-green-900/20',
    },
    pink: {
      bg: 'bg-pink-100 dark:bg-pink-900/40',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-600 dark:border-pink-500',
      bgSelected: 'bg-pink-50 dark:bg-pink-900/20',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-600 dark:border-purple-500',
      bgSelected: 'bg-purple-50 dark:bg-purple-900/20',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <button
      type="button"
      onClick={available ? onClick : undefined}
      disabled={!available}
      className={cn(
        'relative p-6 border-2 rounded-xl transition-all duration-200',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        selected && `${colors.border} ${colors.bgSelected} shadow-md`,
        !selected && 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
        !available && 'opacity-50 cursor-not-allowed hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-none',
        available && `focus:ring-${color}-500`
      )}
    >
      {/* Badge "Próximamente" */}
      {!available && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            Próximamente
          </span>
        </div>
      )}

      {/* Ícono */}
      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto', colors.bg)}>
        <div className={cn('w-8 h-8', colors.text)}>{icon}</div>
      </div>

      {/* Contenido */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      {/* Indicador de selección */}
      {selected && (
        <div className="absolute top-3 left-3">
          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', colors.bg)}>
            <svg
              className={cn('w-4 h-4', colors.text)}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}

export default PlatformCard;
