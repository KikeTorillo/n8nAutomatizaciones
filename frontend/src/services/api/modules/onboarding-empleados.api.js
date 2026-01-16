import apiClient from '../client';
/**
 * API de Onboarding de Empleados
 */
export const onboardingEmpleadosApi = {
  // ========== Plantillas ==========

  /**
   * Listar plantillas de onboarding
   * @param {Object} params - { departamento_id, puesto_id, activo, limite, offset }
   */
  listarPlantillas: (params = {}) =>
    apiClient.get('/onboarding-empleados/plantillas', { params }),

  /**
   * Crear plantilla de onboarding
   * @param {Object} data - { nombre, descripcion, departamento_id, puesto_id, duracion_dias, activo }
   */
  crearPlantilla: (data) =>
    apiClient.post('/onboarding-empleados/plantillas', data),

  /**
   * Obtener plantilla con tareas
   * @param {number} plantillaId
   */
  obtenerPlantilla: (plantillaId) =>
    apiClient.get(`/onboarding-empleados/plantillas/${plantillaId}`),

  /**
   * Actualizar plantilla
   * @param {number} plantillaId
   * @param {Object} data
   */
  actualizarPlantilla: (plantillaId, data) =>
    apiClient.put(`/onboarding-empleados/plantillas/${plantillaId}`, data),

  /**
   * Eliminar plantilla (soft delete)
   * @param {number} plantillaId
   */
  eliminarPlantilla: (plantillaId) =>
    apiClient.delete(`/onboarding-empleados/plantillas/${plantillaId}`),

  /**
   * Obtener plantillas sugeridas para un profesional
   * @param {number} profesionalId
   */
  obtenerPlantillasSugeridas: (profesionalId) =>
    apiClient.get(`/onboarding-empleados/plantillas/sugeridas/${profesionalId}`),

  // ========== Tareas ==========

  /**
   * Crear tarea en plantilla
   * @param {number} plantillaId
   * @param {Object} data - { titulo, descripcion, responsable_tipo, dias_limite, orden, es_obligatoria, url_recurso }
   */
  crearTarea: (plantillaId, data) =>
    apiClient.post(`/onboarding-empleados/plantillas/${plantillaId}/tareas`, data),

  /**
   * Actualizar tarea
   * @param {number} tareaId
   * @param {Object} data
   */
  actualizarTarea: (tareaId, data) =>
    apiClient.put(`/onboarding-empleados/tareas/${tareaId}`, data),

  /**
   * Eliminar tarea (soft delete)
   * @param {number} tareaId
   */
  eliminarTarea: (tareaId) =>
    apiClient.delete(`/onboarding-empleados/tareas/${tareaId}`),

  /**
   * Reordenar tareas de una plantilla
   * @param {number} plantillaId
   * @param {Array} items - [{ id, orden }]
   */
  reordenarTareas: (plantillaId, items) =>
    apiClient.patch(`/onboarding-empleados/plantillas/${plantillaId}/tareas/reordenar`, { items }),

  // ========== Dashboard RRHH ==========

  /**
   * Obtener dashboard de onboarding
   * @param {Object} params - { departamento_id, estado_empleado, limite, offset }
   */
  obtenerDashboard: (params = {}) =>
    apiClient.get('/onboarding-empleados/dashboard', { params }),

  /**
   * Obtener tareas vencidas de todos los empleados
   * @param {Object} params - { solo_obligatorias, limite, offset }
   */
  obtenerTareasVencidas: (params = {}) =>
    apiClient.get('/onboarding-empleados/vencidas', { params }),
};

// ==================== CATÁLOGO DE HABILIDADES ====================
