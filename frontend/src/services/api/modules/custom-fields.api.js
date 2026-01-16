import apiClient from '../client';
/**
 * API de Custom Fields
 */
export const customFieldsApi = {
  // ========== Definiciones ==========

  /**
   * Listar definiciones de campos
   * @param {Object} params - { entidad_tipo?, activo?, seccion?, visible_en_formulario?, visible_en_listado?, limit?, offset? }
   */
  listarDefiniciones: (params = {}) => apiClient.get('/custom-fields/definiciones', { params }),

  /**
   * Obtener definición por ID
   * @param {number} id
   */
  obtenerDefinicion: (id) => apiClient.get(`/custom-fields/definiciones/${id}`),

  /**
   * Crear definición de campo
   * @param {Object} data - { nombre, entidad_tipo, tipo_dato, opciones?, requerido?, ... }
   */
  crearDefinicion: (data) => apiClient.post('/custom-fields/definiciones', data),

  /**
   * Actualizar definición de campo
   * @param {number} id
   * @param {Object} data
   */
  actualizarDefinicion: (id, data) => apiClient.put(`/custom-fields/definiciones/${id}`, data),

  /**
   * Eliminar definición de campo (soft delete)
   * @param {number} id
   */
  eliminarDefinicion: (id) => apiClient.delete(`/custom-fields/definiciones/${id}`),

  /**
   * Reordenar definiciones
   * @param {Object} data - { entidad_tipo, orden: [{ id, orden }] }
   */
  reordenarDefiniciones: (data) => apiClient.put('/custom-fields/definiciones/reorder', data),

  // ========== Valores ==========

  /**
   * Obtener valores de campos personalizados de una entidad
   * @param {string} entidadTipo - cliente, profesional, servicio, producto, cita, evento_digital, invitado_evento
   * @param {number} entidadId
   */
  obtenerValores: (entidadTipo, entidadId) =>
    apiClient.get(`/custom-fields/valores/${entidadTipo}/${entidadId}`),

  /**
   * Guardar valores de campos personalizados
   * @param {string} entidadTipo
   * @param {number} entidadId
   * @param {Object} valores - { nombre_clave: valor, ... }
   */
  guardarValores: (entidadTipo, entidadId, valores) =>
    apiClient.post(`/custom-fields/valores/${entidadTipo}/${entidadId}`, valores),

  /**
   * Validar valores de campos personalizados (sin guardar)
   * @param {string} entidadTipo
   * @param {Object} valores
   */
  validarValores: (entidadTipo, valores) =>
    apiClient.post(`/custom-fields/validar/${entidadTipo}`, valores),

  // ========== Utilidades ==========

  /**
   * Obtener secciones disponibles para un tipo de entidad
   * @param {string} entidadTipo
   */
  obtenerSecciones: (entidadTipo) => apiClient.get(`/custom-fields/secciones/${entidadTipo}`),
};

// ==================== WORKFLOWS DE APROBACIÓN ====================
