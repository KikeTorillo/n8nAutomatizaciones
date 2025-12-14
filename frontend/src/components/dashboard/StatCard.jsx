/**
 * Card de estadística reutilizable
 * @param {Object} props
 * @param {string} props.title - Título de la card
 * @param {number|string} props.value - Valor principal
 * @param {string} props.subtitle - Subtítulo
 * @param {React.Component} props.icon - Icono de lucide-react
 * @param {string} props.color - Color del tema (blue, green, purple, orange, red, cyan)
 * @param {boolean} props.isLoading - Estado de carga
 * @param {function} props.onClick - Callback al hacer clic en la card (opcional)
 */
function StatCard({ title, value, subtitle, icon, color = 'blue', isLoading = false, onClick }) {
  const Icon = icon;
  const colorClasses = {
    blue: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

export default StatCard;
