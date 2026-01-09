import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertCircle, Download, Calculator, Settings, Layers, Package, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import StatCardGrid from '@/components/ui/StatCardGrid';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable, SkeletonCard } from '@/components/ui/SkeletonTable';
import InventarioNavTabs from '@/components/inventario/InventarioNavTabs';
import {
  useValorInventario,
  useAnalisisABC,
  useRotacionInventario,
  useResumenAlertas,
} from '@/hooks/useInventario';
import {
  useResumenValoracion,
  useConfiguracionValoracion,
  useActualizarConfiguracionValoracion,
  useComparativaValoracion,
  METODOS_VALORACION,
  DESCRIPCIONES_METODOS,
  formatearValor,
} from '@/hooks/useValoracion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Tabs de Reportes
 */
const TABS = [
  { id: 'valor', label: 'Valor de Inventario', icon: DollarSign },
  { id: 'valoracion', label: 'FIFO/AVCO', icon: Calculator },
  { id: 'abc', label: 'Análisis ABC', icon: BarChart3 },
  { id: 'rotacion', label: 'Rotación', icon: TrendingUp },
  { id: 'alertas', label: 'Resumen Alertas', icon: AlertCircle },
];

/**
 * Reporte: Valor de Inventario
 */
function ReporteValorInventario() {
  const { data, isLoading } = useValorInventario();
  const reporte = data || {};

  const handleExportar = () => {
    // TODO: Implementar exportación
    console.log('Exportando valor inventario...');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  // Calcular valores para mostrar
  const valorVenta = parseFloat(reporte.valor_venta) || 0;
  const valorCompra = parseFloat(reporte.valor_compra) || 0;
  const totalProductos = parseInt(reporte.total_productos) || 0;
  const totalUnidades = parseInt(reporte.total_unidades) || 0;
  const margenPotencial = parseFloat(reporte.margen_potencial) || 0;
  const porcentajeMargen = parseFloat(reporte.porcentaje_margen) || 0;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <StatCardGrid
        stats={[
          {
            icon: DollarSign,
            label: 'Valor Venta',
            value: `$${valorVenta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            color: 'primary',
            subtext: `Costo: $${valorCompra.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
          },
          {
            icon: Package,
            label: 'Total Productos',
            value: totalProductos.toLocaleString('es-MX'),
          },
          {
            icon: Layers,
            label: 'Unidades Totales',
            value: totalUnidades.toLocaleString('es-MX'),
          },
          {
            icon: TrendingUp,
            label: 'Margen Potencial',
            value: `$${margenPotencial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            color: 'green',
            subtext: `${porcentajeMargen.toFixed(1)}% de margen`,
          },
        ]}
      />

      {/* Botón Exportar */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExportar} icon={Download}>
          Exportar Reporte
        </Button>
      </div>

      {/* Tabla de Productos */}
      {reporte.productos && reporte.productos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Venta
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    % del Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reporte.productos.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {producto.nombre}
                      </div>
                      {producto.sku && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {producto.sku}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{producto.stock_actual}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        ${producto.precio_venta.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        ${producto.valor_total.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {producto.porcentaje_total?.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reporte: Valoracion FIFO/AVCO
 * Gap Alta Prioridad - Dic 2025
 */
function ReporteValoracionFIFOAVCO() {
  const { data: resumen, isLoading: loadingResumen } = useResumenValoracion();
  const { data: config, isLoading: loadingConfig } = useConfiguracionValoracion();
  const { data: comparativa, isLoading: loadingComparativa } = useComparativaValoracion();
  const actualizarConfig = useActualizarConfiguracionValoracion();

  const [metodoSeleccionado, setMetodoSeleccionado] = useState(null);

  // Cuando carga la config, establecer el metodo actual
  if (config?.metodo_valoracion && metodoSeleccionado === null) {
    setMetodoSeleccionado(config.metodo_valoracion);
  }

  const handleCambiarMetodo = async (nuevoMetodo) => {
    setMetodoSeleccionado(nuevoMetodo);
    await actualizarConfig.mutateAsync({ metodo_valoracion: nuevoMetodo });
  };

  if (loadingResumen || loadingConfig) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  const promedio = resumen?.promedio || {};
  const fifo = resumen?.fifo || {};
  const avco = resumen?.avco || {};
  const diferencias = resumen?.comparativa || {};

  return (
    <div className="space-y-6">
      {/* Selector de Metodo */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Metodo de Valoracion Preferido
            </h3>
          </div>
          <Badge variant="primary" size="sm">
            Actual: {METODOS_VALORACION[config?.metodo_valoracion] || 'Promedio'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(METODOS_VALORACION).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleCambiarMetodo(key)}
              disabled={actualizarConfig.isPending}
              className={`p-3 rounded-lg border text-left transition-all ${
                metodoSeleccionado === key
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
            >
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {DESCRIPCIONES_METODOS[key]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Resumen Comparativo - Mismo orden que selector: FIFO, AVCO, Promedio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* FIFO */}
        <div className={`p-4 rounded-lg border ${
          metodoSeleccionado === 'fifo'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">FIFO</p>
            {metodoSeleccionado === 'fifo' && (
              <Badge variant="primary" size="sm">Activo</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatearValor(fifo.valor_total)}
          </p>
          <p className={`text-xs mt-1 ${
            parseFloat(diferencias.diferencia_fifo_promedio) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {parseFloat(diferencias.diferencia_fifo_promedio) >= 0 ? '+' : ''}
            {formatearValor(diferencias.diferencia_fifo_promedio)} vs Promedio
          </p>
        </div>

        {/* AVCO */}
        <div className={`p-4 rounded-lg border ${
          metodoSeleccionado === 'avco'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">AVCO</p>
            {metodoSeleccionado === 'avco' && (
              <Badge variant="primary" size="sm">Activo</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatearValor(avco.valor_total)}
          </p>
          <p className={`text-xs mt-1 ${
            parseFloat(diferencias.diferencia_avco_promedio) >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {parseFloat(diferencias.diferencia_avco_promedio) >= 0 ? '+' : ''}
            {formatearValor(diferencias.diferencia_avco_promedio)} vs Promedio
          </p>
        </div>

        {/* Promedio Simple */}
        <div className={`p-4 rounded-lg border ${
          metodoSeleccionado === 'promedio'
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Promedio Simple</p>
            {metodoSeleccionado === 'promedio' && (
              <Badge variant="primary" size="sm">Activo</Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatearValor(promedio.valor_total)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {promedio.total_productos || 0} productos / {promedio.total_unidades || 0} unidades
          </p>
        </div>
      </div>

      {/* Tabla Comparativa por Producto */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
          <Layers className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Comparativa por Producto
          </h3>
        </div>

        {loadingComparativa ? (
          <div className="p-4">
            <SkeletonTable rows={5} columns={6} />
          </div>
        ) : !comparativa || comparativa.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={Calculator}
              title="Sin datos de valoración"
              description="No hay productos con stock para valorar"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Promedio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    FIFO
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    AVCO
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Dif. FIFO
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comparativa.slice(0, 15).map((prod, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                        {prod.nombre_producto}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {prod.stock_actual}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatearValor(prod.valor_promedio)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatearValor(prod.valor_fifo)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatearValor(prod.valor_avco)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${
                        parseFloat(prod.diferencia_fifo_promedio) >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {parseFloat(prod.diferencia_fifo_promedio) >= 0 ? '+' : ''}
                        {formatearValor(prod.diferencia_fifo_promedio)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

/**
 * Reporte: Análisis ABC
 */
function ReporteAnalisisABC() {
  const [fechas, setFechas] = useState({
    fecha_desde: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    fecha_hasta: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data, isLoading } = useAnalisisABC(fechas);
  const productos = data?.productos || [];

  const getCategoriaVariant = (categoria) => {
    const variants = {
      A: 'success',
      B: 'warning',
      C: 'default',
    };
    return variants[categoria] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Filtros de Fecha */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechas.fecha_desde}
              onChange={(e) => setFechas({ ...fechas, fecha_desde: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechas.fecha_hasta}
              onChange={(e) => setFechas({ ...fechas, fecha_hasta: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Explicación ABC */}
      <Alert variant="info" icon={Info} title="Análisis ABC">
        <ul className="text-sm space-y-1">
          <li>
            <strong>Categoría A (80%):</strong> Productos más importantes por ventas
          </li>
          <li>
            <strong>Categoría B (15%):</strong> Productos de importancia media
          </li>
          <li>
            <strong>Categoría C (5%):</strong> Productos de menor importancia
          </li>
        </ul>
      </Alert>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <SkeletonTable rows={5} columns={5} />
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-8">
          <EmptyState
            icon={BarChart3}
            title="Sin datos de análisis"
            description="No hay datos para el período seleccionado"
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unidades Vendidas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ingresos Totales
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    % Acumulado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {productos.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <Badge variant={getCategoriaVariant(producto.categoria_abc)} size="sm">
                        {producto.categoria_abc}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {producto.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {producto.unidades_vendidas}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        ${producto.ingresos_totales.toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {producto.porcentaje_acumulado.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reporte: Rotación de Inventario
 */
function ReporteRotacion() {
  const [fechas, setFechas] = useState({
    fecha_desde: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    fecha_hasta: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data, isLoading } = useRotacionInventario(fechas);
  const productos = data?.productos || [];

  return (
    <div className="space-y-6">
      {/* Filtros de Fecha */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechas.fecha_desde}
              onChange={(e) => setFechas({ ...fechas, fecha_desde: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechas.fecha_hasta}
              onChange={(e) => setFechas({ ...fechas, fecha_hasta: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <SkeletonTable rows={5} columns={5} />
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-8">
          <EmptyState
            icon={TrendingUp}
            title="Sin datos de rotación"
            description="No hay datos para el período seleccionado"
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock Promedio
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tasa de Rotación
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Días Inventario
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {productos.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {producto.nombre}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {producto.stock_promedio.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {producto.total_vendido}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {producto.tasa_rotacion.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {producto.dias_inventario.toFixed(0)} días
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reporte: Resumen de Alertas
 */
function ReporteAlertas() {
  const { data, isLoading } = useResumenAlertas();
  const resumen = data || {};

  return (
    <div className="space-y-6">
      {/* Resumen por Nivel */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-primary-800 dark:text-primary-300 mb-1">Info</p>
          <p className="text-xl sm:text-3xl font-bold text-primary-900 dark:text-primary-200">
            {resumen.total_info || 0}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-300 mb-1">Warning</p>
          <p className="text-xl sm:text-3xl font-bold text-yellow-900 dark:text-yellow-200">
            {resumen.total_warning || 0}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 mb-1">Critical</p>
          <p className="text-xl sm:text-3xl font-bold text-red-900 dark:text-red-200">
            {resumen.total_critical || 0}
          </p>
        </div>
      </div>

      {/* Resumen por Tipo */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <SkeletonTable rows={5} columns={3} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo de Alerta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    No Leídas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {resumen.por_tipo && resumen.por_tipo.map((tipo, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {tipo.tipo_alerta}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{tipo.total}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {tipo.no_leidas}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Página principal de Reportes de Inventario
 */
function ReportesInventarioPage() {
  const [tabActivo, setTabActivo] = useState('valor');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con navegación */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to="/home" label="Volver al Inicio" className="mb-3" />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestiona productos, proveedores y stock
        </p>
      </div>

      {/* Tabs de navegación */}
      <InventarioNavTabs />

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header de sección */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Reportes de Inventario</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analíticas y reportes de tu inventario
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex px-2 sm:px-6" aria-label="Tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTabActivo(tab.id)}
                    className={`
                      flex-1 sm:flex-none flex items-center justify-center sm:justify-start py-3 sm:py-4 px-1 sm:px-3 border-b-2 font-medium text-xs sm:text-sm
                      ${
                        tabActivo === tab.id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden ml-1">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenido del Tab */}
          <div className="p-6">
            {tabActivo === 'valor' && <ReporteValorInventario />}
            {tabActivo === 'valoracion' && <ReporteValoracionFIFOAVCO />}
            {tabActivo === 'abc' && <ReporteAnalisisABC />}
            {tabActivo === 'rotacion' && <ReporteRotacion />}
            {tabActivo === 'alertas' && <ReporteAlertas />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportesInventarioPage;
