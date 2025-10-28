import { Calendar, Clock, User, Package } from 'lucide-react';
import { formatearFecha, formatearHora } from '@/utils/dateHelpers';
import { obtenerColorEstado, obtenerLabelEstado } from '@/utils/citaValidators';
import Button from '@/components/ui/Button';

/**
 * Componente para listar citas en formato de tabla responsiva
 */
function CitasList({
  citas = [],
  isLoading = false,
  onVerDetalles,
}) {
  // Estados de carga (skeleton)
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profesional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16 ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (!citas || citas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay citas</h3>
        <p className="text-gray-600 mb-6">
          No se encontraron citas con los filtros seleccionados.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Limpiar filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesional
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {citas.map((cita) => (
              <tr
                key={cita.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onVerDetalles(cita)}
              >
                {/* Código de Cita */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900">
                      {cita.codigo_cita}
                    </span>
                  </div>
                </td>

                {/* Fecha y Hora */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatearFecha(cita.fecha_cita, 'dd/MM/yyyy')}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
                  </div>
                </td>

                {/* Cliente */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {cita.cliente_nombre || 'Sin nombre'}
                      </div>
                      {cita.cliente_telefono && (
                        <div className="text-xs text-gray-500">{cita.cliente_telefono}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Profesional */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0"
                      style={{ backgroundColor: cita.profesional_color || '#6366f1' }}
                    >
                      {cita.profesional_nombre?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {cita.profesional_nombre || 'Sin asignar'}
                      </div>
                      {cita.profesional_especialidad && (
                        <div className="text-xs text-gray-500 truncate">
                          {cita.profesional_especialidad}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Servicios (soporte para múltiples servicios) */}
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <Package className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      {/* Si tiene array de servicios (nuevo formato) */}
                      {cita.servicios && Array.isArray(cita.servicios) && cita.servicios.length > 0 ? (
                        <div className="space-y-1">
                          {cita.servicios.map((servicio, idx) => (
                            <div key={idx} className="text-sm text-gray-900">
                              • {servicio.servicio_nombre}
                              <span className="text-xs text-gray-500 ml-1">
                                (${parseFloat(servicio.precio_aplicado || 0).toLocaleString('es-CO')})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Backward compatibility: servicio único */
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {cita.servicio_nombre || 'Sin servicio'}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Total (Precio + Duración) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    ${parseFloat(cita.precio_total || cita.precio_servicio || 0).toLocaleString('es-CO')}
                    {cita.descuento > 0 && (
                      <span className="text-green-600 text-xs ml-1">
                        (-${parseFloat(cita.descuento).toLocaleString('es-CO')})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {cita.duracion_total_minutos || cita.duracion_minutos || 0} min
                  </div>
                </td>

                {/* Estado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${obtenerColorEstado(cita.estado)}`}
                  >
                    {obtenerLabelEstado(cita.estado)}
                  </span>
                </td>

                {/* Acciones */}
                <td
                  className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerDetalles(cita);
                    }}
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación info */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{citas.length}</span> cita
            {citas.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CitasList;
