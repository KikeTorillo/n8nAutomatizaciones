import apiClient, { publicApiClient } from '../client';

/**
 * API Suscripciones-Negocio
 * Módulo de gestión de suscripciones SaaS para negocios.
 */

const BASE_URL = '/suscripciones-negocio';

export const suscripcionesNegocioApi = {
  // ========================================================================
  // PLANES DE SUSCRIPCIÓN
  // ========================================================================

  /** Listar planes de suscripción con paginación y filtros */
  listarPlanes: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/planes`, { params }),

  /** Listar solo planes activos (sin paginación) */
  listarPlanesActivos: () =>
    apiClient.get(`${BASE_URL}/planes/activos`),

  /** Listar planes públicos de Nexo Team (para página de checkout) */
  listarPlanesPublicos: () =>
    apiClient.get(`${BASE_URL}/planes/publicos`),

  /** Obtener plan por ID */
  obtenerPlan: (id: number) =>
    apiClient.get(`${BASE_URL}/planes/${id}`),

  /** Contar suscripciones activas de un plan */
  contarSuscripcionesPlan: (id: number) =>
    apiClient.get(`${BASE_URL}/planes/${id}/suscripciones-activas`),

  /** Crear nuevo plan de suscripción */
  crearPlan: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/planes`, data),

  /** Actualizar plan existente */
  actualizarPlan: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`${BASE_URL}/planes/${id}`, data),

  /** Eliminar plan (solo si no tiene suscripciones activas) */
  eliminarPlan: (id: number) =>
    apiClient.delete(`${BASE_URL}/planes/${id}`),

  // ========================================================================
  // SUSCRIPCIONES
  // ========================================================================

  /** Listar suscripciones con paginación y filtros */
  listarSuscripciones: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/suscripciones`, { params }),

  /** Obtener mi suscripción activa (para página MiPlan) */
  obtenerMiSuscripcion: () =>
    apiClient.get(`${BASE_URL}/suscripciones/mi-suscripcion`),

  /** Cambiar plan de mi propia suscripción */
  cambiarMiPlan: (data: Record<string, unknown>) =>
    apiClient.patch(`${BASE_URL}/suscripciones/mi-suscripcion/cambiar-plan`, data),

  /** Calcular prorrateo para cambio de plan */
  calcularProrrateo: (nuevoPlanId: number) =>
    apiClient.get(`${BASE_URL}/suscripciones/mi-suscripcion/calcular-prorrateo`, {
      params: { nuevo_plan_id: nuevoPlanId }
    }),

  /** Cancelar mi propia suscripción (dogfooding) */
  cancelarMiSuscripcion: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/suscripciones/mi-suscripcion/cancelar`, data),

  /** Buscar suscripciones de un cliente específico */
  buscarSuscripcionesPorCliente: (clienteId: number) =>
    apiClient.get(`${BASE_URL}/suscripciones/cliente/${clienteId}`),

  /** Obtener suscripción por ID */
  obtenerSuscripcion: (id: number) =>
    apiClient.get(`${BASE_URL}/suscripciones/${id}`),

  /** Obtener historial de cambios de una suscripción */
  obtenerHistorialSuscripcion: (id: number) =>
    apiClient.get(`${BASE_URL}/suscripciones/${id}/historial`),

  /** Crear nueva suscripción */
  crearSuscripcion: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/suscripciones`, data),

  /** Actualizar suscripción existente */
  actualizarSuscripcion: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`${BASE_URL}/suscripciones/${id}`, data),

  /** Cambiar estado de suscripción */
  cambiarEstadoSuscripcion: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`${BASE_URL}/suscripciones/${id}/estado`, data),

  /** Cambiar plan de suscripción */
  cambiarPlanSuscripcion: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`${BASE_URL}/suscripciones/${id}/cambiar-plan`, data),

  /** Cancelar suscripción */
  cancelarSuscripcion: (id: number, data: Record<string, unknown> = {}) =>
    apiClient.post(`${BASE_URL}/suscripciones/${id}/cancelar`, data),

  /** Pausar suscripción */
  pausarSuscripcion: (id: number, data: Record<string, unknown> = {}) =>
    apiClient.post(`${BASE_URL}/suscripciones/${id}/pausar`, data),

  /** Reactivar suscripción pausada */
  reactivarSuscripcion: (id: number) =>
    apiClient.post(`${BASE_URL}/suscripciones/${id}/reactivar`),

  /** Actualizar fecha de próximo cobro */
  actualizarProximoCobro: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`${BASE_URL}/suscripciones/${id}/proximo-cobro`, data),

  // ========================================================================
  // CUPONES DE DESCUENTO
  // ========================================================================

  /** Listar cupones con paginación y filtros */
  listarCupones: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/cupones`, { params }),

  /** Listar solo cupones activos y vigentes */
  listarCuponesActivos: () =>
    apiClient.get(`${BASE_URL}/cupones/activos`),

  /** Validar cupón para uso */
  validarCupon: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/cupones/validar`, data),

  /** Buscar cupón por código */
  buscarCuponPorCodigo: (codigo: string) =>
    apiClient.get(`${BASE_URL}/cupones/codigo/${encodeURIComponent(codigo)}`),

  /** Obtener cupón por ID */
  obtenerCupon: (id: number) =>
    apiClient.get(`${BASE_URL}/cupones/${id}`),

  /** Crear nuevo cupón */
  crearCupon: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/cupones`, data),

  /** Actualizar cupón existente */
  actualizarCupon: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`${BASE_URL}/cupones/${id}`, data),

  /** Desactivar cupón */
  desactivarCupon: (id: number) =>
    apiClient.patch(`${BASE_URL}/cupones/${id}/desactivar`),

  /** Eliminar cupón (solo si no tiene usos) */
  eliminarCupon: (id: number) =>
    apiClient.delete(`${BASE_URL}/cupones/${id}`),

  // ========================================================================
  // PAGOS
  // ========================================================================

  /** Listar pagos con paginación y filtros */
  listarPagos: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/pagos`, { params }),

  /** Obtener resumen de pagos (dashboard) */
  obtenerResumenPagos: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/pagos/resumen`, { params }),

  /** Buscar pago por transaction_id del gateway */
  buscarPagoPorTransaccion: (gateway: string, transactionId: string) =>
    apiClient.get(`${BASE_URL}/pagos/transaccion/${gateway}/${transactionId}`),

  /** Obtener pago por ID */
  obtenerPago: (id: number) =>
    apiClient.get(`${BASE_URL}/pagos/${id}`),

  /** Crear registro de pago manual */
  crearPago: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/pagos`, data),

  /** Actualizar estado del pago */
  actualizarEstadoPago: (id: number, data: Record<string, unknown>) =>
    apiClient.patch(`${BASE_URL}/pagos/${id}/estado`, data),

  /** Procesar reembolso */
  procesarReembolso: (id: number, data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/pagos/${id}/reembolso`, data),

  // ========================================================================
  // MÉTRICAS SAAS
  // ========================================================================

  /** Obtener dashboard completo de métricas */
  obtenerDashboardMetricas: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/dashboard`, { params }),

  /** Calcular MRR (Monthly Recurring Revenue) */
  calcularMRR: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/mrr`, { params }),

  /** Calcular ARR (Annual Recurring Revenue) */
  calcularARR: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/arr`, { params }),

  /** Calcular Churn Rate (tasa de cancelación) */
  calcularChurnRate: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/churn`, { params }),

  /** Calcular LTV (Lifetime Value) */
  calcularLTV: () =>
    apiClient.get(`${BASE_URL}/metricas/ltv`),

  /** Obtener número de suscriptores activos */
  obtenerSuscriptoresActivos: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/suscriptores-activos`, { params }),

  /** Obtener crecimiento mensual de MRR */
  obtenerCrecimientoMensual: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/crecimiento`, { params }),

  /** Obtener distribución de suscriptores por estado */
  obtenerDistribucionEstado: () =>
    apiClient.get(`${BASE_URL}/metricas/distribucion-estado`),

  /** Obtener top planes más populares */
  obtenerTopPlanes: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/top-planes`, { params }),

  /** Obtener evolución de MRR (últimos N meses) */
  obtenerEvolucionMRR: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/evolucion-mrr`, { params }),

  /** Obtener evolución de Churn Rate (últimos N meses) */
  obtenerEvolucionChurn: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/evolucion-churn`, { params }),

  /** Obtener evolución de suscriptores (nuevos, cancelados, neto) */
  obtenerEvolucionSuscriptores: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/metricas/evolucion-suscriptores`, { params }),

  // ========================================================================
  // CUSTOMER BILLING
  // ========================================================================

  /** Crear suscripción para un cliente (genera link de checkout) */
  crearSuscripcionParaCliente: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/suscripciones/cliente`, data),

  /** Listar tokens de checkout generados */
  listarCheckoutTokens: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/suscripciones/tokens`, { params }),

  /** Cancelar token de checkout */
  cancelarCheckoutToken: (tokenId: number) =>
    apiClient.delete(`${BASE_URL}/suscripciones/tokens/${tokenId}`),

  // ========================================================================
  // CHECKOUT
  // ========================================================================

  /** Iniciar proceso de checkout */
  iniciarCheckout: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/checkout/iniciar`, data),

  /** Iniciar trial gratuito (sin pago) */
  iniciarTrial: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/checkout/iniciar-trial`, data),

  /** Validar cupón de descuento en checkout */
  validarCuponCheckout: (data: Record<string, unknown>) =>
    apiClient.post(`${BASE_URL}/checkout/validar-cupon`, data),

  /** Obtener resultado del checkout */
  obtenerResultadoCheckout: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/checkout/resultado`, { params }),

  // ========================================================================
  // CHECKOUT PÚBLICO (Sin autenticación)
  // ========================================================================

  /** Obtener datos del checkout público (sin auth) */
  obtenerCheckoutPublico: (token: string) =>
    publicApiClient.get(`${BASE_URL}/checkout/link/${token}`),

  /** Iniciar pago desde checkout público (sin auth) */
  iniciarPagoPublico: (token: string) =>
    publicApiClient.post(`${BASE_URL}/checkout/link/${token}/pagar`),

  // ========================================================================
  // USO DE USUARIOS (SEAT-BASED BILLING)
  // ========================================================================

  /** Obtener resumen de uso de usuarios */
  obtenerResumenUso: () =>
    apiClient.get(`${BASE_URL}/uso/resumen`),

  /** Obtener historial diario de uso de usuarios */
  obtenerHistorialUso: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/uso/historial`, { params }),

  /** Obtener proyección del próximo cobro con desglose */
  obtenerProyeccionCobro: () =>
    apiClient.get(`${BASE_URL}/uso/proyeccion`),

  /** Verificar si se puede crear usuario(s) */
  verificarLimiteUsuarios: (params: Record<string, unknown> = {}) =>
    apiClient.get(`${BASE_URL}/uso/verificar-limite`, { params }),
};
