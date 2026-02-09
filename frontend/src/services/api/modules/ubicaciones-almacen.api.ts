import apiClient from '../client';

/**
 * API de Ubicaciones de Almacén (WMS)
 */
export const ubicacionesAlmacenApi = {
  /** Crear nueva ubicación de almacén */
  crear: (data: Record<string, unknown>) => apiClient.post('/inventario/ubicaciones', data),

  /** Obtener ubicación por ID */
  obtener: (id: number) => apiClient.get(`/inventario/ubicaciones/${id}`),

  /** Listar ubicaciones con filtros */
  listar: (params: Record<string, unknown> = {}) => apiClient.get('/inventario/ubicaciones', { params }),

  /** Obtener árbol jerárquico de ubicaciones de una sucursal */
  obtenerArbol: (sucursalId: number) => apiClient.get(`/inventario/ubicaciones/arbol/${sucursalId}`),

  /** Actualizar ubicación */
  actualizar: (id: number, data: Record<string, unknown>) => apiClient.put(`/inventario/ubicaciones/${id}`, data),

  /** Eliminar ubicación (solo si no tiene stock ni sub-ubicaciones) */
  eliminar: (id: number) => apiClient.delete(`/inventario/ubicaciones/${id}`),

  /** Bloquear/Desbloquear ubicación */
  toggleBloqueo: (id: number, data: Record<string, unknown>) => apiClient.patch(`/inventario/ubicaciones/${id}/bloquear`, data),

  /** Obtener stock de una ubicación */
  obtenerStock: (id: number) => apiClient.get(`/inventario/ubicaciones/${id}/stock`),

  /** Agregar stock a una ubicación */
  agregarStock: (ubicacionId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/ubicaciones/${ubicacionId}/stock`, data),

  /** Mover stock entre ubicaciones */
  moverStock: (data: Record<string, unknown>) => apiClient.post('/inventario/ubicaciones/mover-stock', data),

  /** Obtener ubicaciones disponibles para almacenar */
  obtenerDisponibles: (sucursalId: number, params: Record<string, unknown> = {}) =>
    apiClient.get(`/inventario/ubicaciones/disponibles/${sucursalId}`, { params }),

  /** Obtener estadísticas de ubicaciones de una sucursal */
  obtenerEstadisticas: (sucursalId: number) => apiClient.get(`/inventario/ubicaciones/estadisticas/${sucursalId}`),

  /** Obtener ubicaciones donde está un producto */
  obtenerPorProducto: (productoId: number) => apiClient.get(`/inventario/productos/${productoId}/ubicaciones`),
};
