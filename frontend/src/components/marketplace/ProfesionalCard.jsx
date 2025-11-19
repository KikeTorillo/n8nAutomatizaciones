import { Star, User } from 'lucide-react';

/**
 * Card individual de profesional en perfil público
 * Muestra nombre, biografía y calificación
 *
 * @param {Object} profesional - Datos del profesional
 * @param {string} profesional.nombre_completo - Nombre completo del profesional
 * @param {string} profesional.biografia - Biografía del profesional
 * @param {number} profesional.calificacion_promedio - Calificación promedio (0-5)
 * @param {string} className - Clases adicionales
 *
 * @example
 * <ProfesionalCard profesional={{
 *   nombre_completo: "Juan Pérez",
 *   biografia: "Barbero con 10 años de experiencia",
 *   calificacion_promedio: 4.8
 * }} />
 */
function ProfesionalCard({ profesional, className = '' }) {
  const { nombre_completo, biografia, calificacion_promedio } = profesional;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start space-x-4">
        {/* Avatar placeholder */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-gray-400" />
        </div>

        {/* Información */}
        <div className="flex-1 min-w-0">
          {/* Nombre y calificación */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {nombre_completo}
            </h3>

            {/* Calificación */}
            {calificacion_promedio > 0 && (
              <div className="flex items-center text-sm text-gray-600 ml-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-medium">{calificacion_promedio.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Biografía */}
          {biografia && (
            <p className="text-sm text-gray-600 line-clamp-3">{biografia}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesionalCard;
