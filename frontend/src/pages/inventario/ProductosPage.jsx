/**
 * ====================================================================
 * PRODUCTOS PAGE
 * ====================================================================
 *
 * Migrado a ListadoCRUDPage - Ene 2026
 * Reducción: 529 → ~310 LOC (-41%)
 * ====================================================================
 */

import { useState, useMemo, useCallback } from 'react';
import { Package, Plus, Upload, ScanLine, Search, FileSpreadsheet, TrendingDown, AlertTriangle, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import {
  AdvancedFilterPanel,
  Button,
  FilterChip,
  ListadoCRUDPage,
  SavedSearchModal,
  BarcodeScanner,
  ToggleSwitch,
} from '@/components/ui';
import { useToast, useFilters, useSavedFilters, useExportCSV } from '@/hooks/utils';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import { useProductos, useEliminarProducto, useCategorias, useProveedores, useProductosStockFiltrado } from '@/hooks/inventario';
import ProductoFormDrawer from '@/components/inventario/ProductoFormDrawer';
import BulkProductosModal from '@/components/inventario/BulkProductosModal';
import AjustarStockModal from '@/components/inventario/AjustarStockModal';
import GenerarEtiquetaModal from '@/components/inventario/GenerarEtiquetaModal';
import {
  ProductoRowActions,
  createProductosColumns,
  createFilterConfig,
  PRODUCTOS_INITIAL_FILTERS,
  PRODUCTOS_CSV_COLUMNS,
  mapProductoToCSV,
  getStockLabel,
} from './components';

/**
 * Mapper para transformar data del template a props del FormDrawer
 */
const mapFormData = (data) => ({
  producto: data,
  mode: data ? 'edit' : 'create',
});

/**
 * Página principal de Gestión de Productos
 */
function ProductosPage() {
  const { success: showSuccess } = useToast();
  const { exportCSV } = useExportCSV();
  const [showScanner, setShowScanner] = useState(false);

  // Filtros con persistencia
  const {
    filtros,
    filtrosQuery,
    filtrosActivos,
    filtrosActivosArray,
    setFiltro,
    setFiltros,
    limpiarFiltros,
    aplicarBusqueda,
  } = useFilters(PRODUCTOS_INITIAL_FILTERS, { moduloId: 'inventario.productos' });

  // Búsquedas guardadas
  const {
    busquedas,
    guardarBusqueda,
    eliminarBusqueda,
    toggleDefault,
    existeNombre,
  } = useSavedFilters('inventario.productos');

  // Datos auxiliares para columnas y filtros
  const { data: categoriasData } = useCategorias({ activo: true });
  const categorias = categoriasData?.categorias || [];

  const { data: proveedoresData } = useProveedores({ activo: true });
  const proveedores = proveedoresData?.proveedores || [];

  // Columnas memoizadas - incluye flag de ver_mi_ubicacion
  const columns = useMemo(
    () => createProductosColumns({
      categorias,
      proveedores,
      verMiUbicacion: filtros.ver_mi_ubicacion,
    }),
    [categorias, proveedores, filtros.ver_mi_ubicacion]
  );

  // Configuración de filtros memoizada
  const filterConfig = useMemo(
    () => createFilterConfig({ categorias, proveedores }),
    [categorias, proveedores]
  );

  // Handler de escaneo
  const handleScan = useCallback((code) => {
    setShowScanner(false);
    setFiltro('busqueda', code);
    showSuccess(`Buscando: ${code}`);
  }, [setFiltro, showSuccess]);

  // Handler para guardar búsqueda
  const handleGuardarBusqueda = useCallback((nombre, esDefault) => {
    guardarBusqueda(nombre, filtros, esDefault);
    showSuccess('Búsqueda guardada correctamente');
  }, [guardarBusqueda, filtros, showSuccess]);

  // Exportar CSV
  const handleExportarCSV = useCallback((productos) => {
    if (!productos || productos.length === 0) return;
    const datosExportar = productos.map(mapProductoToCSV);
    exportCSV(datosExportar, PRODUCTOS_CSV_COLUMNS, `productos_${format(new Date(), 'yyyyMMdd')}`);
  }, [exportCSV]);

  // Labels para chips de filtros
  const getFilterLabel = useCallback((key, value) => {
    if (key === 'categoria_id') {
      return { label: 'Categoría', value: categorias.find(c => c.id === value)?.nombre || value };
    }
    if (key === 'proveedor_id') {
      return { label: 'Proveedor', value: proveedores.find(p => p.id === value)?.nombre || value };
    }
    if (key === 'stock_bajo') return { label: 'Stock bajo', value: '' };
    if (key === 'stock_agotado') return { label: 'Agotados', value: '' };
    if (key === 'ver_mi_ubicacion') return { label: 'Mi ubicación', value: '' };
    if (key === 'busqueda') return { label: 'Búsqueda', value };
    return { label: key, value: String(value) };
  }, [categorias, proveedores]);

  // Hook para obtener productos con stock filtrado por ubicación
  // Solo se usa cuando ver_mi_ubicacion está activo
  const useProductosConUbicacion = (params) => {
    const normalQuery = useProductos({ ...params, ...filtrosQuery });
    const filtradoQuery = useProductosStockFiltrado({
      ...params,
      ...filtrosQuery,
      usuario_ubicacion: true, // Filtrar por ubicación del usuario actual
    });

    // Retornar query filtrado si está activo el toggle, sino el normal
    return filtros.ver_mi_ubicacion ? filtradoQuery : normalQuery;
  };

  return (
    <ListadoCRUDPage
      // Layout
      title="Productos"
      icon={Package}
      PageLayout={InventarioPageLayout}

      // Data - usa query filtrado por ubicación si está activo el toggle
      useListQuery={useProductosConUbicacion}
      dataKey="productos"

      // Mutations
      useDeleteMutation={useEliminarProducto}
      deleteMutationOptions={{
        entityName: 'producto',
        getName: (p) => p.nombre,
        confirmMessage: '¿Estás seguro de que deseas eliminar el producto "{name}"? Esta acción marcará el producto como inactivo. Podrás reactivarlo después si lo necesitas.',
      }}

      // Table
      columns={columns}
      rowActions={(row, handlers) => (
        <ProductoRowActions row={row} {...handlers} />
      )}
      emptyState={{
        icon: Package,
        title: 'No se encontraron productos',
        description: 'Crea tu primer producto para comenzar a gestionar el inventario',
        actionLabel: 'Crear Primer Producto',
      }}

      // Filters (custom via renderFilters)
      initialFilters={PRODUCTOS_INITIAL_FILTERS}
      filterPersistId="inventario.productos"
      limit={20}

      // Modals
      FormDrawer={ProductoFormDrawer}
      mapFormData={mapFormData}

      // Extra Modals
      extraModals={{
        bulk: { component: BulkProductosModal },
        ajustarStock: {
          component: AjustarStockModal,
          mapData: (data) => ({ producto: data }),
        },
        etiqueta: {
          component: GenerarEtiquetaModal,
          mapData: (data) => ({ producto: data }),
        },
        saveSearch: {
          component: SavedSearchModal,
          props: {
            filtrosActuales: filtros,
            onSave: handleGuardarBusqueda,
            existeNombre,
          },
        },
      }}

      // Actions (custom header buttons)
      actions={({ openModal, items }) => (
        <>
          <Button
            variant="secondary"
            onClick={() => handleExportarCSV(items)}
            disabled={!items || items.length === 0}
            icon={FileSpreadsheet}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => openModal('bulk')}
            icon={Upload}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">Carga Masiva</span>
            <span className="sm:hidden">Carga</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => openModal('form', null)}
            icon={Plus}
            className="flex-1 sm:flex-none text-sm"
          >
            <span className="hidden sm:inline">Nuevo Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </>
      )}
      showNewButton={false}

      // Custom filters rendering
      renderFilters={({ resetPage }) => (
        <>
          {/* Toggle de filtro por ubicación */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className={`h-5 w-5 ${filtros.ver_mi_ubicacion ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Ver stock de mi ubicación
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Filtra el stock según tu ubicación asignada
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={filtros.ver_mi_ubicacion}
              onChange={(checked) => {
                setFiltro('ver_mi_ubicacion', checked);
                resetPage();
              }}
              size="md"
            />
          </div>

          {/* Panel de Filtros Avanzados */}
          <AdvancedFilterPanel
            filtros={filtros}
            onFiltrosChange={setFiltros}
            onLimpiarFiltros={limpiarFiltros}
            filterConfig={filterConfig}
            moduloId="inventario.productos"
            busquedasGuardadas={busquedas}
            onAplicarBusqueda={aplicarBusqueda}
            onEliminarBusqueda={eliminarBusqueda}
            onToggleDefault={toggleDefault}
            onGuardarBusqueda={() => {}}
            filtrosActivos={filtrosActivos}
            className="mb-4"
            searchBar={
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre, SKU o código..."
                    value={filtros.busqueda}
                    onChange={(e) => {
                      setFiltro('busqueda', e.target.value);
                      resetPage();
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex-shrink-0 p-2.5 border-2 border-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors bg-white dark:bg-gray-700"
                  title="Escanear código de barras"
                  aria-label="Escanear código de barras"
                >
                  <ScanLine className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </button>
              </div>
            }
          />

          {/* Chips de filtros activos */}
          {filtrosActivosArray.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filtrosActivosArray.map(({ key, value }) => {
                const { label, value: displayValue } = getFilterLabel(key, value);
                return (
                  <FilterChip
                    key={key}
                    label={label}
                    value={displayValue || undefined}
                    onRemove={() => setFiltro(key, key.includes('stock') ? false : '')}
                  />
                );
              })}
            </div>
          )}

          {/* Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="w-full max-w-lg">
                <BarcodeScanner
                  onScan={handleScan}
                  onClose={() => setShowScanner(false)}
                  title="Buscar Producto"
                  subtitle="Escanea el código de barras del producto"
                  formats="PRODUCTOS"
                />
              </div>
            </div>
          )}
        </>
      )}
    />
  );
}

export default ProductosPage;
