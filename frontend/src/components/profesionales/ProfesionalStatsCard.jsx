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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary-600" />
        Estadísticas
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Citas Completadas */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Citas</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {profesional.total_citas_completadas || 0}
          </p>
          <p className="text-xs text-gray-500">completadas</p>
        </div>

        {/* Clientes Atendidos */}
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Clientes</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {profesional.total_clientes_atendidos || 0}
          </p>
          <p className="text-xs text-gray-500">atendidos</p>
        </div>

        {/* Calificación Promedio */}
        <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-600">Calificación</span>
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
                      <Star className="w-4 h-4 text-gray-300" />
                      <div className="absolute inset-0 overflow-hidden w-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  );
                } else {
                  // Estrella vacía
                  return (
                    <Star key={index} className="w-4 h-4 text-gray-300" />
                  );
                }
              })}
            </div>

            {/* Valor numérico */}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">
                {calificacion.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">/5.0</span>
            </div>
          </div>

          {/* Mensaje si no hay calificaciones */}
          {profesional.total_citas_completadas === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Sin calificaciones aún
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfesionalStatsCard;
