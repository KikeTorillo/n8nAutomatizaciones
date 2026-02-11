import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conteosApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { extractData, extractDataOr } from '@/lib/apiHelpers';

/**
 * Hooks para gestión de Conteos de Inventario (Conteo Físico)
 * Ciclo: borrador -> en_proceso -> completado -> ajustado | cancelado
 *
 * Feb 2026 - Migrado a TypeScript
 * - Usa extractData/extractDataOr para respuestas API
 * - Helpers de sanitización e invalidación para reducir duplicación
 * - createCRUDErrorHandler en todas las mutations
 */

// ==================== TIPOS ====================

interface ConteosParams {
  sucursal_id?: number;
  estado?: string;
  tipo_conteo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  folio?: string;
  limit?: number;
  offset?: number;
}

interface CrearConteoData {
  tipo_conteo: string;
  sucursal_id?: number;
  filtros?: Record<string, unknown>;
  fecha_programada?: string;
  usuario_contador_id?: number;
  usuario_supervisor_id?: number;
  notas?: string;
}

interface RegistrarConteoItemParams {
  itemId: number;
  cantidad_contada: number;
  notas?: string;
}

interface CancelarConteoParams {
  id: number;
  motivo?: string;
}

interface BuscarItemConteoParams {
  conteoId: number;
  codigo: string;
}

// ==================== HELPERS ====================

/**
 * Sanitiza parámetros removiendo valores vacíos
 */
function sanitizeParams(
  params: Record<string, unknown>
): Record<string, unknown> {
  return Object.entries(params).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );
}

/**
 * Helper para invalidar queries relacionadas con conteos
 */
function invalidateConteosQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  conteoId?: number
) {
  // Invalidar detalle específico si se proporciona ID
  if (conteoId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.inventario.conteos.detail(conteoId),
      refetchType: 'active',
    });
  }

  // Invalidar listas y estadísticas
  queryClient.invalidateQueries({
    queryKey: queryKeys.inventario.conteos.all,
    refetchType: 'active',
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.inventario.conteos.estadisticas({}),
    refetchType: 'active',
  });
}

// ==================== CONSULTAS ====================

/**
 * Hook para listar conteos con filtros
 */
export function useConteos(params: ConteosParams = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useQuery({
    queryKey: queryKeys.inventario.conteos.list(params),
    queryFn: async () => {
      const sanitizedParams = sanitizeParams({
        ...params,
        sucursal_id: params.sucursal_id || getSucursalId() || undefined,
      });

      const response = await conteosApi.listar(sanitizedParams);
      return extractDataOr(response, { conteos: [], totales: {} });
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener un conteo por ID con todos sus items
 */
export function useConteo(id: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.inventario.conteos.detail(id),
    queryFn: async () => {
      const response = await conteosApi.obtenerPorId(id!);
      return extractData(response);
    },
    enabled: !!id,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos (datos cambian durante conteo)
    refetchInterval: (query) => {
      // Refetch automático solo cuando está en proceso
      const data = query.state.data;
      if (data?.estado === 'en_proceso') {
        return 1000 * 10; // Cada 10 segundos
      }
      return false;
    },
  });
}

/**
 * Hook para obtener estadísticas de conteos
 */
export function useEstadisticasConteos(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.inventario.conteos.estadisticas(params),
    queryFn: async () => {
      const sanitizedParams = sanitizeParams(params);
      const response = await conteosApi.obtenerEstadisticas(sanitizedParams);
      return extractDataOr(response, {});
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

// ==================== MUTACIONES ====================

/**
 * Hook para crear un nuevo conteo de inventario
 */
export function useCrearConteo() {
  const queryClient = useQueryClient();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (data: CrearConteoData) => {
      const sanitized = sanitizeParams({
        tipo_conteo: data.tipo_conteo,
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
        filtros: data.filtros || {},
        fecha_programada: data.fecha_programada,
        usuario_contador_id: data.usuario_contador_id,
        usuario_supervisor_id: data.usuario_supervisor_id,
        notas: data.notas?.trim(),
      });

      const response = await conteosApi.crear(sanitized);
      return extractData(response);
    },
    onSuccess: () => {
      invalidateConteosQueries(queryClient);
    },
    onError: createCRUDErrorHandler('create', 'Conteo', {
      409: 'Ya existe un conteo en proceso',
    }),
  });
}

/**
 * Hook para iniciar un conteo (genera items y cambia a en_proceso)
 */
export function useIniciarConteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await conteosApi.iniciar(id);
      return extractData(response);
    },
    onSuccess: (_, id) => {
      invalidateConteosQueries(queryClient, id);
    },
    onError: createCRUDErrorHandler('update', 'Conteo'),
  });
}

