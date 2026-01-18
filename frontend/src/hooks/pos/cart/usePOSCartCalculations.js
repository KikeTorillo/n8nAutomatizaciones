import { useMemo } from 'react';

/**
 * Hook para cálculos derivados del carrito POS
 * Ene 2026: Extraído de usePOSCart para modularización
 *
 * Todos los valores calculados a partir del estado base
 */
export function usePOSCartCalculations({
  items,
  descuentoGlobal,
  cuponActivo,
  descuentoPuntos,
  clienteSeleccionado,
  hayPromocionExclusiva = false,
  descuentoPromociones = 0,
}) {
  // Subtotal: suma de items con descuentos individuales
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const precioUnitario = parseFloat(item.precio_unitario || item.precio_venta || 0);
      const cantidad = parseInt(item.cantidad || 1);
      const descuentoItem = parseFloat(item.descuento_monto || 0);
      return sum + (precioUnitario * cantidad - descuentoItem);
    }, 0);
  }, [items]);

  // Monto del descuento global (porcentaje sobre subtotal)
  const montoDescuentoGlobal = useMemo(() => {
    return subtotal * (parseFloat(descuentoGlobal) / 100);
  }, [subtotal, descuentoGlobal]);

  // Descuento del cupón
  const descuentoCupon = useMemo(() => {
    return cuponActivo?.descuento_calculado || 0;
  }, [cuponActivo]);

  // Si hay promoción exclusiva, no aplicar cupones
  const descuentoCuponFinal = useMemo(() => {
    return hayPromocionExclusiva ? 0 : descuentoCupon;
  }, [descuentoCupon, hayPromocionExclusiva]);

  // Total final
  const total = useMemo(() => {
    return subtotal - montoDescuentoGlobal - descuentoCuponFinal - descuentoPromociones - descuentoPuntos;
  }, [subtotal, montoDescuentoGlobal, descuentoCuponFinal, descuentoPromociones, descuentoPuntos]);

  // Datos del carrito para sincronizar con display del cliente
  const cartDataForDisplay = useMemo(() => {
    if (items.length === 0) return null;
    return {
      items: items.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: parseFloat(item.precio_unitario || item.precio_venta || 0),
        subtotal: parseFloat(item.precio_unitario || item.precio_venta || 0) * item.cantidad,
      })),
      subtotal,
      descuentos: {
        global: montoDescuentoGlobal,
        cupon: descuentoCuponFinal,
        promociones: descuentoPromociones,
        puntos: descuentoPuntos,
      },
      total,
      cliente: clienteSeleccionado ? {
        nombre: clienteSeleccionado.nombre_completo || clienteSeleccionado.nombre,
      } : null,
    };
  }, [items, subtotal, montoDescuentoGlobal, descuentoCuponFinal, descuentoPromociones, descuentoPuntos, total, clienteSeleccionado]);

  return {
    subtotal,
    montoDescuentoGlobal,
    descuentoCupon,
    descuentoCuponFinal,
    total,
    cartDataForDisplay,
  };
}

export default usePOSCartCalculations;
