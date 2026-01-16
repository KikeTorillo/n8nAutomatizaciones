import apiClient from '../client';
/**
 * API de Contabilidad
 */
export const contabilidadApi = {
  // ========== Dashboard ==========

  /**
   * Obtener resumen del dashboard contable
   * @returns {Promise<Object>} { asientos_mes, cuentas_activas, periodo_actual, configurado }
   */
  obtenerDashboard: () => apiClient.get('/contabilidad/dashboard'),

  // ========== Cuentas Contables ==========

  /**
   * Listar cuentas contables con filtros
   * @param {Object} params - { tipo?, naturaleza?, nivel?, cuenta_padre_id?, activo?, afectable?, busqueda?, pagina?, limite? }
   * @returns {Promise<Object>} { cuentas, paginacion }
   */
  listarCuentas: (params = {}) => apiClient.get('/contabilidad/cuentas', { params }),

  /**
   * Obtener árbol jerárquico de cuentas
   * @param {Object} params - { solo_activas? }
   * @returns {Promise<Object>} { arbol }
   */
  obtenerArbolCuentas: (params = {}) => apiClient.get('/contabilidad/cuentas/arbol', { params }),

  /**
   * Obtener cuentas afectables (para selects en asientos)
   * @param {Object} params - { tipo? }
   * @returns {Promise<Object>} { cuentas }
   */
  listarCuentasAfectables: (params = {}) => apiClient.get('/contabilidad/cuentas/afectables', { params }),

  /**
   * Obtener cuenta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerCuenta: (id) => apiClient.get(`/contabilidad/cuentas/${id}`),

  /**
   * Crear cuenta contable
   * @param {Object} data - { codigo, nombre, tipo, naturaleza, cuenta_padre_id?, codigo_sat?, afectable?, activo? }
   * @returns {Promise<Object>}
   */
  crearCuenta: (data) => apiClient.post('/contabilidad/cuentas', data),

  /**
   * Actualizar cuenta contable
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarCuenta: (id, data) => apiClient.put(`/contabilidad/cuentas/${id}`, data),

  /**
   * Eliminar cuenta (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarCuenta: (id) => apiClient.delete(`/contabilidad/cuentas/${id}`),

  /**
   * Inicializar catálogo de cuentas SAT México
   * @returns {Promise<Object>} { success, mensaje, cuentas_creadas }
   */
  inicializarCatalogoSAT: () => apiClient.post('/contabilidad/cuentas/inicializar-sat'),

  // ========== Asientos Contables ==========

  /**
   * Listar asientos con filtros
   * @param {Object} params - { estado?, tipo?, periodo_id?, fecha_desde?, fecha_hasta?, busqueda?, pagina?, limite? }
   * @returns {Promise<Object>} { asientos, paginacion }
   */
  listarAsientos: (params = {}) => apiClient.get('/contabilidad/asientos', { params }),

  /**
   * Obtener asiento por ID con movimientos
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD (requerido para tabla particionada)
   * @returns {Promise<Object>}
   */
  obtenerAsiento: (id, fecha) => apiClient.get(`/contabilidad/asientos/${id}`, { params: { fecha } }),

  /**
   * Crear asiento contable
   * @param {Object} data - { fecha, concepto, tipo?, notas?, estado?, movimientos: [...] }
   * @returns {Promise<Object>}
   */
  crearAsiento: (data) => apiClient.post('/contabilidad/asientos', data),

  /**
   * Actualizar asiento (solo en borrador)
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarAsiento: (id, fecha, data) => apiClient.put(`/contabilidad/asientos/${id}`, data, { params: { fecha } }),

  /**
   * Publicar asiento
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  publicarAsiento: (id, fecha) => apiClient.post(`/contabilidad/asientos/${id}/publicar`, {}, { params: { fecha } }),

  /**
   * Anular asiento
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  anularAsiento: (id, fecha, data) => apiClient.post(`/contabilidad/asientos/${id}/anular`, data, { params: { fecha } }),

  /**
   * Eliminar asiento en borrador
   * @param {number} id
   * @param {string} fecha - YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  eliminarAsiento: (id, fecha) => apiClient.delete(`/contabilidad/asientos/${id}`, { params: { fecha } }),

  // ========== Períodos Contables ==========

  /**
   * Listar períodos contables
   * @param {Object} params - { anio? }
   * @returns {Promise<Object>} { periodos }
   */
  listarPeriodos: (params = {}) => apiClient.get('/contabilidad/periodos', { params }),

  /**
   * Cerrar período contable
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cerrarPeriodo: (id) => apiClient.post(`/contabilidad/periodos/${id}/cerrar`),

  // ========== Reportes Financieros ==========

  /**
   * Obtener Balanza de Comprobación
   * @param {number} periodoId
   * @returns {Promise<Object>} { periodo, cuentas, totales, cuadra }
   */
  obtenerBalanza: (periodoId) => apiClient.get('/contabilidad/reportes/balanza', { params: { periodo_id: periodoId } }),

  /**
   * Obtener Libro Mayor de una cuenta
   * @param {number} cuentaId
   * @param {string} fechaInicio - YYYY-MM-DD
   * @param {string} fechaFin - YYYY-MM-DD
   * @returns {Promise<Object>} { cuenta, movimientos, totales, saldo_final }
   */
  obtenerLibroMayor: (cuentaId, fechaInicio, fechaFin) =>
    apiClient.get('/contabilidad/reportes/libro-mayor', {
      params: { cuenta_id: cuentaId, fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    }),

  /**
   * Obtener Estado de Resultados
   * @param {string} fechaInicio - YYYY-MM-DD
   * @param {string} fechaFin - YYYY-MM-DD
   * @returns {Promise<Object>} { ingresos, gastos, utilidad_neta }
   */
  obtenerEstadoResultados: (fechaInicio, fechaFin) =>
    apiClient.get('/contabilidad/reportes/estado-resultados', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
    }),

  /**
   * Obtener Balance General
   * @param {string} fecha - YYYY-MM-DD
   * @returns {Promise<Object>} { activos, pasivos, capital, ecuacion_contable }
   */
  obtenerBalanceGeneral: (fecha) =>
    apiClient.get('/contabilidad/reportes/balance-general', { params: { fecha } }),

  // ========== Configuración ==========

  /**
   * Obtener configuración contable
   * @returns {Promise<Object>} Configuración con cuentas del sistema
   */
  obtenerConfiguracion: () => apiClient.get('/contabilidad/configuracion'),

  /**
   * Actualizar configuración contable
   * @param {Object} data - { generar_asientos_automaticos?, tasa_iva?, metodo_costeo?, cuenta_*_id? }
   * @returns {Promise<Object>}
   */
  actualizarConfiguracion: (data) => apiClient.put('/contabilidad/configuracion', data),
};

// ==================== SUCURSALES ====================
