import { Star, Calendar, Users, TrendingUp } from 'lucide-react';

/**
 * Componente para mostrar estadísticas de un profesional
 * Muestra métricas clave como citas, calificación y clientes atendidos
 */
function ProfesionalStatsCard({ profesional }) {
  // Calcular estrellas para la calificación
  const calificacion = parseFloat(profesional.calificacion_promedio || 0);
  const estrellasLlenas = Math.floor(calificacion);
  const tieneMediaEstrella = calificacion % 1 >= 0.5;

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        Estadísticas
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Citas Completadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Citas</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {profesional.total_citas_completadas || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">completadas</p>
        </div>

        {/* Clientes Atendidos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Clientes</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {profesional.total_clientes_atendidos || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">atendidos</p>
        </div>

        {/* Calificación Promedio */}
        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Calificación</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Estrellas */}
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, index) => {
                if (index < estrellasLlenas) {
                  // Estrella llena
                  return (
                    <Star
                      key={index}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  );
                } else if (index === estrellasLlenas && tieneMediaEstrella) {
                  // Media estrella
                  return (
                    <div key={index} className="relative w-4 h-4">
                      <Star className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <div className="absolute inset-0 overflow-hidden w-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  );
                } else {
                  // Estrella vacía
                  return (
                    <Star key={index} className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  );
                }
              })}
            </div>

            {/* Valor numérico */}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {calificacion.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">/5.0</span>
            </div>
          </div>

          {/* Mensaje si no hay calificaciones */}
          {profesional.total_citas_completadas === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Sin calificaciones aún
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesionalStatsCard;
