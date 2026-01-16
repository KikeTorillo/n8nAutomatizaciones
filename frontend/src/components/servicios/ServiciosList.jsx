import { Briefcase, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Pagination,
  SkeletonTable
} from '@/components/ui';
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
      <SkeletonTable
        rows={5}
        columns={7}
        columnWidths={['lg', 'md', 'sm', 'md', 'lg', 'sm', 'md']}
      />
    );
  }

  // Empty state
  if (!servicios || servicios.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No se encontraron servicios"
        description="Intenta ajustar los filtros o la búsqueda"
      />
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
                            <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
                      <Badge variant="primary" size="sm">{servicio.categoria}</Badge>
                    </td>

                    {/* Duración */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="info" size="sm">{formatDuration(servicio.duracion_minutos)}</Badge>
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
                      <Badge variant={servicio.activo ? 'success' : 'default'} size="sm">
                        {servicio.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
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
        <div className="mt-4">
          <Pagination
            pagination={{
              page: paginacion.page,
              limit: paginacion.limit,
              total: paginacion.total,
              totalPages: paginacion.totalPages,
              hasNext: paginacion.hasNext,
              hasPrev: paginacion.hasPrev,
            }}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default ServiciosList;
