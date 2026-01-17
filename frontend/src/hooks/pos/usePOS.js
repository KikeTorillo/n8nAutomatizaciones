import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi, inventarioApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { sanitizeParams } from '@/lib/params';

// ==================== VENTAS POS ====================
// ✅ FEATURE: Multi-sucursal - Los hooks inyectan sucursal_id automáticamente

/**
 * Hook para listar ventas con filtros
 * @param {Object} params - { estado?, estado_pago?, tipo_venta?, cliente_id?, profesional_id?, metodo_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
 */
export function useVentas(params = {}) {
  return useQuery({
    queryKey: ['ventas-pos', params],
    queryFn: async () => {
      const response = await posApi.listarVentas(sanitizeParams(params));
      return response.data.data || { ventas: [], total: 0 };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener venta por ID con sus items
 */
export function useVenta(id) {
  return useQuery({
    queryKey: ['venta-pos', id],
    queryFn: async () => {
      const response = await posApi.obtenerVenta(id);
      return response.data.data || { venta: null, items: [] };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para crear venta con items
 */
export function useCrearVenta() {
  const queryClient = useQueryClient();
  // ✅ Multi-sucursal: Obtener sucursal activa del store
  // Ene 2026: Usar selector para evitar re-renders
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (data) => {
      // DEBUG: Ver valor de monto_pagado antes de sanitizar
      console.log('[DEBUG usePOS.crearVenta] data.monto_pagado:', data.monto_pagado, 'tipo:', typeof data.monto_pagado);
      const sanitized = {
        ...data,
        cliente_id: data.cliente_id || undefined,
        cita_id: data.cita_id || undefined,
        profesional_id: data.profesional_id || undefined,
        monto_pagado: data.monto_pagado ?? undefined,
        fecha_apartado: data.fecha_apartado || undefined,
        fecha_vencimiento_apartado: data.fecha_vencimiento_apartado || undefined,
        notas: data.notas?.trim() || undefined,
        // ✅ Multi-sucursal: Inyectar sucursal_id automáticamente
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
      };

      const response = await posApi.crearVenta(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventas-pos']);
      // Ene 2026: Removidas invalidaciones agresivas para reducir requests
      // ['productos'] y ['movimientos'] se refrescan con staleTime (5 min)
      queryClient.invalidateQueries(['stock-critico']); // Solo alertas de stock bajo
      queryClient.invalidateQueries(['corte-caja']);
      queryClient.invalidateQueries(['ventas-diarias']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        400: 'Datos inválidos. Revisa items y cantidades',
        403: 'No tienes permisos para crear ventas o alcanzaste el límite de tu plan',
        404: 'Uno o más productos no fueron encontrados',
        409: 'Stock insuficiente para completar la venta',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al crear venta';
      throw new Error(message);
    },
  });
}

/**
 * Hook para actualizar venta
 */
export function useActualizarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        ...data,
        cliente_id: data.cliente_id || undefined,
        profesional_id: data.profesional_id || undefined,
        fecha_apartado: data.fecha_apartado || undefined,
        fecha_vencimiento_apartado: data.fecha_vencimiento_apartado || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await posApi.actualizarVenta(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['venta-pos', variables.id]);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Venta no encontrada',
        400: 'Datos inválidos',
        403: 'No tienes permisos para actualizar ventas',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al actualizar venta';
      throw new Error(message);
    },
  });
}

/**
 * Hook para actualizar estado de venta
 */
export function useActualizarEstadoVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado }) => {
      const response = await posApi.actualizarEstadoVenta(id, { estado });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['venta-pos', variables.id]);
      if (variables.estado === 'completada') {
        queryClient.invalidateQueries(['productos']);
        queryClient.invalidateQueries(['movimientos']);
      }
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw new Error('Error al actualizar estado de venta');
    },
  });
}

/**
 * Hook para registrar pago en venta
 */
export function useRegistrarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, monto_pago, metodo_pago, pago_id }) => {
      const response = await posApi.registrarPago(id, {
        monto_pago,
        metodo_pago,
        pago_id: pago_id || undefined,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['venta-pos', variables.id]);
      queryClient.invalidateQueries(['corte-caja']);
      queryClient.invalidateQueries(['ventas-diarias']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Venta no encontrada',
        400: 'Monto de pago inválido',
        409: 'El pago excede el monto pendiente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al registrar pago';
      throw new Error(message);
    },
  });
}

/**
 * Hook para cancelar venta y revertir stock
 */
export function useCancelarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo, usuario_id }) => {
      const response = await posApi.cancelarVenta(id, {
        motivo: motivo?.trim() || undefined,
        usuario_id,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['venta-pos', variables.id]);
      queryClient.invalidateQueries(['productos']); // Stock revertido
      queryClient.invalidateQueries(['movimientos']); // Movimiento de reversión
      queryClient.invalidateQueries(['corte-caja']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Venta no encontrada',
        400: 'No se puede cancelar una venta ya cancelada',
        403: 'No tienes permisos para cancelar ventas',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al cancelar venta';
      throw new Error(message);
    },
  });
}

