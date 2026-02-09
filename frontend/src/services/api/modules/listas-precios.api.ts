import apiClient from '../client';

/**
 * API de Listas de Precios
 */
export const listasPreciosApi = {
  /** Listar listas de precios */
  listar: (params: Record<string, unknown>) => apiClient.get('/listas-precios', { params }),

  /** Obtener lista por ID */
  obtenerPorId: (id: number) => apiClient.get(`/listas-precios/${id}`),

  /** Crear lista de precios */
  crear: (data: Record<string, unknown>) => apiClient.post('/listas-precios', data),

  /** Actualizar lista de precios */
  actualizar: (id: number, data: Record<string, unknown>) => apiClient.put(`/listas-precios/${id}`, data),

  /** Eliminar lista de precios */
  eliminar: (id: number) => apiClient.delete(`/listas-precios/${id}`),

  // Items de lista

  /** Listar items de una lista */
  listarItems: (listaId: number) => apiClient.get(`/listas-precios/${listaId}/items`),

  /** Crear item de lista */
  crearItem: (listaId: number, data: Record<string, unknown>) => apiClient.post(`/listas-precios/${listaId}/items`, data),

  /** Actualizar item */
  actualizarItem: (itemId: number, data: Record<string, unknown>) => apiClient.put(`/listas-precios/items/${itemId}`, data),

  /** Eliminar item */
  eliminarItem: (itemId: number) => apiClient.delete(`/listas-precios/items/${itemId}`),

  // Resolución de precios

  /** Obtener precio de producto */
  obtenerPrecio: (productoId: number, params: Record<string, unknown>) =>
    apiClient.get(`/listas-precios/precio/${productoId}`, { params }),

  /** Obtener precios de carrito */
  obtenerPreciosCarrito: (data: Record<string, unknown>) => apiClient.post('/listas-precios/precios-carrito', data),

  // Asignación a clientes

  /** Listar clientes de una lista */
  listarClientes: (listaId: number) => apiClient.get(`/listas-precios/${listaId}/clientes`),

  /** Asignar lista a cliente */
  asignarCliente: (listaId: number, clienteId: number) =>
    apiClient.post(`/listas-precios/${listaId}/asignar-cliente`, { clienteId }),

  /** Asignar lista a múltiples clientes */
  asignarClientesBulk: (listaId: number, clienteIds: number[]) =>
    apiClient.post(`/listas-precios/${listaId}/asignar-clientes`, { clienteIds }),
};
