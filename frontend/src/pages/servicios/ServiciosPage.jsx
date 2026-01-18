import { useMemo } from 'react';
import {
  Briefcase,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
} from 'lucide-react';
import {
  Badge,
  DataTableActions,
  DataTableActionButton,
  ListadoCRUDPage,
} from '@/components/ui';
import AgendamientoPageLayout from '@/components/agendamiento/AgendamientoPageLayout';
import ServicioFormDrawer from '@/components/servicios/ServicioFormDrawer';
import ProfesionalesServicioModal from '@/components/servicios/ProfesionalesServicioModal';
import ServiciosSinProfesionalesAlert from '@/components/servicios/ServiciosSinProfesionalesAlert';
import { useServicios, useEliminarServicio } from '@/hooks/agendamiento';
import { formatCurrency } from '@/lib/utils';
import { formatDuration, parseProfessionalsCount, parsePrice } from '@/utils/formatters';

/**
 * Configuracion de columnas para la tabla de servicios
 */
const COLUMNS = [
  {
    key: 'nombre',
    header: 'Servicio',
    width: 'lg',
    render: (row) => (
      <div className="flex items-center">
        {row.imagen_url ? (
          <img
            src={row.imagen_url}
            alt={row.nombre}
            className="flex-shrink-0 h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        )}
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {row.nombre}
          </div>
          {row.descripcion && (
            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
              {row.descripcion}
            </div>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'categoria',
    header: 'Categoria',
    hideOnMobile: true,
    render: (row) => (
      row.categoria ? (
        <Badge variant="primary" size="sm">{row.categoria}</Badge>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
      )
    ),
  },
  {
    key: 'duracion',
    header: 'Duracion',
    hideOnMobile: true,
    render: (row) => (
      <Badge variant="info" size="sm">
        {formatDuration(row.duracion_minutos)}
      </Badge>
    ),
  },
  {
    key: 'precio',
    header: 'Precio',
    render: (row) => (
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {formatCurrency(parsePrice(row.precio))}
      </div>
    ),
  },
  {
    key: 'profesionales',
    header: 'Profesionales',
    hideOnMobile: true,
    render: (row) => {
      const totalProfs = parseProfessionalsCount(row.total_profesionales_asignados);
      if (totalProfs === 0) {
        return (
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 rounded-md text-xs font-medium">
            <AlertTriangle className="w-3 h-3" />
            Sin asignar
          </div>
        );
      }
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          {totalProfs} profesional{totalProfs !== 1 ? 'es' : ''}
        </div>
      );
    },
  },
  {
    key: 'activo',
    header: 'Estado',
    align: 'center',
    render: (row) => (
      <Badge variant={row.activo ? 'success' : 'default'} size="sm">
        {row.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
];

/**
 * Filtros iniciales
 */
const INITIAL_FILTERS = {
  busqueda: '',
  activo: true,
};

/**
 * Mapper para transformar data del template a props del FormDrawer
 */
const mapFormData = (data) => ({
  servicio: data,
  mode: data ? 'edit' : 'create',
});

/**
 * Acciones por fila de servicio
 */
function ServicioRowActions({ row, onEdit, onDelete, openModal }) {
  const totalProfs = parseProfessionalsCount(row.total_profesionales_asignados);

  return (
    <DataTableActions>
      {/* Accion prioritaria: Gestionar profesionales */}
      <DataTableActionButton
        icon={totalProfs === 0 ? AlertTriangle : Users}
        label={totalProfs === 0 ? 'Asignar' : 'Profesionales'}
        onClick={() => openModal('profesionales', row)}
        variant={totalProfs === 0 ? 'warning' : 'secondary'}
      />
      <DataTableActionButton
        icon={Edit}
        label="Editar"
        onClick={() => onEdit(row)}
        variant="primary"
      />
      <DataTableActionButton
        icon={Trash2}
        label="Desactivar"
        onClick={() => onDelete(row)}
        variant="danger"
      />
    </DataTableActions>
  );
}

/**
 * Pagina principal de Gestion de Servicios
 * Migrado a ListadoCRUDPage - reduccion de ~60% del codigo
 */
function ServiciosPage() {
  return (
    <ListadoCRUDPage
      // Layout
      title="Servicios"
      subtitle="Gestiona los servicios de tu negocio"
      icon={Briefcase}
      PageLayout={AgendamientoPageLayout}

      // Data
      useListQuery={useServicios}
      dataKey="servicios"

      // Mutations
      useDeleteMutation={useEliminarServicio}
      deleteMutationOptions={{
        entityName: 'servicio',
        getName: (s) => s.nombre,
        confirmTitle: 'Desactivar servicio',
        confirmMessage: 'Estas seguro de desactivar el servicio "{name}"? Las citas existentes se mantendran, pero no se podran crear nuevas.',
        confirmText: 'Si, Desactivar',
        successMessage: 'Servicio desactivado correctamente',
      }}

      // Table
      columns={COLUMNS}
      rowActions={(row, handlers) => (
        <ServicioRowActions row={row} {...handlers} />
      )}
      emptyState={{
        icon: Briefcase,
        title: 'No hay servicios',
        description: 'Comienza agregando tu primer servicio',
        actionLabel: 'Nuevo Servicio',
      }}

      // Filters
      initialFilters={INITIAL_FILTERS}
      filterPersistId="agendamiento.servicios"
      limit={20}

      // Stats - Calculadas desde los datos
      statsConfig={null} // Se implementan en renderBeforeTable

      // Modals
      FormDrawer={ServicioFormDrawer}
      mapFormData={mapFormData}

      // Extra Modals
      extraModals={{
        profesionales: {
          component: ProfesionalesServicioModal,
          mapData: (data) => ({ servicio: data }),
        },
      }}

      // Custom slots
      renderBeforeTable={({ items }) => (
        <>
          {/* Estadisticas calculadas */}
          <ServiciosStats servicios={items} />
          {/* Alerta de servicios sin profesionales */}
          <ServiciosSinProfesionalesAlert servicios={items} />
        </>
      )}

      // Actions
      newButtonLabel="Nuevo Servicio"
    />
  );
}

/**
 * Componente de estadisticas de servicios
 */
function ServiciosStats({ servicios = [] }) {
  const stats = useMemo(() => {
    const total = servicios.length;
    const activos = servicios.filter(s => s.activo).length;
    const sinProfesionales = servicios.filter(
      s => parseProfessionalsCount(s.total_profesionales_asignados) === 0 && s.activo
    ).length;
    const precioPromedio = total > 0
      ? servicios.reduce((sum, s) => sum + parsePrice(s.precio), 0) / total
      : 0;

    return [
      { key: 'total', icon: Briefcase, label: 'Total', value: total, color: 'primary' },
      { key: 'activos', icon: CheckCircle, label: 'Activos', value: activos, color: 'green' },
      { key: 'sinProf', icon: AlertTriangle, label: 'Sin Prof.', value: sinProfesionales, color: 'yellow' },
      { key: 'precio', icon: DollarSign, label: 'Precio Prom.', value: formatCurrency(precioPromedio), color: 'primary' },
    ];
  }, [servicios]);

  if (servicios.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const colorClasses = {
          primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
          green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
        };

        return (
          <div
            key={stat.key}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 rounded-lg ${colorClasses[stat.color] || colorClasses.primary}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ServiciosPage;
