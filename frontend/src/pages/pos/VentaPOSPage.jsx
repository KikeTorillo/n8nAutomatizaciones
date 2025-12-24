import { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingCart, Trash2, Check, AlertCircle, User, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/ui/BackButton';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/authStore';
import { useCrearVenta } from '@/hooks/useVentas';
import { useAccesoModulo } from '@/hooks/useAccesoModulo';
import BuscadorProductosPOS from '@/components/pos/BuscadorProductosPOS';
import CarritoVenta from '@/components/pos/CarritoVenta';
import MetodoPagoModal from '@/components/pos/MetodoPagoModal';
import POSNavTabs from '@/components/pos/POSNavTabs';
import ClienteSelector from '@/components/pos/ClienteSelector';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { listasPreciosApi } from '@/services/api/endpoints';

/**
 * Página principal del punto de venta (POS)
 * Permite crear ventas escaneando/buscando productos
 *
 * Nov 2025: Integración con Modelo Unificado Profesional-Usuario
 * - Muestra el vendedor auto-asignado en el header
 * - Valida acceso al módulo POS
 */
export default function VentaPOSPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();
  const crearVenta = useCrearVenta();

  // Nov 2025: Obtener profesional vinculado y validar acceso a POS
  const {
    tieneAcceso,
    profesional,
    profesionalNombre,
    isLoading: isLoadingAcceso
  } = useAccesoModulo('pos');

  // Redirigir si no tiene acceso a POS (después de cargar)
  useEffect(() => {
    if (!isLoadingAcceso && profesional && !tieneAcceso) {
      toast.error('No tienes acceso al módulo de Punto de Venta');
      navigate('/home');
    }
  }, [tieneAcceso, profesional, isLoadingAcceso, navigate, toast]);

  const [items, setItems] = useState([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [mostrarConfirmVaciar, setMostrarConfirmVaciar] = useState(false);
  // Nov 2025: Cliente asociado a la venta (opcional)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  // Dic 2025: Estado para recálculo de precios
  const [recalculandoPrecios, setRecalculandoPrecios] = useState(false);

  // Dic 2025: Función para obtener precio inteligente de un producto
  const obtenerPrecioInteligente = useCallback(async (productoId, cantidad = 1) => {
    try {
      const params = {
        cantidad,
        ...(clienteSeleccionado?.id && { clienteId: clienteSeleccionado.id }),
        ...(user?.sucursal_id && { sucursalId: user.sucursal_id })
      };

      const response = await listasPreciosApi.obtenerPrecio(productoId, params);
      return response?.data?.data || null;
    } catch (error) {
      console.warn('[POS] Error obteniendo precio inteligente:', error);
      return null;
    }
  }, [clienteSeleccionado, user?.sucursal_id]);

  // Dic 2025: Recalcular todos los precios cuando cambia el cliente
  const recalcularPreciosCarrito = useCallback(async () => {
    if (items.length === 0) return;

    setRecalculandoPrecios(true);
    try {
      // Usar el endpoint bulk para eficiencia
      const itemsParaAPI = items.map(item => ({
        productoId: item.producto_id,
        cantidad: item.cantidad
      }));

      const response = await listasPreciosApi.obtenerPreciosCarrito({
        items: itemsParaAPI,
        clienteId: clienteSeleccionado?.id || null,
        sucursalId: user?.sucursal_id || null
      });

      const preciosResueltos = response?.data?.data || [];

      // Actualizar items con los nuevos precios
      // Nota: la función bulk retorna precio_unitario y descuento_pct
      setItems(prevItems => prevItems.map(item => {
        const precioResuelto = preciosResueltos.find(p => p.producto_id === item.producto_id);
        if (precioResuelto) {
          return {
            ...item,
            precio_unitario: parseFloat(precioResuelto.precio_unitario || precioResuelto.precio),
            precio_original: item.precio_venta, // Guardar precio base
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
      console.error('[POS] Error recalculando precios:', error);
      toast.error('Error al recalcular precios');
    } finally {
      setRecalculandoPrecios(false);
    }
  }, [items, clienteSeleccionado, user?.sucursal_id, toast]);

  // Recalcular precios cuando cambia el cliente
  useEffect(() => {
    if (items.length > 0) {
      recalcularPreciosCarrito();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSeleccionado?.id]);

  // Calcular total
  const subtotal = items.reduce((sum, item) => {
    const precioUnitario = parseFloat(item.precio_unitario || item.precio_venta || 0);
    const cantidad = parseInt(item.cantidad || 1);
    const descuentoItem = parseFloat(item.descuento_monto || 0);
    return sum + (precioUnitario * cantidad - descuentoItem);
  }, 0);

  const montoDescuentoGlobal = (subtotal * (parseFloat(descuentoGlobal) / 100));
  const total = subtotal - montoDescuentoGlobal;

  // Handler: Agregar producto al carrito
  // Dic 2025: Integración con listas de precios inteligentes
  const handleProductoSeleccionado = async (producto) => {
    // Verificar si el producto ya está en el carrito
    const itemExistente = items.find(item => item.producto_id === producto.id);

    if (itemExistente) {
      // Incrementar cantidad y recalcular precio por qty breaks
      const nuevaCantidad = itemExistente.cantidad + 1;

      // Obtener precio actualizado por cantidad
      const precioResuelto = await obtenerPrecioInteligente(producto.id, nuevaCantidad);

      setItems(items.map(item =>
        item.producto_id === producto.id
          ? {
              ...item,
              cantidad: nuevaCantidad,
              // Actualizar precio si hay qty break
              ...(precioResuelto && {
                precio_unitario: parseFloat(precioResuelto.precio),
                fuente_precio: precioResuelto.fuente,
                fuente_detalle: precioResuelto.fuente_detalle,
                descuento_lista: parseFloat(precioResuelto.descuento_aplicado || 0),
                lista_codigo: precioResuelto.lista_codigo
              })
            }
          : item
      ));
      toast.success(`Cantidad de "${producto.nombre}" aumentada`);
    } else {
      // Obtener precio inteligente para el nuevo producto
      const precioResuelto = await obtenerPrecioInteligente(producto.id, 1);

      // Agregar nuevo item con precio resuelto
      const nuevoItem = {
        id: Date.now(), // ID temporal para el carrito
        producto_id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precio_venta: producto.precio_venta, // Precio base
        precio_original: producto.precio_venta,
        precio_unitario: precioResuelto?.precio ? parseFloat(precioResuelto.precio) : producto.precio_venta,
        cantidad: 1,
        descuento_monto: 0,
        stock_actual: producto.stock_actual,
        // Dic 2025: Info de lista de precios
        fuente_precio: precioResuelto?.fuente || 'precio_producto',
        fuente_detalle: precioResuelto?.fuente_detalle || 'Precio base del producto',
        descuento_lista: parseFloat(precioResuelto?.descuento_aplicado || 0),
        lista_codigo: precioResuelto?.lista_codigo || null
      };

      setItems([...items, nuevoItem]);

      // Mostrar toast con info del precio
      if (precioResuelto?.fuente === 'lista_precios' && precioResuelto.descuento_aplicado > 0) {
        toast.success(`"${producto.nombre}" agregado (${precioResuelto.lista_codigo}: -${precioResuelto.descuento_aplicado}%)`);
      } else {
        toast.success(`"${producto.nombre}" agregado al carrito`);
      }
    }
  };

  // Handler: Actualizar cantidad de item
  // Dic 2025: Recalcula precio cuando cambia cantidad (qty breaks)
  const handleActualizarCantidad = async (itemId, nuevaCantidad) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Primero actualizar la cantidad
    setItems(prevItems => prevItems.map(i =>
      i.id === itemId ? { ...i, cantidad: nuevaCantidad } : i
    ));

    // Luego obtener el precio actualizado por cantidad
    const precioResuelto = await obtenerPrecioInteligente(item.producto_id, nuevaCantidad);

    if (precioResuelto) {
      setItems(prevItems => prevItems.map(i =>
        i.id === itemId
          ? {
              ...i,
              cantidad: nuevaCantidad,
              precio_unitario: parseFloat(precioResuelto.precio_unitario || precioResuelto.precio),
              fuente_precio: precioResuelto.fuente,
              fuente_detalle: precioResuelto.fuente_detalle || `Lista: ${precioResuelto.lista_codigo || 'Precio base'}`,
              descuento_lista: parseFloat(precioResuelto.descuento_pct || precioResuelto.descuento_aplicado || 0),
              lista_codigo: precioResuelto.lista_codigo
            }
          : i
      ));
    }
  };

  // Handler: Actualizar descuento de item
  const handleActualizarDescuentoItem = (itemId, descuento) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, descuento_monto: descuento }
        : item
    ));
  };

  // Handler: Eliminar item del carrito
  const handleEliminarItem = (itemId) => {
    const item = items.find(i => i.id === itemId);
    setItems(items.filter(i => i.id !== itemId));
    toast.success(`"${item.nombre}" eliminado del carrito`);
  };

  // Handler: Vaciar carrito
  const handleVaciarCarrito = () => {
    setItems([]);
    setDescuentoGlobal(0);
    setMostrarConfirmVaciar(false);
    toast.success('Carrito vaciado');
  };

  // Handler: Proceder al pago
  const handleProcederPago = () => {
    if (items.length === 0) {
      toast.error('Agrega productos al carrito primero');
      return;
    }

    setMostrarModalPago(true);
  };

  // Handler: Confirmar venta
  const handleConfirmarVenta = async (datosPago) => {
    try {
      // Preparar items para el backend
      const itemsBackend = items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(item.precio_unitario),
        descuento_monto: parseFloat(item.descuento_monto || 0),
        aplica_comision: true,
        notas: ''
      }));

      // Calcular descuento global en monto
      const descuentoGlobalMonto = montoDescuentoGlobal;

      // Preparar datos de la venta
      const datosVenta = {
        tipo_venta: 'directa',
        usuario_id: user.id,
        // Nov 2025: Incluir cliente si está seleccionado
        cliente_id: clienteSeleccionado?.id || undefined,
        items: itemsBackend,
        descuento_porcentaje: parseFloat(descuentoGlobal) || 0,
        descuento_monto: descuentoGlobalMonto,
        metodo_pago: datosPago.metodo_pago,
        monto_pagado: datosPago.monto_pagado,
        impuestos: 0,
        notas: ''
      };

      // Crear venta
      const resultado = await crearVenta.mutateAsync(datosVenta);

      // Mostrar éxito
      toast.success(`¡Venta ${resultado.folio} creada exitosamente!`, {
        duration: 4000
      });

      // Mostrar cambio si es efectivo
      if (datosPago.metodo_pago === 'efectivo' && datosPago.cambio > 0) {
        toast.success(`💵 Cambio a entregar: $${datosPago.cambio.toFixed(2)}`, {
          duration: 6000
        });
      }

      // Limpiar carrito y cliente
      setItems([]);
      setDescuentoGlobal(0);
      setClienteSeleccionado(null);
      setMostrarModalPago(false);

    } catch (error) {
      console.error('Error al crear venta:', error);
      toast.error(error.response?.data?.mensaje || 'Error al crear la venta');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header - Mobile First */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-3 sm:px-6 sm:py-4">
        {/* Row 1: Botón de regreso + Vendedor */}
        <div className="flex items-center justify-between mb-2">
          <BackButton to="/home" label="Volver al Inicio" />

          {/* Vendedor - siempre visible pero compacto en móvil */}
          {profesionalNombre && (
            <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">Vendedor:</span>
              <span className="font-medium">{profesionalNombre}</span>
            </div>
          )}
        </div>

        {/* Row 2: Título */}
        <div className="mb-2 sm:mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Punto de Venta</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            Escanea o busca productos para crear una venta
          </p>
        </div>

        {/* Row 3: Cliente + Vaciar Carrito */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex-1 max-w-xs sm:max-w-sm">
            <ClienteSelector
              value={clienteSeleccionado}
              onChange={setClienteSeleccionado}
              placeholder="Asociar cliente (opcional)"
            />
          </div>

          {items.length > 0 && (
            <button
              onClick={() => setMostrarConfirmVaciar(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 py-2 sm:px-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Vaciar Carrito</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs de navegación POS */}
      <POSNavTabs />

      {/* Main Content - Mobile First */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-6 space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          {/* Columna izquierda: Buscador */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <BuscadorProductosPOS onProductoSeleccionado={handleProductoSeleccionado} />

            {/* Info de ayuda - simplificada en móvil */}
            {items.length === 0 && (
              <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4 sm:p-6 text-center">
                <ShoppingCart className="h-10 w-10 sm:h-16 sm:w-16 text-primary-400 dark:text-primary-500 mx-auto mb-2 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-primary-900 dark:text-primary-300 mb-1 sm:mb-2">
                  Comienza a agregar productos
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-400 mb-3 sm:mb-4">
                  Busca productos por nombre, SKU o escanea el código de barras
                </p>
                {/* Atajos de teclado - ocultos en móvil */}
                <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Atajos de teclado:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> - Seleccionar producto</li>
                    <li>• <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> - Cerrar resultados</li>
                    <li>• <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">F2</kbd> - Proceder al pago</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Resumen rápido - responsive */}
            {items.length > 0 && (
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg p-3 sm:p-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-primary-100 text-xs sm:text-sm">Items</p>
                    <p className="text-xl sm:text-3xl font-bold">{items.length}</p>
                  </div>
                  <div>
                    <p className="text-primary-100 text-xs sm:text-sm">Subtotal</p>
                    <p className="text-lg sm:text-3xl font-bold">${subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-primary-100 text-xs sm:text-sm">Total</p>
                    <p className="text-lg sm:text-3xl font-bold">${total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: Carrito */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col lg:h-[calc(100vh-16rem)]">
            <CarritoVenta
              items={items}
              onActualizarCantidad={handleActualizarCantidad}
              onEliminarItem={handleEliminarItem}
              onActualizarDescuentoItem={handleActualizarDescuentoItem}
              descuentoGlobal={descuentoGlobal}
              onActualizarDescuentoGlobal={setDescuentoGlobal}
              recalculandoPrecios={recalculandoPrecios}
              clienteSeleccionado={clienteSeleccionado}
            />

            {/* Botón de pago */}
            {items.length > 0 && (
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleProcederPago}
                  className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg shadow-lg hover:shadow-xl"
                >
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                  PROCEDER AL PAGO
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de método de pago */}
      <MetodoPagoModal
        isOpen={mostrarModalPago}
        onClose={() => setMostrarModalPago(false)}
        total={total}
        onConfirmar={handleConfirmarVenta}
        isLoading={crearVenta.isPending}
      />

      {/* Modal de confirmación para vaciar carrito */}
      <ConfirmDialog
        isOpen={mostrarConfirmVaciar}
        onClose={() => setMostrarConfirmVaciar(false)}
        onConfirm={handleVaciarCarrito}
        title="Vaciar carrito"
        message="¿Estás seguro de vaciar el carrito? Se eliminarán todos los productos agregados."
        confirmText="Vaciar"
        cancelText="Cancelar"
        variant="warning"
      />
    </div>
  );
}