/**
 * Hook para registrar cantidad contada de un item
 */
export function useRegistrarConteoItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      cantidad_contada,
      notas,
    }: RegistrarConteoItemParams) => {
      const sanitized = sanitizeParams({
        cantidad_contada,
        notas: notas?.trim(),
      });

      const response = await conteosApi.registrarConteo(itemId, sanitized);
      return extractData(response);
    },
    onSuccess: (data) => {
      // Invalidar el conteo padre si está disponible, sino invalidar lista
      const conteoId = data?.conteo_id;
      if (conteoId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventario.conteos.detail(conteoId),
          refetchType: 'active',
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventario.conteos.all,
          refetchType: 'active',
        });
      }
    },
    onError: createCRUDErrorHandler('update', 'Item conteo'),
  });
}

/**
 * Hook para completar un conteo
 */
export function useCompletarConteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await conteosApi.completar(id);
      return extractData(response);
    },
    onSuccess: (_, id) => {
      invalidateConteosQueries(queryClient, id);
    },
    onError: createCRUDErrorHandler('update', 'Conteo'),
  });
}

/**
 * Hook para aplicar ajustes de inventario basados en el conteo
 */
export function useAplicarAjustesConteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await conteosApi.aplicarAjustes(id);
      return extractData(response);
    },
    onSuccess: (_, id) => {
      // Invalidar queries de conteos
      invalidateConteosQueries(queryClient, id);

      // Invalidar datos de inventario afectados (solo queries activas)
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.movimientos.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.productos.stockCritico,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.valoracion.resumen,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Ajustes conteo'),
  });
}

/**
 * Hook para cancelar un conteo
 */
export function useCancelarConteo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: CancelarConteoParams) => {
      const sanitized = sanitizeParams({
        motivo: motivo?.trim(),
      });

      const response = await conteosApi.cancelar(id, sanitized);
      return extractData(response);
    },
    onSuccess: (_, { id }) => {
      invalidateConteosQueries(queryClient, id);
    },
    onError: createCRUDErrorHandler('delete', 'Conteo'),
  });
}

/**
 * Hook para buscar item por código de barras o SKU dentro de un conteo
 */
export function useBuscarItemConteo() {
  return useMutation({
    mutationFn: async ({ conteoId, codigo }: BuscarItemConteoParams) => {
      const response = await conteosApi.buscarItem(conteoId, codigo);
      return extractData(response);
    },
    onError: createCRUDErrorHandler('fetch', 'Producto en conteo', {
      404: 'Producto no encontrado en este conteo',
    }),
  });
}

// ==================== CONSTANTES ====================

export const ESTADOS_CONTEO = {
  BORRADOR: 'borrador',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  AJUSTADO: 'ajustado',
  CANCELADO: 'cancelado',
} as const;

export const TIPOS_CONTEO = {
  TOTAL: 'total',
  POR_CATEGORIA: 'por_categoria',
  POR_UBICACION: 'por_ubicacion',
  CICLICO: 'ciclico',
  ALEATORIO: 'aleatorio',
} as const;

export const TIPOS_CONTEO_LABELS = {
  [TIPOS_CONTEO.TOTAL]: 'Conteo Total',
  [TIPOS_CONTEO.POR_CATEGORIA]: 'Por Categoría',
  [TIPOS_CONTEO.POR_UBICACION]: 'Por Ubicación',
  [TIPOS_CONTEO.CICLICO]: 'Cíclico',
  [TIPOS_CONTEO.ALEATORIO]: 'Aleatorio',
} as const;

export const ESTADOS_CONTEO_CONFIG = {
  [ESTADOS_CONTEO.BORRADOR]: {
    label: 'Borrador',
    color: 'gray',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
  [ESTADOS_CONTEO.EN_PROCESO]: {
    label: 'En Proceso',
    color: 'primary',
    badgeClass:
      'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
  },
  [ESTADOS_CONTEO.COMPLETADO]: {
    label: 'Completado',
    color: 'yellow',
    badgeClass:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  [ESTADOS_CONTEO.AJUSTADO]: {
    label: 'Ajustado',
    color: 'green',
    badgeClass:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  [ESTADOS_CONTEO.CANCELADO]: {
    label: 'Cancelado',
    color: 'red',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
} as const;
