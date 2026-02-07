/**
 * ====================================================================
 * HOOKS - DOCUMENTOS DE CLIENTES
 * ====================================================================
 *
 * Fase 4B - Documentos de Cliente (Ene 2026)
 * Hooks TanStack Query para gestión de documentos
 *
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { clientesApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import {
  TIPOS_DOCUMENTO_CLIENTE,
  ESTADOS_VENCIMIENTO_CLIENTE,
  getTipoDocumentoCliente,
  getEstadoVencimientoCliente,
} from '@/lib/documentConstants';
import { estaProximoAVencer, estaVencido } from '@/lib/dateHelpers';

// ====================================================================
// CONSTANTES (re-exportadas desde lib)
// ====================================================================

export const TIPOS_DOCUMENTO = TIPOS_DOCUMENTO_CLIENTE;
export const ESTADOS_VENCIMIENTO = ESTADOS_VENCIMIENTO_CLIENTE;

// ====================================================================
// QUERIES
// ====================================================================

/**
 * Hook para listar documentos de un cliente
 */
export function useDocumentosCliente(clienteId, params = {}) {
  return useQuery({
    queryKey: [...queryKeys.personas.clientes.documentos(clienteId), params],
    queryFn: async () => {
      const response = await clientesApi.listarDocumentos(clienteId, params);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener un documento por ID
 */
export function useDocumento(clienteId, documentoId) {
  return useQuery({
    queryKey: ['cliente-documento', clienteId, documentoId],
    queryFn: async () => {
      const response = await clientesApi.obtenerDocumento(clienteId, documentoId);
      return response.data.data;
    },
    enabled: !!clienteId && !!documentoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para contar documentos de un cliente
 */
export function useConteoDocumentos(clienteId) {
  return useQuery({
    queryKey: ['cliente-documentos-conteo', clienteId],
    queryFn: async () => {
      const response = await clientesApi.contarDocumentos(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener tipos de documento
 */
export function useTiposDocumento() {
  return useQuery({
    queryKey: ['tipos-documento-cliente'],
    queryFn: async () => {
      const response = await clientesApi.obtenerTiposDocumento();
      return response.data.data;
    },
    staleTime: STALE_TIMES.LONG, // 30 minutos (datos estáticos)
  });
}

/**
 * Hook para listar documentos por vencer
 */
export function useDocumentosPorVencer(dias = 30) {
  return useQuery({
    queryKey: ['documentos-por-vencer', dias],
    queryFn: async () => {
      const response = await clientesApi.listarDocumentosPorVencer({ dias });
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * Hook para crear documento
 */
export function useCrearDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, data, archivo }) => {
      const formData = new FormData();

      // Agregar campos del documento
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      });

      // Agregar archivo si existe
      if (archivo) {
        formData.append('archivo', archivo);
      }

      const response = await clientesApi.crearDocumento(clienteId, formData);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.documentos(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos-conteo', variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Documento'),
  });
}

/**
 * Hook para actualizar documento
 */
export function useActualizarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, documentoId, data }) => {
      const response = await clientesApi.actualizarDocumento(clienteId, documentoId, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-documento', variables.clienteId, variables.documentoId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.documentos(variables.clienteId), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Documento'),
  });
}

/**
 * Hook para eliminar documento
 */
export function useEliminarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, documentoId }) => {
      await clientesApi.eliminarDocumento(clienteId, documentoId);
      return { clienteId, documentoId };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.documentos(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos-conteo', variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Documento'),
  });
}

/**
 * Hook para verificar documento
 */
export function useVerificarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, documentoId, verificado }) => {
      const response = await clientesApi.verificarDocumento(clienteId, documentoId, verificado);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-documento', variables.clienteId, variables.documentoId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.documentos(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos-conteo', variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Documento'),
  });
}

/**
 * Hook para subir archivo a documento existente
 */
export function useSubirArchivoDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, documentoId, archivo }) => {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const response = await clientesApi.subirArchivoDocumento(clienteId, documentoId, formData);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-documento', variables.clienteId, variables.documentoId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.clientes.documentos(variables.clienteId), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Archivo'),
  });
}

/**
 * Hook para obtener URL presigned
 */
export function useObtenerPresigned() {
  return useMutation({
    mutationFn: async ({ clienteId, documentoId, expiry = 3600 }) => {
      const response = await clientesApi.obtenerDocumentoPresigned(clienteId, documentoId, { expiry });
      return response.data.data;
    },
    onError: createCRUDErrorHandler('fetch', 'URL de descarga'),
  });
}

// ====================================================================
// HELPER FUNCTIONS (re-exportadas desde lib)
// ====================================================================

/**
 * Obtener configuración de tipo de documento
 * Re-exportado desde @/lib/documentConstants
 */
export const getTipoDocumento = getTipoDocumentoCliente;

/**
 * Obtener configuración de estado de vencimiento
 * Re-exportado desde @/lib/documentConstants
 */
export const getEstadoVencimiento = getEstadoVencimientoCliente;

// NOTA: formatFileSize movido a @/lib/utils

// Re-exportar helpers de fecha desde @/lib/dateHelpers
export { estaProximoAVencer, estaVencido };
