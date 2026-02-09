/**
 * useDocumentosEmpleado - Hooks para Documentos de Empleado
 * Fase 2 del Plan de Empleados Competitivo
 * Enero 2026 | Migrado a TypeScript - Feb 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import {
  TIPOS_DOCUMENTO_EMPLEADO as TIPOS_DOCUMENTO_EMPLEADO_LIB,
  ESTADOS_VENCIMIENTO_EMPLEADO,
  getTipoDocumentoEmpleado,
  getEstadoVencimientoEmpleado,
} from '@/lib/documentConstants';

// ==================== INTERFACES ====================

interface DocumentoFiltros {
  tipo?: string;
  verificado?: boolean;
  estado_vencimiento?: string;
}

interface DocumentosQueryOptions {
  filtros?: DocumentoFiltros;
  enabled?: boolean;
}

interface SubirDocumentoParams {
  profesionalId: number;
  formData: FormData;
}

interface ActualizarDocumentoParams {
  profesionalId: number;
  documentoId: number;
  data: Record<string, unknown>;
}

interface EliminarDocumentoParams {
  profesionalId: number;
  documentoId: number;
}

interface VerificarDocumentoParams {
  profesionalId: number;
  documentoId: number;
  verificado: boolean;
  notas_verificacion?: string;
}

interface ObtenerUrlDocumentoParams {
  profesionalId: number;
  documentoId: number;
  expiry?: number;
}

interface ReemplazarArchivoParams {
  profesionalId: number;
  documentoId: number;
  formData: FormData;
}

interface PrepararFormDataInput {
  [key: string]: string | number | boolean | null | undefined;
}

// ==================== CONSTANTES (re-exportadas desde lib) ====================

export const TIPOS_DOCUMENTO_EMPLEADO = TIPOS_DOCUMENTO_EMPLEADO_LIB;
export const ESTADOS_VENCIMIENTO = ESTADOS_VENCIMIENTO_EMPLEADO;

// ==================== QUERY KEYS ====================

export const documentosKeys = {
  all: ['documentos-empleado'] as const,
  lists: () => [...documentosKeys.all, 'list'] as const,
  list: (profesionalId: number | string | null | undefined, filters?: DocumentoFiltros) =>
    [...documentosKeys.lists(), profesionalId, filters] as const,
  details: () => [...documentosKeys.all, 'detail'] as const,
  detail: (profesionalId: number | string | null | undefined, documentoId: number | string | null | undefined) =>
    [...documentosKeys.details(), profesionalId, documentoId] as const,
};

// ==================== HOOKS DE QUERY ====================

/**
 * Lista documentos de un profesional
 */
export function useDocumentosEmpleado(profesionalId: number | string | null | undefined, options: DocumentosQueryOptions = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: documentosKeys.list(profesionalId, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarDocumentos(Number(profesionalId), filtros);
      return (response as any).data?.data || (response as any).data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Obtiene un documento especifico
 */
export function useDocumentoEmpleado(profesionalId: number | string | null | undefined, documentoId: number | string | null | undefined) {
  return useQuery({
    queryKey: documentosKeys.detail(profesionalId, documentoId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerDocumento(Number(profesionalId), Number(documentoId));
      return (response as any).data?.data || (response as any).data;
    },
    enabled: !!profesionalId && !!documentoId,
  });
}

// ==================== HOOKS DE MUTACION ====================

/**
 * Sube un nuevo documento
 */
export function useSubirDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, formData }: SubirDocumentoParams) => {
      const response = await profesionalesApi.subirDocumento(profesionalId, formData);
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists(), refetchType: 'active' });
      toast.success('Documento subido exitosamente');
    },
    onError: createCRUDErrorHandler('create', 'Documento'),
  });
}

/**
 * Actualiza metadata de un documento
 */
export function useActualizarDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, data }: ActualizarDocumentoParams) => {
      const response = await profesionalesApi.actualizarDocumento(profesionalId, documentoId, data);
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.detail(variables.profesionalId, variables.documentoId)
      });
      toast.success('Documento actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Documento'),
  });
}

/**
 * Elimina un documento (soft delete)
 */
export function useEliminarDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId }: EliminarDocumentoParams) => {
      const response = await profesionalesApi.eliminarDocumento(profesionalId, documentoId);
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists(), refetchType: 'active' });
      toast.success('Documento eliminado');
    },
    onError: createCRUDErrorHandler('delete', 'Documento'),
  });
}

/**
 * Marca un documento como verificado/no verificado
 */
export function useVerificarDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, verificado, notas_verificacion }: VerificarDocumentoParams) => {
      const response = await profesionalesApi.verificarDocumento(profesionalId, documentoId, {
        verificado,
        notas_verificacion
      });
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.detail(variables.profesionalId, variables.documentoId)
      });
      const accion = variables.verificado ? 'verificado' : 'desverificado';
      toast.success(`Documento ${accion}`);
    },
    onError: createCRUDErrorHandler('update', 'Documento'),
  });
}

/**
 * Obtiene URL firmada temporal para descargar documento
 */
export function useObtenerUrlDocumento() {
  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, expiry = 3600 }: ObtenerUrlDocumentoParams) => {
      const response = await profesionalesApi.obtenerUrlDocumento(profesionalId, documentoId, { expiry });
      return (response as any).data?.data || (response as any).data;
    },
    onError: createCRUDErrorHandler('fetch', 'URL de descarga'),
  });
}

/**
 * Reemplaza el archivo de un documento existente
 */
export function useReemplazarArchivo() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, formData }: ReemplazarArchivoParams) => {
      const response = await profesionalesApi.reemplazarArchivoDocumento(profesionalId, documentoId, formData);
      return (response as any).data?.data || (response as any).data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists(), refetchType: 'active' });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.detail(variables.profesionalId, variables.documentoId)
      });
      toast.success('Archivo reemplazado exitosamente');
    },
    onError: createCRUDErrorHandler('update', 'Archivo'),
  });
}

// ==================== UTILIDADES (re-exportadas desde lib) ====================

// NOTA: formatFileSize movido a @/lib/utils

/**
 * Obtiene el label de un tipo de documento
 * Re-exportado desde @/lib/documentConstants
 */
export const getTipoDocumentoLabel = getTipoDocumentoEmpleado;

/**
 * Obtiene el estado de vencimiento con su configuracion visual
 * Re-exportado desde @/lib/documentConstants
 */
export const getEstadoVencimiento = getEstadoVencimientoEmpleado;

/**
 * Prepara FormData para subir documento
 */
export function prepararFormDataDocumento(data: PrepararFormDataInput, file?: File): FormData {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, String(value));
    }
  });

  return formData;
}
