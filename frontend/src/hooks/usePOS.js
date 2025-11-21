import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';

// ==================== VENTAS POS ====================

/**
 * Hook para listar ventas con filtros
 * @param {Object} params - { estado?, estado_pago?, tipo_venta?, cliente_id?, profesional_id?, metodo_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
 */
export function useVentas(params = {}) {
  return useQuery({
    queryKey: ['ventas-pos', params],
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

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        cliente_id: data.cliente_id || undefined,
        cita_id: data.cita_id || undefined,
        profesional_id: data.profesional_id || undefined,
        monto_pagado: data.monto_pagado || undefined,
        fecha_apartado: data.fecha_apartado || undefined,
        fecha_vencimiento_apartado: data.fecha_vencimiento_apartado || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await posApi.crearVenta(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ventas-pos']);
      queryClient.invalidateQueries(['productos']); // Stock cambió
      queryClient.invalidateQueries(['stock-critico']);
      queryClient.invalidateQueries(['movimientos']); // Se registró movimiento automático
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
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await posApi.obtenerCorteCaja(sanitizedParams);
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
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await posApi.obtenerVentasDiarias(sanitizedParams);
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
