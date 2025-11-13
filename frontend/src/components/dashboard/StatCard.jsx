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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
    </div>
  );
}

export default StatCard;
