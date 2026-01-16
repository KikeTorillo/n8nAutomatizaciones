/**
 * useDocumentosEmpleado - Hooks para Documentos de Empleado
 * Fase 2 del Plan de Empleados Competitivo
 * Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profesionalesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';

// ==================== CONSTANTES ====================

export const TIPOS_DOCUMENTO_EMPLEADO = [
  { value: 'identificacion', label: 'Identificación (INE/Cédula)' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'licencia_conducir', label: 'Licencia de conducir' },
  { value: 'contrato', label: 'Contrato laboral' },
  { value: 'visa', label: 'Visa de trabajo' },
  { value: 'certificado', label: 'Certificado profesional' },
  { value: 'seguro_social', label: 'Seguro social (IMSS/ISSSTE)' },
  { value: 'comprobante_domicilio', label: 'Comprobante de domicilio' },
  { value: 'carta_recomendacion', label: 'Carta de recomendación' },
  { value: 'acta_nacimiento', label: 'Acta de nacimiento' },
  { value: 'curp', label: 'CURP' },
  { value: 'rfc', label: 'RFC' },
  { value: 'titulo_profesional', label: 'Título profesional' },
  { value: 'cedula_profesional', label: 'Cédula profesional' },
  { value: 'otro', label: 'Otro documento' },
];

export const ESTADOS_VENCIMIENTO = {
  sin_vencimiento: { label: 'Sin vencimiento', color: 'gray', icon: '📄' },
  vigente: { label: 'Vigente', color: 'green', icon: '✅' },
  por_vencer: { label: 'Por vencer', color: 'yellow', icon: '⚠️' },
  vencido: { label: 'Vencido', color: 'red', icon: '❌' },
};

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
    staleTime: 30 * 1000, // 30 segundos
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
      const mensaje = error.response?.data?.error || 'Error al subir documento';
      toast.error(mensaje);
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
      const mensaje = error.response?.data?.error || 'Error al actualizar documento';
      toast.error(mensaje);
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
      const mensaje = error.response?.data?.error || 'Error al eliminar documento';
      toast.error(mensaje);
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
      const mensaje = error.response?.data?.error || 'Error al verificar documento';
      toast.error(mensaje);
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
      const mensaje = error.response?.data?.error || 'Error al obtener URL de descarga';
      toast.error(mensaje);
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
      const mensaje = error.response?.data?.error || 'Error al reemplazar archivo';
      toast.error(mensaje);
    },
  });
}

// ==================== UTILIDADES ====================

/**
 * Formatea tamaño de archivo en formato legible
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtiene el label de un tipo de documento
 * @param {string} tipo - Tipo de documento
 * @returns {string} Label del tipo
 */
export function getTipoDocumentoLabel(tipo) {
  return TIPOS_DOCUMENTO_EMPLEADO.find(t => t.value === tipo)?.label || tipo;
}

/**
 * Obtiene el estado de vencimiento con su configuración visual
 * @param {string} estado - Estado de vencimiento
 * @returns {Object} { label, color, icon }
 */
export function getEstadoVencimiento(estado) {
  return ESTADOS_VENCIMIENTO[estado] || ESTADOS_VENCIMIENTO.sin_vencimiento;
}

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