/**
 * Hook para procesar devolución parcial o total de items
 */
export function useDevolverItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items_devueltos, motivo, usuario_id }) => {
      const response = await posApi.devolverItems(id, {
        items_devueltos,
        motivo: motivo?.trim() || undefined,
        usuario_id,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['venta-pos', variables.id]);
      queryClient.invalidateQueries(['productos']); // Stock revertido
      queryClient.invalidateQueries(['movimientos']); // Movimiento de devolución
      queryClient.invalidateQueries(['corte-caja']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Venta o items no encontrados',
        400: 'Cantidad a devolver inválida',
        403: 'No tienes permisos para procesar devoluciones',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al procesar devolución';
      throw new Error(message);
    },
  });
}

/**
 * Hook para agregar items a venta existente
 */
export function useAgregarItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items }) => {
      const response = await posApi.agregarItems(id, { items });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['venta-pos', variables.id]);
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['movimientos']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Venta o productos no encontrados',
        400: 'Datos de items inválidos',
        409: 'Stock insuficiente para agregar items',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al agregar items';
      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar venta (marca como cancelada y revierte stock)
 */
export function useEliminarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo, usuario_id }) => {
      const response = await posApi.eliminarVenta(id, { motivo, usuario_id });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['movimientos']);
      queryClient.invalidateQueries(['corte-caja']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Venta no encontrada',
        403: 'No tienes permisos para eliminar ventas',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar venta';
      throw new Error(message);
    },
  });
}

// ==================== REPORTES POS ====================

/**
 * Hook para obtener corte de caja por período
 * @param {Object} params - { fecha_inicio, fecha_fin, usuario_id? }
 */
