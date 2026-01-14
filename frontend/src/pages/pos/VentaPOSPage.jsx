import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ShoppingCart, Trash2, Check, AlertCircle, User, RefreshCw, DollarSign, Lock, ArrowUpDown, MoreVertical, Grid3X3, Search, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BackButton from '@/components/ui/BackButton';
import { useToast } from '@/hooks/useToast';
import useAuthStore from '@/store/authStore';
import useSucursalStore from '@/store/sucursalStore';
import { useCrearVenta } from '@/hooks/useVentas';
import { useAccesoModulo } from '@/hooks/useAccesoModulo';
// Ene 2026: Reservas de stock se manejan atómicamente en el backend
// El frontend ya NO crea/cancela reservas durante el carrito
// import { useCrearReserva, useCancelarReserva, useConfirmarReservasMultiple } from '@/hooks/useInventario';
import { useSesionCajaActiva, useCategoriasPOS, useProductosPOS, useRegistrarPagosSplit } from '@/hooks/usePOS';
import { useEstadoCredito } from '@/hooks/useClienteCredito';
import { useEvaluarPromociones, useAplicarPromocion } from '@/hooks/usePromociones';
import { usePOSDisplaySync } from '@/hooks/usePOSBroadcast';
import { useVerificarCombo, useTieneModificadores } from '@/hooks/useCombosModificadores';
import BuscadorProductosPOS from '@/components/pos/BuscadorProductosPOS';
import CategoriasPOS from '@/components/pos/CategoriasPOS';
import ProductosGridPOS from '@/components/pos/ProductosGridPOS';
import CarritoVenta from '@/components/pos/CarritoVenta';
import MetodoPagoModal from '@/components/pos/MetodoPagoModal';
import POSNavTabs from '@/components/pos/POSNavTabs';
import ClienteSelector from '@/components/pos/ClienteSelector';
import SeleccionarNSModal from '@/components/pos/SeleccionarNSModal';
import AperturaCajaModal from '@/components/pos/AperturaCajaModal';
import CierreCajaModal from '@/components/pos/CierreCajaModal';
import MovimientosCajaDrawer from '@/components/pos/MovimientosCajaDrawer';
import ModificadoresProductoModal from '@/components/pos/ModificadoresProductoModal';
import PuntosCliente from '@/components/pos/PuntosCliente';
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
  const { getSucursalId } = useSucursalStore();
  const toast = useToast();
  const crearVenta = useCrearVenta();
  const registrarPagosSplit = useRegistrarPagosSplit();

  // Ene 2026: Las reservas de stock se manejan atómicamente en el backend
  // El frontend ya NO necesita crear/cancelar reservas durante el carrito
  // Esto elimina ~3 API calls por cada click en producto (problema de rate limiting)

  // Nov 2025: Obtener profesional vinculado y validar acceso a POS
  const {
    tieneAcceso,
    profesional,
    profesionalNombre,
    isLoading: isLoadingAcceso
  } = useAccesoModulo('pos');

  // Ene 2026: Sesión de caja activa
  const { data: sesionData, isLoading: isLoadingSesion } = useSesionCajaActiva();
  const sesionActiva = sesionData?.activa ? sesionData.sesion : null;
  const totalesSesion = sesionData?.totales || null;

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
  // Dic 2025: Estado para selección de números de serie (INV-5)
  const [mostrarModalNS, setMostrarModalNS] = useState(false);
  const [productoParaNS, setProductoParaNS] = useState(null);
  const pendingNSCallback = useRef(null);

  // Ene 2026: Cache local de precios para reducir requests al API
  // Key: `${productoId}-${cantidad}-${clienteId}`, Value: { precio, timestamp }
  const preciosCache = useRef(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Ene 2026: itemsRef ya no es necesario (las reservas se manejan en backend)
  // const itemsRef = useRef(items);

  // Ene 2026: Estados para sesiones de caja
  const [mostrarAperturaCaja, setMostrarAperturaCaja] = useState(false);
  const [mostrarCierreCaja, setMostrarCierreCaja] = useState(false);
  const [mostrarMovimientosCaja, setMostrarMovimientosCaja] = useState(false);
  const [mostrarMenuCaja, setMostrarMenuCaja] = useState(false);

  // Ene 2026: Estados para vista Grid de productos
  const [vistaProductos, setVistaProductos] = useState('grid'); // 'grid' | 'search'
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  // Ene 2026: Estado para cupón de descuento
  const [cuponActivo, setCuponActivo] = useState(null);

  // Ene 2026: Estado para canje de puntos de lealtad
  const [descuentoPuntos, setDescuentoPuntos] = useState(0);
  const [puntosCanjeados, setPuntosCanjeados] = useState(0);

  // Ene 2026: Estado para modal de modificadores/combos
  const [mostrarModalModificadores, setMostrarModalModificadores] = useState(false);
  const [productoParaModificadores, setProductoParaModificadores] = useState(null);

  // Ene 2026: Hook para evaluar promociones automáticas
  const sucursalId = getSucursalId() || user?.sucursal_id;
  const {
    data: promocionesData,
    isLoading: evaluandoPromociones
  } = useEvaluarPromociones(
    {
      items: items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario || item.precio_venta,
        categoria_id: item.categoria_id
      })),
      subtotal: items.reduce((sum, item) => {
        const precio = parseFloat(item.precio_unitario || item.precio_venta || 0);
        const cantidad = parseInt(item.cantidad || 1);
        const descuento = parseFloat(item.descuento_monto || 0);
        return sum + (precio * cantidad - descuento);
      }, 0),
      clienteId: clienteSeleccionado?.id,
      sucursalId
    },
    { enabled: items.length > 0 }
  );

  // Extraer datos de promociones
  const promocionesAplicadas = promocionesData?.promociones || [];
  const descuentoPromociones = promocionesData?.descuento_total || 0;
  const hayPromocionExclusiva = promocionesData?.hay_exclusiva || false;

  // Hook para aplicar promociones al confirmar venta
  const aplicarPromocion = useAplicarPromocion();

  // Ene 2026: Hooks para Grid Visual de Productos
  const { data: categorias = [], isLoading: isLoadingCategorias } = useCategoriasPOS();
  const { data: productosGrid = [], isLoading: isLoadingProductos } = useProductosPOS({
    categoria_id: categoriaActiva
  });

  // Ene 2026: Estado de crédito del cliente seleccionado (para Fiado)
  const { data: estadoCredito } = useEstadoCredito(clienteSeleccionado?.id);
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

  // Ene 2026: Mostrar modal de apertura si no hay sesión activa
  useEffect(() => {
    if (!isLoadingSesion && !sesionActiva) {
      setMostrarAperturaCaja(true);
    }
  }, [isLoadingSesion, sesionActiva]);

  // Ene 2026: Ya no necesitamos cleanup de reservas
  // Las reservas se crean atómicamente en el backend al confirmar la venta
  // Esto elimina el problema de reservas huérfanas y reduce API calls

  // Dic 2025: Función para obtener precio inteligente de un producto
  // Ene 2026: Con cache local para reducir requests
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
        ...(user?.sucursal_id && { sucursalId: user.sucursal_id })
      };

      const response = await listasPreciosApi.obtenerPrecio(productoId, params);
      const precio = response?.data?.data || null;

      // Guardar en cache
      if (precio) {
        preciosCache.current.set(cacheKey, { precio, timestamp: Date.now() });
      }

      return precio;
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
  // Ene 2026: También limpiar cache de precios
  useEffect(() => {
    preciosCache.current.clear(); // Limpiar cache al cambiar cliente
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
  // Ene 2026: Incluir descuento de cupón y promociones en el total
  const descuentoCupon = cuponActivo?.descuento_calculado || 0;
  // Si hay promoción exclusiva, no aplicar cupones
  const descuentoCuponFinal = hayPromocionExclusiva ? 0 : descuentoCupon;
  // Ene 2026: Total incluye descuento de puntos de lealtad
  const total = subtotal - montoDescuentoGlobal - descuentoCuponFinal - descuentoPromociones - descuentoPuntos;

  // Ene 2026: Sincronización con pantalla del cliente
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

  const { isDisplayConnected, broadcastPaymentStart, broadcastPaymentComplete, broadcastClear } = usePOSDisplaySync(
    cartDataForDisplay,
    { organizacion: user?.organizacion }
  );

  // Handler: Agregar producto al carrito
  // Dic 2025: Integración con listas de precios inteligentes + reservas de stock + números de serie
  // Dic 2025: Soporte para variantes de producto
  // Ene 2026: Soporte para combos y modificadores
  const handleProductoSeleccionado = async (producto) => {
    // Dic 2025: Buscar item existente por variante_id o producto_id
    const itemExistente = producto.es_variante
      ? items.find(item => item.variante_id === producto.variante_id)
      : items.find(item => item.producto_id === producto.producto_id && !item.variante_id);

    // Si el producto requiere número de serie y no está en el carrito, mostrar modal de selección
    if (producto.requiere_numero_serie && !itemExistente) {
      setProductoParaNS(producto);
      setMostrarModalNS(true);
      return;
    }

    // Ene 2026: Si es producto nuevo (no en carrito), verificar si es combo o tiene modificadores
    if (!itemExistente) {
      try {
        const { posApi } = await import('@/services/api/endpoints');
        const [esComboRes, tieneModRes] = await Promise.all([
          posApi.verificarCombo(producto.producto_id),
          posApi.tieneModificadores(producto.producto_id)
        ]);

        const esCombo = esComboRes?.data?.data?.es_combo || esComboRes?.data?.es_combo;
        const tieneModificadores = tieneModRes?.data?.data?.tiene_modificadores || tieneModRes?.data?.tiene_modificadores;

        if (esCombo || tieneModificadores) {
          setProductoParaModificadores({
            ...producto,
            id: producto.producto_id,
            precio: producto.precio_venta
          });
          setMostrarModalModificadores(true);
          return;
        }
      } catch (error) {
        console.log('[POS] Error verificando combo/modificadores, agregando producto normalmente');
      }
    }

    // Si ya está en el carrito y requiere NS, no permitir incrementar (cada NS es único)
    if (producto.requiere_numero_serie && itemExistente) {
      toast.warning(`"${producto.nombre}" requiere seleccionar otro número de serie`);
      setProductoParaNS(producto);
      setMostrarModalNS(true);
      return;
    }

    if (itemExistente) {
      // Ene 2026: Incrementar cantidad sin crear reservas (se valida en backend al confirmar)
      const nuevaCantidad = itemExistente.cantidad + 1;

      // Validación optimista de stock (solo UI, el backend valida atómicamente)
      if (nuevaCantidad > (producto.stock_actual || 999)) {
        toast.error(`Stock insuficiente. Disponible: ${producto.stock_actual}`);
        return;
      }

      // Obtener precio actualizado por cantidad (qty breaks)
      const precioResuelto = await obtenerPrecioInteligente(producto.producto_id, nuevaCantidad);

      // Actualizar item (buscar por variante_id si es variante)
      setItems(items.map(item => {
        const esElMismo = producto.es_variante
          ? item.variante_id === producto.variante_id
          : item.producto_id === producto.producto_id && !item.variante_id;

        return esElMismo
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
          : item;
      }));
      toast.success(`Cantidad de "${producto.nombre}" aumentada`);
    } else {
      await agregarProductoAlCarrito(producto, null);
    }
  };

  // Handler interno para agregar producto al carrito (con o sin NS)
  // Ene 2026: Ya NO crea reservas - el backend las maneja atómicamente al confirmar
  const agregarProductoAlCarrito = async (producto, numeroSerie = null) => {
    try {
      // Validación optimista de stock (el backend valida atómicamente al confirmar)
      if ((producto.stock_actual || 0) < 1 && !producto.es_variante) {
        toast.error(`"${producto.nombre}" sin stock disponible`);
        return;
      }

      // Obtener precio inteligente para el producto
      const precioResuelto = await obtenerPrecioInteligente(producto.producto_id, 1);

      // Agregar nuevo item con precio resuelto (sin reserva_id)
      const nuevoItem = {
        id: Date.now(), // ID temporal para el carrito
        producto_id: producto.producto_id,
        variante_id: producto.es_variante ? producto.variante_id : null,
        es_variante: producto.es_variante || false,
        // Ene 2026: Ya no hay reserva_id - el backend maneja las reservas
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
        numero_serie: numeroSerie
      };

      setItems(prev => [...prev, nuevoItem]);

      // Mostrar toast con info del precio
      if (numeroSerie) {
        toast.success(`"${producto.nombre}" (NS: ${numeroSerie.numero_serie}) agregado`);
      } else if (precioResuelto?.fuente === 'lista_precios' && precioResuelto.descuento_aplicado > 0) {
        toast.success(`"${producto.nombre}" agregado (${precioResuelto.lista_codigo}: -${precioResuelto.descuento_aplicado}%)`);
      } else {
        toast.success(`"${producto.nombre}" agregado al carrito`);
      }
    } catch (error) {
      toast.error(error.message || 'Error al agregar producto');
    }
  };

  // Handler para cuando se selecciona NS del modal
  const handleNSSeleccionado = async (numerosSeleccionados) => {
    console.log('[DEBUG NS] numerosSeleccionados:', JSON.stringify(numerosSeleccionados, null, 2));
    if (productoParaNS && numerosSeleccionados.length > 0) {
      // Agregar cada NS como un item separado
      for (const ns of numerosSeleccionados) {
        console.log('[DEBUG NS] Agregando NS al carrito:', ns);
        await agregarProductoAlCarrito(productoParaNS, ns);
      }
      setProductoParaNS(null);
    }
  };

  // Ene 2026: Handler para cuando se confirman modificadores/combo
  const handleModificadoresConfirmados = async ({ cantidad, modificadoresSeleccionados, precioUnitario, descripcionModificadores }) => {
    if (!productoParaModificadores) return;

    try {
      // Crear item con modificadores
      const nuevoItem = {
        id: Date.now(),
        producto_id: productoParaModificadores.producto_id || productoParaModificadores.id,
        nombre: productoParaModificadores.nombre,
        sku: productoParaModificadores.sku,
        precio_venta: productoParaModificadores.precio_venta || productoParaModificadores.precio,
        precio_original: productoParaModificadores.precio_venta || productoParaModificadores.precio,
        precio_unitario: precioUnitario,
        cantidad,
        descuento_monto: 0,
        stock_actual: productoParaModificadores.stock_actual,
        fuente_precio: 'precio_producto',
        fuente_detalle: descripcionModificadores ? `Con: ${descripcionModificadores}` : 'Precio base',
        modificadores: modificadoresSeleccionados,
        descripcion_modificadores: descripcionModificadores
      };

      setItems(prev => [...prev, nuevoItem]);
      toast.success(`"${productoParaModificadores.nombre}" agregado al carrito`);
    } catch (error) {
      toast.error('Error al agregar producto con modificadores');
    } finally {
      setMostrarModalModificadores(false);
      setProductoParaModificadores(null);
    }
  };

  // Handler: Actualizar cantidad de item
  // Ene 2026: Ya NO crea reservas - solo actualiza estado local y recalcula precios
  const handleActualizarCantidad = async (itemId, nuevaCantidad) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Validación optimista de stock (el backend valida atómicamente al confirmar)
    if (nuevaCantidad > (item.stock_actual || 999)) {
      toast.error(`Stock insuficiente. Disponible: ${item.stock_actual}`);
      return;
    }

    // Obtener el precio actualizado por cantidad (qty breaks)
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
  // Ene 2026: Ya no hay reservas que cancelar - solo actualiza estado local
  const handleEliminarItem = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setItems(items.filter(i => i.id !== itemId));
    toast.success(`"${item.nombre}" eliminado del carrito`);
  };

  // Handler: Vaciar carrito
  // Ene 2026: Ya no hay reservas que cancelar - solo actualiza estado local
  const handleVaciarCarrito = () => {
    setItems([]);
    setDescuentoGlobal(0);
    setCuponActivo(null);
    setDescuentoPuntos(0);
    setPuntosCanjeados(0);
    setMostrarConfirmVaciar(false);
    toast.success('Carrito vaciado');
  };

  // Ene 2026: Handler para cuando se aplica un cupón válido
  const handleCuponAplicado = useCallback((cuponData) => {
    setCuponActivo(cuponData);
    toast.success(`Cupón "${cuponData.codigo}" aplicado: -$${cuponData.descuento_calculado?.toFixed(2) || '0.00'}`);
  }, [toast]);

  // Ene 2026: Handler para cuando se quita un cupón
  const handleCuponRemovido = useCallback(() => {
    setCuponActivo(null);
    toast.info('Cupón removido');
  }, [toast]);

  // Ene 2026: Handler para cuando se canjean puntos de lealtad
  const handleCanjeAplicado = useCallback((descuento, puntos) => {
    setDescuentoPuntos(descuento);
    setPuntosCanjeados(puntos);
    toast.success(`${puntos.toLocaleString()} puntos canjeados: -$${descuento.toFixed(2)}`);
  }, [toast]);

  // Handler: Proceder al pago
  const handleProcederPago = () => {
    if (items.length === 0) {
      toast.error('Agrega productos al carrito primero');
      return;
    }

    setMostrarModalPago(true);

    // Ene 2026: Notificar a pantalla del cliente
    broadcastPaymentStart({ total, items: items.length });
  };

  // Handler: Confirmar venta
  // Ene 2026: Simplificado - el backend maneja reservas atómicamente
  // Ya NO se crean/confirman reservas desde el frontend
  const handleConfirmarVenta = async (datosPago) => {
    // Detectar si es pago split (múltiples métodos de pago)
    const esPagoSplit = Array.isArray(datosPago.pagos) && datosPago.pagos.length > 1;

    try {
      // Preparar items para el backend
      const itemsBackend = items.map(item => ({
        producto_id: item.producto_id,
        variante_id: item.variante_id || undefined,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(item.precio_unitario),
        descuento_monto: parseFloat(item.descuento_monto || 0),
        aplica_comision: true,
        notas: '',
        // Número de serie (si aplica)
        numero_serie_id: item.numero_serie?.id || undefined,
        numero_serie: item.numero_serie?.numero_serie || undefined
      }));

      // Preparar datos de la venta
      // Ene 2026: El backend crea y confirma reservas atómicamente en la transacción
      const datosVenta = {
        tipo_venta: 'directa',
        usuario_id: user.id,
        sucursal_id: getSucursalId() || 1,
        cliente_id: clienteSeleccionado?.id || undefined,
        items: itemsBackend,
        descuento_porcentaje: parseFloat(descuentoGlobal) || 0,
        descuento_monto: montoDescuentoGlobal,
        metodo_pago: esPagoSplit ? undefined : (datosPago.pagos?.[0]?.metodo_pago || datosPago.metodo_pago),
        monto_pagado: esPagoSplit ? 0 : (datosPago.pagos?.[0]?.monto || datosPago.monto_pagado),
        impuestos: 0,
        notas: '',
        cupon_id: cuponActivo?.id || undefined,
        descuento_cupon: hayPromocionExclusiva ? 0 : (cuponActivo?.descuento_calculado || 0),
        // Ene 2026: Promociones automáticas
        promociones_aplicadas: promocionesAplicadas
          .filter(p => p.id || p.promocion_id) // Filtrar promociones sin ID
          .map(p => ({
            promocion_id: p.promocion_id || p.id,
            descuento: p.descuento || 0
          })),
        descuento_promociones: descuentoPromociones,
        // Ene 2026: Canje de puntos de lealtad
        descuento_puntos: descuentoPuntos || 0,
        puntos_canjeados: puntosCanjeados || 0
      };

      // Crear venta (el backend valida stock y crea reservas atómicamente)
      const resultado = await crearVenta.mutateAsync(datosVenta);

      // Si es pago split, registrar los pagos adicionales
      if (esPagoSplit) {
        await registrarPagosSplit.mutateAsync({
          ventaId: resultado.id,
          pagos: datosPago.pagos,
          clienteId: clienteSeleccionado?.id || undefined
        });
      }

      // Mostrar éxito
      toast.success(`¡Venta ${resultado.folio} creada exitosamente!`, {
        duration: 4000
      });

      // Mostrar cambio si aplica
      if (esPagoSplit && datosPago.cambio_total > 0) {
        toast.success(`💵 Cambio a entregar: $${datosPago.cambio_total.toFixed(2)}`, {
          duration: 6000
        });
      } else if (!esPagoSplit && datosPago.metodo_pago === 'efectivo' && datosPago.cambio > 0) {
        toast.success(`💵 Cambio a entregar: $${datosPago.cambio.toFixed(2)}`, {
          duration: 6000
        });
      }

      // Ene 2026: Notificar a pantalla del cliente
      broadcastPaymentComplete({
        folio: resultado.folio,
        total: total,
        puntosGanados: resultado.puntos_ganados || 0,
      });

      // Limpiar carrito y estado
      setItems([]);
      setDescuentoGlobal(0);
      setClienteSeleccionado(null);
      setCuponActivo(null);
      setMostrarModalPago(false);

    } catch (error) {
      console.error('Error al procesar venta:', error);
      toast.error(error.response?.data?.message || error.message || 'Error al procesar la venta');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header - Mobile First */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-3 sm:px-6 sm:py-4">
        {/* Row 1: Botón de regreso + Vendedor */}
        <div className="flex items-center justify-between mb-2">
          <BackButton to="/home" label="Volver al Inicio" />

          <div className="flex items-center gap-2">
            {/* Vendedor - siempre visible pero compacto en móvil */}
            {profesionalNombre && (
              <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs sm:text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium hidden sm:inline">Vendedor:</span>
                <span className="font-medium">{profesionalNombre}</span>
              </div>
            )}

            {/* Ene 2026: Indicador de pantalla del cliente */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                isDisplayConnected
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}
              title={isDisplayConnected ? 'Pantalla del cliente conectada' : 'Pantalla del cliente desconectada'}
            >
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">{isDisplayConnected ? 'Display' : 'Sin display'}</span>
            </div>

            {/* Ene 2026: Indicador de sesión de caja */}
            {sesionActiva && (
              <div className="relative">
                <button
                  onClick={() => setMostrarMenuCaja(!mostrarMenuCaja)}
                  className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs sm:text-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium hidden sm:inline">Caja:</span>
                  <span className="font-bold">${(totalesSesion?.monto_esperado || sesionActiva.monto_inicial || 0).toFixed(2)}</span>
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Menú dropdown de caja */}
                {mostrarMenuCaja && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => {
                        setMostrarMovimientosCaja(true);
                        setMostrarMenuCaja(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      Entrada/Salida efectivo
                    </button>
                    <button
                      onClick={() => {
                        setMostrarCierreCaja(true);
                        setMostrarMenuCaja(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <Lock className="h-4 w-4" />
                      Cerrar caja
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
          {/* Columna izquierda: Productos */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Toggle Grid / Búsqueda */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setVistaProductos('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    vistaProductos === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setVistaProductos('search')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    vistaProductos === 'search'
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Búsqueda</span>
                </button>
              </div>

              {/* Contador de productos en grid */}
              {vistaProductos === 'grid' && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {productosGrid.length} productos
                </span>
              )}
            </div>

            {/* Vista Grid de productos */}
            {vistaProductos === 'grid' && (
              <>
                {/* Categorías */}
                <CategoriasPOS
                  categorias={categorias}
                  categoriaActiva={categoriaActiva}
                  onCategoriaChange={setCategoriaActiva}
                  isLoading={isLoadingCategorias}
                />

                {/* Grid de productos */}
                <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
                  <ProductosGridPOS
                    productos={productosGrid}
                    onAddToCart={(producto) => {
                      // Ene 2026: Adaptar formato del grid (id) al formato esperado (producto_id)
                      handleProductoSeleccionado({
                        ...producto,
                        producto_id: producto.id,
                        es_variante: false,
                        requiere_numero_serie: producto.requiere_numero_serie || false
                      });
                    }}
                    cartItems={items}
                    isLoading={isLoadingProductos}
                  />
                </div>
              </>
            )}

            {/* Vista Búsqueda tradicional */}
            {vistaProductos === 'search' && (
              <>
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
              </>
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
          {/* Ene 2026: min-h-0 permite que flex children se contraigan; overflow-hidden evita scroll externo */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col lg:h-[calc(100vh-16rem)] min-h-0">
            <CarritoVenta
              items={items}
              onActualizarCantidad={handleActualizarCantidad}
              onEliminarItem={handleEliminarItem}
              onActualizarDescuentoItem={handleActualizarDescuentoItem}
              descuentoGlobal={descuentoGlobal}
              onActualizarDescuentoGlobal={setDescuentoGlobal}
              recalculandoPrecios={recalculandoPrecios}
              clienteSeleccionado={clienteSeleccionado}
              cuponActivo={cuponActivo}
              onCuponAplicado={handleCuponAplicado}
              onCuponRemovido={handleCuponRemovido}
              promocionesAplicadas={promocionesAplicadas}
              descuentoPromociones={descuentoPromociones}
              hayPromocionExclusiva={hayPromocionExclusiva}
              evaluandoPromociones={evaluandoPromociones}
            />

            {/* Ene 2026: Sección de puntos de lealtad */}
            {clienteSeleccionado && items.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <PuntosCliente
                  clienteId={clienteSeleccionado.id}
                  clienteNombre={clienteSeleccionado.nombre_completo || clienteSeleccionado.nombre}
                  totalCarrito={subtotal - montoDescuentoGlobal - descuentoCuponFinal - descuentoPromociones}
                  tieneCupon={!!cuponActivo}
                  onCanjeAplicado={handleCanjeAplicado}
                />
                {/* Mostrar descuento de puntos aplicado */}
                {descuentoPuntos > 0 && (
                  <div className="mt-2 flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Descuento por {puntosCanjeados.toLocaleString()} puntos
                    </span>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      -${descuentoPuntos.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

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
        clienteId={clienteSeleccionado?.id}
        clienteCredito={clienteCredito}
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

      {/* Modal de selección de número de serie (Dic 2025 - INV-5) */}
      <SeleccionarNSModal
        isOpen={mostrarModalNS}
        onClose={() => {
          setMostrarModalNS(false);
          setProductoParaNS(null);
        }}
        producto={productoParaNS}
        cantidad={1}
        onSeleccionar={handleNSSeleccionado}
      />

      {/* Ene 2026: Modal de modificadores/combos */}
      <ModificadoresProductoModal
        isOpen={mostrarModalModificadores}
        onClose={() => {
          setMostrarModalModificadores(false);
          setProductoParaModificadores(null);
        }}
        producto={productoParaModificadores}
        onConfirmar={handleModificadoresConfirmados}
      />

      {/* Ene 2026: Modal de apertura de caja */}
      <AperturaCajaModal
        isOpen={mostrarAperturaCaja}
        onClose={() => {
          // Solo permitir cerrar si hay sesión activa
          if (sesionActiva) {
            setMostrarAperturaCaja(false);
          }
        }}
        onSuccess={() => {
          setMostrarAperturaCaja(false);
        }}
      />

      {/* Ene 2026: Modal de cierre de caja */}
      <CierreCajaModal
        isOpen={mostrarCierreCaja}
        onClose={() => setMostrarCierreCaja(false)}
        sesionId={sesionActiva?.id}
        onSuccess={() => {
          setMostrarCierreCaja(false);
          // Mostrar modal de apertura para nueva sesión
          setMostrarAperturaCaja(true);
        }}
      />

      {/* Ene 2026: Drawer de movimientos de caja */}
      <MovimientosCajaDrawer
        isOpen={mostrarMovimientosCaja}
        onClose={() => setMostrarMovimientosCaja(false)}
        sesionId={sesionActiva?.id}
      />

      {/* Ene 2026: Click fuera para cerrar menú de caja */}
      {mostrarMenuCaja && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMostrarMenuCaja(false)}
        />
      )}
    </div>
  );
}
