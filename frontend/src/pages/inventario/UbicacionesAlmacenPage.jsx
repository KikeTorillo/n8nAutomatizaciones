import { useState, useMemo, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Package,
  ArrowRightLeft,
  BarChart3,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useModalManager } from '@/hooks/useModalManager';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { TreeView, useTreeExpansion } from '@/components/ui/TreeNode';
import { useToast } from '@/hooks/useToast';
import useSucursalStore from '@/store/sucursalStore';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import {
  useArbolUbicaciones,
  useEstadisticasUbicaciones,
  useStockUbicacion,
  useEliminarUbicacion,
  useToggleBloqueoUbicacion,
} from '@/hooks/useInventario';
import UbicacionFormDrawer from '@/components/inventario/ubicaciones/UbicacionFormDrawer';
import MoverStockDrawer from '@/components/inventario/ubicaciones/MoverStockDrawer';

// Tipos de ubicación con íconos y colores
const TIPOS_UBICACION = {
  zona: { label: 'Zona', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  pasillo: { label: 'Pasillo', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  estante: { label: 'Estante', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  bin: { label: 'Bin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

/**
 * Card de Estadísticas
 */
function EstadisticaCard({ label, value, icon: Icon, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Modal para ver stock de una ubicación
 */
function StockUbicacionModal({ ubicacion, isOpen, onClose }) {
  const { data: stockData, isLoading } = useStockUbicacion(ubicacion?.id);
  const stock = stockData || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stock en ${ubicacion?.codigo || ''}`}
      size="lg"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : stock.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin productos"
            description="No hay productos en esta ubicación"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Lote
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stock.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {item.producto_nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-right font-medium">
                      {item.cantidad}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {item.lote || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Página principal de Gestión de Ubicaciones de Almacén
 */
function UbicacionesAlmacenPage() {
  const { success: showSuccess, error: showError } = useToast();
  const { getSucursalId } = useSucursalStore();
  const sucursalId = getSucursalId();

  // Estado de modales unificado
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    form: { isOpen: false, data: null },      // data: { ubicacion, parent }
    eliminar: { isOpen: false, data: null },
    stock: { isOpen: false, data: null },
    moverStock: { isOpen: false, data: null },
  });
  const [drawerKey, setDrawerKey] = useState(0); // Key para forzar remount de Vaul

  // Estado UI
  const { expanded, toggle, expandAll, collapseAll } = useTreeExpansion();
  const [busqueda, setBusqueda] = useState('');

  // Queries
  const { data: arbolData, isLoading: cargandoArbol, refetch } = useArbolUbicaciones(sucursalId);
  const arbol = arbolData || [];
  const { data: estadisticas, isLoading: cargandoStats } = useEstadisticasUbicaciones(sucursalId);

  // Mutations
  const eliminarMutation = useEliminarUbicacion();
  const toggleBloqueoMutation = useToggleBloqueoUbicacion();

  // Handlers
  const handleNuevaUbicacion = () => {
    openModal('form', { ubicacion: null, parent: null });
  };

  const handleCrearHijo = (parent) => {
    openModal('form', { ubicacion: null, parent });
  };

  const handleEditarUbicacion = (ubicacion) => {
    openModal('form', { ubicacion, parent: null });
  };

  const handleAbrirModalEliminar = (ubicacion) => {
    openModal('eliminar', ubicacion);
  };

  const handleEliminar = () => {
    const ubicacionEliminar = getModalData('eliminar');
    eliminarMutation.mutate(ubicacionEliminar.id, {
      onSuccess: () => {
        showSuccess('Ubicación eliminada correctamente');
        closeModal('eliminar');
      },
      onError: (err) => {
        showError(err.response?.data?.message || 'Error al eliminar ubicación');
      },
    });
  };

  const handleToggleBloqueo = (ubicacion) => {
    toggleBloqueoMutation.mutate(
      {
        id: ubicacion.id,
        bloqueada: !ubicacion.bloqueada,
        motivo_bloqueo: !ubicacion.bloqueada ? 'Bloqueado manualmente' : null,
      },
      {
        onSuccess: () => {
          showSuccess(ubicacion.bloqueada ? 'Ubicación desbloqueada' : 'Ubicación bloqueada');
        },
        onError: (err) => {
          showError(err.response?.data?.message || 'Error al cambiar estado');
        },
      }
    );
  };

  const handleVerStock = (ubicacion) => {
    openModal('stock', ubicacion);
  };

  const handleMoverStock = () => {
    openModal('moverStock', null);
  };

  const handleExpandirTodas = () => {
    expandAll(arbol, 'children');
  };

  const handleContraerTodas = () => {
    collapseAll();
  };

  // Render callbacks para TreeView
  const getNodeClassName = useCallback((ubicacion) => (
    ubicacion.bloqueada
      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
      : ''
  ), []);

  const renderUbicacionContent = useCallback((ubicacion, { hasChildren }) => {
    const tipoInfo = TIPOS_UBICACION[ubicacion.tipo] || { label: ubicacion.tipo, color: 'bg-gray-100 text-gray-700' };

    return (
      <>
        {/* Color/Icono */}
        {ubicacion.color ? (
          <div
            className="w-4 h-4 rounded flex-shrink-0"
            style={{ backgroundColor: ubicacion.color }}
          />
        ) : (
          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}

        {/* Info Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {ubicacion.codigo}
            </h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${tipoInfo.color}`}>
              {tipoInfo.label}
            </span>
            {ubicacion.bloqueada && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded flex items-center gap-1">
                <Lock className="h-3 w-3" /> Bloqueada
              </span>
            )}
            {ubicacion.es_picking && (
              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded">
                Picking
              </span>
            )}
            {ubicacion.es_recepcion && (
              <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 rounded">
                Recepción
              </span>
            )}
            {hasChildren && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded">
                {ubicacion.children.length} sub-ubicaciones
              </span>
            )}
          </div>
          {ubicacion.nombre && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">{ubicacion.nombre}</p>
          )}
        </div>

        {/* Capacidad */}
        {ubicacion.capacidad_maxima > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 hidden sm:block">
            <span className={ubicacion.capacidad_ocupada / ubicacion.capacidad_maxima > 0.9 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
              {ubicacion.capacidad_ocupada || 0}/{ubicacion.capacidad_maxima}
            </span>
          </div>
        )}
      </>
    );
  }, []);

  const renderUbicacionActions = useCallback((ubicacion) => (
    <>
      {ubicacion.tipo !== 'zona' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVerStock(ubicacion)}
          icon={Package}
          title="Ver Stock"
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleToggleBloqueo(ubicacion)}
        icon={ubicacion.bloqueada ? Unlock : Lock}
        title={ubicacion.bloqueada ? 'Desbloquear' : 'Bloquear'}
      />
      {ubicacion.tipo !== 'bin' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCrearHijo(ubicacion)}
          icon={Plus}
          title="Crear Sub-ubicación"
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEditarUbicacion(ubicacion)}
        icon={Edit}
        title="Editar"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAbrirModalEliminar(ubicacion)}
        icon={Trash2}
        title="Eliminar"
        className="text-red-600 hover:text-red-700 dark:text-red-400"
      />
    </>
  ), []);

  // Filtrar por búsqueda
  const arbolFiltrado = useMemo(() => {
    if (!busqueda.trim()) return arbol;

    const busquedaLower = busqueda.toLowerCase();
    const filtrarRecursivo = (ubicaciones) => {
      return ubicaciones
        .map((u) => {
          const coincide =
            u.codigo.toLowerCase().includes(busquedaLower) ||
            (u.nombre && u.nombre.toLowerCase().includes(busquedaLower));
          const hijosFiltrados = u.children ? filtrarRecursivo(u.children) : [];

          if (coincide || hijosFiltrados.length > 0) {
            return { ...u, children: hijosFiltrados };
          }
          return null;
        })
        .filter(Boolean);
    };

    return filtrarRecursivo(arbol);
  }, [arbol, busqueda]);

  // Contar totales
  const contarUbicaciones = (ubicaciones) => {
    let total = ubicaciones.length;
    ubicaciones.forEach((u) => {
      if (u.children) {
        total += contarUbicaciones(u.children);
      }
    });
    return total;
  };
  const totalUbicaciones = contarUbicaciones(arbol);

  if (!sucursalId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Sin sucursal asignada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Debes tener una sucursal asignada para ver las ubicaciones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InventarioPageLayout
      icon={MapPin}
      title="Ubicaciones de Almacén"
      subtitle={`${totalUbicaciones} ubicacion${totalUbicaciones !== 1 ? 'es' : ''} en total`}
      actions={
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={handleMoverStock}
            icon={ArrowRightLeft}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Mover Stock</span>
            <span className="sm:hidden">Mover</span>
          </Button>
          <Button
            variant="primary"
            onClick={handleNuevaUbicacion}
            icon={Plus}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Nueva Ubicación</span>
            <span className="sm:hidden">Nueva</span>
          </Button>
        </div>
      }
    >

        {/* Estadísticas */}
        {!cargandoStats && estadisticas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <EstadisticaCard
              label="Zonas"
              value={estadisticas.zonas || 0}
              icon={MapPin}
              color="blue"
            />
            <EstadisticaCard
              label="Activas"
              value={estadisticas.activas || 0}
              icon={Package}
              color="green"
            />
            <EstadisticaCard
              label="Bloqueadas"
              value={estadisticas.bloqueadas || 0}
              icon={Lock}
              color="red"
            />
            <EstadisticaCard
              label="% Ocupación"
              value={`${estadisticas.porcentaje_ocupacion || 0}%`}
              icon={BarChart3}
              color={estadisticas.porcentaje_ocupacion > 80 ? 'yellow' : 'primary'}
            />
          </div>
        )}

        {/* Controles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Botones */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetch()}
                icon={RefreshCw}
              >
                Actualizar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExpandirTodas}
              >
                Expandir
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleContraerTodas}
              >
                Contraer
              </Button>
            </div>
          </div>
        </div>

        {/* Árbol de Ubicaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <TreeView
            data={arbolFiltrado}
            childrenKey="children"
            expandedState={expanded}
            onToggleExpand={toggle}
            renderContent={renderUbicacionContent}
            renderActions={renderUbicacionActions}
            nodeClassName={getNodeClassName}
            isLoading={cargandoArbol}
            emptyState={
              <EmptyState
                icon={MapPin}
                title={busqueda ? 'Sin resultados' : 'No hay ubicaciones'}
                description={
                  busqueda
                    ? 'No se encontraron ubicaciones con ese criterio'
                    : 'Comienza creando tu primera zona de almacén'
                }
                action={
                  !busqueda && (
                    <Button variant="primary" onClick={handleNuevaUbicacion} icon={Plus}>
                      Nueva Ubicación
                    </Button>
                  )
                }
              />
            }
          />
        </div>

      {/* Drawer de Formulario */}
      <UbicacionFormDrawer
        key={drawerKey}
        isOpen={isOpen('form')}
        onClose={() => {
          closeModal('form');
          setDrawerKey(k => k + 1); // Forzar remount para evitar bug de Vaul
        }}
        ubicacion={getModalData('form')?.ubicacion}
        parent={getModalData('form')?.parent}
        sucursalId={sucursalId}
      />

      {/* Drawer de Mover Stock */}
      <MoverStockDrawer
        isOpen={isOpen('moverStock')}
        onClose={() => closeModal('moverStock')}
        sucursalId={sucursalId}
      />

      {/* Modal de Stock */}
      <StockUbicacionModal
        ubicacion={getModalData('stock')}
        isOpen={isOpen('stock')}
        onClose={() => closeModal('stock')}
      />

      {/* Modal de Eliminación */}
      <ConfirmDialog
        isOpen={isOpen('eliminar')}
        onClose={() => closeModal('eliminar')}
        onConfirm={handleEliminar}
        title="Eliminar Ubicación"
        message={`¿Estás seguro de que deseas eliminar la ubicación "${getModalData('eliminar')?.codigo}"? Solo se puede eliminar si no tiene stock ni sub-ubicaciones.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
        disabled={getModalData('eliminar')?.children?.length > 0}
        size="md"
      >
        {getModalData('eliminar')?.children?.length > 0 && (
          <Alert variant="warning" icon={Lock} title="Operación no permitida">
            <p className="text-sm">Esta ubicación tiene sub-ubicaciones. Debes eliminarlas primero.</p>
          </Alert>
        )}
      </ConfirmDialog>
    </InventarioPageLayout>
  );
}

export default UbicacionesAlmacenPage;
