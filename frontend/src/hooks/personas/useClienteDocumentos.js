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

// ====================================================================
// CONSTANTES
// ====================================================================

export const TIPOS_DOCUMENTO = [
  { value: 'ine', label: 'INE / Identificación oficial', categoria: 'identificacion' },
  { value: 'pasaporte', label: 'Pasaporte', categoria: 'identificacion' },
  { value: 'curp', label: 'CURP', categoria: 'identificacion' },
  { value: 'rfc', label: 'Constancia RFC', categoria: 'fiscal' },
  { value: 'comprobante_domicilio', label: 'Comprobante de domicilio', categoria: 'identificacion' },
  { value: 'contrato', label: 'Contrato de servicios', categoria: 'legal' },
  { value: 'consentimiento', label: 'Consentimiento informado', categoria: 'legal' },
  { value: 'historia_clinica', label: 'Historia clínica', categoria: 'medico' },
  { value: 'receta_medica', label: 'Receta médica', categoria: 'medico' },
  { value: 'estudios_laboratorio', label: 'Estudios de laboratorio', categoria: 'medico' },
  { value: 'radiografia', label: 'Radiografía / Imagen', categoria: 'medico' },
  { value: 'poliza_seguro', label: 'Póliza de seguro', categoria: 'financiero' },
  { value: 'factura', label: 'Factura', categoria: 'financiero' },
  { value: 'comprobante_pago', label: 'Comprobante de pago', categoria: 'financiero' },
  { value: 'foto', label: 'Fotografía', categoria: 'otro' },
  { value: 'otro', label: 'Otro documento', categoria: 'otro' },
];

export const ESTADOS_VENCIMIENTO = [
  { value: 'vencido', label: 'Vencido', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900' },
  { value: 'por_vencer', label: 'Por vencer', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900' },
  { value: 'vigente', label: 'Vigente', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900' },
  { value: 'sin_vencimiento', label: 'Sin vencimiento', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
];

// ====================================================================
// QUERIES
// ====================================================================

/**
 * Hook para listar documentos de un cliente
 */
export function useDocumentosCliente(clienteId, params = {}) {
  return useQuery({
    queryKey: ['cliente-documentos', clienteId, params],
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
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos-conteo', variables.clienteId] });
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
      queryClient.invalidateQueries({ queryKey: ['cliente-documento', variables.clienteId, variables.documentoId] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos', variables.clienteId] });
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
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos-conteo', variables.clienteId] });
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
      queryClient.invalidateQueries({ queryKey: ['cliente-documento', variables.clienteId, variables.documentoId] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos-conteo', variables.clienteId] });
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
      queryClient.invalidateQueries({ queryKey: ['cliente-documento', variables.clienteId, variables.documentoId] });
      queryClient.invalidateQueries({ queryKey: ['cliente-documentos', variables.clienteId] });
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
// HELPER FUNCTIONS
// ====================================================================

/**
 * Obtener configuración de tipo de documento
 */
export function getTipoDocumento(tipo) {
  return TIPOS_DOCUMENTO.find(t => t.value === tipo) || TIPOS_DOCUMENTO[TIPOS_DOCUMENTO.length - 1];
}

/**
 * Obtener configuración de estado de vencimiento
 */
export function getEstadoVencimiento(estado) {
  return ESTADOS_VENCIMIENTO.find(e => e.value === estado) || ESTADOS_VENCIMIENTO[3];
}

// NOTA: formatFileSize movido a @/lib/utils

/**
 * Verificar si un documento está por vencer (próximos 30 días)
 */
export function estaProximoAVencer(fechaVencimiento, dias = 30) {
  if (!fechaVencimiento) return false;

  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diferenciaDias = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

  return diferenciaDias >= 0 && diferenciaDias <= dias;
}

/**
 * Verificar si un documento está vencido
 */
export function estaVencido(fechaVencimiento) {
  if (!fechaVencimiento) return false;

  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);

  return vencimiento < hoy;
}
