/**
 * useDocumentosEmpleado - Hooks para Documentos de Empleado
 * Fase 2 del Plan de Empleados Competitivo
 * Enero 2026
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

// ==================== CONSTANTES (re-exportadas desde lib) ====================

export const TIPOS_DOCUMENTO_EMPLEADO = TIPOS_DOCUMENTO_EMPLEADO_LIB;
export const ESTADOS_VENCIMIENTO = ESTADOS_VENCIMIENTO_EMPLEADO;

// ==================== QUERY KEYS ====================

export const documentosKeys = {
  all: ['documentos-empleado'],
  lists: () => [...documentosKeys.all, 'list'],
  list: (profesionalId, filters) => [...documentosKeys.lists(), profesionalId, filters],
  details: () => [...documentosKeys.all, 'detail'],
  detail: (profesionalId, documentoId) => [...documentosKeys.details(), profesionalId, documentoId],
};

// ==================== HOOKS DE QUERY ====================

/**
 * Lista documentos de un profesional
 * @param {number} profesionalId - ID del profesional
 * @param {Object} options - Opciones del hook
 * @param {Object} options.filtros - { tipo, verificado, estado_vencimiento }
 * @param {boolean} options.enabled - Si el query está habilitado
 */
export function useDocumentosEmpleado(profesionalId, options = {}) {
  const { filtros = {}, enabled = true } = options;

  return useQuery({
    queryKey: documentosKeys.list(profesionalId, filtros),
    queryFn: async () => {
      const response = await profesionalesApi.listarDocumentos(profesionalId, filtros);
      return response.data?.data || response.data;
    },
    enabled: enabled && !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Obtiene un documento específico
 * @param {number} profesionalId - ID del profesional
 * @param {number} documentoId - ID del documento
 */
export function useDocumentoEmpleado(profesionalId, documentoId) {
  return useQuery({
    queryKey: documentosKeys.detail(profesionalId, documentoId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerDocumento(profesionalId, documentoId);
      return response.data?.data || response.data;
    },
    enabled: !!profesionalId && !!documentoId,
  });
}

// ==================== HOOKS DE MUTACIÓN ====================

/**
 * Sube un nuevo documento
 * @returns {Object} Mutation object con mutate, isLoading, etc.
 */
export function useSubirDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, formData }) => {
      const response = await profesionalesApi.subirDocumento(profesionalId, formData);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists() });
      toast.success('Documento subido exitosamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('create', 'Documento')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Actualiza metadata de un documento
 */
export function useActualizarDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, data }) => {
      const response = await profesionalesApi.actualizarDocumento(profesionalId, documentoId, data);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.detail(variables.profesionalId, variables.documentoId)
      });
      toast.success('Documento actualizado');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Documento')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Elimina un documento (soft delete)
 */
export function useEliminarDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId }) => {
      const response = await profesionalesApi.eliminarDocumento(profesionalId, documentoId);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists() });
      toast.success('Documento eliminado');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('delete', 'Documento')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Marca un documento como verificado/no verificado
 */
export function useVerificarDocumento() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, verificado, notas_verificacion }) => {
      const response = await profesionalesApi.verificarDocumento(profesionalId, documentoId, {
        verificado,
        notas_verificacion
      });
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.detail(variables.profesionalId, variables.documentoId)
      });
      const accion = variables.verificado ? 'verificado' : 'desverificado';
      toast.success(`Documento ${accion}`);
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Documento')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Obtiene URL firmada temporal para descargar documento
 */
export function useObtenerUrlDocumento() {
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, expiry = 3600 }) => {
      const response = await profesionalesApi.obtenerUrlDocumento(profesionalId, documentoId, { expiry });
      return response.data?.data || response.data;
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('fetch', 'URL de descarga')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
  });
}

/**
 * Reemplaza el archivo de un documento existente
 */
export function useReemplazarArchivo() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ profesionalId, documentoId, formData }) => {
      const response = await profesionalesApi.reemplazarArchivoDocumento(profesionalId, documentoId, formData);
      return response.data?.data || response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentosKeys.detail(variables.profesionalId, variables.documentoId)
      });
      toast.success('Archivo reemplazado exitosamente');
    },
    onError: (error) => {
      try {
        createCRUDErrorHandler('update', 'Archivo')(error);
      } catch (e) {
        toast.error(e.message);
      }
    },
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
 * Obtiene el estado de vencimiento con su configuración visual
 * Re-exportado desde @/lib/documentConstants
 */
export const getEstadoVencimiento = getEstadoVencimientoEmpleado;

/**
 * Prepara FormData para subir documento
 * @param {Object} data - Datos del documento
 * @param {File} file - Archivo a subir
 * @returns {FormData}
 */
export function prepararFormDataDocumento(data, file) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}
