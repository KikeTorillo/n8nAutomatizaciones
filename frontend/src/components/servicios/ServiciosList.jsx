import { Scissors, Edit, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { formatDuration, parseProfessionalsCount, parsePrice } from '@/utils/formatters';

/**
 * Componente de lista de servicios con tabla responsiva y paginación
 * Sigue el patrón de ClientesList.jsx
 */
function ServiciosList({
  servicios,
  paginacion,
  isLoading,
  onPageChange,
  onEdit,
  onGestionarProfesionales,
  onDelete,
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!servicios || servicios.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron servicios
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Intenta ajustar los filtros o la búsqueda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duración
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profesionales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {servicios.map((servicio) => {
                const totalProfs = parseProfessionalsCount(servicio.total_profesionales_asignados);
                const precio = parsePrice(servicio.precio);

                return (
                  <tr
                    key={servicio.id}
                    id={`servicio-${servicio.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Servicio */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {/* Imagen o icono del servicio */}
                        {servicio.imagen_url ? (
                          <img
                            src={servicio.imagen_url}
                            alt={servicio.nombre}
                            className="flex-shrink-0 h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {servicio.nombre}
                          </div>
                          {servicio.descripcion && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                              {servicio.descripcion}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400">
                        {servicio.categoria}
                      </span>
                    </td>

                    {/* Duración */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400">
                        {formatDuration(servicio.duracion_minutos)}
                      </span>
                    </td>

                    {/* Precio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(precio)}
                      </div>
                    </td>

                    {/* Profesionales */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {totalProfs === 0 ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 rounded-md text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Sin profesionales asignados
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGestionarProfesionales(servicio);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {totalProfs} profesional{totalProfs !== 1 ? 'es' : ''}
                        </button>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`
                          px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${servicio.activo
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                          }
                        `}
                      >
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botón de Acción Rápida - Prioridad según estado */}
                        {totalProfs === 0 ? (
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGestionarProfesionales(servicio);
                            }}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Asignar profesionales
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGestionarProfesionales(servicio);
                            }}
                          >
                            Gestionar profesionales
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(servicio);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(servicio);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {paginacion && paginacion.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando{' '}
              <span className="font-medium">
                {(paginacion.page - 1) * paginacion.limit + 1}
              </span>
              {' - '}
              <span className="font-medium">
                {Math.min(paginacion.page * paginacion.limit, paginacion.total)}
              </span>
              {' de '}
              <span className="font-medium">{paginacion.total}</span>
              {' servicios'}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(paginacion.page - 1)}
                disabled={!paginacion.hasPrev}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: paginacion.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Mostrar solo páginas cercanas a la actual
                    return (
                      page === 1 ||
                      page === paginacion.totalPages ||
                      Math.abs(page - paginacion.page) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    // Agregar "..." si hay un salto
                    const showEllipsis =
                      index > 0 && array[index - 1] !== page - 1;

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => onPageChange(page)}
                          className={`
                            min-w-[2.5rem] h-10 px-3 rounded-md text-sm font-medium
                            transition-colors
                            ${page === paginacion.page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(paginacion.page + 1)}
                disabled={!paginacion.hasNext}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiciosList;
