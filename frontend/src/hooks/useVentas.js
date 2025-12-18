import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore from '@/store/sucursalStore';

// ==================== VENTAS POS ====================
// ✅ FEATURE: Multi-sucursal - Los hooks inyectan sucursal_id automáticamente

/**
 * Hook para listar ventas con filtros
 * @param {Object} params - { estado?, estado_pago?, tipo_venta?, cliente_id?, profesional_id?, metodo_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
 */
export function useVentas(params = {}) {
  return useQuery({
    queryKey: ['ventas', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await posApi.listarVentas(sanitizedParams);
      return response.data.data || { ventas: [], total: 0 };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener venta por ID con items
 * @param {number} ventaId
 */
export function useVenta(ventaId) {
  return useQuery({
    queryKey: ['venta', ventaId],
    queryFn: async () => {
      const response = await posApi.obtenerVenta(ventaId);
      return response.data.data || { venta: null, items: [] };
    },
    enabled: !!ventaId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para crear venta con items
 */
export function useCrearVenta() {
  const queryClient = useQueryClient();
  // ✅ Multi-sucursal: Obtener sucursal activa del store
  const { getSucursalId } = useSucursalStore();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        tipo_venta: data.tipo_venta || 'directa',
        cliente_id: data.cliente_id || undefined,
        cita_id: data.cita_id || undefined,
        profesional_id: data.profesional_id || undefined,
        descuento_porcentaje: data.descuento_porcentaje || undefined,
        descuento_monto: data.descuento_monto || undefined,
        impuestos: data.impuestos || undefined,
        monto_pagado: data.monto_pagado || undefined,
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
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['productos']); // Stock se actualizó
      queryClient.invalidateQueries(['stock-critico']);
      queryClient.invalidateQueries(['movimientos']); // Se generó movimiento
    },
    onError: (error) => {
      console.error('Error al crear venta:', error);
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
        tipo_venta: data.tipo_venta || undefined,
        cliente_id: data.cliente_id || undefined,
        profesional_id: data.profesional_id || undefined,
        descuento_porcentaje: data.descuento_porcentaje || undefined,
        descuento_monto: data.descuento_monto || undefined,
        impuestos: data.impuestos || undefined,
        metodo_pago: data.metodo_pago || undefined,
        fecha_apartado: data.fecha_apartado || undefined,
        fecha_vencimiento_apartado: data.fecha_vencimiento_apartado || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await posApi.actualizarVenta(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['venta', variables.id]);
    },
    onError: (error) => {
      console.error('Error al actualizar venta:', error);
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
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['venta', variables.id]);
    },
    onError: (error) => {
      console.error('Error al actualizar estado de venta:', error);
    },
  });
}

/**
 * Hook para registrar pago en venta
 */
export function useRegistrarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        monto_pago: data.monto_pago,
        metodo_pago: data.metodo_pago,
        pago_id: data.pago_id || undefined,
      };

      const response = await posApi.registrarPago(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['venta', variables.id]);
    },
    onError: (error) => {
      console.error('Error al registrar pago:', error);
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
        usuario_id
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['venta', variables.id]);
      queryClient.invalidateQueries(['productos']); // Stock revertido
      queryClient.invalidateQueries(['movimientos']); // Movimiento de reversión
    },
    onError: (error) => {
      console.error('Error al cancelar venta:', error);
    },
  });
}

/**
 * Hook para procesar devolución de items
 */
export function useDevolverItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items_devueltos, motivo, usuario_id }) => {
      const response = await posApi.devolverItems(id, {
        items_devueltos,
        motivo: motivo?.trim() || undefined,
        usuario_id
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['venta', variables.id]);
      queryClient.invalidateQueries(['productos']); // Stock ajustado
      queryClient.invalidateQueries(['movimientos']); // Movimiento de devolución
    },
    onError: (error) => {
      console.error('Error al devolver items:', error);
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
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['venta', variables.id]);
      queryClient.invalidateQueries(['productos']); // Stock actualizado
    },
    onError: (error) => {
      console.error('Error al agregar items:', error);
    },
  });
}

/**
 * Hook para eliminar venta (cancela y revierte stock)
 */
export function useEliminarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo, usuario_id }) => {
      const response = await posApi.eliminarVenta(id, { motivo, usuario_id });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventas']);
      queryClient.invalidateQueries(['productos']); // Stock revertido
      queryClient.invalidateQueries(['movimientos']); // Movimiento de reversión
    },
    onError: (error) => {
      console.error('Error al eliminar venta:', error);
    },
  });
}

// ==================== REPORTES POS ====================

/**
 * Hook para obtener corte de caja
 * @param {Object} params - { fecha_inicio, fecha_fin, usuario_id? }
 */
export function useCorteCaja(params) {
  return useQuery({
    queryKey: ['corte-caja', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await posApi.obtenerCorteCaja(sanitizedParams);
      return response.data.data || { resumen: {}, totales_por_metodo: [], ventas_por_hora: [], top_productos: [] };
    },
    enabled: !!params.fecha_inicio && !!params.fecha_fin,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener ventas diarias
 * @param {Object} params - { fecha, profesional_id?, usuario_id? }
 */
export function useVentasDiarias(params) {
  return useQuery({
    queryKey: ['ventas-diarias', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await posApi.obtenerVentasDiarias(sanitizedParams);
      return response.data.data || { resumen: {}, ventas_por_hora: [], top_productos: [], detalle: [] };
    },
    enabled: !!params.fecha,
    staleTime: 1000 * 60 * 5,
  });
}
