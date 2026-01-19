/**
 * ====================================================================
 * HOOKS DE PROMOCIONES AUTOMATICAS
 * ====================================================================
 *
 * Hooks para gestion de promociones en POS:
 * - Evaluacion de promociones en carrito
 * - Aplicacion de promociones
 * - CRUD de promociones (administracion)
 *
 * Ene 2026 - Fase 3 POS
 * Ene 2026 - Migrado a createCRUDHooks
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';

// =========================================================================
// HOOKS CRUD VIA FACTORY
// =========================================================================

const hooks = createCRUDHooks({
  name: 'promocion',
  namePlural: 'promociones',
  api: posApi,
  baseKey: 'promociones',
  apiMethods: {
    list: 'listarPromociones',
    get: 'obtenerPromocion',
    create: 'crearPromocion',
    update: 'actualizarPromocion',
    delete: 'eliminarPromocion',
  },
  invalidateOnCreate: ['promociones', 'promociones-vigentes'],
  invalidateOnUpdate: ['promociones', 'promociones-vigentes'],
  invalidateOnDelete: ['promociones', 'promociones-vigentes'],
  staleTime: STALE_TIMES.DYNAMIC,
  responseKey: 'promociones',
  usePreviousData: true, // Evita flash de loading durante paginación
  transformList: (data) => ({
    promociones: data,
    paginacion: data.pagination,
  }),
});

// Exportar hooks CRUD
export const usePromociones = hooks.useList;
export const usePromocion = hooks.useDetail;
export const useCrearPromocion = hooks.useCreate;
export const useActualizarPromocion = hooks.useUpdate;
export const useEliminarPromocion = hooks.useDelete;

// =========================================================================
// HOOKS PARA POS (Uso en ventas)
// =========================================================================

/**
 * Hook para obtener promociones vigentes
 * GET /pos/promociones/vigentes
 * @param {Object} params - { sucursal_id? }
 */
export function usePromocionesVigentes(params = {}) {
  return useQuery({
    queryKey: ['promociones-vigentes', params],
    queryFn: async () => {
      const response = await posApi.listarPromocionesVigentes(params);
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para evaluar promociones aplicables a un carrito
 * POST /pos/promociones/evaluar
 *
 * @param {Object} data - { items, subtotal, clienteId?, sucursalId? }
 * @param {Object} options - { enabled? }
 * @returns Query con { promociones, descuento_total, hay_exclusiva, cantidad_aplicables }
 */
export function useEvaluarPromociones(data, options = {}) {
  const { items = [], subtotal = 0, clienteId, sucursalId } = data;
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['promociones-evaluar', { items, subtotal, clienteId, sucursalId }],
    queryFn: async () => {
      // Formatear items para el backend
      const itemsFormateados = items.map(item => ({
        producto_id: item.productoId || item.producto_id || item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario || item.precio_unitario || item.precio,
        categoria_id: item.categoriaId || item.categoria_id,
      }));

      const response = await posApi.evaluarPromociones({
        items: itemsFormateados,
        subtotal,
        cliente_id: clienteId,
        sucursal_id: sucursalId,
      });

      return response.data.data;
    },
    enabled: enabled && items.length > 0,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos - evaluar frecuentemente
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook mutation para evaluar promociones manualmente
 * Util cuando se necesita control manual de cuando evaluar
 */
export function useEvaluarPromocionesMutation() {
  return useMutation({
    mutationFn: async ({ items, subtotal, clienteId, sucursalId }) => {
      const itemsFormateados = items.map(item => ({
        producto_id: item.productoId || item.producto_id || item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario || item.precio_unitario || item.precio,
        categoria_id: item.categoriaId || item.categoria_id,
      }));

      const response = await posApi.evaluarPromociones({
        items: itemsFormateados,
        subtotal,
        cliente_id: clienteId,
        sucursal_id: sucursalId,
      });

      return response.data.data;
    },
  });
}

/**
 * Hook para aplicar una promocion a una venta
 * POST /pos/promociones/aplicar
 */
export function useAplicarPromocion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ promocionId, ventaPosId, clienteId, descuentoTotal, productosAplicados }) => {
      const response = await posApi.aplicarPromocion({
        promocion_id: promocionId,
        venta_pos_id: ventaPosId,
        cliente_id: clienteId,
        descuento_total: descuentoTotal,
        productos_aplicados: productosAplicados,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar venta para refrescar totales
      queryClient.invalidateQueries({ queryKey: ['venta', variables.ventaPosId] });
      queryClient.invalidateQueries({ queryKey: ['promociones-vigentes'] });
    },
  });
}

// =========================================================================
// HOOKS ESPECIALIZADOS DE ADMINISTRACION
// =========================================================================

/**
 * Hook para obtener historial de uso de una promocion
 * GET /pos/promociones/:id/historial
 */
export function useHistorialPromocion(promocionId, params = {}) {
  return useQuery({
    queryKey: ['promocion-historial', promocionId, params],
    queryFn: async () => {
      const response = await posApi.obtenerHistorialPromocion(promocionId, params);
      return response.data.data;
    },
    enabled: !!promocionId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para obtener estadisticas de una promocion
 * GET /pos/promociones/:id/estadisticas
 */
export function useEstadisticasPromocion(promocionId) {
  return useQuery({
    queryKey: ['promocion-estadisticas', promocionId],
    queryFn: async () => {
      const response = await posApi.obtenerEstadisticasPromocion(promocionId);
      return response.data.data;
    },
    enabled: !!promocionId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para cambiar estado de promocion (activar/desactivar)
 * PATCH /pos/promociones/:id/estado
 */
export function useCambiarEstadoPromocion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }) => {
      const response = await posApi.cambiarEstadoPromocion(id, activo);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
      queryClient.invalidateQueries({ queryKey: ['promocion', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['promociones-vigentes'] });
    },
  });
}

/**
 * Hook para duplicar promocion
 * POST /pos/promociones/:id/duplicar
 */
export function useDuplicarPromocion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await posApi.duplicarPromocion(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promociones'] });
    },
  });
}

// =========================================================================
// TIPOS DE PROMOCION (constantes para UI)
// =========================================================================

export const TIPOS_PROMOCION = {
  cantidad: {
    label: '2x1, 3x2...',
    description: 'Compra X cantidad y paga menos',
    icon: 'Package',
  },
  porcentaje: {
    label: 'Descuento %',
    description: 'Porcentaje de descuento en productos/categorias',
    icon: 'Percent',
  },
  monto_fijo: {
    label: 'Descuento $',
    description: 'Monto fijo de descuento',
    icon: 'DollarSign',
  },
  precio_especial: {
    label: 'Precio especial',
    description: 'Precio fijo para producto especifico',
    icon: 'Tag',
  },
  regalo: {
    label: 'Regalo con compra',
    description: 'Producto gratis al cumplir condicion',
    icon: 'Gift',
  },
};

export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
];
