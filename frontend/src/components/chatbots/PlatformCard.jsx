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
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-600',
      bgSelected: 'bg-blue-50',
    },
    green: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-600',
      bgSelected: 'bg-green-50',
    },
    pink: {
      bg: 'bg-pink-100',
      text: 'text-pink-600',
      border: 'border-pink-600',
      bgSelected: 'bg-pink-50',
    },
    purple: {
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-600',
      bgSelected: 'bg-purple-50',
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
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
        selected && `${colors.border} ${colors.bgSelected} shadow-md`,
        !selected && 'border-gray-200 bg-white hover:border-gray-300',
        !available && 'opacity-50 cursor-not-allowed hover:border-gray-200 hover:shadow-none',
        available && `focus:ring-${color}-500`
      )}
    >
      {/* Badge "Próximamente" */}
      {!available && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
        <p className="text-sm text-gray-600">{description}</p>
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
