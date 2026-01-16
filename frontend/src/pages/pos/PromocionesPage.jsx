import { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
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
  Tag,
  Search
} from 'lucide-react';

import POSPageLayout from '@/components/pos/POSPageLayout';
import {
  Button,
  ConfirmDialog,
  DataTable,
  SearchInput
} from '@/components/ui';
import PromocionFormDrawer from '@/components/pos/PromocionFormDrawer';
import PromocionStatsModal from '@/components/pos/PromocionStatsModal';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import { useFilters } from '@/hooks/useFilters';
import useSucursalStore from '@/store/sucursalStore';
import {
  usePromociones,
  useEliminarPromocion,
  useCambiarEstadoPromocion,
  useDuplicarPromocion,
} from '@/hooks/usePromociones';
import { TIPOS_PROMOCION } from '@/components/pos/promocion-form';

// Filtros iniciales
const INITIAL_FILTERS = {
  busqueda: '',
  tipo: '',
  activo: '',
};

// Configuración de filtros para el panel
const FILTER_CONFIG = [
  {
    id: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: '', label: 'Todos los tipos' },
      ...Object.entries(TIPOS_PROMOCION).map(([key, val]) => ({
        value: key,
        label: val.label,
      })),
    ],
  },
  {
    id: 'activo',
    label: 'Estado',
    type: 'select',
    options: [
      { value: '', label: 'Todos' },
      { value: 'true', label: 'Activas' },
      { value: 'false', label: 'Inactivas' },
    ],
  },
];

/**
 * Iconos por tipo de promoción
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
 * Color y label según estado/vigencia
 */
const getEstadoInfo = (promocion) => {
  if (!promocion.activo) {
    return {
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      label: 'Inactiva',
    };
  }
  const hoy = new Date();
  const inicio = new Date(promocion.fecha_inicio);
  const fin = promocion.fecha_fin ? new Date(promocion.fecha_fin) : null;

  if (hoy < inicio) {
    return {
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      label: 'Programada',
    };
  }
  if (fin && hoy > fin) {
    return {
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      label: 'Expirada',
    };
  }
  return {
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    label: 'Activa',
  };
};

/**
 * Página de administración de Promociones Automáticas
 * Refactorizado: usa POSPageLayout, DataTable y componentes extraídos
 */
export default function PromocionesPage() {
  const toast = useToast();
  const { sucursalActiva } = useSucursalStore();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filtros con useFilters
  const { filtros, filtrosQuery, setFiltro, limpiarFiltros, filtrosActivos } = useFilters(
    INITIAL_FILTERS,
    { moduloId: 'pos.promociones' }
  );

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
    stats: { isOpen: false, data: null },
  });

  // Query principal
  const { data, isLoading, error } = usePromociones({
    page,
    limit,
    busqueda: filtrosQuery.busqueda || undefined,
    tipo: filtrosQuery.tipo || undefined,
    activo: filtrosQuery.activo === 'true' ? true : filtrosQuery.activo === 'false' ? false : undefined,
    sucursalId: sucursalActiva?.id,
  });

  const promociones = data?.promociones || [];
  const paginacion = {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    ...data?.paginacion,
  };

  // Mutations
  const eliminarMutation = useEliminarPromocion();
  const cambiarEstadoMutation = useCambiarEstadoPromocion();
  const duplicarMutation = useDuplicarPromocion();

  // Handlers
  const handleNuevo = () => openModal('form', null);
  const handleEditar = (promocion) => openModal('form', promocion);
  const handleEliminar = (promocion) => openModal('delete', promocion);
  const handleVerEstadisticas = (promocion) => openModal('stats', promocion);

  const handleDuplicar = async (promocionId) => {
    try {
      await duplicarMutation.mutateAsync(promocionId);
      toast.success('Promoción duplicada');
    } catch (error) {
      toast.error(error.message || 'Error al duplicar');
    }
  };

  const handleToggleEstado = async (promocion) => {
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: promocion.id,
        activo: !promocion.activo,
      });
      toast.success(promocion.activo ? 'Promoción desactivada' : 'Promoción activada');
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  const confirmarEliminar = async () => {
    const promocionToDelete = getModalData('delete');
    try {
      await eliminarMutation.mutateAsync(promocionToDelete.id);
      toast.success('Promoción eliminada');
      closeModal('delete');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error al eliminar');
    }
  };

  // Columnas de la tabla
  const columns = useMemo(
    () => [
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
        header: 'Promoción',
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
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
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
      {
        key: 'actions',
        header: '',
        align: 'right',
        render: (row) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleEstado(row);
              }}
              className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                handleVerEstadisticas(row);
              }}
              className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Ver estadísticas"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicar(row.id);
              }}
              className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Duplicar"
            >
              <Copy className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditar(row);
              }}
              className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEliminar(row);
              }}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <POSPageLayout
      icon={Sparkles}
      title="Promociones"
      subtitle={`${paginacion.total} promociones`}
      actions={
        <Button onClick={handleNuevo} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Promoción</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      }
    >
      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={filtros.busqueda}
              onChange={(value) => {
                setFiltro('busqueda', value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o código..."
              icon={Search}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filtros.tipo}
              onChange={(e) => {
                setFiltro('tipo', e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              {FILTER_CONFIG[0].options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={filtros.activo}
              onChange={(e) => {
                setFiltro('activo', e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              {FILTER_CONFIG[1].options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {filtrosActivos > 0 && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={promociones}
        isLoading={isLoading}
        keyField="id"
        onRowClick={handleEditar}
        pagination={paginacion}
        onPageChange={setPage}
        emptyState={{
          icon: Sparkles,
          title: 'No hay promociones',
          description:
            filtros.busqueda || filtros.tipo || filtros.activo
              ? 'No se encontraron promociones con esos filtros'
              : 'Crea tu primera promoción automática',
          actionLabel: !filtros.busqueda && !filtros.tipo && !filtros.activo ? 'Nueva Promoción' : undefined,
          onAction: !filtros.busqueda && !filtros.tipo && !filtros.activo ? handleNuevo : undefined,
        }}
      />

      {/* Drawer de crear/editar */}
      {isOpen('form') && (
        <PromocionFormDrawer
          key={`form-${getModalData('form')?.id || 'new'}`}
          isOpen={isOpen('form')}
          onClose={() => closeModal('form')}
          promocion={getModalData('form')}
          onSuccess={() => closeModal('form')}
        />
      )}

      {/* Modal de estadísticas */}
      <PromocionStatsModal
        isOpen={isOpen('stats')}
        onClose={() => closeModal('stats')}
        promocion={getModalData('stats')}
      />

      {/* Confirmación de eliminar */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmarEliminar}
        title="Eliminar promoción"
        message={`¿Estás seguro de eliminar la promoción "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </POSPageLayout>
  );
}
