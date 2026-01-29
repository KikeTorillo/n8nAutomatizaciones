import {
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Clock,
  Calendar,
  Percent,
  DollarSign,
  Package,
  Gift,
  Tag
} from 'lucide-react';

import { getEstadoVigencia, LABELS_FEMENINO } from '@/lib/estadoVigencia';
import POSPageLayout from '@/components/pos/POSPageLayout';
import { ListadoCRUDPage } from '@/components/ui';
import PromocionFormDrawer from '@/components/pos/PromocionFormDrawer';
import PromocionStatsModal from '@/components/pos/PromocionStatsModal';
import { useToast } from '@/hooks/utils';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';
import {
  usePromociones,
  useEliminarPromocion,
  useCambiarEstadoPromocion,
  useDuplicarPromocion,
} from '@/hooks/pos';
import { TIPOS_PROMOCION } from '@/components/pos/promocion-form';

// =========== CONSTANTES ===========

/**
 * Filtros iniciales
 */
const INITIAL_FILTERS = {
  busqueda: '',
  tipo: '',
  activo: '',
};

// =========== HELPERS ===========

/**
 * Iconos por tipo de promocion
 */
const getTipoIcon = (tipo) => {
  const icons = {
    cantidad: Package,
    porcentaje: Percent,
    monto_fijo: DollarSign,
    regalo: Gift,
    precio_especial: Tag,
  };
  const Icon = icons[tipo] || Sparkles;
  return <Icon className="h-4 w-4" />;
};

/**
 * Color y label segun estado/vigencia
 */
const getEstadoInfo = (promocion) => getEstadoVigencia(promocion, { labels: LABELS_FEMENINO });

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
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
        }`}
      >
        {getTipoIcon(row.tipo)}
      </div>
    ),
  },
  {
    key: 'nombre',
    header: 'Promocion',
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
            {row.exclusiva && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 font-medium">
                Exclusiva
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {TIPOS_PROMOCION[row.tipo]?.label || row.tipo}
            {row.valor_descuento && (
              <> - {row.tipo === 'porcentaje' ? `${row.valor_descuento}%` : `$${row.valor_descuento}`}</>
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
    render: (row) => (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(row.fecha_inicio).toLocaleDateString()}
          {row.fecha_fin && ` - ${new Date(row.fecha_fin).toLocaleDateString()}`}
        </div>
        {(row.hora_inicio || row.hora_fin) && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="h-3.5 w-3.5" />
            {row.hora_inicio || '00:00'} - {row.hora_fin || '23:59'}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'usos',
    header: 'Usos',
    align: 'center',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {row.veces_usado || 0}
      </span>
    ),
  },
];

// =========== COMPONENTES AUXILIARES ===========

/**
 * Acciones por fila de promocion
 */
function PromocionRowActions({
  row,
  onEdit,
  onDelete,
  onViewStats,
  onToggleEstado,
  onDuplicar,
  isToggling,
  isDuplicating
}) {
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
          onDuplicar(row.id);
        }}
        disabled={isDuplicating}
        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        title="Duplicar"
      >
        <Copy className="h-5 w-5" />
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
const mapFormData = (data) => ({ promocion: data });

/**
 * Mapper para StatsModal
 */
const mapStatsData = (data) => ({ promocion: data });

// =========== PAGINA PRINCIPAL ===========

/**
 * Pagina de administracion de Promociones Automaticas
 * Migrado a ListadoCRUDPage - reduccion de ~76% del codigo
 */
export default function PromocionesPage() {
  const toast = useToast();
  const sucursalActiva = useSucursalStore(selectSucursalActiva);

  // Mutations para acciones custom
  const cambiarEstadoMutation = useCambiarEstadoPromocion();
  const duplicarMutation = useDuplicarPromocion();

  // Handler para toggle de estado
  const handleToggleEstado = async (promocion) => {
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: promocion.id,
        activo: !promocion.activo,
      });
      toast.success(promocion.activo ? 'Promocion desactivada' : 'Promocion activada');
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  // Handler para duplicar
  const handleDuplicar = async (promocionId) => {
    try {
      await duplicarMutation.mutateAsync(promocionId);
      toast.success('Promocion duplicada');
    } catch (error) {
      toast.error(error.message || 'Error al duplicar');
    }
  };

  return (
    <ListadoCRUDPage
      // Layout
      title="Promociones"
      icon={Sparkles}
      PageLayout={POSPageLayout}

      // Data
      useListQuery={usePromociones}
      queryParams={{ sucursalId: sucursalActiva?.id }}
      dataKey="promociones"

      // Mutations
      useDeleteMutation={useEliminarPromocion}
      deleteMutationOptions={{
        entityName: 'promocion',
        getName: (p) => p.nombre,
      }}

      // Table
      columns={COLUMNS}
      rowActions={(row, handlers) => (
        <PromocionRowActions
          row={row}
          {...handlers}
          onToggleEstado={handleToggleEstado}
          onDuplicar={handleDuplicar}
          isToggling={cambiarEstadoMutation.isPending}
          isDuplicating={duplicarMutation.isPending}
        />
      )}
      emptyState={{
        icon: Sparkles,
        title: 'No hay promociones',
        description: 'Crea tu primera promocion automatica',
        actionLabel: 'Nueva Promocion',
      }}

      // Filters
      initialFilters={INITIAL_FILTERS}
      filterPersistId="pos.promociones"
      limit={10}

      // Modals
      FormDrawer={PromocionFormDrawer}
      mapFormData={mapFormData}
      StatsModal={PromocionStatsModal}
      mapStatsData={mapStatsData}

      // Actions
      newButtonLabel="Nueva Promocion"
    />
  );
}
