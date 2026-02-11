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
 * Feb 2026 - Migrado a TypeScript
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { extractData } from '@/lib/apiHelpers';
import type { Promocion } from '@/types/entities';

// =========================================================================
// INTERFACES LOCALES
// =========================================================================

interface EvaluarPromocionesData {
  items: Array<{
    productoId?: number;
    producto_id?: number;
    id?: number;
    cantidad: number;
    precioUnitario?: number;
    precio_unitario?: number;
    precio?: number;
    categoriaId?: number;
    categoria_id?: number;
  }>;
  subtotal: number;
  clienteId?: number;
  sucursalId?: number;
}

interface EvaluarPromocionesOptions {
  enabled?: boolean;
}

interface AplicarPromocionData {
  promocionId: number;
  ventaPosId: number;
  clienteId?: number;
  descuentoTotal: number;
  productosAplicados?: number[];
}

interface CambiarEstadoData {
  id: number;
  activo: boolean;
}

interface TipoPromocionInfo {
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

interface DiaSemana {
  readonly value: number;
  readonly label: string;
}

// =========================================================================
// HOOKS CRUD VIA FACTORY
// =========================================================================

const hooks = createCRUDHooks<Promocion>({
  name: 'promocion',
  namePlural: 'promociones',
  api: posApi as any,
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
  usePreviousData: true, // Evita flash de loading durante paginacion
  transformList: (data: Promocion[]) => ({
    promociones: data,
    paginacion: (data as any).pagination,
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
 */
export function usePromocionesVigentes(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.pos.promociones.vigentes(params),
    queryFn: async () => {
      const response = await posApi.listarPromocionesVigentes(params);
      return extractData(response);
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para evaluar promociones aplicables a un carrito
 * POST /pos/promociones/evaluar
 */
export function useEvaluarPromociones(
  data: EvaluarPromocionesData,
  options: EvaluarPromocionesOptions = {}
) {
  const { items = [], subtotal = 0, clienteId, sucursalId } = data;
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.pos.promociones.evaluar({
      items,
      subtotal,
      clienteId,
      sucursalId,
    }),
    queryFn: async () => {
      // Formatear items para el backend
      const itemsFormateados = items.map((item) => ({
        producto_id: item.productoId || item.producto_id || item.id || 0,
        cantidad: item.cantidad,
        precio_unitario:
          item.precioUnitario || item.precio_unitario || item.precio || 0,
        categoria_id: item.categoriaId || item.categoria_id,
      }));

      const response = await posApi.evaluarPromociones({
        items: itemsFormateados,
        subtotal,
        cliente_id: clienteId,
        sucursal_id: sucursalId,
      });

      return extractData(response);
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
    mutationFn: async ({
      items,
      subtotal,
      clienteId,
      sucursalId,
    }: EvaluarPromocionesData) => {
      const itemsFormateados = items.map((item) => ({
        producto_id: item.productoId || item.producto_id || item.id || 0,
        cantidad: item.cantidad,
        precio_unitario:
          item.precioUnitario || item.precio_unitario || item.precio || 0,
        categoria_id: item.categoriaId || item.categoria_id,
      }));

      const response = await posApi.evaluarPromociones({
        items: itemsFormateados,
        subtotal,
        cliente_id: clienteId,
        sucursal_id: sucursalId,
      });

      return extractData(response);
    },
    onError: createCRUDErrorHandler('fetch', 'Promociones'),
  });
}

/**
 * Hook para aplicar una promocion a una venta
 * POST /pos/promociones/aplicar
 */
export function useAplicarPromocion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      promocionId,
      ventaPosId,
      clienteId,
      descuentoTotal,
      productosAplicados,
    }: AplicarPromocionData) => {
      const response = await posApi.aplicarPromocion({
        promocion_id: promocionId,
        venta_pos_id: ventaPosId,
        cliente_id: clienteId,
        descuento_total: descuentoTotal,
        productos_aplicados: productosAplicados,
      });
      return extractData(response);
    },
    onSuccess: (_data: unknown, variables: AplicarPromocionData) => {
      // Invalidar venta para refrescar totales
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.ventas.detail(variables.ventaPosId),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.promociones.vigentesBase,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Promocion', {
      400: 'No se pudo aplicar la promocion',
    }),
  });
}

// =========================================================================
// HOOKS ESPECIALIZADOS DE ADMINISTRACION
// =========================================================================

/**
 * Hook para obtener historial de uso de una promocion
 * GET /pos/promociones/:id/historial
 */
export function useHistorialPromocion(
  promocionId: number | undefined | null,
  params: Record<string, unknown> = {}
) {
  return useQuery({
    queryKey: queryKeys.pos.promociones.historial(promocionId, params),
    queryFn: async () => {
      const response = await posApi.obtenerHistorialPromocion(
        promocionId!,
        params
      );
      return extractData(response);
    },
    enabled: !!promocionId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para obtener estadisticas de una promocion
 * GET /pos/promociones/:id/estadisticas
 */
export function useEstadisticasPromocion(
  promocionId: number | undefined | null
) {
  return useQuery({
    queryKey: queryKeys.pos.promociones.estadisticas(promocionId),
    queryFn: async () => {
      const response = await posApi.obtenerEstadisticasPromocion(promocionId!);
      return extractData(response);
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
    mutationFn: async ({ id, activo }: CambiarEstadoData) => {
      const response = await posApi.cambiarEstadoPromocion(id, activo);
      return extractData(response);
    },
    onSuccess: (_data: unknown, variables: CambiarEstadoData) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.promociones.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.promociones.estadisticas(variables.id),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.promociones.vigentesBase,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Promocion'),
  });
}

/**
 * Hook para duplicar promocion
 * POST /pos/promociones/:id/duplicar
 */
export function useDuplicarPromocion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await posApi.duplicarPromocion(id);
      return extractData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pos.promociones.all,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('create', 'Promocion'),
  });
}

// =========================================================================
// TIPOS DE PROMOCION (constantes para UI)
// =========================================================================

export const TIPOS_PROMOCION: Record<string, TipoPromocionInfo> = {
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
} as const;

export const DIAS_SEMANA: readonly DiaSemana[] = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
] as const;
