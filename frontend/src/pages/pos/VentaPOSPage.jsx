import { useState } from 'react';
import { ShoppingCart, Trash2, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/authStore';
import { useCrearVenta } from '@/hooks/useVentas';
import BuscadorProductosPOS from '@/components/pos/BuscadorProductosPOS';
import CarritoVenta from '@/components/pos/CarritoVenta';
import MetodoPagoModal from '@/components/pos/MetodoPagoModal';

/**
 * Página principal del punto de venta (POS)
 * Permite crear ventas escaneando/buscando productos
 */
export default function VentaPOSPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const toast = useToast();
  const crearVenta = useCrearVenta();

  const [items, setItems] = useState([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);

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
  const handleProductoSeleccionado = (producto) => {
    // Verificar si el producto ya está en el carrito
    const itemExistente = items.find(item => item.producto_id === producto.id);

    if (itemExistente) {
      // Incrementar cantidad
      setItems(items.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
      toast.success(`Cantidad de "${producto.nombre}" aumentada`);
    } else {
      // Agregar nuevo item
      const nuevoItem = {
        id: Date.now(), // ID temporal para el carrito
        producto_id: producto.id,
        nombre: producto.nombre,
        sku: producto.sku,
        precio_venta: producto.precio_venta,
        precio_unitario: producto.precio_venta,
        cantidad: 1,
        descuento_monto: 0,
        stock_actual: producto.stock_actual,
      };

      setItems([...items, nuevoItem]);
      toast.success(`"${producto.nombre}" agregado al carrito`);
    }
  };

  // Handler: Actualizar cantidad de item
  const handleActualizarCantidad = (itemId, nuevaCantidad) => {
    setItems(items.map(item =>
      item.id === itemId
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
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
    if (window.confirm('¿Estás seguro de vaciar el carrito?')) {
      setItems([]);
      setDescuentoGlobal(0);
      toast.success('Carrito vaciado');
    }
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
        aplica_comision: false,
        notas: ''
      }));

      // Calcular descuento global en monto
      const descuentoGlobalMonto = montoDescuentoGlobal;

      // Preparar datos de la venta
      const datosVenta = {
        tipo_venta: 'directa',
        usuario_id: user.id,
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

      // Limpiar carrito
      setItems([]);
      setDescuentoGlobal(0);
      setMostrarModalPago(false);

    } catch (error) {
      console.error('Error al crear venta:', error);
      toast.error(error.response?.data?.mensaje || 'Error al crear la venta');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Punto de Venta</h1>
            <p className="mt-1 text-sm text-gray-500">
              Escanea o busca productos para crear una venta
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleVaciarCarrito}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
            >
              <Trash2 className="h-5 w-5" />
              Vaciar Carrito
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Columna izquierda: Buscador */}
          <div className="lg:col-span-2 space-y-4">
            <BuscadorProductosPOS onProductoSeleccionado={handleProductoSeleccionado} />

            {/* Info de ayuda */}
            {items.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <ShoppingCart className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Comienza a agregar productos
                </h3>
                <p className="text-blue-700 mb-4">
                  Busca productos por nombre, SKU o escanea el código de barras
                </p>
                <div className="bg-white rounded-lg p-4 text-left max-w-md mx-auto">
                  <p className="text-sm text-gray-600 font-medium mb-2">Atajos de teclado:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <kbd className="px-2 py-0.5 bg-gray-100 rounded">Enter</kbd> - Seleccionar producto (si solo hay 1 resultado)</li>
                    <li>• <kbd className="px-2 py-0.5 bg-gray-100 rounded">Esc</kbd> - Cerrar resultados</li>
                    <li>• <kbd className="px-2 py-0.5 bg-gray-100 rounded">F2</kbd> - Proceder al pago</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Resumen rápido */}
            {items.length > 0 && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-blue-100 text-sm">Items</p>
                    <p className="text-3xl font-bold">{items.length}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Subtotal</p>
                    <p className="text-3xl font-bold">${subtotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Total</p>
                    <p className="text-3xl font-bold">${total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna derecha: Carrito */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
            <CarritoVenta
              items={items}
              onActualizarCantidad={handleActualizarCantidad}
              onEliminarItem={handleEliminarItem}
              onActualizarDescuentoItem={handleActualizarDescuentoItem}
              descuentoGlobal={descuentoGlobal}
              onActualizarDescuentoGlobal={setDescuentoGlobal}
            />

            {/* Botón de pago */}
            {items.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-200">
                <button
                  onClick={handleProcederPago}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl"
                >
                  <Check className="h-6 w-6" />
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
    </div>
  );
}
