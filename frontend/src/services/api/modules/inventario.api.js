import apiClient from '../client';
import { ubicacionesAlmacenApi } from './ubicaciones-almacen.api';

/**
 * API de Inventario
 * Gestión de productos, categorías, proveedores, stock, valoración
 */
export const inventarioApi = {
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

  // ========== Productos ==========

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
   * Ajustar stock manualmente (conteo físico, correcciones)
   * @param {number} id
   * @param {Object} data - { cantidad_ajuste, motivo, tipo_movimiento: 'entrada_ajuste' | 'salida_ajuste' }
   * @returns {Promise<Object>}
   */
  ajustarStock: (id, data) => apiClient.patch(`/inventario/productos/${id}/stock`, data),

  /**
   * Eliminar producto (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarProducto: (id) => apiClient.delete(`/inventario/productos/${id}`),

  // ========== Movimientos de Inventario ==========

  /**
   * Registrar movimiento de inventario
   * @param {Object} data - { producto_id, tipo_movimiento, cantidad, costo_unitario?, proveedor_id?, venta_pos_id?, cita_id?, usuario_id?, referencia?, motivo?, fecha_vencimiento?, lote? }
   * @returns {Promise<Object>}
   */
  registrarMovimiento: (data) => apiClient.post('/inventario/movimientos', data),

  /**
   * Listar movimientos con filtros
   * @param {Object} params - { tipo_movimiento?, categoria?, producto_id?, proveedor_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { movimientos, total }
   */
  listarMovimientos: (params = {}) => apiClient.get('/inventario/movimientos', { params }),

  /**
   * Obtener kardex de un producto
   * @param {number} productoId
   * @param {Object} params - { tipo_movimiento?, fecha_desde?, fecha_hasta?, proveedor_id?, limit?, offset? }
   * @returns {Promise<Object>} { kardex, producto }
   */
  obtenerKardex: (productoId, params = {}) => apiClient.get(`/inventario/movimientos/kardex/${productoId}`, { params }),

  /**
   * Obtener estadísticas de movimientos
   * @param {Object} params - { fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} { estadisticas }
   */
  obtenerEstadisticasMovimientos: (params) => apiClient.get('/inventario/movimientos/estadisticas', { params }),

  // ========== Alertas de Inventario ==========

  /**
   * Listar alertas con filtros
   * @param {Object} params - { tipo_alerta?, nivel?, leida?, producto_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { alertas, total }
   */
  listarAlertas: (params = {}) => apiClient.get('/inventario/alertas', { params }),

  /**
   * Obtener dashboard de alertas
   * @returns {Promise<Object>} { resumen, alertas_recientes }
   */
  obtenerDashboardAlertas: () => apiClient.get('/inventario/alertas/dashboard'),

  /**
   * Obtener alerta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerAlerta: (id) => apiClient.get(`/inventario/alertas/${id}`),

  /**
   * Marcar alerta como leída
   * @param {number} id
   * @returns {Promise<Object>}
   */
  marcarAlertaLeida: (id) => apiClient.patch(`/inventario/alertas/${id}/marcar-leida`),

  /**
   * Marcar múltiples alertas como leídas
   * @param {Object} data - { alerta_ids: [...] }
   * @returns {Promise<Object>}
   */
  marcarVariasAlertasLeidas: (data) => apiClient.patch('/inventario/alertas/marcar-varias-leidas', data),

  // ========== Reportes de Inventario ==========

  /**
   * Obtener valor total del inventario
   * @returns {Promise<Object>} { total_productos, total_unidades, valor_compra, valor_venta, margen_potencial }
   */
  obtenerValorInventario: () => apiClient.get('/inventario/reportes/valor-inventario'),

  /**
   * Obtener análisis ABC de productos (clasificación Pareto)
   * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id? }
   * @returns {Promise<Object>} { productos_abc }
   */
  obtenerAnalisisABC: (params) => apiClient.get('/inventario/reportes/analisis-abc', { params }),

  /**
   * Obtener reporte de rotación de inventario
   * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id?, top? }
   * @returns {Promise<Object>} { productos_rotacion }
   */
  obtenerRotacionInventario: (params) => apiClient.get('/inventario/reportes/rotacion', { params }),

  /**
   * Obtener resumen de alertas agrupadas
   * @returns {Promise<Object>} { resumen_alertas }
   */
  obtenerResumenAlertas: () => apiClient.get('/inventario/reportes/alertas'),

  // ========== Reservas de Stock (Dic 2025 - Fase 1 Gaps) ==========

  /**
   * Obtener stock disponible de un producto (stock_actual - reservas_activas)
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>} { producto_id, stock_disponible }
   */
  obtenerStockDisponible: (productoId, params = {}) =>
    apiClient.get(`/inventario/productos/${productoId}/stock-disponible`, { params }),

  /**
   * Obtener stock disponible de múltiples productos
   * @param {Object} data - { producto_ids: [...], sucursal_id? }
   * @returns {Promise<Object>} { [producto_id]: { nombre, stock_actual, stock_disponible } }
   */
  obtenerStockDisponibleMultiple: (data) =>
    apiClient.post('/inventario/productos/stock-disponible', data),

  /**
   * Verificar si hay stock suficiente para una cantidad
   * @param {number} productoId
   * @param {Object} params - { cantidad, sucursal_id? }
   * @returns {Promise<Object>} { disponible, suficiente, faltante }
   */
  verificarDisponibilidad: (productoId, params) =>
    apiClient.get(`/inventario/productos/${productoId}/verificar-disponibilidad`, { params }),

  /**
   * Crear reserva de stock
   * @param {Object} data - { producto_id, cantidad, tipo_origen, origen_id?, sucursal_id?, minutos_expiracion? }
   * @returns {Promise<Object>} Reserva creada
   */
  crearReserva: (data) => apiClient.post('/inventario/reservas', data),

  /**
   * Crear múltiples reservas
   * @param {Object} data - { items: [{ producto_id, cantidad }], tipo_origen, origen_id?, sucursal_id? }
   * @returns {Promise<Object>} { reservas: [...] }
   */
  crearReservasMultiple: (data) => apiClient.post('/inventario/reservas/multiple', data),

  /**
   * Listar reservas con filtros
   * @param {Object} params - { estado?, producto_id?, sucursal_id?, tipo_origen?, origen_id?, limit?, offset? }
   * @returns {Promise<Object>} { reservas: [...] }
   */
  listarReservas: (params = {}) => apiClient.get('/inventario/reservas', { params }),

  /**
   * Obtener reserva por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerReserva: (id) => apiClient.get(`/inventario/reservas/${id}`),

  /**
   * Confirmar reserva (descuenta stock real)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  confirmarReserva: (id) => apiClient.patch(`/inventario/reservas/${id}/confirmar`),

  /**
   * Confirmar múltiples reservas
   * @param {Object} data - { reserva_ids: [...] }
   * @returns {Promise<Object>} { confirmadas: [...], total }
   */
  confirmarReservasMultiple: (data) => apiClient.post('/inventario/reservas/confirmar-multiple', data),

  /**
   * Extender tiempo de expiración de una reserva
   * @param {number} id
   * @param {Object} data - { minutos_adicionales? }
   * @returns {Promise<Object>}
   */
  extenderReserva: (id, data = {}) => apiClient.patch(`/inventario/reservas/${id}/extender`, data),

  /**
   * Cancelar reserva individual
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelarReserva: (id) => apiClient.delete(`/inventario/reservas/${id}`),

  /**
   * Cancelar reservas por origen
   * @param {string} tipoOrigen - 'venta_pos' | 'orden_venta' | 'cita_servicio' | 'transferencia'
   * @param {number} origenId
   * @returns {Promise<Object>} { canceladas: [...], total }
   */
  cancelarReservasPorOrigen: (tipoOrigen, origenId) =>
    apiClient.delete(`/inventario/reservas/origen/${tipoOrigen}/${origenId}`),

  // ========== Ubicaciones de Almacén WMS (delegado a ubicacionesAlmacenApi) ==========
  // Re-exportación para compatibilidad retroactiva
  crearUbicacion: ubicacionesAlmacenApi.crear,
  obtenerUbicacion: ubicacionesAlmacenApi.obtener,
  listarUbicaciones: ubicacionesAlmacenApi.listar,
  obtenerArbolUbicaciones: ubicacionesAlmacenApi.obtenerArbol,
  actualizarUbicacion: ubicacionesAlmacenApi.actualizar,
  eliminarUbicacion: ubicacionesAlmacenApi.eliminar,
  toggleBloqueoUbicacion: ubicacionesAlmacenApi.toggleBloqueo,
  obtenerStockUbicacion: ubicacionesAlmacenApi.obtenerStock,
  agregarStockUbicacion: ubicacionesAlmacenApi.agregarStock,
  moverStockUbicacion: ubicacionesAlmacenApi.moverStock,
  obtenerUbicacionesDisponibles: ubicacionesAlmacenApi.obtenerDisponibles,
  obtenerEstadisticasUbicaciones: ubicacionesAlmacenApi.obtenerEstadisticas,
  obtenerUbicacionesProducto: ubicacionesAlmacenApi.obtenerPorProducto,

  // ========== Valoracion FIFO/AVCO (Dic 2025 - Gap Alta Prioridad) ==========

  /**
   * Obtener configuracion de valoracion de la organizacion
   * @returns {Promise<Object>} { metodo_valoracion, incluir_gastos_envio, redondeo_decimales }
   */
  obtenerConfiguracionValoracion: () => apiClient.get('/inventario/valoracion/configuracion'),

  /**
   * Actualizar configuracion de valoracion
   * @param {Object} data - { metodo_valoracion?, incluir_gastos_envio?, redondeo_decimales? }
   * @returns {Promise<Object>}
   */
  actualizarConfiguracionValoracion: (data) => apiClient.put('/inventario/valoracion/configuracion', data),

  /**
   * Obtener resumen comparativo de todos los metodos para dashboard
   * @returns {Promise<Object>} { metodo_configurado, promedio, fifo, avco, comparativa }
   */
  obtenerResumenValoracion: () => apiClient.get('/inventario/valoracion/resumen'),

  /**
   * Obtener valor total del inventario segun metodo
   * @param {Object} params - { metodo?: 'fifo'|'avco'|'promedio', categoria_id?, sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValorTotal: (params = {}) => apiClient.get('/inventario/valoracion/total', { params }),

  /**
   * Comparar valoracion de productos por los 3 metodos
   * @param {Object} params - { producto_id? } - Opcional, para un producto especifico
   * @returns {Promise<Array>}
   */
  obtenerComparativaValoracion: (params = {}) => apiClient.get('/inventario/valoracion/comparativa', { params }),

  /**
   * Reporte de valoracion agrupado por categorias
   * @param {Object} params - { metodo? }
   * @returns {Promise<Array>}
   */
  obtenerReporteValoracionCategorias: (params = {}) => apiClient.get('/inventario/valoracion/reporte/categorias', { params }),

  /**
   * Productos con mayor diferencia entre metodos
   * @param {Object} params - { limite?: number }
   * @returns {Promise<Array>}
   */
  obtenerReporteDiferenciasValoracion: (params = {}) => apiClient.get('/inventario/valoracion/reporte/diferencias', { params }),

  /**
   * Valoracion detallada de un producto con todos los metodos
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  obtenerValoracionProducto: (productoId) => apiClient.get(`/inventario/valoracion/producto/${productoId}`),

  /**
   * Valoracion FIFO de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValoracionFIFO: (productoId, params = {}) => apiClient.get(`/inventario/valoracion/producto/${productoId}/fifo`, { params }),

  /**
   * Valoracion AVCO de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValoracionAVCO: (productoId, params = {}) => apiClient.get(`/inventario/valoracion/producto/${productoId}/avco`, { params }),

  /**
   * Capas de inventario FIFO detalladas con trazabilidad
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerCapasFIFO: (productoId) => apiClient.get(`/inventario/valoracion/producto/${productoId}/capas`),

  // ========== Numeros de Serie / Lotes (Dic 2025 - Gap Media Prioridad) ==========

  /**
   * Listar numeros de serie con filtros
   * @param {Object} params - { producto_id?, sucursal_id?, ubicacion_id?, estado?, lote?, fecha_vencimiento_desde?, fecha_vencimiento_hasta?, busqueda?, page?, limit? }
   * @returns {Promise<Object>}
   */
  listarNumerosSerie: (params = {}) => apiClient.get('/inventario/numeros-serie', { params }),

  /**
   * Buscar numeros de serie
   * @param {string} termino
   * @returns {Promise<Array>}
   */
  buscarNumeroSerie: (termino) => apiClient.get('/inventario/numeros-serie/buscar', { params: { q: termino } }),

  /**
   * Obtener numero de serie por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerNumeroSerie: (id) => apiClient.get(`/inventario/numeros-serie/${id}`),

  /**
   * Obtener historial de movimientos de un numero de serie
   * @param {number} id
   * @returns {Promise<Array>}
   */
  obtenerHistorialNumeroSerie: (id) => apiClient.get(`/inventario/numeros-serie/${id}/historial`),

  /**
   * Crear numero de serie individual
   * @param {Object} data - { producto_id, numero_serie, lote?, fecha_vencimiento?, sucursal_id?, ubicacion_id?, costo_unitario?, proveedor_id?, orden_compra_id?, notas? }
   * @returns {Promise<Object>}
   */
  crearNumeroSerie: (data) => apiClient.post('/inventario/numeros-serie', data),

  /**
   * Crear multiples numeros de serie (recepcion masiva)
   * @param {Object} data - { items: [...] }
   * @returns {Promise<Object>}
   */
  crearNumerosSerieMultiple: (data) => apiClient.post('/inventario/numeros-serie/bulk', data),

  /**
   * Obtener numeros de serie disponibles de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Array>}
   */
  obtenerNumerosSerieDisponibles: (productoId, params = {}) => apiClient.get(`/inventario/numeros-serie/producto/${productoId}/disponibles`, { params }),

  /**
   * Obtener resumen de numeros de serie por producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerResumenNumeroSerieProducto: (productoId) => apiClient.get(`/inventario/numeros-serie/producto/${productoId}/resumen`),

  /**
   * Obtener productos que requieren numero de serie
   * @returns {Promise<Array>}
   */
  obtenerProductosConSerie: () => apiClient.get('/inventario/numeros-serie/productos-con-serie'),

  /**
   * Obtener estadisticas generales de numeros de serie
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasNumerosSerie: () => apiClient.get('/inventario/numeros-serie/estadisticas'),

  /**
   * Obtener numeros de serie proximos a vencer
   * @param {number} dias
   * @returns {Promise<Array>}
   */
  obtenerProximosVencer: (dias = 30) => apiClient.get('/inventario/numeros-serie/proximos-vencer', { params: { dias } }),

  /**
   * Verificar si existe un numero de serie
   * @param {number} productoId
   * @param {string} numeroSerie
   * @returns {Promise<Object>}
   */
  verificarExistenciaNumeroSerie: (productoId, numeroSerie) => apiClient.get('/inventario/numeros-serie/existe', { params: { producto_id: productoId, numero_serie: numeroSerie } }),

  /**
   * Vender numero de serie
   * @param {number} id
   * @param {Object} data - { venta_id, cliente_id? }
   * @returns {Promise<Object>}
   */
  venderNumeroSerie: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/vender`, data),

  /**
   * Transferir numero de serie
   * @param {number} id
   * @param {Object} data - { sucursal_destino_id, ubicacion_destino_id?, notas? }
   * @returns {Promise<Object>}
   */
  transferirNumeroSerie: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/transferir`, data),

  /**
   * Devolver numero de serie
   * @param {number} id
   * @param {Object} data - { sucursal_id, ubicacion_id?, motivo }
   * @returns {Promise<Object>}
   */
  devolverNumeroSerie: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/devolver`, data),

  /**
   * Marcar numero de serie como defectuoso
   * @param {number} id
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  marcarNumeroSerieDefectuoso: (id, data) => apiClient.post(`/inventario/numeros-serie/${id}/defectuoso`, data),

  /**
   * Reservar numero de serie
   * @param {number} id
   * @param {Object} data - { notas? }
   * @returns {Promise<Object>}
   */
  reservarNumeroSerie: (id, data = {}) => apiClient.post(`/inventario/numeros-serie/${id}/reservar`, data),

  /**
   * Liberar reserva de numero de serie
   * @param {number} id
   * @returns {Promise<Object>}
   */
  liberarReservaNumeroSerie: (id) => apiClient.post(`/inventario/numeros-serie/${id}/liberar`),

  /**
   * Actualizar garantia de numero de serie
   * @param {number} id
   * @param {Object} data - { tiene_garantia, fecha_inicio_garantia?, fecha_fin_garantia? }
   * @returns {Promise<Object>}
   */
  actualizarGarantiaNumeroSerie: (id, data) => apiClient.put(`/inventario/numeros-serie/${id}/garantia`, data),

  // ========== Rutas de Operación (Dic 2025 - Gap Inventario Avanzado) ==========

  /**
   * Crear rutas por defecto para la organización
   * @returns {Promise<Object>} { rutas: [...] }
   */
  inicializarRutas: () => apiClient.post('/inventario/rutas-operacion/init'),

  /**
   * Listar rutas de operación
   * @param {Object} params - { tipo?, activo? }
   * @returns {Promise<Object>} { rutas: [...] }
   */
  listarRutas: (params = {}) => apiClient.get('/inventario/rutas-operacion', { params }),

  /**
   * Crear ruta de operación
   * @param {Object} data - { codigo, nombre, descripcion?, tipo, prioridad?, sucursal_origen_id?, proveedor_default_id?, lead_time_dias?, activo?, es_default? }
   * @returns {Promise<Object>}
   */
  crearRuta: (data) => apiClient.post('/inventario/rutas-operacion', data),

  /**
   * Obtener ruta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerRuta: (id) => apiClient.get(`/inventario/rutas-operacion/${id}`),

  /**
   * Actualizar ruta
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarRuta: (id, data) => apiClient.put(`/inventario/rutas-operacion/${id}`, data),

  /**
   * Eliminar ruta
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarRuta: (id) => apiClient.delete(`/inventario/rutas-operacion/${id}`),

  /**
   * Obtener rutas asignadas a un producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerRutasProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/rutas`),

  /**
   * Asignar ruta a producto
   * @param {number} productoId
   * @param {Object} data - { ruta_id, prioridad?, sucursal_id? }
   * @returns {Promise<Object>}
   */
  asignarRutaProducto: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/rutas`, data),

  /**
   * Quitar ruta de producto
   * @param {number} productoId
   * @param {number} rutaId
   * @returns {Promise<Object>}
   */
  quitarRutaProducto: (productoId, rutaId) => apiClient.delete(`/inventario/productos/${productoId}/rutas/${rutaId}`),

  /**
   * Obtener mejor ruta para un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerMejorRuta: (productoId, params = {}) => apiClient.get(`/inventario/productos/${productoId}/mejor-ruta`, { params }),

  // ========== Reglas de Reabastecimiento ==========

  /**
   * Listar reglas de reabastecimiento
   * @param {Object} params - { activo?, tipo_trigger? }
   * @returns {Promise<Object>} { reglas: [...] }
   */
  listarReglasReabastecimiento: (params = {}) => apiClient.get('/inventario/reglas-reabastecimiento', { params }),

  /**
   * Crear regla de reabastecimiento
   * @param {Object} data - { nombre, descripcion?, tipo_trigger, condicion, acciones, activo? }
   * @returns {Promise<Object>}
   */
  crearReglaReabastecimiento: (data) => apiClient.post('/inventario/reglas-reabastecimiento', data),

  /**
   * Obtener regla por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerReglaReabastecimiento: (id) => apiClient.get(`/inventario/reglas-reabastecimiento/${id}`),

  /**
   * Actualizar regla
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarReglaReabastecimiento: (id, data) => apiClient.put(`/inventario/reglas-reabastecimiento/${id}`, data),

  /**
   * Eliminar regla
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarReglaReabastecimiento: (id) => apiClient.delete(`/inventario/reglas-reabastecimiento/${id}`),

  // ========== Transferencias entre Sucursales ==========

  /**
   * Listar solicitudes de transferencia
   * @param {Object} params - { estado?, sucursal_origen_id?, sucursal_destino_id? }
   * @returns {Promise<Object>} { transferencias: [...] }
   */
  listarTransferencias: (params = {}) => apiClient.get('/inventario/transferencias', { params }),

  /**
   * Crear solicitud de transferencia
   * @param {Object} data - { sucursal_origen_id, sucursal_destino_id, items: [{ producto_id, cantidad }], notas? }
   * @returns {Promise<Object>}
   */
  crearTransferencia: (data) => apiClient.post('/inventario/transferencias', data),

  /**
   * Obtener transferencia con items
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerTransferencia: (id) => apiClient.get(`/inventario/transferencias/${id}`),

  /**
   * Aprobar solicitud de transferencia
   * @param {number} id
   * @returns {Promise<Object>}
   */
  aprobarTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/aprobar`),

  /**
   * Rechazar solicitud de transferencia
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>}
   */
  rechazarTransferencia: (id, data = {}) => apiClient.post(`/inventario/transferencias/${id}/rechazar`, data),

  /**
   * Marcar transferencia como enviada
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviarTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/enviar`),

  /**
   * Marcar transferencia como recibida
   * @param {number} id
   * @returns {Promise<Object>}
   */
  recibirTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/recibir`),

  // ========== Atributos de Producto (Variantes) ==========

  /**
   * Listar atributos de producto
   * @param {Object} params - { incluir_inactivos? }
   * @returns {Promise<Object>}
   */
  listarAtributos: (params = {}) => apiClient.get('/inventario/atributos', { params }),

  /**
   * Obtener atributo por ID con valores
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerAtributo: (id) => apiClient.get(`/inventario/atributos/${id}`),

  /**
   * Crear atributo
   * @param {Object} data - { nombre, codigo, tipo_visualizacion?, orden? }
   * @returns {Promise<Object>}
   */
  crearAtributo: (data) => apiClient.post('/inventario/atributos', data),

  /**
   * Actualizar atributo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarAtributo: (id, data) => apiClient.put(`/inventario/atributos/${id}`, data),

  /**
   * Eliminar atributo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarAtributo: (id) => apiClient.delete(`/inventario/atributos/${id}`),

  /**
   * Crear atributos por defecto (Color, Talla)
   * @returns {Promise<Object>}
   */
  crearAtributosDefecto: () => apiClient.post('/inventario/atributos/defecto'),

  /**
   * Agregar valor a atributo
   * @param {number} atributoId
   * @param {Object} data - { valor, codigo, color_hex?, orden? }
   * @returns {Promise<Object>}
   */
  agregarValorAtributo: (atributoId, data) => apiClient.post(`/inventario/atributos/${atributoId}/valores`, data),

  /**
   * Actualizar valor de atributo
   * @param {number} valorId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarValor: (valorId, data) => apiClient.put(`/inventario/valores/${valorId}`, data),

  /**
   * Eliminar valor de atributo
   * @param {number} valorId
   * @returns {Promise<Object>}
   */
  eliminarValor: (valorId) => apiClient.delete(`/inventario/valores/${valorId}`),

  // ========== Variantes de Producto ==========

  /**
   * Listar variantes de un producto
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  listarVariantes: (productoId) => apiClient.get(`/inventario/productos/${productoId}/variantes`),

  /**
   * Obtener variante por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerVariante: (id) => apiClient.get(`/inventario/variantes/${id}`),

  /**
   * Buscar variante por SKU o codigo de barras
   * @param {string} termino
   * @returns {Promise<Object>}
   */
  buscarVariante: (termino) => apiClient.get('/inventario/variantes/buscar', { params: { termino } }),

  /**
   * Obtener resumen de stock por variantes
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  obtenerResumenVariantes: (productoId) => apiClient.get(`/inventario/productos/${productoId}/variantes/resumen`),

  /**
   * Crear variante individual
   * @param {number} productoId
   * @param {Object} data - { nombre_variante, sku?, codigo_barras?, precio_compra?, precio_venta?, stock_actual?, atributos? }
   * @returns {Promise<Object>}
   */
  crearVariante: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/variantes`, data),

  /**
   * Generar variantes automaticamente
   * @param {number} productoId
   * @param {Object} data - { atributos: [{ atributo_id, valores: [] }], opciones?: { sku_base?, precio_venta?, precio_compra? } }
   * @returns {Promise<Object>}
   */
  generarVariantes: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/variantes/generar`, data),

  /**
   * Actualizar variante
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarVariante: (id, data) => apiClient.put(`/inventario/variantes/${id}`, data),

  /**
   * Ajustar stock de variante
   * @param {number} id
   * @param {Object} data - { cantidad, tipo, motivo? }
   * @returns {Promise<Object>}
   */
  ajustarStockVariante: (id, data) => apiClient.patch(`/inventario/variantes/${id}/stock`, data),

  /**
   * Eliminar variante
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarVariante: (id) => apiClient.delete(`/inventario/variantes/${id}`),

  // ========== Inventory at Date - Snapshots (Dic 2025) ==========

  /**
   * Listar snapshots disponibles
   * @param {Object} params - { limit?, offset? }
   * @returns {Promise<Object>} { snapshots[] }
   */
  listarSnapshots: (params = {}) => apiClient.get('/inventario/snapshots', { params }),

  /**
   * Obtener fechas disponibles para selector
   * @returns {Promise<Object>} { fechas[] }
   */
  obtenerFechasDisponibles: () => apiClient.get('/inventario/snapshots/fechas'),

  /**
   * Generar snapshot manualmente
   * @param {Object} data - { fecha?, descripcion? }
   * @returns {Promise<Object>}
   */
  generarSnapshot: (data = {}) => apiClient.post('/inventario/snapshots', data),

  /**
   * Obtener historico de stock de un producto para grafico de pronostico
   * @param {number} productoId - ID del producto
   * @param {Object} params - { dias? } (default: 30)
   * @returns {Promise<Object>} { snapshots[], producto, oc_pendientes[], proyeccion[], metricas }
   */
  obtenerHistoricoProducto: (productoId, params = {}) =>
    apiClient.get(`/inventario/snapshots/historico/${productoId}`, { params }),

  /**
   * Consultar stock en fecha especifica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {Object} params - { producto_id?, categoria_id?, solo_con_stock?, limit?, offset? }
   * @returns {Promise<Object>} { fecha, productos[], totales }
   */
  obtenerStockEnFecha: (fecha, params = {}) => apiClient.get('/inventario/at-date', { params: { fecha, ...params } }),

  /**
   * Comparar inventario entre dos fechas
   * @param {string} fechaDesde - Fecha inicial YYYY-MM-DD
   * @param {string} fechaHasta - Fecha final YYYY-MM-DD
   * @param {boolean} soloCambios - Solo productos con cambios (default: true)
   * @returns {Promise<Object>} { fecha_desde, fecha_hasta, productos[], resumen }
   */
  compararInventario: (fechaDesde, fechaHasta, soloCambios = true) =>
    apiClient.get('/inventario/comparar', { params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta, solo_cambios: soloCambios } }),
};

// ==================== ÓRDENES DE COMPRA ====================

