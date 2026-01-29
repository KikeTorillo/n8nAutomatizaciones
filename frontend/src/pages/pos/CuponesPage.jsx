import {
  Ticket,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Hash
} from 'lucide-react';

import { getEstadoVigencia } from '@/lib/estadoVigencia';
import POSPageLayout from '@/components/pos/POSPageLayout';
import { ListadoCRUDPage } from '@/components/ui';
import CuponFormDrawer from '@/components/pos/CuponFormDrawer';
import CuponStatsModal from '@/components/pos/CuponStatsModal';
import { useToast } from '@/hooks/utils';
import {
  useCupones,
  useEliminarCupon,
  useCambiarEstadoCupon
} from '@/hooks/pos';

// =========== CONSTANTES ===========

/**
 * Tipos de descuento disponibles
 */
const TIPOS_DESCUENTO = {
  porcentaje: { label: 'Porcentaje', icon: Percent },
  monto_fijo: { label: 'Monto fijo', icon: DollarSign }
};

/**
 * Filtros iniciales
 */
const INITIAL_FILTERS = {
  busqueda: '',
  activo: '',
};

// =========== HELPERS ===========

/**
 * Obtiene el icono por tipo de descuento
 */
const getTipoIcon = (tipo) => {
  const Icon = TIPOS_DESCUENTO[tipo]?.icon || Ticket;
  return <Icon className="h-4 w-4" />;
};

/**
 * Color y label segun estado/vigencia
 */
const getEstadoInfo = (cupon) => getEstadoVigencia(cupon);

/**
 * Formatear valor de descuento
 */
const formatDescuento = (cupon) => {
  if (cupon.tipo_descuento === 'porcentaje') {
    return `${cupon.valor}%`;
  }
  return `$${cupon.valor}`;
};

// =========== COLUMNAS ===========

const COLUMNS = [
  {
    key: 'tipo_icon',
    header: '',
    width: 'sm',
    render: (row) => (
      <div
        className={`p-2 rounded-lg ${
          row.activo
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
        }`}
      >
        {getTipoIcon(row.tipo_descuento)}
      </div>
    ),
  },
  {
    key: 'nombre',
    header: 'Cupon',
    width: 'xl',
    render: (row) => {
      const estado = getEstadoInfo(row);
      return (
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {row.nombre}
            </span>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {row.codigo}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estado.color}`}>
              {estado.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {TIPOS_DESCUENTO[row.tipo_descuento]?.label || row.tipo_descuento}
            {' - '}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {formatDescuento(row)}
            </span>
            {row.monto_minimo && (
              <span className="ml-2 text-xs">(min. ${row.monto_minimo})</span>
            )}
          </p>
        </div>
      );
    },
  },
  {
    key: 'vigencia',
    header: 'Vigencia',
    hideOnMobile: true,
    render: (row) =>
      row.fecha_inicio || row.fecha_fin ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {row.fecha_inicio && new Date(row.fecha_inicio).toLocaleDateString()}
            {row.fecha_fin && ` - ${new Date(row.fecha_fin).toLocaleDateString()}`}
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-400">Sin limite</span>
      ),
  },
  {
    key: 'usos',
    header: 'Usos',
    align: 'center',
    hideOnMobile: true,
    render: (row) => (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {row.uso_maximo ? (
          <span className="flex items-center gap-1">
            <Hash className="h-3.5 w-3.5" />
            {row.veces_usado || 0}/{row.uso_maximo}
          </span>
        ) : (
          <span>{row.veces_usado || 0}</span>
        )}
        {row.uso_por_cliente && (
          <span className="flex items-center gap-1 text-xs mt-0.5">
            <Users className="h-3 w-3" />
            Max {row.uso_por_cliente}/cliente
          </span>
        )}
      </div>
    ),
  },
];

// =========== COMPONENTES AUXILIARES ===========

/**
 * Acciones por fila de cupon
 */
function CuponRowActions({ row, onEdit, onDelete, onViewStats, onToggleEstado, isToggling }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleEstado(row);
        }}
        disabled={isToggling}
        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        title={row.activo ? 'Desactivar' : 'Activar'}
      >
        {row.activo ? (
          <ToggleRight className="h-5 w-5 text-green-500" />
        ) : (
          <ToggleLeft className="h-5 w-5" />
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewStats(row);
        }}
        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Ver estadisticas"
      >
        <BarChart3 className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit(row);
        }}
        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="Editar"
      >
        <Edit2 className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(row);
        }}
        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        title="Eliminar"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}

// =========== MAPPERS ===========

/**
 * Mapper para FormDrawer
 */
const mapFormData = (data) => ({ cupon: data });

/**
 * Mapper para StatsModal
 */
const mapStatsData = (data) => ({ cupon: data });

// =========== PAGINA PRINCIPAL ===========

/**
 * Pagina de administracion de Cupones de Descuento
 * Migrado a ListadoCRUDPage - reduccion de ~76% del codigo
 */
export default function CuponesPage() {
  const toast = useToast();
  const cambiarEstadoMutation = useCambiarEstadoCupon();

  // Handler para toggle de estado
  const handleToggleEstado = async (cupon) => {
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: cupon.id,
        activo: !cupon.activo,
      });
      toast.success(cupon.activo ? 'Cupon desactivado' : 'Cupon activado');
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  return (
    <ListadoCRUDPage
      // Layout
      title="Cupones de Descuento"
      icon={Ticket}
      PageLayout={POSPageLayout}

      // Data
      useListQuery={useCupones}
      dataKey="cupones"

      // Mutations
      useDeleteMutation={useEliminarCupon}
      deleteMutationOptions={{
        entityName: 'cupon',
        getName: (c) => c.nombre,
      }}

      // Table
      columns={COLUMNS}
      rowActions={(row, handlers) => (
        <CuponRowActions
          row={row}
          {...handlers}
          onToggleEstado={handleToggleEstado}
          isToggling={cambiarEstadoMutation.isPending}
        />
      )}
      emptyState={{
        icon: Ticket,
        title: 'No hay cupones',
        description: 'Crea tu primer cupon de descuento',
        actionLabel: 'Nuevo Cupon',
      }}

      // Filters
      initialFilters={INITIAL_FILTERS}
      filterPersistId="pos.cupones"
      limit={10}

      // Modals
      FormDrawer={CuponFormDrawer}
      mapFormData={mapFormData}
      StatsModal={CuponStatsModal}
      mapStatsData={mapStatsData}

      // Actions
      newButtonLabel="Nuevo Cupon"
    />
  );
}
