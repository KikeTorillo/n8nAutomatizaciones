/**
 * Barra de progreso para mostrar uso de límites del plan
 * @param {Object} props
 * @param {string} props.label - Etiqueta del límite
 * @param {number} props.usado - Cantidad usada
 * @param {number} props.limite - Límite total
 * @param {number} props.porcentaje - Porcentaje de uso
 */
function LimitProgressBar({ label, usado, limite, porcentaje }) {
  // Determinar color según porcentaje
  const getColor = () => {
    if (porcentaje >= 90) return 'bg-red-500';
    if (porcentaje >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (porcentaje >= 90) return 'text-red-700';
    if (porcentaje >= 70) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-semibold ${getTextColor()}`}>
          {usado} / {limite}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500">{porcentaje}% usado</p>
    </div>
  );
}

export default LimitProgressBar;
