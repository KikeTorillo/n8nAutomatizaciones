import apiClient from '../client';

/**
 * API de Clientes
 * CRM, contactos, marketing, crédito, actividades
 */
export const clientesApi = {
  /**
   * Crear cliente
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/clientes', data),

  /**
   * Listar clientes con paginación
   * @param {Object} params - { page, limit, busqueda, activo, marketing_permitido, ordenPor, orden }
   * @returns {Promise<Object>} { data, pagination }
   */
  listar: (params = {}) => apiClient.get('/clientes', { params }),

  /**
   * Obtener cliente por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/clientes/${id}`),

  /**
   * Actualizar cliente
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/clientes/${id}`, data),

  /**
   * Eliminar cliente (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/clientes/${id}`),

  /**
   * Búsqueda rápida de clientes
   * @param {Object} params - { q, limit }
   * @returns {Promise<Object>}
   */
  buscar: (params) => apiClient.get('/clientes/buscar', { params }),

  /**
   * Buscar cliente por teléfono (útil para walk-in)
   * @param {Object} params - { telefono, exacto, incluir_inactivos, crear_si_no_existe }
   * @returns {Promise<Object>}
   */
  buscarPorTelefono: (params) => apiClient.get('/clientes/buscar-telefono', { params }),

  /**
   * Buscar cliente por nombre
   * @param {Object} params - { nombre, limit }
   * @returns {Promise<Object>}
   */
  buscarPorNombre: (params) => apiClient.get('/clientes/buscar-nombre', { params }),

  /**
   * Obtener estadísticas de clientes
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: () => apiClient.get('/clientes/estadisticas'),

  /**
   * Cambiar estado de cliente (activo/inactivo)
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, activo) => apiClient.patch(`/clientes/${id}/estado`, { activo }),

  /**
   * Obtener estadísticas de un cliente específico (Vista 360°)
   * Ene 2026: Total citas, ventas POS, lifetime value, servicios frecuentes
   * @param {number} id - ID del cliente
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasCliente: (id) => apiClient.get(`/clientes/${id}/estadisticas`),

  /**
   * Importar clientes desde CSV
   * Ene 2026: Importacion masiva de clientes
   * @param {Object} data - { clientes: Array<{ nombre, email?, telefono?, direccion?, notas? }> }
   * @returns {Promise<Object>} { creados, errores, duplicados }
   */
  importarCSV: (data) => apiClient.post('/clientes/importar-csv', data),

  // ==================== ETIQUETAS (Ene 2026 - Fase 2) ====================

  /**
   * Listar etiquetas de la organización
   * @param {Object} params - { soloActivas }
   * @returns {Promise<Object>}
   */
  listarEtiquetas: (params = {}) => apiClient.get('/clientes/etiquetas', { params }),

  /**
   * Crear etiqueta
   * @param {Object} data - { nombre, color, descripcion, orden }
   * @returns {Promise<Object>}
   */
  crearEtiqueta: (data) => apiClient.post('/clientes/etiquetas', data),

  /**
   * Obtener etiqueta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEtiqueta: (id) => apiClient.get(`/clientes/etiquetas/${id}`),

  /**
   * Actualizar etiqueta
   * @param {number} id
   * @param {Object} data - { nombre, color, descripcion, orden, activo }
   * @returns {Promise<Object>}
   */
  actualizarEtiqueta: (id, data) => apiClient.put(`/clientes/etiquetas/${id}`, data),

  /**
   * Eliminar etiqueta
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarEtiqueta: (id) => apiClient.delete(`/clientes/etiquetas/${id}`),

  /**
   * Obtener etiquetas de un cliente
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  obtenerEtiquetasCliente: (clienteId) => apiClient.get(`/clientes/${clienteId}/etiquetas`),

  /**
   * Asignar etiquetas a un cliente (reemplaza las existentes)
   * @param {number} clienteId
   * @param {Array<number>} etiquetaIds
   * @returns {Promise<Object>}
   */
  asignarEtiquetasCliente: (clienteId, etiquetaIds) =>
    apiClient.post(`/clientes/${clienteId}/etiquetas`, { etiqueta_ids: etiquetaIds }),

  /**
   * Agregar una etiqueta a un cliente
   * @param {number} clienteId
   * @param {number} etiquetaId
   * @returns {Promise<Object>}
   */
  agregarEtiquetaCliente: (clienteId, etiquetaId) =>
    apiClient.post(`/clientes/${clienteId}/etiquetas/${etiquetaId}`),

  /**
   * Quitar una etiqueta de un cliente
   * @param {number} clienteId
   * @param {number} etiquetaId
   * @returns {Promise<Object>}
   */
  quitarEtiquetaCliente: (clienteId, etiquetaId) =>
    apiClient.delete(`/clientes/${clienteId}/etiquetas/${etiquetaId}`),

  // ==================== ACTIVIDADES Y TIMELINE (Ene 2026 - Fase 4A) ====================

  /**
   * Listar actividades de un cliente
   * @param {number} clienteId
   * @param {Object} params - { page, limit, tipo, estado, soloTareas }
   * @returns {Promise<Object>}
   */
  listarActividades: (clienteId, params = {}) =>
    apiClient.get(`/clientes/${clienteId}/actividades`, { params }),

  /**
   * Obtener timeline unificado (actividades + citas + ventas)
   * @param {number} clienteId
   * @param {Object} params - { limit, offset }
   * @returns {Promise<Object>}
   */
  obtenerTimeline: (clienteId, params = {}) =>
    apiClient.get(`/clientes/${clienteId}/timeline`, { params }),

  /**
   * Crear actividad (nota, llamada, tarea, email)
   * @param {number} clienteId
   * @param {Object} data - { tipo, titulo, descripcion, fecha_vencimiento, prioridad, asignado_a }
   * @returns {Promise<Object>}
   */
  crearActividad: (clienteId, data) =>
    apiClient.post(`/clientes/${clienteId}/actividades`, data),

  /**
   * Obtener actividad por ID
   * @param {number} clienteId
   * @param {number} actividadId
   * @returns {Promise<Object>}
   */
  obtenerActividad: (clienteId, actividadId) =>
    apiClient.get(`/clientes/${clienteId}/actividades/${actividadId}`),

  /**
   * Actualizar actividad
   * @param {number} clienteId
   * @param {number} actividadId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarActividad: (clienteId, actividadId, data) =>
    apiClient.put(`/clientes/${clienteId}/actividades/${actividadId}`, data),

  /**
   * Eliminar actividad
   * @param {number} clienteId
   * @param {number} actividadId
   * @returns {Promise<Object>}
   */
  eliminarActividad: (clienteId, actividadId) =>
    apiClient.delete(`/clientes/${clienteId}/actividades/${actividadId}`),

  /**
   * Marcar tarea como completada
   * @param {number} clienteId
   * @param {number} actividadId
   * @returns {Promise<Object>}
   */
  completarTarea: (clienteId, actividadId) =>
    apiClient.patch(`/clientes/${clienteId}/actividades/${actividadId}/completar`),

  /**
   * Contar actividades de un cliente por tipo
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  contarActividades: (clienteId) =>
    apiClient.get(`/clientes/${clienteId}/actividades/conteo`),

  // ==================== DOCUMENTOS (Ene 2026 - Fase 4B) ====================

  /**
   * Obtener tipos de documento disponibles
   * @returns {Promise<Object>}
   */
  obtenerTiposDocumento: () =>
    apiClient.get('/clientes/documentos/tipos'),

  /**
   * Listar documentos por vencer de la organización
   * @param {Object} params - { dias }
   * @returns {Promise<Object>}
   */
  listarDocumentosPorVencer: (params = {}) =>
    apiClient.get('/clientes/documentos/por-vencer', { params }),

  /**
   * Listar documentos de un cliente
   * @param {number} clienteId
   * @param {Object} params - { tipo, verificado, estado_vencimiento, limite, offset }
   * @returns {Promise<Object>}
   */
  listarDocumentos: (clienteId, params = {}) =>
    apiClient.get(`/clientes/${clienteId}/documentos`, { params }),

  /**
   * Obtener documento por ID
   * @param {number} clienteId
   * @param {number} documentoId
   * @returns {Promise<Object>}
   */
  obtenerDocumento: (clienteId, documentoId) =>
    apiClient.get(`/clientes/${clienteId}/documentos/${documentoId}`),

  /**
   * Crear documento (con o sin archivo)
   * @param {number} clienteId
   * @param {FormData} formData - Datos del documento + archivo opcional
   * @returns {Promise<Object>}
   */
  crearDocumento: (clienteId, formData) =>
    apiClient.post(`/clientes/${clienteId}/documentos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * Actualizar documento
   * @param {number} clienteId
   * @param {number} documentoId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarDocumento: (clienteId, documentoId, data) =>
    apiClient.put(`/clientes/${clienteId}/documentos/${documentoId}`, data),

  /**
   * Eliminar documento
   * @param {number} clienteId
   * @param {number} documentoId
   * @returns {Promise<Object>}
   */
  eliminarDocumento: (clienteId, documentoId) =>
    apiClient.delete(`/clientes/${clienteId}/documentos/${documentoId}`),

  /**
   * Verificar/desverificar documento
   * @param {number} clienteId
   * @param {number} documentoId
   * @param {boolean} verificado
   * @returns {Promise<Object>}
   */
  verificarDocumento: (clienteId, documentoId, verificado) =>
    apiClient.patch(`/clientes/${clienteId}/documentos/${documentoId}/verificar`, { verificado }),

  /**
   * Obtener URL presigned para descargar documento
   * @param {number} clienteId
   * @param {number} documentoId
   * @param {Object} params - { expiry }
   * @returns {Promise<Object>}
   */
  obtenerDocumentoPresigned: (clienteId, documentoId, params = {}) =>
    apiClient.get(`/clientes/${clienteId}/documentos/${documentoId}/presigned`, { params }),

  /**
   * Contar documentos de un cliente
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  contarDocumentos: (clienteId) =>
    apiClient.get(`/clientes/${clienteId}/documentos/conteo`),

  /**
   * Subir/reemplazar archivo de un documento existente
   * @param {number} clienteId
   * @param {number} documentoId
   * @param {FormData} formData - Archivo
   * @returns {Promise<Object>}
   */
  subirArchivoDocumento: (clienteId, documentoId, formData) =>
    apiClient.post(`/clientes/${clienteId}/documentos/${documentoId}/archivo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ==================== OPORTUNIDADES POR CLIENTE (Ene 2026 - Fase 5) ====================

  /**
   * Listar oportunidades de un cliente
   * @param {number} clienteId
   * @param {Object} params - { page, limit, estado }
   * @returns {Promise<Object>}
   */
  listarOportunidadesCliente: (clienteId, params = {}) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades`, { params }),

  /**
   * Crear oportunidad para un cliente
   * @param {number} clienteId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crearOportunidadCliente: (clienteId, data) =>
    apiClient.post(`/clientes/${clienteId}/oportunidades`, data),

  /**
   * Obtener estadísticas de oportunidades de un cliente
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasOportunidadesCliente: (clienteId) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades/estadisticas`),

  // ==================== CRÉDITO / FIADO (Ene 2026) ====================

  /**
   * Obtener estado de crédito de un cliente
   * @param {number} clienteId
   * @returns {Promise<Object>} { cliente, permite_credito, limite_credito, saldo_credito, disponible, dias_credito, credito_suspendido }
   */
  obtenerEstadoCredito: (clienteId) =>
    apiClient.get(`/clientes/${clienteId}/credito`),

  /**
   * Actualizar configuración de crédito de un cliente
   * @param {number} clienteId
   * @param {Object} data - { permite_credito, limite_credito, dias_credito }
   * @returns {Promise<Object>}
   */
  actualizarCredito: (clienteId, data) =>
    apiClient.patch(`/clientes/${clienteId}/credito`, data),

  /**
   * Suspender crédito de un cliente
   * @param {number} clienteId
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  suspenderCredito: (clienteId, data = {}) =>
    apiClient.post(`/clientes/${clienteId}/credito/suspender`, data),

  /**
   * Reactivar crédito de un cliente
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  reactivarCredito: (clienteId) =>
    apiClient.post(`/clientes/${clienteId}/credito/reactivar`),

  /**
   * Registrar abono a cuenta de cliente
   * @param {number} clienteId
   * @param {Object} data - { monto, descripcion }
   * @returns {Promise<Object>}
   */
  registrarAbono: (clienteId, data) =>
    apiClient.post(`/clientes/${clienteId}/credito/abono`, data),

  /**
   * Listar movimientos de crédito de un cliente
   * @param {number} clienteId
   * @param {Object} params - { limit, offset }
   * @returns {Promise<Object>}
   */
  listarMovimientosCredito: (clienteId, params = {}) =>
    apiClient.get(`/clientes/${clienteId}/credito/movimientos`, { params }),

  /**
   * Listar clientes con saldo pendiente (cobranza)
   * @param {Object} params - { solo_vencidos }
   * @returns {Promise<Object>}
   */
  listarClientesConSaldo: (params = {}) =>
    apiClient.get('/clientes/credito/con-saldo', { params }),
};

// ==================== OPORTUNIDADES B2B (Ene 2026 - Fase 5) ====================

