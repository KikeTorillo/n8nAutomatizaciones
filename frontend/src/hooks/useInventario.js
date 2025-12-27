import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi, ordenesCompraApi } from '@/services/api/endpoints';
import useSucursalStore from '@/store/sucursalStore';

// ==================== MOVIMIENTOS DE INVENTARIO ====================
// ✅ FEATURE: Multi-sucursal - Los hooks inyectan sucursal_id automáticamente

/**
 * Hook para listar movimientos con filtros
 * @param {Object} params - { tipo_movimiento?, categoria?, producto_id?, proveedor_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
 */
export function useMovimientos(params = {}) {
  return useQuery({
    queryKey: ['movimientos', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.listarMovimientos(sanitizedParams);
      return response.data.data || { movimientos: [], total: 0 };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos (movimientos requieren frescura)
  });
}

/**
 * Hook para obtener kardex de un producto
 * @param {number} productoId
 * @param {Object} params - { tipo_movimiento?, fecha_desde?, fecha_hasta?, proveedor_id?, limit?, offset? }
 */
export function useKardex(productoId, params = {}) {
  return useQuery({
    queryKey: ['kardex', productoId, params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.obtenerKardex(productoId, sanitizedParams);
      return response.data.data || { kardex: [], producto: null };
    },
    enabled: !!productoId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener estadísticas de movimientos
 * @param {Object} params - { fecha_desde, fecha_hasta }
 */
export function useEstadisticasMovimientos(params) {
  return useQuery({
    queryKey: ['estadisticas-movimientos', params],
    queryFn: async () => {
      const response = await inventarioApi.obtenerEstadisticasMovimientos(params);
      return response.data.data.estadisticas || {};
    },
    enabled: !!params.fecha_desde && !!params.fecha_hasta,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para registrar movimiento de inventario
 */
export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();
  // ✅ Multi-sucursal: Obtener sucursal activa del store
  const { getSucursalId } = useSucursalStore();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        costo_unitario: data.costo_unitario || undefined,
        proveedor_id: data.proveedor_id || undefined,
        venta_pos_id: data.venta_pos_id || undefined,
        cita_id: data.cita_id || undefined,
        usuario_id: data.usuario_id || undefined,
        referencia: data.referencia?.trim() || undefined,
        motivo: data.motivo?.trim() || undefined,
        fecha_vencimiento: data.fecha_vencimiento || undefined,
        lote: data.lote?.trim() || undefined,
        // ✅ Multi-sucursal: Inyectar sucursal_id automáticamente
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
      };

      const response = await inventarioApi.registrarMovimiento(sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['movimientos']);
      queryClient.invalidateQueries(['kardex', variables.producto_id]);
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['producto', variables.producto_id]);
      queryClient.invalidateQueries(['stock-critico']);
      queryClient.invalidateQueries(['valor-inventario']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Producto no encontrado',
        400: 'Datos inválidos. Revisa cantidad y tipo de movimiento',
        403: 'No tienes permisos para registrar movimientos',
        409: 'Stock insuficiente para realizar la salida',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al registrar movimiento';
      throw new Error(message);
    },
  });
}

// ==================== ALERTAS DE INVENTARIO ====================

/**
 * Hook para listar alertas con filtros
 * @param {Object} params - { tipo_alerta?, nivel?, leida?, producto_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
 */
export function useAlertas(params = {}) {
  return useQuery({
    queryKey: ['alertas', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.listarAlertas(sanitizedParams);
      return response.data.data || { alertas: [], total: 0 };
    },
    staleTime: 1000 * 60 * 1, // 1 minuto (alertas requieren actualización frecuente)
  });
}

/**
 * Hook para obtener dashboard de alertas
 */
export function useDashboardAlertas() {
  return useQuery({
    queryKey: ['dashboard-alertas'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerDashboardAlertas();
      return response.data.data || { resumen: {}, alertas_recientes: [] };
    },
    staleTime: 1000 * 60 * 1, // 1 minuto
  });
}

/**
 * Hook para obtener alerta por ID
 */
export function useAlerta(id) {
  return useQuery({
    queryKey: ['alerta', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerAlerta(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para marcar alerta como leída
 */
export function useMarcarAlertaLeida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.marcarAlertaLeida(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alertas']);
      queryClient.invalidateQueries(['dashboard-alertas']);
    },
  });
}

/**
 * Hook para marcar múltiples alertas como leídas
 */
export function useMarcarVariasAlertasLeidas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alerta_ids) => {
      const response = await inventarioApi.marcarVariasAlertasLeidas({ alerta_ids });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alertas']);
      queryClient.invalidateQueries(['dashboard-alertas']);
    },
  });
}

