import { Plus, Minus, Trash2, ShoppingCart, Percent, Globe, Tag, RefreshCw, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { monedasApi } from '@/services/api/endpoints';
import { useCurrency } from '@/hooks/utils';
import InputCupon from './InputCupon';
import PromocionesAplicadas from './PromocionesAplicadas';

/**
 * Componente de carrito de venta para POS
 * Muestra items, cantidades, descuentos y totales
 * Dic 2025: Conversión multi-moneda + Listas de precios inteligentes
 * Ene 2026: Cupones + Promociones automáticas
 */
export default function CarritoVenta({
  items,
  onActualizarCantidad,
  onEliminarItem,
  onActualizarDescuentoItem,
  descuentoGlobal = 0,
  onActualizarDescuentoGlobal,
  monedaSecundaria = 'USD', // Moneda para mostrar equivalente
  recalculandoPrecios = false, // Dic 2025: Estado de recálculo
  clienteSeleccionado = null,  // Dic 2025: Cliente para mostrar en header
  // Ene 2026: Props para cupones de descuento
  cuponActivo = null,
  onCuponAplicado,
  onCuponRemovido,
  // Ene 2026: Props para promociones automáticas
  promocionesAplicadas = [],
  descuentoPromociones = 0,
  hayPromocionExclusiva = false,
  evaluandoPromociones = false
}) {
  const { code: monedaOrg } = useCurrency();

  // Obtener tasa de cambio para moneda secundaria
  // Ene 2026: Aumentado staleTime y deshabilitado refetch para reducir requests
  const { data: tasaResponse } = useQuery({
    queryKey: ['tasa-cambio', monedaOrg, monedaSecundaria],
    queryFn: () => monedasApi.obtenerTasa(monedaOrg, monedaSecundaria),
    staleTime: 1000 * 60 * 30, // 30 minutos - tasas no cambian frecuentemente
    refetchOnWindowFocus: false,
    enabled: monedaOrg !== monedaSecundaria,
  });

  const tasaCambio = tasaResponse?.data?.data?.tasa || null;

  // Calcular subtotal
  const subtotal = items.reduce((sum, item) => {
    const precioUnitario = parseFloat(item.precio_unitario || item.precio_venta || 0);
    const cantidad = parseInt(item.cantidad || 1);
    const descuentoItem = parseFloat(item.descuento_monto || 0);
    return sum + (precioUnitario * cantidad - descuentoItem);
  }, 0);

  // Calcular descuento global
  const montoDescuentoGlobal = (subtotal * (parseFloat(descuentoGlobal) / 100));

  // Ene 2026: Descuento por cupón
  const descuentoCupon = cuponActivo?.descuento_calculado || 0;

  // Ene 2026: Verificar si cupón y promociones son acumulables
  // Si hay promocion exclusiva, no aplicar cupones
  const descuentoCuponFinal = hayPromocionExclusiva ? 0 : descuentoCupon;

  // Calcular total (incluye descuento global + cupón + promociones)
  const total = subtotal - montoDescuentoGlobal - descuentoCuponFinal - descuentoPromociones;

  const formatearPrecio = (precio) => {
    return `$${parseFloat(precio || 0).toFixed(2)}`;
  };

  // Calcular equivalente en moneda secundaria
  const totalEquivalente = tasaCambio ? total * parseFloat(tasaCambio) : null;

  const formatearEquivalente = (monto) => {
    if (!monto) return null;
    // USD usa 2 decimales
    return `≈ $${parseFloat(monto).toFixed(2)} ${monedaSecundaria}`;
  };

  const handleCantidadChange = (itemId, nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad);
    if (cantidad >= 1 && cantidad <= 999) {
      onActualizarCantidad(itemId, cantidad);
    }
  };

  const handleDescuentoItemChange = (itemId, descuento) => {
    const desc = parseFloat(descuento);
    if (desc >= 0) {
      onActualizarDescuentoItem(itemId, desc);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Carrito de Venta</h3>
            {/* Dic 2025: Indicador de recálculo */}
            {recalculandoPrecios && (
              <RefreshCw className="h-4 w-4 animate-spin" />
            )}
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full">
            <span className="font-semibold">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
        </div>
        {/* Dic 2025: Mostrar cliente si hay uno seleccionado */}
        {clienteSeleccionado && (
          <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
            <User className="h-3.5 w-3.5" />
            <span>Precios para: <strong className="text-white">{clienteSeleccionado.nombre}</strong></span>
            {clienteSeleccionado.lista_codigo && (
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                {clienteSeleccionado.lista_codigo}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400 dark:text-gray-500">
            <ShoppingCart className="h-20 w-20 mb-4" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Carrito vacío</p>
            <p className="text-sm text-center mt-2">Busca y selecciona productos para agregar a la venta</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => {
              const precioUnitario = parseFloat(item.precio_unitario || item.precio_venta || 0);
              const precioOriginal = parseFloat(item.precio_original || item.precio_venta || 0);
              const cantidad = parseInt(item.cantidad || 1);
              const descuentoItem = parseFloat(item.descuento_monto || 0);
              const subtotalItem = (precioUnitario * cantidad) - descuentoItem;
              // Dic 2025: Info de lista de precios
              const tieneDescuentoLista = item.descuento_lista > 0;
              const tienePrecioEspecial = item.fuente_precio === 'lista_precios' || item.fuente_precio === 'precio_fijo';

              return (
                <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {/* Nombre y precio unitario */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.nombre}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {item.sku && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">SKU: {item.sku}</span>
                        )}
                        {/* Dic 2025: Badge de lista de precios */}
                        {tienePrecioEspecial && item.lista_codigo && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                            <Tag className="h-3 w-3" />
                            {item.lista_codigo}
                            {tieneDescuentoLista && (
                              <span className="text-green-600 dark:text-green-300">
                                -{item.descuento_lista}%
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {/* Dic 2025: Mostrar precio original tachado si hay descuento */}
                      {tieneDescuentoLista && precioOriginal > precioUnitario && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-gray-400 dark:text-gray-500 line-through">
                            ${precioOriginal.toFixed(2)}
                          </span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ${precioUnitario.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onEliminarItem(item.id)}
                      className="ml-2 p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Controles de cantidad y precio */}
                  <div className="flex items-center gap-4">
                    {/* Cantidad */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCantidadChange(item.id, cantidad - 1)}
                        disabled={cantidad <= 1}
                        className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>

                      <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                        className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        min="1"
                        max="999"
                      />

                      <button
                        onClick={() => handleCantidadChange(item.id, cantidad + 1)}
                        disabled={cantidad >= (item.stock_actual || 999)}
                        className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>

                    {/* Precio unitario */}
                    <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                      <span className="text-gray-500 dark:text-gray-400">×</span> {formatearPrecio(precioUnitario)}
                    </div>

                    {/* Subtotal del item */}
                    <div className="font-semibold text-primary-600 dark:text-primary-400">
                      {formatearPrecio(subtotalItem)}
                    </div>
                  </div>

                  {/* Descuento por item */}
                  <div className="mt-2 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="number"
                      value={descuentoItem}
                      onChange={(e) => handleDescuentoItemChange(item.id, e.target.value)}
                      placeholder="Descuento $"
                      className="w-32 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Descuento en pesos</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer con totales */}
      {items.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          {/* Descuento global */}
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Percent className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descuento global (%):</label>
            <input
              type="number"
              value={descuentoGlobal}
              onChange={(e) => onActualizarDescuentoGlobal(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-24 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="0"
              max="100"
              step="0.1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatearPrecio(montoDescuentoGlobal)}
            </span>
          </div>

          {/* Ene 2026: Cupón de descuento */}
          <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <InputCupon
              subtotal={subtotal - montoDescuentoGlobal - descuentoPromociones}
              clienteId={clienteSeleccionado?.id}
              productosIds={items.map(item => item.producto_id || item.id)}
              onCuponAplicado={onCuponAplicado}
              onCuponRemovido={onCuponRemovido}
              cuponActivo={cuponActivo}
              disabled={items.length === 0 || hayPromocionExclusiva}
            />
            {hayPromocionExclusiva && cuponActivo && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                La promocion exclusiva no permite cupones adicionales
              </p>
            )}
          </div>

          {/* Ene 2026: Promociones automáticas */}
          {(promocionesAplicadas.length > 0 || evaluandoPromociones) && (
            <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
              {evaluandoPromociones ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Evaluando promociones...</span>
                </div>
              ) : (
                <PromocionesAplicadas
                  promociones={promocionesAplicadas}
                  descuentoTotal={descuentoPromociones}
                  hayExclusiva={hayPromocionExclusiva}
                  compact={true}
                />
              )}
            </div>
          )}

          {/* Subtotal */}
          <div className="flex justify-between text-base">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{formatearPrecio(subtotal)}</span>
          </div>

          {/* Descuento global */}
          {montoDescuentoGlobal > 0 && (
            <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
              <span>Descuento ({descuentoGlobal}%):</span>
              <span>-{formatearPrecio(montoDescuentoGlobal)}</span>
            </div>
          )}

          {/* Ene 2026: Descuento por cupón */}
          {descuentoCuponFinal > 0 && cuponActivo && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Cupón ({cuponActivo.codigo}):</span>
              <span>-{formatearPrecio(descuentoCuponFinal)}</span>
            </div>
          )}

          {/* Ene 2026: Descuento por promociones */}
          {descuentoPromociones > 0 && (
            <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
              <span>Promociones ({promocionesAplicadas.length}):</span>
              <span>-{formatearPrecio(descuentoPromociones)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-2xl font-bold text-primary-600 dark:text-primary-400 pt-3 border-t border-gray-300 dark:border-gray-600">
            <span>TOTAL:</span>
            <span>{formatearPrecio(total)}</span>
          </div>

          {/* Equivalente en moneda secundaria */}
          {totalEquivalente && (
            <div className="flex items-center justify-end gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Globe className="h-3.5 w-3.5" />
              <span>{formatearEquivalente(totalEquivalente)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
