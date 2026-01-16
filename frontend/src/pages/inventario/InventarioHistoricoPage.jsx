import { useState, useMemo } from 'react';
import { Calendar, RefreshCw, Clock, Package, TrendingUp, TrendingDown, Minus, AlertCircle, Download, Filter, X } from 'lucide-react';
import { Button, EmptyState, Select } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import InventarioPageLayout from '@/components/inventario/InventarioPageLayout';
import { useInventoryAtDate, useFechasDisponibles, useGenerarSnapshot, useCompararInventario } from '@/hooks/useInventoryAtDate';
import { useCategorias } from '@/hooks/useCategorias';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Página de Inventario Histórico - Consulta de snapshots
 */
function InventarioHistoricoPage() {
  const { showToast } = useToast();

  // Estado
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [fechaComparar, setFechaComparar] = useState('');
  const [modoComparacion, setModoComparacion] = useState(false);
  const [filtros, setFiltros] = useState({
    categoria_id: '',
    solo_con_stock: false,
  });

  // Queries
  const { data: fechasData, isLoading: cargandoFechas } = useFechasDisponibles();
  const fechasDisponibles = fechasData || [];

  const { data: categoriasData } = useCategorias({ activo: true });
  const categorias = categoriasData?.categorias || [];

  const { data: inventarioData, isLoading: cargandoInventario, error: errorInventario } = useInventoryAtDate(
    fechaSeleccionada,
    {
      categoria_id: filtros.categoria_id || undefined,
      solo_con_stock: filtros.solo_con_stock,
    },
    { enabled: !!fechaSeleccionada }
  );

  const { data: comparacionData, isLoading: cargandoComparacion } = useCompararInventario(
    fechaSeleccionada,
    fechaComparar,
    true,
    { enabled: modoComparacion && !!fechaSeleccionada && !!fechaComparar }
  );

  const { mutate: generarSnapshot, isPending: generandoSnapshot } = useGenerarSnapshot();

  // Datos procesados
  const productos = inventarioData?.productos || [];
  const totales = inventarioData?.totales || {};
  const comparacion = comparacionData?.productos || [];

  // Estadísticas
  const stats = useMemo(() => {
    if (!productos.length) return null;

    const conCambios = productos.filter(p => p.diferencia !== 0);
    const aumentaron = productos.filter(p => p.diferencia > 0);
    const disminuyeron = productos.filter(p => p.diferencia < 0);

    return {
      total: productos.length,
      conCambios: conCambios.length,
      aumentaron: aumentaron.length,
      disminuyeron: disminuyeron.length,
      sinCambios: productos.length - conCambios.length,
    };
  }, [productos]);

  // Handlers
  const handleFechaChange = (fecha) => {
    setFechaSeleccionada(fecha);
    setModoComparacion(false);
    setFechaComparar('');
  };

  const handleGenerarSnapshot = () => {
    generarSnapshot(
      { descripcion: 'Snapshot manual desde UI' },
      {
        onSuccess: (data) => {
          showToast('success', `Snapshot generado: ${data.total_productos} productos, ${data.total_unidades} unidades`);
        },
        onError: (error) => {
          showToast('error', error.message || 'Error al generar snapshot');
        },
      }
    );
  };

  const handleLimpiarFiltros = () => {
    setFiltros({ categoria_id: '', solo_con_stock: false });
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      return format(parseISO(fecha), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return fecha;
    }
  };

  const getDiferenciaColor = (diferencia) => {
    if (diferencia > 0) return 'text-green-600 dark:text-green-400';
    if (diferencia < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-400 dark:text-gray-500';
  };

  const getDiferenciaIcon = (diferencia) => {
    if (diferencia > 0) return TrendingUp;
    if (diferencia < 0) return TrendingDown;
    return Minus;
  };

  return (
    <InventarioPageLayout
      icon={Clock}
      title="Inventario Histórico"
      subtitle="Consulta el estado del inventario en fechas pasadas"
      actions={
        <Button
          onClick={handleGenerarSnapshot}
          loading={generandoSnapshot}
          icon={RefreshCw}
        >
          Generar Snapshot
        </Button>
      }
    >
      <div className="space-y-6">

        {/* Selector de Fecha y Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha del Snapshot
              </label>
              {cargandoFechas ? (
                <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : fechasDisponibles.length === 0 ? (
                <div className="text-sm text-amber-600 dark:text-amber-400 py-2">
                  <AlertCircle className="inline h-4 w-4 mr-1" />
                  No hay snapshots disponibles
                </div>
              ) : (
                <Select
                  value={fechaSeleccionada}
                  onChange={(e) => handleFechaChange(e.target.value)}
                >
                  <option value="">Seleccionar fecha...</option>
                  {fechasDisponibles.map((fecha) => (
                    <option key={fecha} value={fecha.split('T')[0]}>
                      {formatFecha(fecha)}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Filter className="inline h-4 w-4 mr-1" />
                Categoría
              </label>
              <Select
                value={filtros.categoria_id}
                onChange={(e) => setFiltros(prev => ({ ...prev, categoria_id: e.target.value }))}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </Select>
            </div>

            {/* Solo con stock */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.solo_con_stock}
                  onChange={(e) => setFiltros(prev => ({ ...prev, solo_con_stock: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Solo con stock</span>
              </label>
            </div>

            {/* Limpiar */}
            <div className="flex items-end">
              <Button variant="secondary" onClick={handleLimpiarFiltros} icon={X} className="w-full">
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Error */}
        {errorInventario && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{errorInventario.message || 'Error al cargar el inventario'}</span>
            </div>
          </div>
        )}

        {/* Resumen / Stats */}
        {fechaSeleccionada && totales && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Productos</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totales.total_productos || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Unidades</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {Number(totales.total_unidades || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Valor Total</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${Number(totales.valor_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </div>
            {stats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Cambios vs Hoy</div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 dark:text-green-400">+{stats.aumentaron}</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-red-600 dark:text-red-400">-{stats.disminuyeron}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabla de Productos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {!fechaSeleccionada ? (
            <EmptyState
              icon={Calendar}
              title="Selecciona una fecha"
              description="Elige una fecha para ver el estado del inventario en ese momento"
              size="sm"
              className="border-0 shadow-none"
            />
          ) : cargandoInventario ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando inventario...</span>
            </div>
          ) : productos.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Sin productos"
              description="No hay productos registrados en el snapshot de esta fecha"
              size="sm"
              className="border-0 shadow-none"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock ({formatFecha(fechaSeleccionada).split(',')[0]})
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reservas
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock Hoy
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Diferencia
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Costo Unit.
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {productos.map((producto, index) => {
                    const DiferenciaIcon = getDiferenciaIcon(producto.diferencia);
                    return (
                      <tr key={`${producto.producto_id}-${producto.variante_id || 0}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {/* Producto */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {producto.producto_nombre}
                          </div>
                          {producto.variante_nombre && (
                            <div className="text-xs text-primary-600 dark:text-primary-400">
                              {producto.variante_nombre}
                            </div>
                          )}
                          {producto.producto_sku && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {producto.producto_sku}
                            </div>
                          )}
                        </td>

                        {/* Categoría */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {producto.categoria_nombre || '-'}
                          </span>
                        </td>

                        {/* Stock en Fecha */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {producto.stock_snapshot}
                          </span>
                          {producto.stock_disponible !== producto.stock_snapshot && (
                            <div className="text-xs text-gray-500">
                              Disp: {producto.stock_disponible}
                            </div>
                          )}
                        </td>

                        {/* Reservas */}
                        <td className="px-6 py-4 text-center">
                          {producto.reservas_activas > 0 ? (
                            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                              {producto.reservas_activas}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>

                        {/* Stock Hoy */}
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {producto.stock_actual_hoy}
                          </span>
                        </td>

                        {/* Diferencia */}
                        <td className="px-6 py-4 text-center">
                          <div className={`flex items-center justify-center space-x-1 ${getDiferenciaColor(producto.diferencia)}`}>
                            <DiferenciaIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {producto.diferencia > 0 ? '+' : ''}{producto.diferencia}
                            </span>
                          </div>
                        </td>

                        {/* Costo Unitario */}
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            ${Number(producto.costo_unitario || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </InventarioPageLayout>
  );
}

export default InventarioHistoricoPage;