// ==================== REPORTES DE INVENTARIO ====================

/**
 * Hook para obtener valor total del inventario
 */
export function useValorInventario() {
  return useQuery({
    queryKey: ['valor-inventario'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerValorInventario();
      return response.data.data || {
        total_productos: 0,
        total_unidades: 0,
        valor_compra: 0,
        valor_venta: 0,
        margen_potencial: 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener análisis ABC de productos (clasificación Pareto)
 * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id? }
 */
export function useAnalisisABC(params) {
  return useQuery({
    queryKey: ['analisis-abc', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.obtenerAnalisisABC(sanitizedParams);
      return response.data.data.productos_abc || [];
    },
    enabled: !!params.fecha_desde && !!params.fecha_hasta,
    staleTime: 1000 * 60 * 10, // 10 minutos (análisis costoso, cachear más tiempo)
  });
}

/**
 * Hook para obtener reporte de rotación de inventario
 * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id?, top? }
 */
export function useRotacionInventario(params) {
  return useQuery({
    queryKey: ['rotacion-inventario', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.obtenerRotacionInventario(sanitizedParams);
      return response.data.data.productos_rotacion || [];
    },
    enabled: !!params.fecha_desde && !!params.fecha_hasta,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para obtener resumen de alertas agrupadas
 */
export function useResumenAlertas() {
  return useQuery({
    queryKey: ['resumen-alertas'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerResumenAlertas();
      return response.data.data.resumen_alertas || {};
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== RESERVAS DE STOCK (Dic 2025 - Fase 1 Gaps) ====================

/**
 * Hook para obtener stock disponible de un producto
 * Considera reservas activas de otros usuarios
 * @param {number} productoId - ID del producto
 * @param {Object} options - { sucursalId?, enabled? }
 */
export function useStockDisponible(productoId, options = {}) {
  const { getSucursalId } = useSucursalStore();
  const sucursalId = options.sucursalId || getSucursalId();

  return useQuery({
    queryKey: ['stock-disponible', productoId, sucursalId],
    queryFn: async () => {
      const params = sucursalId ? { sucursal_id: sucursalId } : {};
      const response = await inventarioApi.obtenerStockDisponible(productoId, params);
      return response.data.data;
    },
    enabled: options.enabled !== false && !!productoId,
    staleTime: 1000 * 30, // 30 segundos (stock debe estar fresco)
    refetchInterval: 1000 * 60, // Refrescar cada minuto
  });
}

/**
 * Hook para obtener stock disponible de múltiples productos
 * @param {Array<number>} productosIds - Array de IDs de productos
 * @param {Object} options - { sucursalId?, enabled? }
 */
export function useStockDisponibleMultiple(productosIds, options = {}) {
  const { getSucursalId } = useSucursalStore();
  const sucursalId = options.sucursalId || getSucursalId();

  return useQuery({
    queryKey: ['stock-disponible-multiple', productosIds, sucursalId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerStockDisponibleMultiple({
        producto_ids: productosIds,
        sucursal_id: sucursalId || undefined,
      });
      return response.data.data || {};
    },
    enabled: options.enabled !== false && productosIds?.length > 0,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Hook para verificar disponibilidad de un producto
 * @param {number} productoId - ID del producto
 * @param {number} cantidad - Cantidad requerida
 * @param {Object} options - { sucursalId?, enabled? }
 */
export function useVerificarDisponibilidad(productoId, cantidad, options = {}) {
  const { getSucursalId } = useSucursalStore();
  const sucursalId = options.sucursalId || getSucursalId();

  return useQuery({
    queryKey: ['verificar-disponibilidad', productoId, cantidad, sucursalId],
    queryFn: async () => {
      const params = {
        cantidad,
        ...(sucursalId && { sucursal_id: sucursalId }),
      };
      const response = await inventarioApi.verificarDisponibilidad(productoId, params);
      return response.data.data;
    },
    enabled: options.enabled !== false && !!productoId && cantidad > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook para crear reserva de stock
 */
export function useCrearReserva() {
  const queryClient = useQueryClient();
  const { getSucursalId } = useSucursalStore();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        producto_id: data.producto_id,
        cantidad: data.cantidad,
        tipo_origen: data.tipo_origen || 'venta_pos',
        origen_id: data.origen_id || undefined,
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
        minutos_expiracion: data.minutos_expiracion || 15,
      };
      const response = await inventarioApi.crearReserva(sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['stock-disponible', variables.producto_id]);
      queryClient.invalidateQueries(['stock-disponible-multiple']);
      queryClient.invalidateQueries(['reservas']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al crear reserva');
    },
  });
}

/**
 * Hook para crear múltiples reservas
 */
export function useCrearReservasMultiple() {
  const queryClient = useQueryClient();
  const { getSucursalId } = useSucursalStore();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        items: data.items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
        tipo_origen: data.tipo_origen || 'venta_pos',
        origen_id: data.origen_id || undefined,
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
      };
      const response = await inventarioApi.crearReservasMultiple(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock-disponible']);
      queryClient.invalidateQueries(['stock-disponible-multiple']);
      queryClient.invalidateQueries(['reservas']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al crear reservas');
    },
  });
}

/**
 * Hook para confirmar reserva
 */
export function useConfirmarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaId) => {
      const response = await inventarioApi.confirmarReserva(reservaId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock-disponible']);
      queryClient.invalidateQueries(['stock-disponible-multiple']);
      queryClient.invalidateQueries(['reservas']);
      queryClient.invalidateQueries(['productos']);
    },
  });
}

/**
 * Hook para confirmar múltiples reservas
 */
export function useConfirmarReservasMultiple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaIds) => {
      const response = await inventarioApi.confirmarReservasMultiple({ reserva_ids: reservaIds });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock-disponible']);
      queryClient.invalidateQueries(['stock-disponible-multiple']);
      queryClient.invalidateQueries(['reservas']);
      queryClient.invalidateQueries(['productos']);
    },
  });
}

/**
 * Hook para cancelar reserva
 */
export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaId) => {
      const response = await inventarioApi.cancelarReserva(reservaId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock-disponible']);
      queryClient.invalidateQueries(['stock-disponible-multiple']);
      queryClient.invalidateQueries(['reservas']);
    },
  });
}

/**
 * Hook para listar reservas
 * @param {Object} params - { estado?, producto_id?, sucursal_id?, tipo_origen?, origen_id?, limit?, offset? }
 */
export function useReservas(params = {}) {
  return useQuery({
    queryKey: ['reservas', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.listarReservas(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: 1000 * 30,
  });
}

// ==================== AUTO-GENERACIÓN DE OC (Dic 2025 - Fase 2 Gaps) ====================

/**
 * Hook para obtener sugerencias de OC (productos con stock bajo)
 */
export function useSugerenciasOC() {
  return useQuery({
    queryKey: ['sugerencias-oc'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerSugerenciasOC();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para generar OC desde un producto con stock bajo
 */
export function useGenerarOCDesdeProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productoId) => {
      const response = await ordenesCompraApi.generarOCDesdeProducto(productoId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sugerencias-oc']);
      queryClient.invalidateQueries(['alertas']);
      queryClient.invalidateQueries(['ordenes-compra']);
    },
  });
}

/**
 * Hook para generar OCs automáticas para todos los productos con stock bajo
 */
export function useAutoGenerarOCs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await ordenesCompraApi.autoGenerarOCs();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sugerencias-oc']);
      queryClient.invalidateQueries(['alertas']);
      queryClient.invalidateQueries(['ordenes-compra']);
    },
  });
}

// ==============================================================================
// UBICACIONES DE ALMACÉN - WMS (Dic 2025 - Fase 3 Gaps)
// ==============================================================================

/**
 * Hook para listar ubicaciones con filtros
 * @param {Object} filtros - { sucursal_id?, tipo?, parent_id?, es_picking?, activo?, bloqueada?, busqueda?, limit?, offset? }
 */
export function useUbicaciones(filtros = {}) {
  return useQuery({
    queryKey: ['ubicaciones', filtros],
    queryFn: async () => {
      const response = await inventarioApi.listarUbicaciones(filtros);
      return response.data.data;
    },
    keepPreviousData: true,
  });
}

/**
 * Hook para obtener ubicación por ID
 */
export function useUbicacion(id) {
  return useQuery({
    queryKey: ['ubicacion', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerUbicacion(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obtener árbol jerárquico de ubicaciones de una sucursal
 */
export function useArbolUbicaciones(sucursalId) {
  return useQuery({
    queryKey: ['ubicaciones-arbol', sucursalId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerArbolUbicaciones(sucursalId);
      return response.data.data || [];
    },
    enabled: !!sucursalId,
  });
}

/**
 * Hook para obtener estadísticas de ubicaciones
 */
export function useEstadisticasUbicaciones(sucursalId) {
  return useQuery({
    queryKey: ['ubicaciones-estadisticas', sucursalId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerEstadisticasUbicaciones(sucursalId);
      return response.data.data;
    },
    enabled: !!sucursalId,
  });
}

/**
 * Hook para obtener stock de una ubicación
 */
export function useStockUbicacion(ubicacionId) {
  return useQuery({
    queryKey: ['ubicacion-stock', ubicacionId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerStockUbicacion(ubicacionId);
      return response.data.data || [];
    },
    enabled: !!ubicacionId,
  });
}

/**
 * Hook para obtener ubicaciones donde está un producto
 */
export function useUbicacionesProducto(productoId) {
  return useQuery({
    queryKey: ['producto-ubicaciones', productoId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerUbicacionesProducto(productoId);
      return response.data.data || [];
    },
    enabled: !!productoId,
  });
}

/**
 * Hook para obtener ubicaciones disponibles
 */
export function useUbicacionesDisponibles(sucursalId, cantidad = 1) {
  return useQuery({
    queryKey: ['ubicaciones-disponibles', sucursalId, cantidad],
    queryFn: async () => {
      const response = await inventarioApi.obtenerUbicacionesDisponibles(sucursalId, { cantidad });
      return response.data.data || [];
    },
    enabled: !!sucursalId,
  });
}

/**
 * Hook para crear ubicación
 */
export function useCrearUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await inventarioApi.crearUbicacion(data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] });
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-arbol', variables.sucursal_id] });
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-estadisticas', variables.sucursal_id] });
    },
  });
}

