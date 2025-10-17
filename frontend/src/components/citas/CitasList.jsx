import { Calendar, Clock, User, Package, ChevronRight, MoreVertical } from 'lucide-react';
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
  onCambiarEstado,
  onEditar,
  onCancelar,
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
                  Fecha y Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profesional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duración
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
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-36"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-28"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-24 ml-auto"></div>
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
                Fecha y Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesional
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Servicio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duración
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
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {cita.cliente_nombre || 'Sin nombre'}
                      </div>
                      {cita.cliente_telefono && (
                        <div className="text-xs text-gray-500">{cita.cliente_telefono}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Profesional */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2"
                      style={{ backgroundColor: cita.profesional_color || '#6366f1' }}
                    >
                      {cita.profesional_nombre?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {cita.profesional_nombre || 'Sin asignar'}
                      </div>
                      {cita.profesional_especialidad && (
                        <div className="text-xs text-gray-500">
                          {cita.profesional_especialidad}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Servicio */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {cita.servicio_nombre || 'Sin servicio'}
                      </div>
                      {cita.precio_servicio && (
                        <div className="text-xs text-gray-500">
                          ${cita.precio_servicio.toLocaleString('es-CO')}
                          {cita.descuento > 0 && (
                            <span className="text-green-600 ml-1">
                              (-${cita.descuento.toLocaleString('es-CO')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Duración */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{cita.duracion_minutos} min</span>
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
                  <div className="flex items-center justify-end gap-2">
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

                    {/* Menú de acciones según estado */}
                    <div className="relative group">
                      <button
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {/* Dropdown de acciones */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                        {cita.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCambiarEstado(cita, 'confirmar');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCambiarEstado(cita, 'iniciar');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Iniciar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditar(cita);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Editar
                            </button>
                          </>
                        )}

                        {cita.estado === 'confirmada' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCambiarEstado(cita, 'iniciar');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Iniciar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCambiarEstado(cita, 'no_show');
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-orange-700 hover:bg-orange-50 transition-colors"
                            >
                              Marcar No Show
                            </button>
                          </>
                        )}

                        {cita.estado === 'en_curso' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCambiarEstado(cita, 'completar');
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50 transition-colors"
                          >
                            Completar
                          </button>
                        )}

                        {/* Cancelar disponible para pendiente, confirmada, en_curso */}
                        {['pendiente', 'confirmada', 'en_curso'].includes(cita.estado) && (
                          <>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelar(cita);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors"
                            >
                              Cancelar Cita
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
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
