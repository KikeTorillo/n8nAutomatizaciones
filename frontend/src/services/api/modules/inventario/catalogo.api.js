import apiClient from '../../client';

/**
 * API de Catálogo de Inventario
 * Categorías, proveedores y productos CRUD básico
 */
export const catalogoApi = {
  // ========== Categorías de Productos ==========

  /**
   * Crear categoría de producto
   * @param {Object} data - { nombre, descripcion?, categoria_padre_id?, icono?, color?, orden?, activo? }
   * @returns {Promise<Object>}
   */
  crearCategoria: (data) => apiClient.post('/inventario/categorias', data),

  /**
   * Listar categorías con filtros
   * @param {Object} params - { activo?, categoria_padre_id?, busqueda? }
   * @returns {Promise<Object>} { categorias }
   */
  listarCategorias: (params = {}) => apiClient.get('/inventario/categorias', { params }),

  /**
   * Obtener árbol jerárquico de categorías
   * @returns {Promise<Object>} { arbol }
   */
  obtenerArbolCategorias: () => apiClient.get('/inventario/categorias/arbol'),

  /**
   * Obtener categoría por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerCategoria: (id) => apiClient.get(`/inventario/categorias/${id}`),

  /**
   * Actualizar categoría
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarCategoria: (id, data) => apiClient.put(`/inventario/categorias/${id}`, data),

  /**
   * Eliminar categoría (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarCategoria: (id) => apiClient.delete(`/inventario/categorias/${id}`),

  // ========== Proveedores ==========

  /**
   * Crear proveedor
   * @param {Object} data - { nombre, razon_social?, rfc?, telefono?, email?, sitio_web?, direccion?, ciudad?, estado?, codigo_postal?, pais?, dias_credito?, dias_entrega_estimados?, monto_minimo_compra?, notas?, activo? }
   * @returns {Promise<Object>}
   */
  crearProveedor: (data) => apiClient.post('/inventario/proveedores', data),

  /**
   * Listar proveedores con filtros
   * @param {Object} params - { activo?, busqueda?, ciudad?, rfc?, limit?, offset? }
   * @returns {Promise<Object>} { proveedores, total }
   */
  listarProveedores: (params = {}) => apiClient.get('/inventario/proveedores', { params }),

  /**
   * Obtener proveedor por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerProveedor: (id) => apiClient.get(`/inventario/proveedores/${id}`),

  /**
   * Actualizar proveedor
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarProveedor: (id, data) => apiClient.put(`/inventario/proveedores/${id}`, data),

  /**
   * Eliminar proveedor (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarProveedor: (id) => apiClient.delete(`/inventario/proveedores/${id}`),

  // ========== Productos CRUD Básico ==========

  /**
   * Crear producto
   * @param {Object} data - { nombre, descripcion?, sku?, codigo_barras?, categoria_id?, proveedor_id?, precio_compra?, precio_venta, stock_actual?, stock_minimo?, stock_maximo?, unidad_medida?, alerta_stock_minimo?, es_perecedero?, dias_vida_util?, permite_venta?, permite_uso_servicio?, notas?, activo? }
   * @returns {Promise<Object>}
   */
  crearProducto: (data) => apiClient.post('/inventario/productos', data),

  /**
   * Crear múltiples productos (bulk 1-50)
   * @param {Object} data - { productos: [...] }
   * @returns {Promise<Object>} { productos_creados, errores? }
   */
  bulkCrearProductos: (data) => apiClient.post('/inventario/productos/bulk', data),

  /**
   * Listar productos con filtros
   * @param {Object} params - { activo?, categoria_id?, proveedor_id?, busqueda?, sku?, codigo_barras?, stock_bajo?, stock_agotado?, permite_venta?, orden_por?, orden_dir?, limit?, offset? }
   * @returns {Promise<Object>} { productos, total }
   */
  listarProductos: (params = {}) => apiClient.get('/inventario/productos', { params }),

  /**
   * Buscar productos (full-text search + código de barras)
   * @param {Object} params - { q, tipo_busqueda?, categoria_id?, proveedor_id?, solo_activos?, solo_con_stock?, limit? }
   * @returns {Promise<Object>} { productos }
   */
  buscarProductos: (params) => apiClient.get('/inventario/productos/buscar', { params }),

  /**
   * Obtener productos con stock crítico
   * @returns {Promise<Object>} { productos }
   */
  obtenerStockCritico: () => apiClient.get('/inventario/productos/stock-critico'),

  /**
   * Obtener producto por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerProducto: (id) => apiClient.get(`/inventario/productos/${id}`),

  /**
   * Actualizar producto
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarProducto: (id, data) => apiClient.put(`/inventario/productos/${id}`, data),

  /**
   * Eliminar producto (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarProducto: (id) => apiClient.delete(`/inventario/productos/${id}`),
};
