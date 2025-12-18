import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
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