export function useCorteCaja(params) {
  return useQuery({
    queryKey: ['corte-caja', params],
    queryFn: async () => {
      const response = await posApi.obtenerCorteCaja(sanitizeParams(params));
      return response.data.data || {
        resumen: {},
        totales_por_metodo: [],
        ventas_por_hora: [],
        top_productos: [],
      };
    },
    enabled: !!params.fecha_inicio && !!params.fecha_hasta,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener reporte de ventas diarias
 * @param {Object} params - { fecha, profesional_id?, usuario_id? }
 */
export function useVentasDiarias(params) {
  return useQuery({
    queryKey: ['ventas-diarias', params],
    queryFn: async () => {
      const response = await posApi.obtenerVentasDiarias(sanitizeParams(params));
      return response.data.data || {
        resumen: {},
        ventas_por_hora: [],
        top_productos: [],
        detalle: [],
      };
    },
    enabled: !!params.fecha,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// ==================== PAGO SPLIT (Ene 2026) ====================

/**
 * Hook para registrar pagos split (múltiples métodos de pago)
 */
export function useRegistrarPagosSplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ventaId, pagos, clienteId }) => {
      const data = {
        pagos,
        cliente_id: clienteId || undefined,
      };

      const response = await posApi.registrarPagosSplit(ventaId, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['venta-pos', variables.ventaId]);
      queryClient.invalidateQueries(['pagos-venta', variables.ventaId]);
      queryClient.invalidateQueries(['corte-caja']);
      queryClient.invalidateQueries(['ventas-diarias']);
      queryClient.invalidateQueries(['sesion-caja-activa']);
      // Si es pago a cuenta, invalidar crédito del cliente
      if (variables.clienteId) {
        queryClient.invalidateQueries(['cliente-credito', variables.clienteId]);
      }
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        400: 'Datos de pago inválidos',
        404: 'Venta no encontrada',
        403: 'No tienes permisos para registrar pagos',
        409: 'El monto de pagos excede el total de la venta',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al registrar pagos';
      throw new Error(message);
    },
  });
}

/**
 * Hook para obtener desglose de pagos de una venta
 */
export function usePagosVenta(ventaId) {
  return useQuery({
    queryKey: ['pagos-venta', ventaId],
    queryFn: async () => {
      const response = await posApi.obtenerPagosVenta(ventaId);
      return response.data.data || { venta: null, pagos: [], resumen: {} };
    },
    enabled: !!ventaId,
    staleTime: 1000 * 60 * 2,
  });
}

// ==================== SESIONES DE CAJA ====================

/**
 * Hook para obtener sesión de caja activa del usuario
 * @param {Object} params - { sucursal_id? }
 */
export function useSesionCajaActiva(params = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useQuery({
    queryKey: ['sesion-caja-activa', params],
    queryFn: async () => {
      const sucursalId = params.sucursal_id || getSucursalId();
      const response = await posApi.obtenerSesionActiva({ sucursal_id: sucursalId });
      return response.data.data || { activa: false, sesion: null, totales: null };
    },
    staleTime: 1000 * 60 * 3, // 3 minutos - Ene 2026: aumentado para reducir requests
    refetchOnWindowFocus: false, // Ene 2026: desactivado para evitar refetch innecesario
  });
}

/**
 * Hook para obtener sesión de caja por ID
 */
export function useSesionCaja(id) {
  return useQuery({
    queryKey: ['sesion-caja', id],
    queryFn: async () => {
      const response = await posApi.obtenerSesionCaja(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener resumen de sesión para cierre
 * Ene 2026: Aumentado staleTime para reducir requests en POS
 */
export function useResumenSesionCaja(id) {
  return useQuery({
    queryKey: ['resumen-sesion-caja', id],
    queryFn: async () => {
      const response = await posApi.obtenerResumenSesion(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos - Ene 2026: aumentado para reducir requests
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar sesiones de caja con filtros
 * @param {Object} params - { sucursal_id?, usuario_id?, estado?, fecha_desde?, fecha_hasta?, limit?, offset? }
 */
export function useSesionesCaja(params = {}) {
  return useQuery({
    queryKey: ['sesiones-caja', params],
    queryFn: async () => {
      const response = await posApi.listarSesionesCaja(sanitizeParams(params));
      return response.data.data || { sesiones: [], total: 0 };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - Ene 2026: aumentado
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar movimientos de una sesión
 * Ene 2026: Aumentado staleTime para reducir requests en POS
 */
export function useMovimientosCaja(sesionId) {
  return useQuery({
    queryKey: ['movimientos-caja', sesionId],
    queryFn: async () => {
      const response = await posApi.listarMovimientosCaja(sesionId);
      return response.data.data || [];
    },
    enabled: !!sesionId,
    staleTime: 1000 * 60 * 5, // 5 minutos - Ene 2026: aumentado para reducir requests
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para abrir sesión de caja
 */
export function useAbrirSesionCaja() {
  const queryClient = useQueryClient();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        sucursal_id: data.sucursal_id || getSucursalId(),
        monto_inicial: data.monto_inicial || 0,
        nota_apertura: data.nota_apertura?.trim() || undefined,
      };

      const response = await posApi.abrirSesionCaja(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sesion-caja-activa']);
      queryClient.invalidateQueries(['sesiones-caja']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        400: 'Datos inválidos para abrir caja',
        403: 'No tienes permisos para abrir caja',
        409: 'Ya existe una sesión de caja abierta',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al abrir sesión de caja';
      throw new Error(message);
    },
  });
}

/**
 * Hook para cerrar sesión de caja
 */
export function useCerrarSesionCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        sesion_id: data.sesion_id,
        monto_contado: data.monto_contado,
        nota_cierre: data.nota_cierre?.trim() || undefined,
        desglose: data.desglose || undefined,
      };

      const response = await posApi.cerrarSesionCaja(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sesion-caja-activa']);
      queryClient.invalidateQueries(['sesiones-caja']);
      queryClient.invalidateQueries(['resumen-sesion-caja']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        400: 'Datos inválidos para cerrar caja',
        403: 'No tienes permisos para cerrar caja',
        404: 'Sesión de caja no encontrada',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al cerrar sesión de caja';
      throw new Error(message);
    },
  });
}

/**
 * Hook para registrar movimiento de efectivo (entrada/salida)
 */
export function useRegistrarMovimientoCaja() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sesionId, data }) => {
      const sanitized = {
        tipo: data.tipo,
        monto: data.monto,
        motivo: data.motivo?.trim(),
      };

      const response = await posApi.registrarMovimientoCaja(sesionId, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['sesion-caja-activa']);
      queryClient.invalidateQueries(['movimientos-caja', variables.sesionId]);
      queryClient.invalidateQueries(['resumen-sesion-caja', variables.sesionId]);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        400: 'Datos inválidos para el movimiento',
        403: 'No tienes permisos para registrar movimientos de caja',
        404: 'Sesión de caja no encontrada o ya está cerrada',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al registrar movimiento de caja';
      throw new Error(message);
    },
  });
}

// ==================== GRID VISUAL PRODUCTOS ====================

/**
 * Hook para obtener categorías de productos para POS
 * Solo categorías activas con conteo de productos
 */
export function useCategoriasPOS() {
  return useQuery({
    queryKey: ['categorias-pos'],
    queryFn: async () => {
      const response = await inventarioApi.listarCategorias({
        solo_activas: true,
        incluir_conteo: true
      });
      return response.data.data?.categorias || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - categorías cambian poco
    refetchOnWindowFocus: false, // Ene 2026: evitar refetch innecesario
  });
}

/**
 * Hook para obtener productos para el grid visual del POS
 * @param {Object} params - { categoria_id?, limit? }
 */
export function useProductosPOS(params = {}) {
  return useQuery({
    queryKey: ['productos-pos', params],
    queryFn: async () => {
      const response = await inventarioApi.listarProductos({
        solo_activos: true,
        solo_con_stock: false, // Mostrar todos, pero indicar agotados
        categoria_id: params.categoria_id || undefined,
        limit: params.limit || 50,
        orden: 'nombre',
        direccion: 'asc'
      });
      return response.data.data?.productos || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - Ene 2026: aumentado para reducir requests
    refetchOnWindowFocus: false, // Ene 2026: evitar refetch innecesario
  });
}
