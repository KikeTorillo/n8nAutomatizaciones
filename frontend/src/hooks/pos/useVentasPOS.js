import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

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
    staleTime: STALE_TIMES.DYNAMIC,
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
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para crear venta con items
 */
export function useCrearVenta() {
  const queryClient = useQueryClient();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        cliente_id: data.cliente_id || undefined,
        cita_id: data.cita_id || undefined,
        profesional_id: data.profesional_id || undefined,
        monto_pagado: data.monto_pagado ?? undefined,
        fecha_apartado: data.fecha_apartado || undefined,
        fecha_vencimiento_apartado: data.fecha_vencimiento_apartado || undefined,
        notas: data.notas?.trim() || undefined,
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
      };

      const response = await posApi.crearVenta(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
      queryClient.invalidateQueries({ queryKey: ['corte-caja'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-diarias'] });
    },
    onError: createCRUDErrorHandler('create', 'Venta', {
      400: 'Datos inválidos. Revisa items y cantidades',
      403: 'No tienes permisos para crear ventas o alcanzaste el límite de tu plan',
      404: 'Uno o más productos no fueron encontrados',
      409: 'Stock insuficiente para completar la venta',
    }),
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
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['venta-pos', variables.id] });
    },
    onError: createCRUDErrorHandler('update', 'Venta'),
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
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['venta-pos', variables.id] });
      if (variables.estado === 'completada') {
        queryClient.invalidateQueries({ queryKey: ['productos'] });
        queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      }
    },
    onError: createCRUDErrorHandler('update', 'Estado de venta'),
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
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['venta-pos', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['corte-caja'] });
    },
    onError: createCRUDErrorHandler('delete', 'Venta', {
      400: 'No se puede cancelar una venta ya cancelada',
    }),
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
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['venta-pos', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['corte-caja'] });
    },
    onError: createCRUDErrorHandler('update', 'Devolución', {
      404: 'Venta o items no encontrados',
      400: 'Cantidad a devolver inválida',
    }),
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
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['venta-pos', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    },
    onError: createCRUDErrorHandler('update', 'Items', {
      404: 'Venta o productos no encontrados',
      400: 'Datos de items inválidos',
      409: 'Stock insuficiente para agregar items',
    }),
  });
}

/**
 * Hook para eliminar venta
 */
export function useEliminarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo, usuario_id }) => {
      const response = await posApi.eliminarVenta(id, { motivo, usuario_id });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['corte-caja'] });
    },
    onError: createCRUDErrorHandler('delete', 'Venta'),
  });
}
