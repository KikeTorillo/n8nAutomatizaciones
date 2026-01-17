import { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import useAuthStore, { selectUser } from '@/store/authStore';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { useCrearVenta } from '@/hooks/useVentas';
import { useAccesoModulo } from '@/hooks/useAccesoModulo';
import { useSesionCajaActiva, useCategoriasPOS, useProductosPOS, useRegistrarPagosSplit } from '@/hooks/usePOS';
import { useEstadoCredito } from '@/hooks/useClienteCredito';
import { useEvaluarPromociones } from '@/hooks/usePromociones';
import { usePOSDisplaySync } from '@/hooks/usePOSBroadcast';
import { usePOSCart } from '@/hooks/usePOSCart';
import { useModalManager } from '@/hooks/useModalManager';
import POSHeader from '@/components/pos/POSHeader';
import POSProductsSection from '@/components/pos/POSProductsSection';
import POSNavTabs from '@/components/pos/POSNavTabs';
import CarritoVenta from '@/components/pos/CarritoVenta';
import PuntosCliente from '@/components/pos/PuntosCliente';
import MetodoPagoModal from '@/components/pos/MetodoPagoModal';
import SeleccionarNSModal from '@/components/pos/SeleccionarNSModal';
import AperturaCajaModal from '@/components/pos/AperturaCajaModal';
import CierreCajaModal from '@/components/pos/CierreCajaModal';
import MovimientosCajaDrawer from '@/components/pos/MovimientosCajaDrawer';
import ModificadoresProductoModal from '@/components/pos/ModificadoresProductoModal';
import { ConfirmDialog } from '@/components/ui';
import { playCashRegisterSound } from '@/utils/audioFeedback';

/**
 * Página principal del punto de venta (POS)
 * Ene 2026: Refactorizado con usePOSCart, useModalManager y componentes extraídos
 */
export default function VentaPOSPage() {
  const navigate = useNavigate();
  const user = useAuthStore(selectUser);
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const toast = useToast();
  const crearVenta = useCrearVenta();
  const registrarPagosSplit = useRegistrarPagosSplit();
  const sucursalId = getSucursalId() || user?.sucursal_id;

  // ==================== ACCESO Y SESIÓN ====================
  const { tieneAcceso, profesional, profesionalNombre, isLoading: isLoadingAcceso } = useAccesoModulo('pos');
  const { data: sesionData, isLoading: isLoadingSesion } = useSesionCajaActiva();
  const sesionActiva = sesionData?.activa ? sesionData.sesion : null;
  const totalesSesion = sesionData?.totales || null;

  useEffect(() => {
    if (!isLoadingAcceso && profesional && !tieneAcceso) {
      toast.error('No tienes acceso al módulo de Punto de Venta');
      navigate('/home');
    }
  }, [tieneAcceso, profesional, isLoadingAcceso, navigate, toast]);

  // ==================== MODALES ====================
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    pago: { isOpen: false, data: null },
    confirmVaciar: { isOpen: false, data: null },
    seleccionNS: { isOpen: false, data: null },
    modificadores: { isOpen: false, data: null },
    aperturaCaja: { isOpen: false, data: null },
    cierreCaja: { isOpen: false, data: null },
    movimientosCaja: { isOpen: false, data: null },
    menuCaja: { isOpen: false, data: null },
  });

  // ==================== PROMOCIONES ====================
  const [promocionesParams, setPromocionesParams] = useState({ items: [], subtotal: 0 });
  const { data: promocionesData, isLoading: evaluandoPromociones } = useEvaluarPromociones(
    { ...promocionesParams, clienteId: null, sucursalId },
    { enabled: promocionesParams.items.length > 0 }
  );
  const promocionesAplicadas = promocionesData?.promociones || [];
  const descuentoPromociones = promocionesData?.descuento_total || 0;
  const hayPromocionExclusiva = promocionesData?.hay_exclusiva || false;

  // ==================== CARRITO ====================
  const cart = usePOSCart({ hayPromocionExclusiva, descuentoPromociones });

  useEffect(() => {
    if (cart.items.length > 0) {
      setPromocionesParams({
        items: cart.items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario || item.precio_venta,
          categoria_id: item.categoria_id
        })),
        subtotal: cart.subtotal,
        clienteId: cart.clienteSeleccionado?.id
      });
    } else {
      setPromocionesParams({ items: [], subtotal: 0 });
    }
  }, [cart.items, cart.subtotal, cart.clienteSeleccionado?.id]);

  // ==================== ESTADO UI ====================
  const [vistaProductos, setVistaProductos] = useState('grid');
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  // ==================== QUERIES ====================
  const { data: categorias = [], isLoading: isLoadingCategorias } = useCategoriasPOS();
  const { data: productosGrid = [], isLoading: isLoadingProductos } = useProductosPOS({ categoria_id: categoriaActiva });
  const { data: estadoCredito } = useEstadoCredito(cart.clienteSeleccionado?.id);

  const clienteCredito = useMemo(() => {
    if (!estadoCredito) return null;
    return {
      permite_credito: estadoCredito.permite_credito,
      limite_credito: estadoCredito.limite_credito || 0,
      saldo_credito: estadoCredito.saldo_credito || 0,
      disponible: (estadoCredito.limite_credito || 0) - (estadoCredito.saldo_credito || 0),
      credito_suspendido: estadoCredito.credito_suspendido
    };
  }, [estadoCredito]);

  // ==================== DISPLAY ====================
  const { isDisplayConnected, broadcastPaymentStart, broadcastPaymentComplete } = usePOSDisplaySync(
    cart.cartDataForDisplay,
    { organizacion: user?.organizacion }
  );

  // ==================== EFECTOS ====================
  useEffect(() => {
    if (!isLoadingSesion && !sesionActiva) {
      openModal('aperturaCaja');
    }
  }, [isLoadingSesion, sesionActiva, openModal]);

  // ==================== HANDLERS ====================
  const handleProductoSeleccionado = async (producto) => {
    const result = await cart.agregarProducto(producto);
    if (result?.needsNS) {
      openModal('seleccionNS', { producto: result.producto });
      return;
    }
    if (result?.success === undefined && !result?.needsNS) {
      try {
        const { posApi } = await import('@/services/api/endpoints');
        const [esComboRes, tieneModRes] = await Promise.all([
          posApi.verificarCombo(producto.producto_id),
          posApi.tieneModificadores(producto.producto_id)
        ]);
        const esCombo = esComboRes?.data?.data?.es_combo || esComboRes?.data?.es_combo;
        const tieneModificadores = tieneModRes?.data?.data?.tiene_modificadores || tieneModRes?.data?.tiene_modificadores;
        if (esCombo || tieneModificadores) {
          openModal('modificadores', { producto: { ...producto, id: producto.producto_id, precio: producto.precio_venta } });
        }
      } catch (error) {
        console.log('[POS] Error verificando combo/modificadores');
      }
    }
  };

  const handleNSSeleccionado = async (numerosSeleccionados) => {
    const modalData = getModalData('seleccionNS');
    if (modalData?.producto && numerosSeleccionados.length > 0) {
      await cart.agregarConNS(modalData.producto, numerosSeleccionados);
    }
    closeModal('seleccionNS');
  };

  const handleModificadoresConfirmados = async (data) => {
    const modalData = getModalData('modificadores');
    if (modalData?.producto) {
      await cart.agregarConModificadores({ producto: modalData.producto, ...data });
    }
    closeModal('modificadores');
  };

  const handleProcederPago = () => {
    if (cart.items.length === 0) {
      toast.error('Agrega productos al carrito primero');
      return;
    }
    openModal('pago');
    broadcastPaymentStart({ total: cart.total, items: cart.items.length });
  };

  const handleConfirmarVenta = async (datosPago) => {
    const esPagoSplit = Array.isArray(datosPago.pagos) && datosPago.pagos.length > 1;
    try {
      const datosVenta = {
        tipo_venta: 'directa',
        usuario_id: user.id,
        sucursal_id: sucursalId || 1,
        cliente_id: cart.clienteSeleccionado?.id || undefined,
        items: cart.prepararItemsParaVenta(),
        descuento_porcentaje: parseFloat(cart.descuentoGlobal) || 0,
        descuento_monto: cart.montoDescuentoGlobal,
        metodo_pago: esPagoSplit ? undefined : (datosPago.pagos?.[0]?.metodo_pago || datosPago.metodo_pago),
        monto_pagado: esPagoSplit ? 0 : (datosPago.pagos?.[0]?.monto || datosPago.monto_pagado),
        impuestos: 0,
        notas: '',
        cupon_id: cart.cuponActivo?.id || undefined,
        descuento_cupon: hayPromocionExclusiva ? 0 : (cart.cuponActivo?.descuento_calculado || 0),
        promociones_aplicadas: promocionesAplicadas.filter(p => p.id || p.promocion_id).map(p => ({ promocion_id: p.promocion_id || p.id, descuento: p.descuento || 0 })),
        descuento_promociones: descuentoPromociones,
        descuento_puntos: cart.descuentoPuntos || 0,
        puntos_canjeados: cart.puntosCanjeados || 0
      };

      const resultado = await crearVenta.mutateAsync(datosVenta);
      if (esPagoSplit) {
        await registrarPagosSplit.mutateAsync({ ventaId: resultado.id, pagos: datosPago.pagos, clienteId: cart.clienteSeleccionado?.id || undefined });
      }

      playCashRegisterSound();
      toast.success(`Venta ${resultado.folio} creada exitosamente!`, { duration: 4000 });

      if (esPagoSplit && datosPago.cambio_total > 0) {
        toast.success(`Cambio a entregar: $${datosPago.cambio_total.toFixed(2)}`, { duration: 6000 });
      } else if (!esPagoSplit && datosPago.metodo_pago === 'efectivo' && datosPago.cambio > 0) {
        toast.success(`Cambio a entregar: $${datosPago.cambio.toFixed(2)}`, { duration: 6000 });
      }

      broadcastPaymentComplete({ folio: resultado.folio, total: cart.total, puntosGanados: resultado.puntos_ganados || 0 });
      cart.limpiarDespuesDeVenta();
      closeModal('pago');
    } catch (error) {
      console.error('Error al procesar venta:', error);
      toast.error(error.response?.data?.message || error.message || 'Error al procesar la venta');
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <POSHeader
        profesionalNombre={profesionalNombre}
        isDisplayConnected={isDisplayConnected}
        sesionActiva={sesionActiva}
        totalesSesion={totalesSesion}
        clienteSeleccionado={cart.clienteSeleccionado}
        onClienteChange={cart.setClienteSeleccionado}
        itemsCount={cart.items.length}
        onVaciarCarrito={() => openModal('confirmVaciar')}
        isMenuCajaOpen={isOpen('menuCaja')}
        onToggleMenuCaja={() => isOpen('menuCaja') ? closeModal('menuCaja') : openModal('menuCaja')}
        onMovimientosCaja={() => { openModal('movimientosCaja'); closeModal('menuCaja'); }}
        onCierreCaja={() => { openModal('cierreCaja'); closeModal('menuCaja'); }}
      />

      <POSNavTabs />

      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-6 space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
          <POSProductsSection
            vistaProductos={vistaProductos}
            onVistaChange={setVistaProductos}
            categorias={categorias}
            categoriaActiva={categoriaActiva}
            onCategoriaChange={setCategoriaActiva}
            isLoadingCategorias={isLoadingCategorias}
            productosGrid={productosGrid}
            isLoadingProductos={isLoadingProductos}
            cartItems={cart.items}
            onProductoSeleccionado={handleProductoSeleccionado}
            subtotal={cart.subtotal}
            total={cart.total}
          />

          {/* Carrito */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col lg:h-[calc(100vh-16rem)] min-h-0">
            <CarritoVenta
              items={cart.items}
              onActualizarCantidad={cart.actualizarCantidad}
              onEliminarItem={cart.eliminarItem}
              onActualizarDescuentoItem={cart.actualizarDescuentoItem}
              descuentoGlobal={cart.descuentoGlobal}
              onActualizarDescuentoGlobal={cart.setDescuentoGlobal}
              recalculandoPrecios={cart.recalculandoPrecios}
              clienteSeleccionado={cart.clienteSeleccionado}
              cuponActivo={cart.cuponActivo}
              onCuponAplicado={cart.aplicarCupon}
              onCuponRemovido={cart.removerCupon}
              promocionesAplicadas={promocionesAplicadas}
              descuentoPromociones={descuentoPromociones}
              hayPromocionExclusiva={hayPromocionExclusiva}
              evaluandoPromociones={evaluandoPromociones}
            />

            {cart.clienteSeleccionado && cart.items.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <PuntosCliente
                  clienteId={cart.clienteSeleccionado.id}
                  clienteNombre={cart.clienteSeleccionado.nombre_completo || cart.clienteSeleccionado.nombre}
                  totalCarrito={cart.subtotal - cart.montoDescuentoGlobal - cart.descuentoCuponFinal - descuentoPromociones}
                  tieneCupon={!!cart.cuponActivo}
                  onCanjeAplicado={cart.aplicarCanjePuntos}
                />
                {cart.descuentoPuntos > 0 && (
                  <div className="mt-2 flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm text-green-700 dark:text-green-300">Descuento por {cart.puntosCanjeados.toLocaleString()} puntos</span>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">-${cart.descuentoPuntos.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {cart.items.length > 0 && (
              <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <button onClick={handleProcederPago} className="w-full py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg shadow-lg hover:shadow-xl">
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                  PROCEDER AL PAGO
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <MetodoPagoModal isOpen={isOpen('pago')} onClose={() => closeModal('pago')} total={cart.total} onConfirmar={handleConfirmarVenta} isLoading={crearVenta.isPending} clienteId={cart.clienteSeleccionado?.id} clienteCredito={clienteCredito} />
      <ConfirmDialog isOpen={isOpen('confirmVaciar')} onClose={() => closeModal('confirmVaciar')} onConfirm={() => { cart.vaciarCarrito(); closeModal('confirmVaciar'); }} title="Vaciar carrito" message="¿Estás seguro de vaciar el carrito? Se eliminarán todos los productos agregados." confirmText="Vaciar" cancelText="Cancelar" variant="warning" />
      <SeleccionarNSModal isOpen={isOpen('seleccionNS')} onClose={() => closeModal('seleccionNS')} producto={getModalData('seleccionNS')?.producto} cantidad={1} onSeleccionar={handleNSSeleccionado} />
      <ModificadoresProductoModal isOpen={isOpen('modificadores')} onClose={() => closeModal('modificadores')} producto={getModalData('modificadores')?.producto} onConfirmar={handleModificadoresConfirmados} />
      <AperturaCajaModal isOpen={isOpen('aperturaCaja')} onClose={() => { if (sesionActiva) closeModal('aperturaCaja'); }} onSuccess={() => closeModal('aperturaCaja')} />
      <CierreCajaModal isOpen={isOpen('cierreCaja')} onClose={() => closeModal('cierreCaja')} sesionId={sesionActiva?.id} onSuccess={() => { closeModal('cierreCaja'); openModal('aperturaCaja'); }} />
      <MovimientosCajaDrawer isOpen={isOpen('movimientosCaja')} onClose={() => closeModal('movimientosCaja')} sesionId={sesionActiva?.id} />
      {isOpen('menuCaja') && <div className="fixed inset-0 z-40" onClick={() => closeModal('menuCaja')} />}
    </div>
  );
}
