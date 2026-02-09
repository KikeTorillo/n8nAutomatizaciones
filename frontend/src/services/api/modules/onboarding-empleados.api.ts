import apiClient from '../client';

/**
 * API de Onboarding de Empleados
 */
export const onboardingEmpleadosApi = {
  // ========== Plantillas ==========

  /** Listar plantillas de onboarding */
  listarPlantillas: (params: Record<string, unknown> = {}) =>
    apiClient.get('/onboarding-empleados/plantillas', { params }),

  /** Crear plantilla de onboarding */
  crearPlantilla: (data: Record<string, unknown>) =>
    apiClient.post('/onboarding-empleados/plantillas', data),

  /** Obtener plantilla con tareas */
  obtenerPlantilla: (plantillaId: number) =>
    apiClient.get(`/onboarding-empleados/plantillas/${plantillaId}`),

  /** Actualizar plantilla */
  actualizarPlantilla: (plantillaId: number, data: Record<string, unknown>) =>
    apiClient.put(`/onboarding-empleados/plantillas/${plantillaId}`, data),

  /** Eliminar plantilla (soft delete) */
  eliminarPlantilla: (plantillaId: number) =>
    apiClient.delete(`/onboarding-empleados/plantillas/${plantillaId}`),

  /** Obtener plantillas sugeridas para un profesional */
  obtenerPlantillasSugeridas: (profesionalId: number) =>
    apiClient.get(`/onboarding-empleados/plantillas/sugeridas/${profesionalId}`),

  // ========== Tareas ==========

  /** Crear tarea en plantilla */
  crearTarea: (plantillaId: number, data: Record<string, unknown>) =>
    apiClient.post(`/onboarding-empleados/plantillas/${plantillaId}/tareas`, data),

  /** Actualizar tarea */
  actualizarTarea: (tareaId: number, data: Record<string, unknown>) =>
    apiClient.put(`/onboarding-empleados/tareas/${tareaId}`, data),

  /** Eliminar tarea (soft delete) */
  eliminarTarea: (tareaId: number) =>
    apiClient.delete(`/onboarding-empleados/tareas/${tareaId}`),

  /** Reordenar tareas de una plantilla */
  reordenarTareas: (plantillaId: number, items: Array<{ id: number; orden: number }>) =>
    apiClient.patch(`/onboarding-empleados/plantillas/${plantillaId}/tareas/reordenar`, { items }),

  // ========== Dashboard RRHH ==========

  /** Obtener dashboard de onboarding */
  obtenerDashboard: (params: Record<string, unknown> = {}) =>
    apiClient.get('/onboarding-empleados/dashboard', { params }),

  /** Obtener tareas vencidas de todos los empleados */
  obtenerTareasVencidas: (params: Record<string, unknown> = {}) =>
    apiClient.get('/onboarding-empleados/vencidas', { params }),
};
