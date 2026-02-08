import { useState, useEffect } from 'react';
import { Settings, Layers, Calculator } from 'lucide-react';
import {
  Badge,
  EmptyState,
  SkeletonCard,
  SkeletonTable,
} from '@/components/ui';
import {
  useResumenValoracion,
  useConfiguracionValoracion,
  useActualizarConfiguracionValoracion,
  useComparativaValoracion,
  METODOS_VALORACION,
  DESCRIPCIONES_METODOS,
  formatearValor,
} from '@/hooks/inventario';

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
  useEffect(() => {
    if (config?.metodo_valoracion && metodoSeleccionado === null) {
      setMetodoSeleccionado(config.metodo_valoracion);
    }
  }, [config?.metodo_valoracion, metodoSeleccionado]);

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
                {comparativa.slice(0, 15).map((prod) => (
                  <tr key={prod.producto_id || prod.nombre_producto} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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

export default ReporteValoracionFIFOAVCO;
