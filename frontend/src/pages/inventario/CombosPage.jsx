import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  Layers,
  Box
} from 'lucide-react';

import {
  Button,
  ConfirmDialog,
  EmptyState,
  Pagination
} from '@/components/ui';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import ComboFormDrawer from '@/components/inventario/ComboFormDrawer';
import { useCrudHandlers } from '@/hooks/useCrudHandlers';
import { useCombos, useEliminarCombo } from '@/hooks/useCombosModificadores';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';

// Etiquetas para tipos de precio
const TIPO_PRECIO_LABELS = {
  fijo: { label: 'Precio fijo', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  suma_componentes: { label: 'Suma', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' },
  descuento_porcentaje: { label: 'Descuento', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

// Etiquetas para manejo de stock
const MANEJO_STOCK_LABELS = {
  descontar_componentes: 'Descuenta componentes',
  descontar_combo: 'Descuenta combo',
};

export default function CombosPage() {
  const sucursalActiva = useSucursalStore(selectSucursalActiva);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;

  // Mutations
  const eliminarMutation = useEliminarCombo();

  // CRUD handlers centralizados
  const {
    isOpen,
    handleNuevo,
    handleEditar,
    handleEliminar,
    confirmarEliminar,
    drawerKey,
    handleDrawerSuccess,
    closeModal,
    formData,
    deleteData,
    isDeleting,
  } = useCrudHandlers({
    deleteMutation: eliminarMutation,
    getDeleteId: (combo) => ({
      productoId: combo.producto_id,
      sucursalId: sucursalActiva?.id,
    }),
    entityName: 'combo',
  });

  // Query
  const { data, isLoading, error } = useCombos({
    page,
    limit,
    busqueda: searchTerm || undefined,
  });

  // La API devuelve data como array directamente (via select en el hook)
  const combos = Array.isArray(data) ? data : (data?.combos || data || []);
  const paginacion = { total: combos.length, totalPages: 1 };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <InventarioPageLayout>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Combos / Kits
                  </h1>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Productos compuestos por múltiples componentes
                </p>
              </div>
            </div>
            <Button onClick={handleNuevo}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Combo
            </Button>
          </div>

          {/* Buscador */}
          <div className="mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Buscar por nombre o SKU..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Error al cargar combos: {error.message}
          </div>
        ) : combos.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={searchTerm ? 'Sin resultados' : 'Sin combos'}
            description={
              searchTerm
                ? `No se encontraron combos para "${searchTerm}"`
                : 'Crea combos para vender paquetes de productos con descuento'
            }
            actionLabel={!searchTerm ? 'Crear primer combo' : undefined}
            onAction={!searchTerm ? handleNuevo : undefined}
          />
        ) : (
          <>
            {/* Info */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {paginacion.total} combo{paginacion.total !== 1 ? 's' : ''} encontrado{paginacion.total !== 1 ? 's' : ''}
            </p>

            {/* Lista de combos */}
            <div className="space-y-3">
              {combos.map((combo) => {
                const tipoPrecioInfo = TIPO_PRECIO_LABELS[combo.tipo_precio] || TIPO_PRECIO_LABELS.fijo;
                return (
                  <div
                    key={combo.producto_id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icono */}
                      <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Layers className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {combo.producto_nombre}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${tipoPrecioInfo.color}`}>
                            {tipoPrecioInfo.label}
                            {combo.tipo_precio === 'descuento_porcentaje' && ` ${combo.descuento_porcentaje}%`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          SKU: {combo.producto_sku || 'N/A'}
                        </p>

                        {/* Componentes */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(combo.componentes || []).slice(0, 5).map((comp, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                            >
                              <Box className="h-3 w-3" />
                              {comp.cantidad}x {comp.nombre || comp.producto_nombre}
                            </span>
                          ))}
                          {(combo.componentes || []).length > 5 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                              +{combo.componentes.length - 5} más
                            </span>
                          )}
                        </div>

                        {/* Meta info */}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {MANEJO_STOCK_LABELS[combo.manejo_stock] || combo.manejo_stock}
                        </p>
                      </div>

                      {/* Precio */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          ${parseFloat(combo.precio_calculado || combo.producto_precio || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {combo.total_componentes || combo.componentes?.length || 0} componentes
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditar(combo)}
                          className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(combo)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {paginacion.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  pagination={{
                    page,
                    limit,
                    total: paginacion.total,
                    totalPages: paginacion.totalPages
                  }}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawer */}
      <ComboFormDrawer
        key={drawerKey}
        isOpen={isOpen('form')}
        onClose={() => closeModal('form')}
        combo={formData}
        onSuccess={handleDrawerSuccess}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmarEliminar}
        title="Eliminar combo"
        message={`¿Eliminar el combo "${deleteData?.producto_nombre}"? El producto seguirá existiendo pero ya no será un combo.`}
        confirmText="Eliminar"
        variant="danger"
        isLoading={isDeleting}
      />
    </InventarioPageLayout>
  );
}
