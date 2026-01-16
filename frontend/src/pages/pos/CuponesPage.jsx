import { useState, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Hash,
  Search
} from 'lucide-react';

import POSPageLayout from '@/components/pos/POSPageLayout';
import Button from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import CuponFormDrawer from '@/components/pos/CuponFormDrawer';
import CuponStatsModal from '@/components/pos/CuponStatsModal';
import { useToast } from '@/hooks/useToast';
import { useModalManager } from '@/hooks/useModalManager';
import { useFilters } from '@/hooks/useFilters';
import {
  useCupones,
  useEliminarCupon,
  useCambiarEstadoCupon
} from '@/hooks/useCupones';

// Tipos de descuento disponibles
const TIPOS_DESCUENTO = {
  porcentaje: { label: 'Porcentaje', icon: Percent },
  monto_fijo: { label: 'Monto fijo', icon: DollarSign }
};

// Filtros iniciales
const INITIAL_FILTERS = {
  busqueda: '',
  activo: '',
};

// Configuración de filtros
const FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
];

/**
 * Obtiene el icono por tipo de descuento
 */
const getTipoIcon = (tipo) => {
  const Icon = TIPOS_DESCUENTO[tipo]?.icon || Ticket;
  return <Icon className="h-4 w-4" />;
};

/**
 * Color y label según estado/vigencia
 */
const getEstadoInfo = (cupon) => {
  if (!cupon.activo) {
    return {
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      label: 'Inactivo',
    };
  }
  const hoy = new Date();
  const inicio = cupon.fecha_inicio ? new Date(cupon.fecha_inicio) : null;
  const fin = cupon.fecha_fin ? new Date(cupon.fecha_fin) : null;

  if (inicio && hoy < inicio) {
    return {
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      label: 'Programado',
    };
  }
  if (fin && hoy > fin) {
    return {
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      label: 'Expirado',
    };
  }
  return {
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    label: 'Activo',
  };
};

/**
 * Formatear valor de descuento
 */
const formatDescuento = (cupon) => {
  if (cupon.tipo_descuento === 'porcentaje') {
    return `${cupon.valor}%`;
  }
  return `$${cupon.valor}`;
};

/**
 * Página de administración de Cupones de Descuento
 * Refactorizado: usa POSPageLayout, DataTable y componentes extraídos
 */
export default function CuponesPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filtros con useFilters
  const { filtros, filtrosQuery, setFiltro, limpiarFiltros, filtrosActivos } = useFilters(
    INITIAL_FILTERS,
    { moduloId: 'pos.cupones' }
  );

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
    stats: { isOpen: false, data: null },
  });

  // Query principal
  const { data, isLoading } = useCupones({
    page,
    limit,
    busqueda: filtrosQuery.busqueda || undefined,
    activo: filtrosQuery.activo || undefined,
  });

  const cupones = data?.cupones || [];
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
  const eliminarMutation = useEliminarCupon();
  const cambiarEstadoMutation = useCambiarEstadoCupon();

  // Handlers
  const handleNuevo = () => openModal('form', null);
  const handleEditar = (cupon) => openModal('form', cupon);
  const handleEliminar = (cupon) => openModal('delete', cupon);
  const handleVerEstadisticas = (cupon) => openModal('stats', cupon);

  const handleToggleEstado = async (cupon) => {
    try {
      await cambiarEstadoMutation.mutateAsync({
        id: cupon.id,
        activo: !cupon.activo,
      });
      toast.success(cupon.activo ? 'Cupón desactivado' : 'Cupón activado');
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  const confirmarEliminar = async () => {
    const cuponToDelete = getModalData('delete');
    try {
      await eliminarMutation.mutateAsync(cuponToDelete.id);
      toast.success('Cupón eliminado');
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
        header: 'Cupón',
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
            <span className="text-sm text-gray-400">Sin límite</span>
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
      icon={Ticket}
      title="Cupones de Descuento"
      subtitle={`${paginacion.total} cupones`}
      actions={
        <Button onClick={handleNuevo} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Cupón</span>
          <span className="sm:hidden">Nuevo</span>
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
              value={filtros.activo}
              onChange={(e) => {
                setFiltro('activo', e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              {FILTER_OPTIONS.map((opt) => (
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
        data={cupones}
        isLoading={isLoading}
        keyField="id"
        onRowClick={handleEditar}
        pagination={paginacion}
        onPageChange={setPage}
        emptyState={{
          icon: Ticket,
          title: 'No hay cupones',
          description:
            filtros.busqueda || filtros.activo
              ? 'No se encontraron cupones con esos filtros'
              : 'Crea tu primer cupón de descuento',
          actionLabel: !filtros.busqueda && !filtros.activo ? 'Nuevo Cupón' : undefined,
          onAction: !filtros.busqueda && !filtros.activo ? handleNuevo : undefined,
        }}
      />

      {/* Drawer de crear/editar */}
      {isOpen('form') && (
        <CuponFormDrawer
          key={`form-${getModalData('form')?.id || 'new'}`}
          isOpen={isOpen('form')}
          onClose={() => closeModal('form')}
          cupon={getModalData('form')}
          onSuccess={() => closeModal('form')}
        />
      )}

      {/* Modal de estadísticas */}
      <CuponStatsModal
        isOpen={isOpen('stats')}
        onClose={() => closeModal('stats')}
        cupon={getModalData('stats')}
      />

      {/* Confirmación de eliminar */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmarEliminar}
        title="Eliminar cupón"
        message={`¿Estás seguro de eliminar el cupón "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </POSPageLayout>
  );
}
