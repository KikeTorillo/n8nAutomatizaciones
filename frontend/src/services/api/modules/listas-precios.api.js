import apiClient from '../client';
/**
 * API de Listas de Precios
 */
export const listasPreciosApi = {
  /**
   * Listar listas de precios
   * @param {Object} params - { soloActivas?, moneda? }
   * @returns {Promise<Object[]>} Listas de precios
   */
  listar: (params) => apiClient.get('/listas-precios', { params }),

  /**
   * Obtener lista por ID
   * @param {number} id
   * @returns {Promise<Object>} Lista con detalles
   */
  obtenerPorId: (id) => apiClient.get(`/listas-precios/${id}`),

  /**
   * Crear lista de precios
   * @param {Object} data - { codigo, nombre, descripcion?, moneda?, es_default?, descuento_global_pct? }
   * @returns {Promise<Object>} Lista creada
   */
  crear: (data) => apiClient.post('/listas-precios', data),

  /**
   * Actualizar lista de precios
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Lista actualizada
   */
  actualizar: (id, data) => apiClient.put(`/listas-precios/${id}`, data),

  /**
   * Eliminar lista de precios
   * @param {number} id
   * @returns {Promise<void>}
   */
  eliminar: (id) => apiClient.delete(`/listas-precios/${id}`),

  // Items de lista
  /**
   * Listar items de una lista
   * @param {number} listaId
   * @returns {Promise<Object[]>} Items
   */
  listarItems: (listaId) => apiClient.get(`/listas-precios/${listaId}/items`),

  /**
   * Crear item de lista
   * @param {number} listaId
   * @param {Object} data - { producto_id?, categoria_id?, cantidad_minima?, precio_fijo?, descuento_pct? }
   * @returns {Promise<Object>} Item creado
   */
  crearItem: (listaId, data) => apiClient.post(`/listas-precios/${listaId}/items`, data),

  /**
   * Actualizar item
   * @param {number} itemId
   * @param {Object} data
   * @returns {Promise<Object>} Item actualizado
   */
  actualizarItem: (itemId, data) => apiClient.put(`/listas-precios/items/${itemId}`, data),

  /**
   * Eliminar item
   * @param {number} itemId
   * @returns {Promise<void>}
   */
  eliminarItem: (itemId) => apiClient.delete(`/listas-precios/items/${itemId}`),

  // Resolución de precios
  /**
   * Obtener precio de producto
   * @param {number} productoId
   * @param {Object} params - { clienteId?, cantidad?, moneda?, sucursalId? }
   * @returns {Promise<Object>} Precio resuelto
   */
  obtenerPrecio: (productoId, params) => apiClient.get(`/listas-precios/precio/${productoId}`, { params }),

  /**
   * Obtener precios de carrito
   * @param {Object} data - { items: [{ productoId, cantidad }], clienteId?, moneda?, sucursalId? }
   * @returns {Promise<Object[]>} Precios
   */
  obtenerPreciosCarrito: (data) => apiClient.post('/listas-precios/precios-carrito', data),

  // Asignación a clientes
  /**
   * Listar clientes de una lista
   * @param {number} listaId
   * @returns {Promise<Object[]>} Clientes
   */
  listarClientes: (listaId) => apiClient.get(`/listas-precios/${listaId}/clientes`),

  /**
   * Asignar lista a cliente
   * @param {number} listaId
   * @param {number} clienteId
   * @returns {Promise<Object>}
   */
  asignarCliente: (listaId, clienteId) => apiClient.post(`/listas-precios/${listaId}/asignar-cliente`, { clienteId }),

  /**
   * Asignar lista a múltiples clientes
   * @param {number} listaId
   * @param {number[]} clienteIds
   * @returns {Promise<Object>}
   */
  asignarClientesBulk: (listaId, clienteIds) => apiClient.post(`/listas-precios/${listaId}/asignar-clientes`, { clienteIds }),
};

// ==================== CONTEOS DE INVENTARIO (Dic 2025) ====================
