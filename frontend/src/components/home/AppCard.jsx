import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

/**
 * AppCard - Tarjeta de aplicación para el App Launcher
 *
 * Props:
 * - id: Identificador único de la app
 * - name: Nombre de la aplicación
 * - description: Descripción corta (1 línea)
 * - icon: Componente de ícono (Lucide)
 * - path: Ruta de navegación
 * - color: Color del ícono (tailwind)
 * - bgColor: Color de fondo del ícono
 * - enabled: Si la app está habilitada (plan)
 * - badge: Número para mostrar en badge (notificaciones)
 * - badgeColor: Color del badge
 */
function AppCard({
  id,
  name,
  description,
  icon: Icon,
  path,
  color = 'text-gray-700',
  bgColor = 'bg-gray-100',
  enabled = true,
  badge = 0,
  badgeColor = 'bg-red-500',
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (enabled && path) {
      navigate(path);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!enabled}
      className={`
        relative group w-full p-6 rounded-2xl border-2 transition-all duration-200
        ${enabled
          ? 'bg-white border-gray-200 hover:border-primary-400 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
          : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
        }
      `}
    >
      {/* Badge de notificación */}
      {badge > 0 && enabled && (
        <span className={`
          absolute -top-2 -right-2 min-w-[24px] h-6 px-2
          ${badgeColor} text-white text-xs font-bold
          rounded-full flex items-center justify-center
          shadow-md
        `}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}

      {/* Ícono bloqueado para apps deshabilitadas */}
      {!enabled && (
        <span className="absolute top-3 right-3 text-gray-400">
          <Lock className="w-4 h-4" />
        </span>
      )}

      {/* Contenido de la tarjeta */}
      <div className="flex flex-col items-center text-center space-y-3">
        {/* Ícono */}
        <div className={`
          w-16 h-16 rounded-xl flex items-center justify-center
          ${enabled ? bgColor : 'bg-gray-200'}
          ${enabled ? 'group-hover:scale-110' : ''} transition-transform duration-200
        `}>
          <Icon className={`w-8 h-8 ${enabled ? color : 'text-gray-400'}`} />
        </div>

        {/* Nombre */}
        <h3 className={`
          font-semibold text-base
          ${enabled ? 'text-gray-900' : 'text-gray-500'}
        `}>
          {name}
        </h3>

        {/* Descripción */}
        <p className={`
          text-sm leading-tight
          ${enabled ? 'text-gray-500' : 'text-gray-400'}
        `}>
          {description}
        </p>

        {/* Indicador de plan requerido */}
        {!enabled && (
          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
            Plan Pro
          </span>
        )}
      </div>
    </button>
  );
}

export default AppCard;
