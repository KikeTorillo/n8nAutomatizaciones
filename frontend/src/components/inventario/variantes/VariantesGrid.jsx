import { useState } from 'react';
import {
  Package,
  Edit2,
  Trash2,
  Plus,
  Minus,
  Loader2,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { useVariantes, useAjustarStockVariante, useEliminarVariante } from '@/hooks/useVariantes';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

/**
 * Grid de variantes de un producto
 * Muestra lista de variantes con stock, precio y acciones
 */
export default function VariantesGrid({
  productoId,
  onEditVariante,
  onGenerarVariantes
}) {
  const [ajustandoStock, setAjustandoStock] = useState(null);
  const [cantidadAjuste, setCantidadAjuste] = useState(1);

  const { data: variantes = [], isLoading } = useVariantes(productoId);
  const ajustarStock = useAjustarStockVariante();
  const eliminarVariante = useEliminarVariante();
  const { format: formatPrice } = useCurrency();

  // Ajustar stock
  const handleAjustarStock = async (varianteId, tipo) => {
    try {
      await ajustarStock.mutateAsync({
        id: varianteId,
        cantidad: cantidadAjuste,
        tipo: tipo === 'entrada' ? 'entrada_ajuste' : 'salida_ajuste',
        motivo: 'Ajuste manual desde variantes'
      });
      toast.success(`Stock ${tipo === 'entrada' ? 'agregado' : 'descontado'}`);
      setAjustandoStock(null);
      setCantidadAjuste(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al ajustar stock');
    }
  };

  // Eliminar variante
  const handleEliminar = async (variante) => {
    if (!confirm(`¿Eliminar variante "${variante.nombre_variante}"?`)) return;

    try {
      await eliminarVariante.mutateAsync(variante.id);
      toast.success('Variante eliminada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (variantes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sin variantes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Este producto no tiene variantes configuradas
        </p>
        {onGenerarVariantes && (
          <button
            onClick={onGenerarVariantes}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Generar Variantes
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {variantes.length} variante{variantes.length !== 1 && 's'}
        </div>
        {onGenerarVariantes && (
          <button
            onClick={onGenerarVariantes}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + Agregar mas
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {variantes.map(variante => (
          <div
            key={variante.id}
            className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            {/* Imagen y nombre */}
            <div className="flex gap-3 mb-3">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                {variante.imagen_url_efectiva ? (
                  <img
                    src={variante.imagen_url_efectiva}
                    alt={variante.nombre_variante}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {variante.nombre_variante}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  SKU: {variante.sku || '-'}
                </p>
              </div>
            </div>

            {/* Atributos */}
            {variante.atributos && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {variante.atributos.map((attr, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                  >
                    {attr.color_hex && (
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: attr.color_hex }}
                      />
                    )}
                    {attr.valor}
                  </span>
                ))}
              </div>
            )}

            {/* Precio y stock */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatPrice(variante.precio_venta_efectivo)}
              </span>
              <div className="flex items-center gap-1">
                {variante.stock_actual <= variante.stock_minimo && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span className={`
                  text-sm font-medium
                  ${variante.stock_actual === 0
                    ? 'text-red-600 dark:text-red-400'
                    : variante.stock_actual <= variante.stock_minimo
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                `}>
                  {variante.stock_actual} uds
                </span>
              </div>
            </div>

            {/* Ajuste de stock inline */}
            {ajustandoStock === variante.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={cantidadAjuste}
                  onChange={(e) => setCantidadAjuste(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <button
                  onClick={() => handleAjustarStock(variante.id, 'entrada')}
                  disabled={ajustarStock.isPending}
                  className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded hover:bg-green-200"
                  title="Agregar"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAjustarStock(variante.id, 'salida')}
                  disabled={ajustarStock.isPending || variante.stock_actual < cantidadAjuste}
                  className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded hover:bg-red-200 disabled:opacity-50"
                  title="Descontar"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setAjustandoStock(null);
                    setCantidadAjuste(1);
                  }}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAjustandoStock(variante.id)}
                  className="flex-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Ajustar Stock
                </button>
                {onEditVariante && (
                  <button
                    onClick={() => onEditVariante(variante)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEliminar(variante)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
