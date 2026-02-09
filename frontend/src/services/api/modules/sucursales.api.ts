import apiClient from '../client';

/**
 * API de Sucursales
 */
export const sucursalesApi = {
  // ========== CRUD Sucursales ==========

  /** Listar sucursales con filtros */
  listar: (params: Record<string, unknown> = {}) => apiClient.get('/sucursales', { params }),

  /** Obtener sucursal por ID */
  obtener: (id: number) => apiClient.get(`/sucursales/${id}`),

  /** Obtener sucursal matriz de la organización */
  obtenerMatriz: () => apiClient.get('/sucursales/matriz'),

  /** Obtener sucursales asignadas a un usuario */
  obtenerPorUsuario: (usuarioId: number) => apiClient.get(`/sucursales/usuario/${usuarioId}`),

  /** Crear nueva sucursal */
  crear: (data: Record<string, unknown>) => apiClient.post('/sucursales', data),

  /** Actualizar sucursal */
  actualizar: (id: number, data: Record<string, unknown>) => apiClient.put(`/sucursales/${id}`, data),

  /** Eliminar sucursal (soft delete) */
  eliminar: (id: number) => apiClient.delete(`/sucursales/${id}`),

  // ========== Métricas Dashboard ==========

  /** Obtener métricas consolidadas para dashboard multi-sucursal */
  obtenerMetricas: (params: Record<string, unknown> = {}) => apiClient.get('/sucursales/metricas', { params }),

  // ========== Usuarios de Sucursal ==========

  /** Obtener usuarios asignados a una sucursal */
  obtenerUsuarios: (sucursalId: number) => apiClient.get(`/sucursales/${sucursalId}/usuarios`),

  /** Asignar usuario a sucursal */
  asignarUsuario: (sucursalId: number, data: Record<string, unknown>) =>
    apiClient.post(`/sucursales/${sucursalId}/usuarios`, data),

  // ========== Profesionales de Sucursal ==========

  /** Obtener profesionales asignados a una sucursal */
  obtenerProfesionales: (sucursalId: number) => apiClient.get(`/sucursales/${sucursalId}/profesionales`),

  /** Asignar profesional a sucursal */
  asignarProfesional: (sucursalId: number, data: Record<string, unknown>) =>
    apiClient.post(`/sucursales/${sucursalId}/profesionales`, data),

  // ========== Transferencias de Stock ==========

  /** Listar transferencias de stock */
  listarTransferencias: (params: Record<string, unknown> = {}) =>
    apiClient.get('/sucursales/transferencias/lista', { params }),

  /** Obtener transferencia por ID */
  obtenerTransferencia: (id: number) => apiClient.get(`/sucursales/transferencias/${id}`),

  /** Crear nueva transferencia */
  crearTransferencia: (data: Record<string, unknown>) => apiClient.post('/sucursales/transferencias', data),

  /** Agregar item a transferencia */
  agregarItemTransferencia: (transferenciaId: number, data: Record<string, unknown>) =>
    apiClient.post(`/sucursales/transferencias/${transferenciaId}/items`, data),

  /** Eliminar item de transferencia */
  eliminarItemTransferencia: (transferenciaId: number, itemId: number) =>
    apiClient.delete(`/sucursales/transferencias/${transferenciaId}/items/${itemId}`),

  /** Enviar transferencia (borrador -> enviado) */
  enviarTransferencia: (id: number) => apiClient.post(`/sucursales/transferencias/${id}/enviar`),

  /** Recibir transferencia (enviado -> recibido) */
  recibirTransferencia: (id: number, data: Record<string, unknown> = {}) =>
    apiClient.post(`/sucursales/transferencias/${id}/recibir`, data),

  /** Cancelar transferencia */
  cancelarTransferencia: (id: number) => apiClient.post(`/sucursales/transferencias/${id}/cancelar`),
};

// ==================== ORGANIZACIÓN (Dic 2025) ====================

/**
 * API de Departamentos
 * Gestión de estructura departamental jerárquica
 */
