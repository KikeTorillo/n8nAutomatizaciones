/**
 * ====================================================================
 * HOOKS WORKFLOWS DE APROBACION
 * ====================================================================
 *
 * Aprobaciones pendientes, historial, delegaciones, definiciones.
 * Migrado a TypeScript - Feb 2026
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { workflowsApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';

// Alias para brevedad
const WF_KEYS = queryKeys.sistema.workflows;

// Prefijos base para invalidación (arrays de 1 elemento para prefix-matching de TanStack Query)
const APROBACIONES_PREFIX = [WF_KEYS.aprobacionesPendientes()[0]] as const;
const HISTORIAL_PREFIX = [WF_KEYS.historialAprobaciones()[0]] as const;
const DELEGACIONES_PREFIX = [WF_KEYS.delegaciones()[0]] as const;

// ==================== TIPOS ====================

interface AprobacionesPendientesParams {
  entidad_tipo?: string;
  limit?: number;
  offset?: number;
}

interface AprobacionesPendientesResponse {
  instancias: WorkflowInstancia[];
  total: number;
}

interface WorkflowInstancia {
  id: number;
  workflow_id: number;
  entidad_tipo: string;
  entidad_id: number;
  estado: string;
  paso_actual: number;
  solicitante_id: number;
  datos_solicitud?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface HistorialParams {
  entidad_tipo?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}

interface DelegacionesParams {
  activas?: boolean;
  como_delegado?: boolean;
}

interface Delegacion {
  id: number;
  usuario_delegante_id: number;
  usuario_delegado_id: number;
  workflow_id?: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo?: string;
  activo: boolean;
  created_at: string;
}

interface DefinicionesWorkflowParams {
  entidad_tipo?: string;
  activo?: boolean;
}

interface WorkflowDefinicion {
  id: number;
  nombre: string;
  entidad_tipo: string;
  activo: boolean;
  pasos?: unknown[];
  transiciones?: unknown[];
}

interface AprobarSolicitudParams {
  id: number;
  comentario?: string;
}

interface RechazarSolicitudParams {
  id: number;
  motivo: string;
}

interface CrearDelegacionData {
  usuario_delegado_id: number;
  workflow_id?: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo?: string;
}

interface ActualizarDelegacionParams {
  id: number;
  data: {
    fecha_fin?: string;
    activo?: boolean;
    motivo?: string;
  };
}

// ==================== QUERIES ====================

/**
 * Hook para obtener aprobaciones pendientes del usuario actual
 */
export function useAprobacionesPendientes(
  params: AprobacionesPendientesParams = {}
) {
  return useQuery({
    queryKey: WF_KEYS.aprobacionesPendientes(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await workflowsApi.listarPendientes(sanitizedParams);
      return (response as any).data.data || { instancias: [], total: 0 };
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos - se refresca frecuentemente
  });
}

/**
 * Hook para contar aprobaciones pendientes (para badge en sidebar)
 * Polling cada 30 segundos para mantener actualizado
 */
export function useContadorAprobaciones() {
  return useQuery({
    queryKey: WF_KEYS.aprobacionesCount,
    queryFn: async () => {
      const response = await workflowsApi.contarPendientes();
      return (response as any).data.data?.total || 0;
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
    refetchInterval: 1000 * 30, // Polling cada 30 segundos
  });
}

/**
 * Hook para obtener detalle de una instancia de workflow
 */
export function useInstanciaWorkflow(id: number | null | undefined) {
  return useQuery({
    queryKey: WF_KEYS.instancia(id),
    queryFn: async () => {
      const response = await workflowsApi.obtenerInstancia(id!);
      return (response as any).data.data || null;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener historial de aprobaciones
 */
export function useHistorialAprobaciones(params: HistorialParams = {}) {
  return useQuery({
    queryKey: WF_KEYS.historialAprobaciones(params),
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce<
        Record<string, unknown>
      >((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await workflowsApi.listarHistorial(sanitizedParams);
      return (response as any).data.data || { instancias: [], total: 0 };
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para listar delegaciones del usuario
 */
export function useDelegaciones(params: DelegacionesParams = {}) {
  return useQuery({
    queryKey: WF_KEYS.delegaciones(params),
    queryFn: async () => {
      const response = await workflowsApi.listarDelegaciones(params);
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para listar definiciones de workflows
 */
export function useDefinicionesWorkflow(
  params: DefinicionesWorkflowParams = {}
) {
  return useQuery({
    queryKey: WF_KEYS.definiciones(params),
    queryFn: async () => {
      const response = await workflowsApi.listarDefiniciones(params);
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para obtener una definicion de workflow por ID
 */
export function useDefinicionWorkflow(id: number | null | undefined) {
  return useQuery({
    queryKey: WF_KEYS.definicion(id),
    queryFn: async () => {
      const response = await workflowsApi.obtenerDefinicion(id!);
      return (response as any).data.data || null;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para aprobar una solicitud
 */
export function useAprobarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comentario }: AprobarSolicitudParams) => {
      const response = await workflowsApi.aprobar(id, {
        comentario: comentario?.trim() || undefined,
      });
      return (response as any).data.data;
    },
    onSuccess: (_: unknown, variables: AprobarSolicitudParams) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: APROBACIONES_PREFIX,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: WF_KEYS.aprobacionesCount,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: WF_KEYS.instancia(variables.id),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: HISTORIAL_PREFIX,
        refetchType: 'active',
      });
      // Invalidar ordenes de compra si aplica
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.ordenesCompra.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.ordenesCompra.pendientes,
        refetchType: 'active',
      });
    },
  });
}

/**
 * Hook para rechazar una solicitud
 */
export function useRechazarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: RechazarSolicitudParams) => {
      const response = await workflowsApi.rechazar(id, { motivo });
      return (response as any).data.data;
    },
    onSuccess: (_: unknown, variables: RechazarSolicitudParams) => {
      queryClient.invalidateQueries({
        queryKey: APROBACIONES_PREFIX,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: WF_KEYS.aprobacionesCount,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: WF_KEYS.instancia(variables.id),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: HISTORIAL_PREFIX,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.ordenesCompra.all,
        refetchType: 'active',
      });
    },
  });
}

/**
 * Hook para crear delegacion
 */
export function useCrearDelegacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearDelegacionData) => {
      const sanitized = {
        usuario_delegado_id: data.usuario_delegado_id,
        workflow_id: data.workflow_id || undefined,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        motivo: data.motivo?.trim() || undefined,
      };

      const response = await workflowsApi.crearDelegacion(sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DELEGACIONES_PREFIX,
        refetchType: 'active',
      });
    },
  });
}

/**
 * Hook para actualizar delegacion
 */
export function useActualizarDelegacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: ActualizarDelegacionParams) => {
      const sanitized: Record<string, unknown> = {
        fecha_fin: data.fecha_fin || undefined,
        activo: data.activo !== undefined ? data.activo : undefined,
        motivo: data.motivo?.trim() || undefined,
      };

      // Eliminar campos undefined
      Object.keys(sanitized).forEach((key) => {
        if (sanitized[key] === undefined) delete sanitized[key];
      });

      const response = await workflowsApi.actualizarDelegacion(id, sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DELEGACIONES_PREFIX,
        refetchType: 'active',
      });
    },
  });
}

/**
 * Hook para eliminar delegacion
 */
export function useEliminarDelegacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await workflowsApi.eliminarDelegacion(id);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DELEGACIONES_PREFIX,
        refetchType: 'active',
      });
    },
  });
}
