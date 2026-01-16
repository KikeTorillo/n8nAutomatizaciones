import apiClient from '../client';
/**
 * API de Sucursales
 */
export const sucursalesApi = {
  // ========== CRUD Sucursales ==========

  /**
   * Listar sucursales con filtros
   * @param {Object} params - { activo, es_matriz, ciudad_id }
   * @returns {Promise<Object>} { sucursales }
   */
  listar: (params = {}) => apiClient.get('/sucursales', { params }),

  /**
   * Obtener sucursal por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/sucursales/${id}`),

  /**
   * Obtener sucursal matriz de la organización
   * @returns {Promise<Object>}
   */
  obtenerMatriz: () => apiClient.get('/sucursales/matriz'),

  /**
   * Obtener sucursales asignadas a un usuario
   * @param {number} usuarioId
   * @returns {Promise<Object>}
   */
  obtenerPorUsuario: (usuarioId) => apiClient.get(`/sucursales/usuario/${usuarioId}`),

  /**
   * Crear nueva sucursal
   * @param {Object} data - { nombre, codigo?, direccion?, estado_id?, ciudad_id?, ... }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/sucursales', data),

  /**
   * Actualizar sucursal
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/sucursales/${id}`, data),

  /**
   * Eliminar sucursal (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/sucursales/${id}`),

  // ========== Métricas Dashboard ==========

  /**
   * Obtener métricas consolidadas para dashboard multi-sucursal
   * @param {Object} params - { sucursal_id?, fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>} { ventas, citas, comparativaSucursales, tendencia, transferencias }
   */
  obtenerMetricas: (params = {}) => apiClient.get('/sucursales/metricas', { params }),

  // ========== Usuarios de Sucursal ==========

  /**
   * Obtener usuarios asignados a una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>}
   */
  obtenerUsuarios: (sucursalId) => apiClient.get(`/sucursales/${sucursalId}/usuarios`),

  /**
   * Asignar usuario a sucursal
   * @param {number} sucursalId
   * @param {Object} data - { usuario_id, es_gerente?, rol_sucursal?, activo? }
   * @returns {Promise<Object>}
   */
  asignarUsuario: (sucursalId, data) => apiClient.post(`/sucursales/${sucursalId}/usuarios`, data),

  // ========== Profesionales de Sucursal ==========

  /**
   * Obtener profesionales asignados a una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>}
   */
  obtenerProfesionales: (sucursalId) => apiClient.get(`/sucursales/${sucursalId}/profesionales`),

  /**
   * Asignar profesional a sucursal
   * @param {number} sucursalId
   * @param {Object} data - { profesional_id, horarios_personalizados?, activo? }
   * @returns {Promise<Object>}
   */
  asignarProfesional: (sucursalId, data) => apiClient.post(`/sucursales/${sucursalId}/profesionales`, data),

  // ========== Transferencias de Stock ==========

  /**
   * Listar transferencias de stock
   * @param {Object} params - { estado?, sucursal_origen_id?, sucursal_destino_id?, fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>}
   */
  listarTransferencias: (params = {}) => apiClient.get('/sucursales/transferencias/lista', { params }),

  /**
   * Obtener transferencia por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerTransferencia: (id) => apiClient.get(`/sucursales/transferencias/${id}`),

  /**
   * Crear nueva transferencia
   * @param {Object} data - { sucursal_origen_id, sucursal_destino_id, notas?, items? }
   * @returns {Promise<Object>}
   */
  crearTransferencia: (data) => apiClient.post('/sucursales/transferencias', data),

  /**
   * Agregar item a transferencia
   * @param {number} transferenciaId
   * @param {Object} data - { producto_id, cantidad_enviada, notas? }
   * @returns {Promise<Object>}
   */
  agregarItemTransferencia: (transferenciaId, data) =>
    apiClient.post(`/sucursales/transferencias/${transferenciaId}/items`, data),

  /**
   * Eliminar item de transferencia
   * @param {number} transferenciaId
   * @param {number} itemId
   * @returns {Promise<Object>}
   */
  eliminarItemTransferencia: (transferenciaId, itemId) =>
    apiClient.delete(`/sucursales/transferencias/${transferenciaId}/items/${itemId}`),

  /**
   * Enviar transferencia (borrador -> enviado)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviarTransferencia: (id) => apiClient.post(`/sucursales/transferencias/${id}/enviar`),

  /**
   * Recibir transferencia (enviado -> recibido)
   * @param {number} id
   * @param {Object} data - { items?: [{ id, cantidad_recibida, notas? }] }
   * @returns {Promise<Object>}
   */
  recibirTransferencia: (id, data = {}) => apiClient.post(`/sucursales/transferencias/${id}/recibir`, data),

  /**
   * Cancelar transferencia
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelarTransferencia: (id) => apiClient.post(`/sucursales/transferencias/${id}/cancelar`),
};

// ==================== ORGANIZACIÓN (Dic 2025) ====================

/**
 * API de Departamentos
 * Gestión de estructura departamental jerárquica
 */
