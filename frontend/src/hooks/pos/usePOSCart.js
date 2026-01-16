import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import useSucursalStore from '@/store/sucursalStore';
import useAuthStore from '@/store/authStore';
import { listasPreciosApi } from '@/services/api/endpoints';
import { playSuccessBeep } from '@/utils/audioFeedback';

/**
 * Hook centralizado para el estado del carrito del POS
 * Ene 2026: Extrae toda la lógica del carrito de VentaPOSPage.jsx
 *
 * Responsabilidades:
 * - Estado del carrito (items, cliente, descuentos)
 * - Cálculos derivados (subtotal, total)
 * - Handlers para manipular el carrito
 * - Cache de precios inteligentes
 * - Recálculo de precios al cambiar cliente
 */
export function usePOSCart({ hayPromocionExclusiva = false, descuentoPromociones = 0 } = {}) {
  const toast = useToast();
  const { getSucursalId } = useSucursalStore();
  const { user } = useAuthStore();
  const sucursalId = getSucursalId() || user?.sucursal_id;

  // ==================== ESTADO DEL CARRITO ====================
  const [items, setItems] = useState([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [cuponActivo, setCuponActivo] = useState(null);
  const [descuentoPuntos, setDescuentoPuntos] = useState(0);
  const [puntosCanjeados, setPuntosCanjeados] = useState(0);
  const [recalculandoPrecios, setRecalculandoPrecios] = useState(false);

  // ==================== CACHE DE PRECIOS ====================
  const preciosCache = useRef(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // ==================== CÁLCULOS DERIVADOS ====================
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const precioUnitario = parseFloat(item.precio_unitario || item.precio_venta || 0);
      const cantidad = parseInt(item.cantidad || 1);
      const descuentoItem = parseFloat(item.descuento_monto || 0);
      return sum + (precioUnitario * cantidad - descuentoItem);
    }, 0);
  }, [items]);

  const montoDescuentoGlobal = useMemo(() => {
    return subtotal * (parseFloat(descuentoGlobal) / 100);
  }, [subtotal, descuentoGlobal]);

  const descuentoCupon = useMemo(() => {
    return cuponActivo?.descuento_calculado || 0;
  }, [cuponActivo]);

  // Si hay promoción exclusiva, no aplicar cupones
  const descuentoCuponFinal = useMemo(() => {
    return hayPromocionExclusiva ? 0 : descuentoCupon;
  }, [descuentoCupon, hayPromocionExclusiva]);

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

  // ==================== FUNCIONES INTERNAS ====================

  /**
   * Obtiene el precio inteligente de un producto con cache
   */
  const obtenerPrecioInteligente = useCallback(async (productoId, cantidad = 1) => {
    try {
      const clienteId = clienteSeleccionado?.id || 'none';
      const cacheKey = `${productoId}-${cantidad}-${clienteId}`;

      // Verificar cache
      const cached = preciosCache.current.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.precio;
      }

      const params = {
        cantidad,
        ...(clienteSeleccionado?.id && { clienteId: clienteSeleccionado.id }),
        ...(sucursalId && { sucursalId })
      };

      const response = await listasPreciosApi.obtenerPrecio(productoId, params);
      const precio = response?.data?.data || null;

      // Guardar en cache
      if (precio) {
        preciosCache.current.set(cacheKey, { precio, timestamp: Date.now() });
      }

      return precio;
    } catch (error) {
      console.warn('[usePOSCart] Error obteniendo precio inteligente:', error);
      return null;
    }
  }, [clienteSeleccionado, sucursalId]);

  /**
   * Recalcula todos los precios del carrito cuando cambia el cliente
   */
  const recalcularPreciosCarrito = useCallback(async () => {
    if (items.length === 0) return;

    setRecalculandoPrecios(true);
    try {
      const itemsParaAPI = items.map(item => ({
        productoId: item.producto_id,
        cantidad: item.cantidad
      }));

      const response = await listasPreciosApi.obtenerPreciosCarrito({
        items: itemsParaAPI,
        clienteId: clienteSeleccionado?.id || null,
        sucursalId: sucursalId || null
      });

      const preciosResueltos = response?.data?.data || [];

      setItems(prevItems => prevItems.map(item => {
        const precioResuelto = preciosResueltos.find(p => p.producto_id === item.producto_id);
        if (precioResuelto) {
          return {
            ...item,
            precio_unitario: parseFloat(precioResuelto.precio_unitario || precioResuelto.precio),
            precio_original: item.precio_venta,
            fuente_precio: precioResuelto.fuente,
            fuente_detalle: precioResuelto.fuente_detalle || `Lista: ${precioResuelto.lista_codigo || 'Precio base'}`,
            descuento_lista: parseFloat(precioResuelto.descuento_pct || precioResuelto.descuento_aplicado || 0),
            lista_codigo: precioResuelto.lista_codigo
          };
        }
        return item;
      }));

      if (clienteSeleccionado) {
        toast.success(`Precios actualizados para ${clienteSeleccionado.nombre}`);
      }
    } catch (error) {
      console.error('[usePOSCart] Error recalculando precios:', error);
      toast.error('Error al recalcular precios');
    } finally {
      setRecalculandoPrecios(false);
    }
  }, [items, clienteSeleccionado, sucursalId, toast]);

  // Recalcular precios cuando cambia el cliente
  useEffect(() => {
    preciosCache.current.clear();
    if (items.length > 0) {
      recalcularPreciosCarrito();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSeleccionado?.id]);

  // ==================== HANDLERS ====================

  /**
   * Agrega un producto al carrito (interno)
   */
  const agregarProductoInterno = useCallback(async (producto, numeroSerie = null) => {
    try {
      // Validación optimista de stock
      if ((producto.stock_actual || 0) < 1 && !producto.es_variante) {
        toast.error(`"${producto.nombre}" sin stock disponible`);
        return false;
      }

      // Obtener precio inteligente
      const precioResuelto = await obtenerPrecioInteligente(producto.producto_id, 1);

      const nuevoItem = {
        id: Date.now(),
        producto_id: producto.producto_id,
        variante_id: producto.es_variante ? producto.variante_id : null,
        es_variante: producto.es_variante || false,
        nombre: producto.nombre,
        sku: producto.sku,
        precio_venta: producto.precio_venta,
        precio_original: producto.precio_venta,
        precio_unitario: precioResuelto?.precio ? parseFloat(precioResuelto.precio) : producto.precio_venta,
        cantidad: 1,
        descuento_monto: 0,
        stock_actual: producto.stock_actual,
        fuente_precio: precioResuelto?.fuente || 'precio_producto',
        fuente_detalle: precioResuelto?.fuente_detalle || 'Precio base del producto',
        descuento_lista: parseFloat(precioResuelto?.descuento_aplicado || 0),
        lista_codigo: precioResuelto?.lista_codigo || null,
        requiere_numero_serie: producto.requiere_numero_serie || false,
        numero_serie: numeroSerie,
        categoria_id: producto.categoria_id
      };

      setItems(prev => [...prev, nuevoItem]);
      playSuccessBeep();

      // Toast con info del precio
      if (numeroSerie) {
        toast.success(`"${producto.nombre}" (NS: ${numeroSerie.numero_serie}) agregado`);
      } else if (precioResuelto?.fuente === 'lista_precios' && precioResuelto.descuento_aplicado > 0) {
        toast.success(`"${producto.nombre}" agregado (${precioResuelto.lista_codigo}: -${precioResuelto.descuento_aplicado}%)`);
      } else {
        toast.success(`"${producto.nombre}" agregado al carrito`);
      }

      return true;
    } catch (error) {
      toast.error(error.message || 'Error al agregar producto');
      return false;
    }
  }, [obtenerPrecioInteligente, toast]);

  /**
   * Agrega un producto al carrito (handler principal)
   * Retorna: { needsNS, needsModifiers, producto } si requiere interacción adicional
   */
  const agregarProducto = useCallback(async (producto) => {
    // Buscar item existente
    const itemExistente = producto.es_variante
      ? items.find(item => item.variante_id === producto.variante_id)
      : items.find(item => item.producto_id === producto.producto_id && !item.variante_id);

    // Si requiere NS y no está en el carrito
    if (producto.requiere_numero_serie && !itemExistente) {
      return { needsNS: true, producto };
    }

    // Si requiere NS y ya está en el carrito
    if (producto.requiere_numero_serie && itemExistente) {
      toast.warning(`"${producto.nombre}" requiere seleccionar otro número de serie`);
      return { needsNS: true, producto };
    }

    // Si ya está en el carrito, incrementar cantidad
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + 1;

      // Validación optimista de stock
      if (nuevaCantidad > (producto.stock_actual || 999)) {
        toast.error(`Stock insuficiente. Disponible: ${producto.stock_actual}`);
        return { success: false };
      }

      // Obtener precio actualizado por cantidad (qty breaks)
      const precioResuelto = await obtenerPrecioInteligente(producto.producto_id, nuevaCantidad);

      setItems(prevItems => prevItems.map(item => {
        const esElMismo = producto.es_variante
          ? item.variante_id === producto.variante_id
          : item.producto_id === producto.producto_id && !item.variante_id;

        return esElMismo
          ? {
              ...item,
              cantidad: nuevaCantidad,
              ...(precioResuelto && {
                precio_unitario: parseFloat(precioResuelto.precio),
                fuente_precio: precioResuelto.fuente,
                fuente_detalle: precioResuelto.fuente_detalle,
                descuento_lista: parseFloat(precioResuelto.descuento_aplicado || 0),
                lista_codigo: precioResuelto.lista_codigo
              })
            }
          : item;
      }));

      playSuccessBeep();
      toast.success(`Cantidad de "${producto.nombre}" aumentada`);
      return { success: true };
    }

    // Producto nuevo: agregar directamente
    const success = await agregarProductoInterno(producto, null);
    return { success };
  }, [items, obtenerPrecioInteligente, agregarProductoInterno, toast]);

  /**
   * Agrega un producto con número(s) de serie seleccionado(s)
   */
  const agregarConNS = useCallback(async (producto, numerosSeleccionados) => {
    if (!numerosSeleccionados || numerosSeleccionados.length === 0) return;

    for (const ns of numerosSeleccionados) {
      await agregarProductoInterno(producto, ns);
    }
  }, [agregarProductoInterno]);

  /**
   * Agrega un producto con modificadores/combo configurado
   */
  const agregarConModificadores = useCallback(async ({ producto, cantidad, modificadoresSeleccionados, precioUnitario, descripcionModificadores }) => {
    if (!producto) return;

    try {
      const nuevoItem = {
        id: Date.now(),
        producto_id: producto.producto_id || producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precio_venta: producto.precio_venta || producto.precio,
        precio_original: producto.precio_venta || producto.precio,
        precio_unitario: precioUnitario,
        cantidad,
        descuento_monto: 0,
        stock_actual: producto.stock_actual,
        fuente_precio: 'precio_producto',
        fuente_detalle: descripcionModificadores ? `Con: ${descripcionModificadores}` : 'Precio base',
        modificadores: modificadoresSeleccionados,
        descripcion_modificadores: descripcionModificadores,
        categoria_id: producto.categoria_id
      };

      setItems(prev => [...prev, nuevoItem]);
      playSuccessBeep();
      toast.success(`"${producto.nombre}" agregado al carrito`);
    } catch (error) {
      toast.error('Error al agregar producto con modificadores');
    }
  }, [toast]);

  /**
   * Actualiza la cantidad de un item
   */
  const actualizarCantidad = useCallback(async (itemId, nuevaCantidad) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Validación optimista de stock
    if (nuevaCantidad > (item.stock_actual || 999)) {
      toast.error(`Stock insuficiente. Disponible: ${item.stock_actual}`);
      return;
    }

    // Obtener precio actualizado por cantidad (qty breaks)
    const precioResuelto = await obtenerPrecioInteligente(item.producto_id, nuevaCantidad);

    setItems(prevItems => prevItems.map(i =>
      i.id === itemId
        ? {
            ...i,
            cantidad: nuevaCantidad,
            ...(precioResuelto && {
              precio_unitario: parseFloat(precioResuelto.precio_unitario || precioResuelto.precio),
              fuente_precio: precioResuelto.fuente,
              fuente_detalle: precioResuelto.fuente_detalle || `Lista: ${precioResuelto.lista_codigo || 'Precio base'}`,
              descuento_lista: parseFloat(precioResuelto.descuento_pct || precioResuelto.descuento_aplicado || 0),
              lista_codigo: precioResuelto.lista_codigo
            })
          }
        : i
    ));
  }, [items, obtenerPrecioInteligente, toast]);

  /**
   * Actualiza el descuento de un item individual
   */
  const actualizarDescuentoItem = useCallback((itemId, descuento) => {
    setItems(prevItems => prevItems.map(item =>
      item.id === itemId
        ? { ...item, descuento_monto: descuento }
        : item
    ));
  }, []);

  /**
   * Elimina un item del carrito
   */
  const eliminarItem = useCallback((itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setItems(prevItems => prevItems.filter(i => i.id !== itemId));
    toast.success(`"${item.nombre}" eliminado del carrito`);
  }, [items, toast]);

  /**
   * Vacía completamente el carrito
   */
  const vaciarCarrito = useCallback(() => {
    setItems([]);
    setDescuentoGlobal(0);
    setCuponActivo(null);
    setDescuentoPuntos(0);
    setPuntosCanjeados(0);
    toast.success('Carrito vaciado');
  }, [toast]);

  /**
   * Aplica un cupón de descuento
   */
  const aplicarCupon = useCallback((cuponData) => {
    setCuponActivo(cuponData);
    toast.success(`Cupón "${cuponData.codigo}" aplicado: -$${cuponData.descuento_calculado?.toFixed(2) || '0.00'}`);
  }, [toast]);

  /**
   * Remueve el cupón activo
   */
  const removerCupon = useCallback(() => {
    setCuponActivo(null);
    toast.info('Cupón removido');
  }, [toast]);

  /**
   * Aplica canje de puntos de lealtad
   */
  const aplicarCanjePuntos = useCallback((descuento, puntos) => {
    setDescuentoPuntos(descuento);
    setPuntosCanjeados(puntos);
    toast.success(`${puntos.toLocaleString()} puntos canjeados: -$${descuento.toFixed(2)}`);
  }, [toast]);

  /**
   * Limpia el carrito después de una venta exitosa
   */
  const limpiarDespuesDeVenta = useCallback(() => {
    setItems([]);
    setDescuentoGlobal(0);
    setClienteSeleccionado(null);
    setCuponActivo(null);
    setDescuentoPuntos(0);
    setPuntosCanjeados(0);
  }, []);

  /**
   * Prepara los items para enviar al backend
   */
  const prepararItemsParaVenta = useCallback(() => {
    return items.map(item => ({
      producto_id: item.producto_id,
      variante_id: item.variante_id || undefined,
      cantidad: item.cantidad,
      precio_unitario: parseFloat(item.precio_unitario),
      descuento_monto: parseFloat(item.descuento_monto || 0),
      aplica_comision: true,
      notas: '',
      numero_serie_id: item.numero_serie?.id || undefined,
      numero_serie: item.numero_serie?.numero_serie || undefined
    }));
  }, [items]);

  // ==================== RETURN ====================
  return {
    // Estado
    items,
    clienteSeleccionado,
    cuponActivo,
    descuentoGlobal,
    descuentoPuntos,
    puntosCanjeados,
    recalculandoPrecios,

    // Cálculos derivados
    subtotal,
    montoDescuentoGlobal,
    descuentoCupon,
    descuentoCuponFinal,
    total,
    cartDataForDisplay,

    // Setters directos
    setClienteSeleccionado,
    setDescuentoGlobal,

    // Handlers
    agregarProducto,
    agregarConNS,
    agregarConModificadores,
    actualizarCantidad,
    actualizarDescuentoItem,
    eliminarItem,
    vaciarCarrito,
    aplicarCupon,
    removerCupon,
    aplicarCanjePuntos,
    limpiarDespuesDeVenta,
    prepararItemsParaVenta,
  };
}