/**
 * Hook para actualizar ubicación
 */
export function useActualizarUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await inventarioApi.actualizarUbicacion(id, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] });
      queryClient.invalidateQueries({ queryKey: ['ubicacion', data.id] });
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-arbol', data.sucursal_id] });
    },
  });
}

/**
 * Hook para eliminar ubicación
 */
export function useEliminarUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarUbicacion(id);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] });
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-arbol', data.sucursal_id] });
      queryClient.invalidateQueries({ queryKey: ['ubicaciones-estadisticas', data.sucursal_id] });
    },
  });
}

/**
 * Hook para bloquear/desbloquear ubicación
 */
export function useToggleBloqueoUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bloqueada, motivo_bloqueo }) => {
      const response = await inventarioApi.toggleBloqueoUbicacion(id, { bloqueada, motivo_bloqueo });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ubicaciones'] });
      queryClient.invalidateQueries({ queryKey: ['ubicacion', data.id] });
    },
  });
}

/**
 * Hook para agregar stock a una ubicación
 */
export function useAgregarStockUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ubicacion_id, ...data }) => {
      const response = await inventarioApi.agregarStockUbicacion(ubicacion_id, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ubicacion-stock', variables.ubicacion_id]);
      queryClient.invalidateQueries(['producto-ubicaciones', variables.producto_id]);
      queryClient.invalidateQueries(['ubicaciones-estadisticas']);
    },
  });
}

/**
 * Hook para mover stock entre ubicaciones
 */
export function useMoverStockUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await inventarioApi.moverStockUbicacion(data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ubicacion-stock', variables.ubicacion_origen_id]);
      queryClient.invalidateQueries(['ubicacion-stock', variables.ubicacion_destino_id]);
      queryClient.invalidateQueries(['producto-ubicaciones', variables.producto_id]);
      queryClient.invalidateQueries(['ubicaciones-estadisticas']);
    },
  });
}
