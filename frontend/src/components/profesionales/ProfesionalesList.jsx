import {
  Users,
  Eye,
  Trash2,
  Clock,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Star,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ProfesionalStatsCard from './ProfesionalStatsCard';
import { ESTADOS_LABORALES } from '@/hooks/useProfesionales';

/**
 * Componente de lista de profesionales con cards/tabla responsivos
 * Muestra información detallada y acciones por profesional
 * Ene 2026: Agregado soporte para vista tabla y paginación server-side
 */
function ProfesionalesList({
  profesionales,
  pagination,
  viewMode = 'cards',
  isLoading,
  onVerDetalle,
  onDelete,
  onGestionarHorarios,
  onGestionarServicios,
  onPageChange,
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando profesionales...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!profesionales || profesionales.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron profesionales
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Intenta ajustar los filtros o la busqueda
          </p>
        </div>
      </div>
    );
  }

  // Renderizar estrellas de calificacion
  const renderEstrellas = (calificacion) => {
    const cal = parseFloat(calificacion || 0);
    const estrellasLlenas = Math.floor(cal);
    const tieneMedia = cal % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i <= estrellasLlenas
                ? 'text-yellow-400 fill-yellow-400'
                : i === estrellasLlenas + 1 && tieneMedia
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {cal > 0 ? cal.toFixed(1) : '-'}
        </span>
      </div>
    );
  };

  // Obtener color del estado laboral
  const getEstadoColor = (estado) => {
    const config = ESTADOS_LABORALES[estado];
    if (!config) return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';

    const colors = {
      green: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400',
      blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400',
      red: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400',
      gray: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    };

    return colors[config.color] || colors.gray;
  };

  return (
    <div className="space-y-4">
      {/* Header con contador */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {pagination?.total || profesionales.length}
          </span>{' '}
          profesional(es) encontrado(s)
        </p>
      </div>

      {/* Vista Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {profesionales.map((profesional) => (
            <div
              key={profesional.id}
              id={`profesional-${profesional.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
            >
              {/* Header del Card con Avatar - Clickeable */}
              <button
                type="button"
                onClick={() => onVerDetalle(profesional)}
                className="w-full p-6 border-b border-gray-100 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar con foto o iniciales */}
                  {profesional.foto_url ? (
                    <img
                      src={profesional.foto_url}
                      alt={profesional.nombre_completo}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2"
                      style={{ borderColor: profesional.color_calendario || '#753572' }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                      style={{
                        backgroundColor: profesional.color_calendario || '#753572',
                      }}
                    >
                      {profesional.nombre_completo?.split(' ')[0]?.charAt(0)}
                      {profesional.nombre_completo?.split(' ')[1]?.charAt(0) || ''}
                    </div>
                  )}

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {profesional.nombre_completo || 'Sin nombre'}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {profesional.puesto_nombre || profesional.departamento_nombre || 'Sin puesto asignado'}
                    </p>

                    {/* Badge de estado */}
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          profesional.activo
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {profesional.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Informacion de contacto */}
              <div className="p-6 space-y-3">
                {profesional.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400 truncate">
                      {profesional.email}
                    </span>
                  </div>
                )}

                {profesional.telefono && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{profesional.telefono}</span>
                  </div>
                )}

                {profesional.biografia && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                    {profesional.biografia}
                  </div>
                )}
              </div>

              {/* Estadisticas */}
              <div className="px-6 pb-6">
                <ProfesionalStatsCard profesional={profesional} />
              </div>

              {/* Acciones */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  {/* Ver Detalle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVerDetalle(profesional)}
                    className="w-full"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Ver Detalle
                  </Button>

                  {/* Desactivar */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(profesional)}
                    className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Desactivar
                  </Button>

                  {/* Horarios */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGestionarHorarios(profesional)}
                    className="w-full"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Horarios
                  </Button>

                  {/* Servicios */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onGestionarServicios(profesional)}
                    className="w-full"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Servicios
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Tabla */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profesional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Citas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Calificacion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {profesionales.map((profesional) => (
                  <tr
                    key={profesional.id}
                    id={`profesional-${profesional.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => onVerDetalle(profesional)}
                  >
                    {/* Profesional */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {profesional.foto_url ? (
                          <img
                            src={profesional.foto_url}
                            alt={profesional.nombre_completo}
                            className="flex-shrink-0 h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div
                            className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: profesional.color_calendario || '#753572' }}
                          >
                            {profesional.nombre_completo?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {profesional.nombre_completo}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {profesional.puesto_nombre || 'Sin puesto'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {profesional.email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                            <span className="truncate max-w-[150px]">{profesional.email}</span>
                          </div>
                        )}
                        {profesional.telefono && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                            {profesional.telefono}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Departamento */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {profesional.departamento_nombre || '-'}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          profesional.activo
                            ? getEstadoColor(profesional.estado || 'activo')
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {profesional.activo
                          ? ESTADOS_LABORALES[profesional.estado]?.label || 'Activo'
                          : 'Inactivo'}
                      </span>
                    </td>

                    {/* Citas */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {profesional.total_citas_completadas || 0} citas
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {profesional.total_clientes_atendidos || 0} clientes
                      </div>
                    </td>

                    {/* Calificacion */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderEstrellas(profesional.calificacion_promedio)}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGestionarHorarios(profesional);
                          }}
                          title="Horarios"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGestionarServicios(profesional);
                          }}
                          title="Servicios"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(profesional);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Desactivar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginacion */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando{' '}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>
              {' - '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>
              {' de '}
              <span className="font-medium">{pagination.total}</span>
              {' profesionales'}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Mostrar solo paginas cercanas a la actual
                    return (
                      page === 1 ||
                      page === pagination.totalPages ||
                      Math.abs(page - pagination.page) <= 1
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
                            ${page === pagination.page
                              ? 'bg-primary-600 dark:bg-primary-500 text-white'
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
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
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

export default ProfesionalesList;
