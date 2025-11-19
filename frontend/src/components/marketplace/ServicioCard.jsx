import { Clock, DollarSign } from 'lucide-react';

/**
 * Card individual de servicio en perfil público
 * Muestra nombre, descripción, precio y duración
 *
 * @param {Object} servicio - Datos del servicio
 * @param {string} servicio.nombre - Nombre del servicio
 * @param {string} servicio.descripcion - Descripción del servicio
 * @param {number} servicio.precio - Precio del servicio
 * @param {number} servicio.duracion_minutos - Duración en minutos
 * @param {string} servicio.categoria - Categoría del servicio
 * @param {string} className - Clases adicionales
 *
 * @example
 * <ServicioCard servicio={{
 *   nombre: "Corte de cabello",
 *   descripcion: "Corte profesional con lavado incluido",
 *   precio: 150,
 *   duracion_minutos: 30
 * }} />
 */
function ServicioCard({ servicio, className = '' }) {
  const { nombre, descripcion, precio, duracion_minutos } = servicio;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow ${className}`}
    >
      {/* Nombre del servicio */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{nombre}</h3>

      {/* Descripción */}
      {descripcion && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{descripcion}</p>
      )}

      {/* Footer con precio y duración */}
      <div className="flex items-center justify-between text-sm">
        {/* Precio */}
        <div className="flex items-center text-primary-700 font-semibold">
          <DollarSign className="w-4 h-4 mr-1" />
          <span>${precio}</span>
        </div>

        {/* Duración */}
        {duracion_minutos && (
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>{duracion_minutos} min</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServicioCard;
