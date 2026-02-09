import apiClient from '../client';

/**
 * API de Contabilidad
 */
export const contabilidadApi = {
  // ========== Dashboard ==========

  /** Obtener resumen del dashboard contable */
  obtenerDashboard: () => apiClient.get('/contabilidad/dashboard'),

  // ========== Cuentas Contables ==========

  /** Listar cuentas contables con filtros */
  listarCuentas: (params: Record<string, unknown> = {}) => apiClient.get('/contabilidad/cuentas', { params }),

  /** Obtener árbol jerárquico de cuentas */
  obtenerArbolCuentas: (params: Record<string, unknown> = {}) =>
    apiClient.get('/contabilidad/cuentas/arbol', { params }),

  /** Obtener cuentas afectables (para selects en asientos) */
  listarCuentasAfectables: (params: Record<string, unknown> = {}) =>
    apiClient.get('/contabilidad/cuentas/afectables', { params }),

  /** Obtener cuenta por ID */
  obtenerCuenta: (id: number) => apiClient.get(`/contabilidad/cuentas/${id}`),

  /** Crear cuenta contable */
  crearCuenta: (data: Record<string, unknown>) => apiClient.post('/contabilidad/cuentas', data),

  /** Actualizar cuenta contable */
  actualizarCuenta: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/contabilidad/cuentas/${id}`, data),

  /** Eliminar cuenta (soft delete) */
  eliminarCuenta: (id: number) => apiClient.delete(`/contabilidad/cuentas/${id}`),

  /** Inicializar catálogo de cuentas SAT México */
  inicializarCatalogoSAT: () => apiClient.post('/contabilidad/cuentas/inicializar-sat'),

  // ========== Asientos Contables ==========

  /** Listar asientos con filtros */
  listarAsientos: (params: Record<string, unknown> = {}) => apiClient.get('/contabilidad/asientos', { params }),

  /** Obtener asiento por ID con movimientos (fecha requerida para tabla particionada) */
  obtenerAsiento: (id: number, fecha: string) =>
    apiClient.get(`/contabilidad/asientos/${id}`, { params: { fecha } }),

  /** Crear asiento contable */
  crearAsiento: (data: Record<string, unknown>) => apiClient.post('/contabilidad/asientos', data),

  /** Actualizar asiento (solo en borrador) */
  actualizarAsiento: (id: number, fecha: string, data: Record<string, unknown>) =>
    apiClient.put(`/contabilidad/asientos/${id}`, data, { params: { fecha } }),

  /** Publicar asiento */
  publicarAsiento: (id: number, fecha: string) =>
    apiClient.post(`/contabilidad/asientos/${id}/publicar`, {}, { params: { fecha } }),

  /** Anular asiento */
  anularAsiento: (id: number, fecha: string, data: Record<string, unknown>) =>
    apiClient.post(`/contabilidad/asientos/${id}/anular`, data, { params: { fecha } }),

  /** Eliminar asiento en borrador */
  eliminarAsiento: (id: number, fecha: string) =>
    apiClient.delete(`/contabilidad/asientos/${id}`, { params: { fecha } }),

  // ========== Períodos Contables ==========

  /** Listar períodos contables */
  listarPeriodos: (params: Record<string, unknown> = {}) =>
    apiClient.get('/contabilidad/periodos', { params }),

  /** Cerrar período contable */
  cerrarPeriodo: (id: number) => apiClient.post(`/contabilidad/periodos/${id}/cerrar`),

  // ========== Reportes Financieros ==========

  /** Obtener Balanza de Comprobación */
  obtenerBalanza: (periodoId: number) =>
    apiClient.get('/contabilidad/reportes/balanza', { params: { periodo_id: periodoId } }),

  /** Obtener Libro Mayor de una cuenta */
  obtenerLibroMayor: (cuentaId: number, fechaInicio: string, fechaFin: string) =>
    apiClient.get('/contabilidad/reportes/libro-mayor', {
      params: { cuenta_id: cuentaId, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    }),

  /** Obtener Estado de Resultados */
  obtenerEstadoResultados: (fechaInicio: string, fechaFin: string) =>
    apiClient.get('/contabilidad/reportes/estado-resultados', {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    }),

  /** Obtener Balance General */
  obtenerBalanceGeneral: (fecha: string) =>
    apiClient.get('/contabilidad/reportes/balance-general', { params: { fecha } }),

  // ========== Configuración ==========

  /** Obtener configuración contable */
  obtenerConfiguracion: () => apiClient.get('/contabilidad/configuracion'),

  /** Actualizar configuración contable */
  actualizarConfiguracion: (data: Record<string, unknown>) =>
    apiClient.put('/contabilidad/configuracion', data),
};

// ==================== SUCURSALES ====================
