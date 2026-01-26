import { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Calendar, Clock, User, Package } from 'lucide-react';
import { formatearFecha, formatearHora } from '@/utils/dateHelpers';
import { obtenerColorEstado, obtenerLabelEstado } from '@/utils/citaValidators';
import { Button, DataTable, DataTableActions } from '@/components/ui';

/**
 * Componente para listar citas usando DataTable genérico
 */
const CitasList = memo(function CitasList({
  citas = [],
  isLoading = false,
  onVerDetalles,
  onLimpiarFiltros,
}) {
  // Definición de columnas con useMemo
  const columns = useMemo(() => [
    {
      key: 'codigo_cita',
      header: 'Código',
      width: 'md',
      render: (row) => (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {row.codigo_cita}
          </span>
        </div>
      ),
    },
    {
      key: 'fecha_cita',
      header: 'Fecha',
      width: 'md',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {formatearFecha(row.fecha_cita, 'dd/MM/yyyy')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {formatearHora(row.hora_inicio)} - {formatearHora(row.hora_fin)}
          </div>
        </div>
      ),
    },
    {
      key: 'cliente_nombre',
      header: 'Cliente',
      width: 'lg',
      render: (row) => (
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {row.cliente_nombre || 'Sin nombre'}
            </div>
            {row.cliente_telefono && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{row.cliente_telefono}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'profesional_nombre',
      header: 'Profesional',
      width: 'lg',
      hideOnMobile: true,
      render: (row) => (
        <div className="flex items-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0"
            style={{ backgroundColor: row.profesional_color || '#6366f1' }}
          >
            {row.profesional_nombre?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {row.profesional_nombre || 'Sin asignar'}
            </div>
            {row.profesional_especialidad && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {row.profesional_especialidad}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'servicios',
      header: 'Servicios',
      hideOnMobile: true,
      render: (row) => (
        <div className="flex items-start">
          <Package className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0 mt-1" />
          <div className="min-w-0 flex-1">
            {row.servicios && Array.isArray(row.servicios) && row.servicios.length > 0 ? (
              <div className="space-y-1">
                {row.servicios.map((servicio, idx) => (
                  <div key={idx} className="text-sm text-gray-900 dark:text-gray-100">
                    • {servicio.servicio_nombre}
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      (${parseFloat(servicio.precio_aplicado || 0).toLocaleString('es-CO')})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {row.servicio_nombre || 'Sin servicio'}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'precio_total',
      header: 'Total',
      align: 'right',
      hideOnMobile: true,
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
            ${parseFloat(row.precio_total || row.precio_servicio || 0).toLocaleString('es-CO')}
            {row.descuento > 0 && (
              <span className="text-green-600 dark:text-green-400 text-xs ml-1">
                (-${parseFloat(row.descuento).toLocaleString('es-CO')})
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {row.duracion_total_minutos || row.duracion_minutos || 0} min
          </div>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      width: 'sm',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${obtenerColorEstado(row.estado)}`}
        >
          {obtenerLabelEstado(row.estado)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <DataTableActions>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onVerDetalles(row);
            }}
          >
            Ver
          </Button>
        </DataTableActions>
      ),
    },
  ], [onVerDetalles]);

  return (
    <DataTable
      columns={columns}
      data={citas}
      keyField="id"
      isLoading={isLoading}
      onRowClick={onVerDetalles}
      hoverable
      emptyState={{
        icon: Calendar,
        title: 'No hay citas',
        description: 'No se encontraron citas con los filtros seleccionados.',
        actionLabel: onLimpiarFiltros ? 'Limpiar filtros' : undefined,
        onAction: onLimpiarFiltros,
      }}
      skeletonRows={3}
    />
  );
});

CitasList.propTypes = {
  citas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      codigo_cita: PropTypes.string,
      fecha_cita: PropTypes.string,
      hora_inicio: PropTypes.string,
      hora_fin: PropTypes.string,
      cliente_nombre: PropTypes.string,
      cliente_telefono: PropTypes.string,
      profesional_nombre: PropTypes.string,
      profesional_color: PropTypes.string,
      profesional_especialidad: PropTypes.string,
      servicio_nombre: PropTypes.string,
      servicios: PropTypes.arrayOf(
        PropTypes.shape({
          servicio_nombre: PropTypes.string,
          precio_aplicado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
      ),
      precio_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      precio_servicio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      descuento: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      duracion_total_minutos: PropTypes.number,
      duracion_minutos: PropTypes.number,
      estado: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
  onVerDetalles: PropTypes.func.isRequired,
  onLimpiarFiltros: PropTypes.func,
};

export default CitasList;
