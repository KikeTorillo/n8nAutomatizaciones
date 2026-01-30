import apiClient from '../client';

/**
 * API de POS (Punto de Venta)
 * Ventas, sesiones de caja, cupones, promociones
 */
export const posApi = {
  // ========== Configuración POS ==========

  /**
   * Obtener tipos de venta disponibles
   * @returns {Promise<Object>} Array de configuración de tipos de venta
   */
  obtenerTiposVenta: () => apiClient.get('/pos/config/tipos-venta'),

  // ========== Ventas POS ==========

  /**
   * Crear venta con items
   * @param {Object} data - { tipo_venta?, cliente_id?, cita_id?, profesional_id?, usuario_id, items: [{ producto_id, cantidad, precio_unitario?, descuento_porcentaje?, descuento_monto?, aplica_comision?, notas? }], descuento_porcentaje?, descuento_monto?, impuestos?, metodo_pago, monto_pagado?, fecha_apartado?, fecha_vencimiento_apartado?, notas? }
   * @returns {Promise<Object>}
   */
  crearVenta: (data) => apiClient.post('/pos/ventas', data),

  /**
   * Listar ventas con filtros
   * @param {Object} params - { estado?, estado_pago?, tipo_venta?, cliente_id?, profesional_id?, metodo_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>} { ventas, total }
   */
  listarVentas: (params = {}) => apiClient.get('/pos/ventas', { params }),

  /**
   * Obtener venta por ID con sus items
   * @param {number} id
   * @returns {Promise<Object>} { venta, items }
   */
  obtenerVenta: (id) => apiClient.get(`/pos/ventas/${id}`),

  /**
   * Actualizar venta
   * @param {number} id
   * @param {Object} data - { tipo_venta?, cliente_id?, profesional_id?, descuento_porcentaje?, descuento_monto?, impuestos?, metodo_pago?, fecha_apartado?, fecha_vencimiento_apartado?, notas? }
   * @returns {Promise<Object>}
   */
  actualizarVenta: (id, data) => apiClient.put(`/pos/ventas/${id}`, data),

  /**
   * Actualizar estado de venta
   * @param {number} id
   * @param {Object} data - { estado: 'cotizacion' | 'apartado' | 'completada' | 'cancelada' }
   * @returns {Promise<Object>}
   */
  actualizarEstadoVenta: (id, data) => apiClient.patch(`/pos/ventas/${id}/estado`, data),

  /**
   * Registrar pago en venta
   * @param {number} id
   * @param {Object} data - { monto_pago, metodo_pago, pago_id? }
   * @returns {Promise<Object>}
   */
  registrarPago: (id, data) => apiClient.post(`/pos/ventas/${id}/pago`, data),

  /**
   * Cancelar venta y revertir stock
   * @param {number} id
   * @param {Object} data - { motivo?, usuario_id }
   * @returns {Promise<Object>}
   */
  cancelarVenta: (id, data) => apiClient.post(`/pos/ventas/${id}/cancelar`, data),

  /**
   * Procesar devolución parcial o total de items
   * @param {number} id
   * @param {Object} data - { items_devueltos: [{ item_id, cantidad_devolver }], motivo?, usuario_id }
   * @returns {Promise<Object>}
   */
  devolverItems: (id, data) => apiClient.post(`/pos/ventas/${id}/devolver`, data),

  /**
   * Agregar items a venta existente
   * @param {number} id
   * @param {Object} data - { items: [{ producto_id, cantidad, precio_unitario?, descuento_porcentaje?, descuento_monto?, aplica_comision?, notas? }] }
   * @returns {Promise<Object>}
   */
  agregarItems: (id, data) => apiClient.post(`/pos/ventas/${id}/items`, data),

  /**
   * Eliminar venta (marca como cancelada y revierte stock)
   * @param {number} id
   * @param {Object} data - { motivo, usuario_id }
   * @returns {Promise<Object>}
   */
  eliminarVenta: (id, data) => apiClient.delete(`/pos/ventas/${id}`, { data }),

  // ========== Tickets PDF ==========

  /**
   * Generar ticket PDF de una venta
   * @param {number} id - ID de la venta
   * @param {Object} options - { paper_size?: '58mm' | '80mm', download?: boolean }
   * @returns {Promise<Blob>} PDF binary
   */
  generarTicket: (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.paper_size) params.append('paper_size', options.paper_size);
    if (options.download !== undefined) params.append('download', options.download);
    const queryString = params.toString();
    const url = `/pos/ventas/${id}/ticket${queryString ? '?' + queryString : ''}`;
    return apiClient.get(url, { responseType: 'blob' });
  },

  /**
   * Obtener URL para descargar ticket (útil para abrir en nueva pestaña)
   * @param {number} id - ID de la venta
   * @param {Object} options - { paper_size?: '58mm' | '80mm' }
   * @returns {string} URL del endpoint
   */
  getTicketUrl: (id, options = {}) => {
    const params = new URLSearchParams();
    if (options.paper_size) params.append('paper_size', options.paper_size);
    params.append('download', 'false'); // Para visualizar inline
    const queryString = params.toString();
    return `/api/v1/pos/ventas/${id}/ticket?${queryString}`;
  },

  // ========== Reportes POS ==========

  /**
   * Obtener corte de caja por período
   * @param {Object} params - { fecha_inicio, fecha_fin, usuario_id? }
   * @returns {Promise<Object>} { resumen, totales_por_metodo, ventas_por_hora, top_productos }
   */
  obtenerCorteCaja: (params) => apiClient.get('/pos/corte-caja', { params }),

  /**
   * Obtener reporte de ventas diarias
   * @param {Object} params - { fecha, profesional_id?, usuario_id? }
   * @returns {Promise<Object>} { resumen, ventas_por_hora, top_productos, detalle }
   */
  obtenerVentasDiarias: (params) => apiClient.get('/pos/reportes/ventas-diarias', { params }),

  // ========== Pago Split (Ene 2026) ==========

  /**
   * Registrar pagos split (múltiples métodos de pago)
   * @param {number} ventaId - ID de la venta
   * @param {Object} data - { pagos: [{ metodo_pago, monto, monto_recibido?, referencia? }], cliente_id? }
   * @returns {Promise<Object>} { venta, pagos }
   */
  registrarPagosSplit: (ventaId, data) => apiClient.post(`/pos/ventas/${ventaId}/pagos-split`, data),

  /**
   * Obtener desglose de pagos de una venta
   * @param {number} ventaId - ID de la venta
   * @returns {Promise<Object>} { venta, pagos, resumen }
   */
  obtenerPagosVenta: (ventaId) => apiClient.get(`/pos/ventas/${ventaId}/pagos`),

  // ========== Sesiones de Caja ==========

  /**
   * Abrir nueva sesión de caja
   * @param {Object} data - { sucursal_id?, monto_inicial?, nota_apertura? }
   * @returns {Promise<Object>} { sesion }
   */
  abrirSesionCaja: (data) => apiClient.post('/pos/sesiones-caja/abrir', data),

  /**
   * Obtener sesión de caja activa del usuario
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>} { activa, sesion?, totales? }
   */
  obtenerSesionActiva: (params = {}) => apiClient.get('/pos/sesiones-caja/activa', { params }),

  /**
   * Cerrar sesión de caja
   * @param {Object} data - { sesion_id, monto_contado, nota_cierre?, desglose? }
   * @returns {Promise<Object>} { sesion, diferencia }
   */
  cerrarSesionCaja: (data) => apiClient.post('/pos/sesiones-caja/cerrar', data),

  /**
   * Listar sesiones de caja con filtros
   * @param {Object} params - { sucursal_id?, usuario_id?, estado?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { sesiones, total }
   */
  listarSesionesCaja: (params = {}) => apiClient.get('/pos/sesiones-caja', { params }),

  /**
   * Obtener sesión de caja por ID
   * @param {number} id
   * @returns {Promise<Object>} { sesion }
   */
  obtenerSesionCaja: (id) => apiClient.get(`/pos/sesiones-caja/${id}`),

  /**
   * Obtener resumen de sesión para cierre
   * @param {number} id
   * @returns {Promise<Object>} { sesion, totales, movimientos }
   */
  obtenerResumenSesion: (id) => apiClient.get(`/pos/sesiones-caja/${id}/resumen`),

  /**
   * Registrar movimiento de efectivo (entrada/salida)
   * @param {number} id - ID de la sesión
   * @param {Object} data - { tipo: 'entrada' | 'salida', monto, motivo }
   * @returns {Promise<Object>} { movimiento }
   */
  registrarMovimientoCaja: (id, data) => apiClient.post(`/pos/sesiones-caja/${id}/movimiento`, data),

  /**
   * Listar movimientos de una sesión
   * @param {number} id - ID de la sesión
   * @returns {Promise<Object>} { movimientos }
   */
  listarMovimientosCaja: (id) => apiClient.get(`/pos/sesiones-caja/${id}/movimientos`),

  // ========== Cupones de Descuento (Ene 2026) ==========

  /**
   * Listar cupones vigentes (para selector en POS)
   * @returns {Promise<Object>} Array de cupones activos
   */
  listarCuponesVigentes: () => apiClient.get('/pos/cupones/vigentes'),

  /**
   * Validar cupón sin aplicar (preview)
   * @param {Object} data - { codigo, subtotal, cliente_id?, productos_ids? }
   * @returns {Promise<Object>} { valido, cupon?, descuento_calculado?, error?, mensaje? }
   */
  validarCupon: (data) => apiClient.post('/pos/cupones/validar', data),

  /**
   * Aplicar cupón a una venta
   * @param {Object} data - { cupon_id, venta_pos_id, cliente_id?, subtotal_antes? }
   * @returns {Promise<Object>} uso_cupones row
   */
  aplicarCupon: (data) => apiClient.post('/pos/cupones/aplicar', data),

  /**
   * Listar cupones con paginación (administración)
   * @param {Object} params - { page?, limit?, busqueda?, activo?, vigente?, ordenPor?, orden? }
   * @returns {Promise<Object>} { cupones, paginacion }
   */
  listarCupones: (params = {}) => apiClient.get('/pos/cupones', { params }),

  /**
   * Crear nuevo cupón
   * @param {Object} data - { codigo, nombre, tipo_descuento, valor, ... }
   * @returns {Promise<Object>}
   */
  crearCupon: (data) => apiClient.post('/pos/cupones', data),

  /**
   * Obtener cupón por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerCupon: (id) => apiClient.get(`/pos/cupones/${id}`),

  /**
   * Actualizar cupón
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarCupon: (id, data) => apiClient.put(`/pos/cupones/${id}`, data),

  /**
   * Eliminar cupón (solo si no tiene usos)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarCupon: (id) => apiClient.delete(`/pos/cupones/${id}`),

  /**
   * Obtener historial de uso de un cupón
   * @param {number} id
   * @param {Object} params - { limit?, offset? }
   * @returns {Promise<Object>}
   */
  obtenerHistorialCupon: (id, params = {}) => apiClient.get(`/pos/cupones/${id}/historial`, { params }),

  /**
   * Obtener estadísticas de un cupón
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasCupon: (id, params = {}) => apiClient.get(`/pos/cupones/${id}/estadisticas`, { params }),

  /**
   * Activar/desactivar cupón
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstadoCupon: (id, activo) => apiClient.patch(`/pos/cupones/${id}/estado`, { activo }),

  // ========== Promociones Automáticas (Ene 2026) ==========

  /**
   * Listar promociones vigentes (para aplicar en POS)
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>} Array de promociones activas y vigentes
   */
  listarPromocionesVigentes: (params = {}) => apiClient.get('/pos/promociones/vigentes', { params }),

  /**
   * Evaluar promociones aplicables a un carrito
   * @param {Object} data - { items: [{ producto_id, cantidad, precio_unitario, categoria_id? }], subtotal, cliente_id?, sucursal_id? }
   * @returns {Promise<Object>} { promociones: [...], descuento_total, hay_exclusiva, cantidad_aplicables }
   */
  evaluarPromociones: (data) => apiClient.post('/pos/promociones/evaluar', data),

  /**
   * Aplicar promoción a una venta (registrar uso)
   * @param {Object} data - { promocion_id, venta_pos_id, cliente_id?, descuento_total, productos_aplicados? }
   * @returns {Promise<Object>} uso_promociones row
   */
  aplicarPromocion: (data) => apiClient.post('/pos/promociones/aplicar', data),

  /**
   * Listar promociones con paginación (administración)
   * @param {Object} params - { page?, limit?, busqueda?, activo?, vigente?, tipo?, ordenPor?, orden? }
   * @returns {Promise<Object>} { promociones, paginacion }
   */
  listarPromociones: (params = {}) => apiClient.get('/pos/promociones', { params }),

  /**
   * Crear nueva promoción
   * @param {Object} data - { codigo, nombre, tipo, reglas, valor_descuento?, fecha_inicio, fecha_fin?, ... }
   * @returns {Promise<Object>}
   */
  crearPromocion: (data) => apiClient.post('/pos/promociones', data),

  /**
   * Obtener promoción por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerPromocion: (id) => apiClient.get(`/pos/promociones/${id}`),

  /**
   * Actualizar promoción
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarPromocion: (id, data) => apiClient.put(`/pos/promociones/${id}`, data),

  /**
   * Eliminar promoción (solo si no tiene usos)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarPromocion: (id) => apiClient.delete(`/pos/promociones/${id}`),

  /**
   * Obtener historial de uso de una promoción
   * @param {number} id
   * @param {Object} params - { limit?, offset? }
   * @returns {Promise<Object>}
   */
  obtenerHistorialPromocion: (id, params = {}) => apiClient.get(`/pos/promociones/${id}/historial`, { params }),

  /**
   * Obtener estadísticas de una promoción
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasPromocion: (id) => apiClient.get(`/pos/promociones/${id}/estadisticas`),

  /**
   * Activar/desactivar promoción
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstadoPromocion: (id, activo) => apiClient.patch(`/pos/promociones/${id}/estado`, { activo }),

  /**
   * Duplicar promoción
   * @param {number} id
   * @returns {Promise<Object>}
   */
  duplicarPromocion: (id) => apiClient.post(`/pos/promociones/${id}/duplicar`),

  // ========== Programa de Lealtad (Ene 2026) ==========

  /**
   * Obtener configuración del programa de lealtad
   * @returns {Promise<Object>} { configuracion }
   */
  obtenerConfiguracionLealtad: () => apiClient.get('/pos/lealtad/configuracion'),

  /**
   * Guardar configuración del programa de lealtad
   * @param {Object} data - { activo, puntos_por_peso, puntos_por_peso_descuento, meses_expiracion, ... }
   * @returns {Promise<Object>}
   */
  guardarConfiguracionLealtad: (data) => apiClient.put('/pos/lealtad/configuracion', data),

  /**
   * Listar niveles de lealtad
   * @param {Object} params - { incluir_inactivos? }
   * @returns {Promise<Object>} Array de niveles
   */
  listarNivelesLealtad: (params = {}) => apiClient.get('/pos/lealtad/niveles', { params }),

  /**
   * Crear nivel de lealtad
   * @param {Object} data - { nombre, codigo, color?, puntos_minimos, puntos_maximos?, multiplicador_puntos?, ... }
   * @returns {Promise<Object>}
   */
  crearNivelLealtad: (data) => apiClient.post('/pos/lealtad/niveles', data),

  /**
   * Actualizar nivel de lealtad
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarNivelLealtad: (id, data) => apiClient.put(`/pos/lealtad/niveles/${id}`, data),

  /**
   * Eliminar nivel de lealtad
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarNivelLealtad: (id) => apiClient.delete(`/pos/lealtad/niveles/${id}`),

  /**
   * Crear niveles por defecto (Bronze, Silver, Gold, Platinum)
   * @returns {Promise<Object>} Array de niveles creados
   */
  crearNivelesLealtadDefault: () => apiClient.post('/pos/lealtad/niveles/default'),

  /**
   * Obtener puntos de un cliente
   * @param {number} clienteId
   * @returns {Promise<Object>} { puntos_disponibles, puntos_totales, nivel, proximo_nivel, ... }
   */
  obtenerPuntosCliente: (clienteId) => apiClient.get(`/pos/lealtad/clientes/${clienteId}/puntos`),

  /**
   * Obtener historial de transacciones de puntos de un cliente
   * @param {number} clienteId
   * @param {Object} params - { limit?, offset?, tipo?, fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>} { transacciones, paginacion }
   */
  obtenerHistorialPuntos: (clienteId, params = {}) => apiClient.get(`/pos/lealtad/clientes/${clienteId}/historial`, { params }),

  /**
   * Listar clientes con puntos (administración)
   * @param {Object} params - { limit?, offset?, busqueda?, nivel_id?, orden? }
   * @returns {Promise<Object>} { clientes, paginacion }
   */
  listarClientesConPuntos: (params = {}) => apiClient.get('/pos/lealtad/clientes', { params }),

  /**
   * Calcular puntos que ganaría una venta (preview)
   * @param {Object} data - { cliente_id?, monto, tiene_cupon? }
   * @returns {Promise<Object>} { puntos, multiplicador, detalle }
   */
  calcularPuntosVenta: (data) => apiClient.post('/pos/lealtad/calcular', data),

  /**
   * Validar canje de puntos (preview sin aplicar)
   * @param {Object} data - { cliente_id, puntos, total_venta }
   * @returns {Promise<Object>} { valido, descuento, mensaje }
   */
  validarCanjePuntos: (data) => apiClient.post('/pos/lealtad/validar-canje', data),

  /**
   * Canjear puntos por descuento
   * @param {Object} data - { cliente_id, venta_id?, puntos, descuento, descripcion? }
   * @returns {Promise<Object>} Transacción de canje
   */
  canjearPuntos: (data) => apiClient.post('/pos/lealtad/canjear', data),

  /**
   * Acumular puntos por una venta
   * @param {Object} data - { cliente_id, venta_id, monto, descripcion? }
   * @returns {Promise<Object>} Transacción de acumulación
   */
  acumularPuntos: (data) => apiClient.post('/pos/lealtad/acumular', data),

  /**
   * Ajuste manual de puntos (administración)
   * @param {Object} data - { cliente_id, puntos, motivo }
   * @returns {Promise<Object>} Transacción de ajuste
   */
  ajustarPuntos: (data) => apiClient.post('/pos/lealtad/ajustar', data),

  /**
   * Obtener estadísticas del programa de lealtad
   * @param {number} sucursalId - ID de la sucursal (requerido para permisos)
   * @returns {Promise<Object>} { clientes_activos, puntos_circulantes, canjes_mes, ... }
   */
  obtenerEstadisticasLealtad: (sucursalId) =>
    apiClient.get('/pos/lealtad/estadisticas', {
      params: sucursalId ? { sucursalId } : {}
    }),

  // ========== Combos y Modificadores (Migrado a Inventario - Ene 2026) ==========

  // --- Combos / Kits ---

  /**
   * Verificar si un producto es combo
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} { es_combo: boolean }
   */
  verificarCombo: (productoId) => apiClient.get(`/inventario/combos/verificar/${productoId}`),

  /**
   * Obtener combo por producto ID
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} Combo con componentes
   */
  obtenerCombo: (productoId) => apiClient.get(`/inventario/combos/${productoId}`),

  /**
   * Listar combos
   * @param {Object} params - { limit?, offset?, busqueda?, activo? }
   * @returns {Promise<Object>} { data, total, paginacion }
   */
  listarCombos: (params = {}) => apiClient.get('/inventario/combos', { params }),

  /**
   * Crear combo
   * @param {Object} data - { producto_id, tipo_precio, descuento_porcentaje?, componentes[] }
   * @returns {Promise<Object>} Combo creado
   */
  crearCombo: (data) => apiClient.post('/inventario/combos', data),

  /**
   * Actualizar combo
   * @param {number} productoId - ID del producto
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Combo actualizado
   */
  actualizarCombo: (productoId, data) => apiClient.put(`/inventario/combos/${productoId}`, data),

  /**
   * Eliminar combo
   * @param {number} productoId - ID del producto
   * @param {number} sucursalId - ID de la sucursal (para permisos)
   * @returns {Promise<Object>}
   */
  eliminarCombo: (productoId, sucursalId) => apiClient.delete(`/inventario/combos/${productoId}`, { params: { sucursalId } }),

  /**
   * Calcular precio de combo
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} { precio }
   */
  calcularPrecioCombo: (productoId) => apiClient.get(`/inventario/combos/${productoId}/precio`),

  /**
   * Verificar stock de combo
   * @param {number} productoId - ID del producto
   * @param {number} cantidad - Cantidad a verificar (default 1)
   * @returns {Promise<Object>} { disponible, componentes }
   */
  verificarStockCombo: (productoId, cantidad = 1) => apiClient.get(`/inventario/combos/${productoId}/stock`, { params: { cantidad } }),

  // --- Grupos de Modificadores ---

  /**
   * Listar grupos de modificadores
   * @param {Object} params - { activo?, incluir_modificadores? }
   * @returns {Promise<Object>} Lista de grupos
   */
  listarGruposModificadores: (params = {}) => apiClient.get('/inventario/modificadores/grupos', { params }),

  /**
   * Crear grupo de modificadores
   * @param {Object} data - { nombre, descripcion?, tipo_seleccion, es_obligatorio?, minimo_seleccion?, maximo_seleccion?, modificadores[]? }
   * @returns {Promise<Object>} Grupo creado
   */
  crearGrupoModificadores: (data) => apiClient.post('/inventario/modificadores/grupos', data),

  /**
   * Actualizar grupo de modificadores
   * @param {number} id - ID del grupo
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Grupo actualizado
   */
  actualizarGrupoModificadores: (id, data) => apiClient.put(`/inventario/modificadores/grupos/${id}`, data),

  /**
   * Eliminar grupo de modificadores
   * @param {number} id - ID del grupo
   * @returns {Promise<Object>}
   */
  eliminarGrupoModificadores: (id) => apiClient.delete(`/inventario/modificadores/grupos/${id}`),

  // --- Modificadores ---

  /**
   * Crear modificador
   * @param {Object} data - { grupo_id, nombre, descripcion?, precio_adicional?, prefijo?, orden?, activo? }
   * @returns {Promise<Object>} Modificador creado
   */
  crearModificador: (data) => apiClient.post('/inventario/modificadores', data),

  /**
   * Actualizar modificador
   * @param {number} id - ID del modificador
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Modificador actualizado
   */
  actualizarModificador: (id, data) => apiClient.put(`/inventario/modificadores/${id}`, data),

  /**
   * Eliminar modificador
   * @param {number} id - ID del modificador
   * @returns {Promise<Object>}
   */
  eliminarModificador: (id) => apiClient.delete(`/inventario/modificadores/${id}`),

  // --- Modificadores de Producto ---

  /**
   * Obtener modificadores de un producto
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} Grupos y modificadores del producto
   */
  obtenerModificadoresProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/modificadores`),

  /**
   * Verificar si un producto tiene modificadores
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} { tiene_modificadores: boolean }
   */
  tieneModificadores: (productoId) => apiClient.get(`/inventario/productos/${productoId}/tiene-modificadores`),

  /**
   * Listar asignaciones de grupos a un producto
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object>} Lista de asignaciones
   */
  listarAsignacionesProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/grupos`),

  /**
   * Asignar grupo a producto
   * @param {number} productoId - ID del producto
   * @param {Object} data - { grupo_id, orden? }
   * @returns {Promise<Object>} Asignación creada
   */
  asignarGrupoAProducto: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/grupos`, data),

  /**
   * Eliminar asignación de grupo a producto
   * @param {number} productoId - ID del producto
   * @param {number} grupoId - ID del grupo
   * @returns {Promise<Object>}
   */
  eliminarAsignacionProducto: (productoId, grupoId) => apiClient.delete(`/inventario/productos/${productoId}/grupos/${grupoId}`),

  /**
   * Asignar grupo a categoría
   * @param {number} categoriaId - ID de la categoría
   * @param {Object} data - { grupo_id, orden? }
   * @returns {Promise<Object>} Asignación creada
   */
  asignarGrupoACategoria: (categoriaId, data) => apiClient.post(`/inventario/categorias/${categoriaId}/grupos`, data),

  // Alias de compatibilidad (Ene 2026)
  obtenerVentas: (params = {}) => apiClient.get('/pos/ventas', { params }),
};

// ==================== MÓDULOS ====================

