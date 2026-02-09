import apiClient from '../client';

/**
 * API de Paquetes
 */
export const paquetesApi = {
  // ==================== PAQUETES POR OPERACION ====================

  /** Crear paquete para operación de empaque */
  crear: (operacionId: number, data: Record<string, unknown> = {}) =>
    apiClient.post(`/inventario/operaciones/${operacionId}/paquetes`, data),

  /** Listar paquetes de una operación */
  listarPorOperacion: (operacionId: number) =>
    apiClient.get(`/inventario/operaciones/${operacionId}/paquetes`),

  /** Obtener items disponibles para empacar */
  obtenerItemsDisponibles: (operacionId: number) =>
    apiClient.get(`/inventario/operaciones/${operacionId}/items-disponibles`),

  /** Obtener resumen de empaque de la operación */
  obtenerResumen: (operacionId: number) =>
    apiClient.get(`/inventario/operaciones/${operacionId}/resumen-empaque`),

  // ==================== PAQUETE INDIVIDUAL ====================

  /** Obtener paquete por ID con items */
  obtenerPorId: (id: number) => apiClient.get(`/inventario/paquetes/${id}`),

  /** Actualizar dimensiones/peso del paquete */
  actualizar: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/inventario/paquetes/${id}`, data),

  // ==================== ITEMS DE PAQUETE ====================

  /** Agregar item al paquete */
  agregarItem: (paqueteId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/paquetes/${paqueteId}/items`, data),

  /** Remover item del paquete */
  removerItem: (paqueteId: number, itemId: number) =>
    apiClient.delete(`/inventario/paquetes/${paqueteId}/items/${itemId}`),

  // ==================== ACCIONES DE PAQUETE ====================

  /** Cerrar paquete (no más modificaciones) */
  cerrar: (id: number) => apiClient.post(`/inventario/paquetes/${id}/cerrar`),

  /** Cancelar paquete */
  cancelar: (id: number, data: Record<string, unknown> = {}) =>
    apiClient.post(`/inventario/paquetes/${id}/cancelar`, data),

  /** Marcar paquete como etiquetado */
  etiquetar: (id: number, data: Record<string, unknown> = {}) =>
    apiClient.post(`/inventario/paquetes/${id}/etiquetar`, data),

  /** Marcar paquete como enviado */
  enviar: (id: number) => apiClient.post(`/inventario/paquetes/${id}/enviar`),

  /** Generar datos de etiqueta del paquete */
  generarEtiqueta: (id: number) => apiClient.get(`/inventario/paquetes/${id}/etiqueta`),
};
