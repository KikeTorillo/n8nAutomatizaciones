import { useMemo } from 'react';
import {
  Users,
  Eye,
  Trash2,
  Clock,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  Star,
} from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  DataTableActionButton,
  DataTableActions,
  Pagination
} from '@/components/ui';
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

  // Mapear color de estado laboral a variante de Badge
  const getEstadoBadgeVariant = (estado) => {
    const config = ESTADOS_LABORALES[estado];
    if (!config) return 'default';

    const variantMap = {
      green: 'success',
      blue: 'info',
      yellow: 'warning',
      red: 'error',
      gray: 'default',
    };

    return variantMap[config.color] || 'default';
  };

  // Columnas para DataTable
  const columns = useMemo(() => [
    {
      key: 'profesional',
      header: 'Profesional',
      width: 'xl',
      render: (row) => (
        <div className="flex items-center">
          {row.foto_url ? (
            <img
              src={row.foto_url}
              alt={row.nombre_completo}
              className="flex-shrink-0 h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div
              className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: row.color_calendario || '#753572' }}
            >
              {row.nombre_completo?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {row.nombre_completo}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {row.puesto_nombre || 'Sin puesto'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      hideOnMobile: true,
      render: (row) => (
        <div className="flex flex-col gap-1">
          {row.email && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
              <span className="truncate max-w-[150px]">{row.email}</span>
            </div>
          )}
          {row.telefono && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
              {row.telefono}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'departamento_nombre',
      header: 'Departamento',
      hideOnMobile: true,
      render: (row) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {row.departamento_nombre || '-'}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge
          variant={row.activo ? getEstadoBadgeVariant(row.estado || 'activo') : 'default'}
          size="sm"
        >
          {row.activo
            ? ESTADOS_LABORALES[row.estado]?.label || 'Activo'
            : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'citas',
      header: 'Citas',
      hideOnMobile: true,
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {row.total_citas_completadas || 0} citas
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {row.total_clientes_atendidos || 0} clientes
          </div>
        </div>
      ),
    },
    {
      key: 'calificacion',
      header: 'Calificación',
      hideOnMobile: true,
      render: (row) => renderEstrellas(row.calificacion_promedio),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <DataTableActions>
          <DataTableActionButton
            icon={Clock}
            label="Horarios"
            onClick={(e) => {
              e.stopPropagation();
              onGestionarHorarios(row);
            }}
          />
          <DataTableActionButton
            icon={Calendar}
            label="Servicios"
            onClick={(e) => {
              e.stopPropagation();
              onGestionarServicios(row);
            }}
          />
          <DataTableActionButton
            icon={Trash2}
            label="Desactivar"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
            }}
          />
        </DataTableActions>
      ),
    },
  ], [onDelete, onGestionarHorarios, onGestionarServicios]);

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
                      <Badge
                        variant={profesional.activo ? 'success' : 'default'}
                        size="sm"
                      >
                        {profesional.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
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
        <DataTable
          columns={columns}
          data={profesionales}
          keyField="id"
          onRowClick={onVerDetalle}
          emptyState={{
            icon: Users,
            title: 'No se encontraron profesionales',
            description: 'Intenta ajustar los filtros o la búsqueda',
          }}
        />
      )}

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-6">
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default ProfesionalesList;
