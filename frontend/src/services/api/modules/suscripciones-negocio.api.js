import apiClient from '../client';

/**
 * ====================================================================
 * API SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Módulo de gestión de suscripciones SaaS para negocios.
 * Permite a organizaciones vender planes de suscripción a sus clientes.
 *
 * Base URL: /api/v1/suscripciones-negocio
 */

const BASE_URL = '/suscripciones-negocio';

export const suscripcionesNegocioApi = {
  // ========================================================================
  // PLANES DE SUSCRIPCIÓN
  // ========================================================================

  /**
   * Listar planes de suscripción con paginación y filtros
   * @param {Object} params - { page, limit, activo, ciclo_facturacion, orden, direccion }
   * @returns {Promise<Object>} { planes, total, paginacion }
   */
  listarPlanes: (params = {}) =>
    apiClient.get(`${BASE_URL}/planes`, { params }),

  /**
   * Listar solo planes activos (sin paginación)
   * @returns {Promise<Object>} { planes }
   */
  listarPlanesActivos: () =>
    apiClient.get(`${BASE_URL}/planes/activos`),

  /**
   * Listar planes públicos de Nexo Team (para página de checkout)
   * NO requiere autenticación
   * @returns {Promise<Object>} { planes }
   */
  listarPlanesPublicos: () =>
    apiClient.get(`${BASE_URL}/planes/publicos`),

  /**
   * Obtener plan por ID
   * @param {number} id - ID del plan
   * @returns {Promise<Object>}
   */
  obtenerPlan: (id) =>
    apiClient.get(`${BASE_URL}/planes/${id}`),

  /**
   * Contar suscripciones activas de un plan
   * @param {number} id - ID del plan
   * @returns {Promise<Object>} { plan_id, total_suscripciones_activas }
   */
  contarSuscripcionesPlan: (id) =>
    apiClient.get(`${BASE_URL}/planes/${id}/suscripciones-activas`),

  /**
   * Crear nuevo plan de suscripción
   * @param {Object} data - { nombre, descripcion, precio, ciclo_facturacion, caracteristicas, activo }
   * @returns {Promise<Object>}
   */
  crearPlan: (data) =>
    apiClient.post(`${BASE_URL}/planes`, data),

  /**
   * Actualizar plan existente
   * @param {number} id - ID del plan
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object>}
   */
  actualizarPlan: (id, data) =>
    apiClient.put(`${BASE_URL}/planes/${id}`, data),

  /**
   * Eliminar plan (solo si no tiene suscripciones activas)
   * @param {number} id - ID del plan
   * @returns {Promise<Object>}
   */
  eliminarPlan: (id) =>
    apiClient.delete(`${BASE_URL}/planes/${id}`),

  // ========================================================================
  // SUSCRIPCIONES
  // ========================================================================

  /**
   * Listar suscripciones con paginación y filtros
   * @param {Object} params - { page, limit, estado, plan_id, cliente_id, fecha_desde, fecha_hasta, orden, direccion }
   * @returns {Promise<Object>} { suscripciones, total, paginacion }
   */
  listarSuscripciones: (params = {}) =>
    apiClient.get(`${BASE_URL}/suscripciones`, { params }),

  /**
   * Buscar suscripciones de un cliente específico
   * @param {number} clienteId - ID del cliente
   * @returns {Promise<Object>} { suscripciones }
   */
  buscarSuscripcionesPorCliente: (clienteId) =>
    apiClient.get(`${BASE_URL}/suscripciones/cliente/${clienteId}`),

  /**
   * Obtener suscripción por ID
   * @param {number} id - ID de la suscripción
   * @returns {Promise<Object>}
   */
  obtenerSuscripcion: (id) =>
    apiClient.get(`${BASE_URL}/suscripciones/${id}`),

  /**
   * Obtener historial de cambios de una suscripción
   * @param {number} id - ID de la suscripción
   * @returns {Promise<Object>} { historial }
   */
  obtenerHistorialSuscripcion: (id) =>
    apiClient.get(`${BASE_URL}/suscripciones/${id}/historial`),

  /**
   * Crear nueva suscripción
   * @param {Object} data - { cliente_id, plan_id, cupon_codigo, metodo_pago, notas }
   * @returns {Promise<Object>}
   */
  crearSuscripcion: (data) =>
    apiClient.post(`${BASE_URL}/suscripciones`, data),

  /**
   * Actualizar suscripción existente
   * @param {number} id - ID de la suscripción
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object>}
   */
  actualizarSuscripcion: (id, data) =>
    apiClient.put(`${BASE_URL}/suscripciones/${id}`, data),

  /**
   * Cambiar estado de suscripción
   * @param {number} id - ID de la suscripción
   * @param {Object} data - { estado, motivo }
   * @returns {Promise<Object>}
   */
  cambiarEstadoSuscripcion: (id, data) =>
    apiClient.patch(`${BASE_URL}/suscripciones/${id}/estado`, data),

  /**
   * Cambiar plan de suscripción
   * @param {number} id - ID de la suscripción
   * @param {Object} data - { nuevo_plan_id, aplicar_desde, prorrateo }
   * @returns {Promise<Object>}
   */
  cambiarPlanSuscripcion: (id, data) =>
    apiClient.patch(`${BASE_URL}/suscripciones/${id}/cambiar-plan`, data),

  /**
   * Cancelar suscripción
   * @param {number} id - ID de la suscripción
   * @param {Object} data - { motivo_cancelacion, cancelar_inmediatamente, solicitar_reembolso }
   * @returns {Promise<Object>}
   */
  cancelarSuscripcion: (id, data = {}) =>
    apiClient.post(`${BASE_URL}/suscripciones/${id}/cancelar`, data),

  /**
   * Pausar suscripción
   * @param {number} id - ID de la suscripción
   * @param {Object} data - { motivo, duracion_pausa_dias }
   * @returns {Promise<Object>}
   */
  pausarSuscripcion: (id, data = {}) =>
    apiClient.post(`${BASE_URL}/suscripciones/${id}/pausar`, data),

  /**
   * Reactivar suscripción pausada
   * @param {number} id - ID de la suscripción
   * @returns {Promise<Object>}
   */
  reactivarSuscripcion: (id) =>
    apiClient.post(`${BASE_URL}/suscripciones/${id}/reactivar`),

  /**
   * Actualizar fecha de próximo cobro
   * @param {number} id - ID de la suscripción
   * @param {Object} data - { proxima_fecha_cobro }
   * @returns {Promise<Object>}
   */
  actualizarProximoCobro: (id, data) =>
    apiClient.patch(`${BASE_URL}/suscripciones/${id}/proximo-cobro`, data),

  // ========================================================================
  // CUPONES DE DESCUENTO
  // ========================================================================

  /**
   * Listar cupones con paginación y filtros
   * @param {Object} params - { page, limit, activo, tipo_descuento, orden, direccion }
   * @returns {Promise<Object>} { cupones, total, paginacion }
   */
  listarCupones: (params = {}) =>
    apiClient.get(`${BASE_URL}/cupones`, { params }),

  /**
   * Listar solo cupones activos y vigentes
   * @returns {Promise<Object>} { cupones }
   */
  listarCuponesActivos: () =>
    apiClient.get(`${BASE_URL}/cupones/activos`),

  /**
   * Validar cupón para uso
   * @param {Object} data - { codigo, plan_id }
   * @returns {Promise<Object>} { valido, cupon, descuento_calculado, mensaje }
   */
  validarCupon: (data) =>
    apiClient.post(`${BASE_URL}/cupones/validar`, data),

  /**
   * Buscar cupón por código
   * @param {string} codigo - Código del cupón
   * @returns {Promise<Object>}
   */
  buscarCuponPorCodigo: (codigo) =>
    apiClient.get(`${BASE_URL}/cupones/codigo/${encodeURIComponent(codigo)}`),

  /**
   * Obtener cupón por ID
   * @param {number} id - ID del cupón
   * @returns {Promise<Object>}
   */
  obtenerCupon: (id) =>
    apiClient.get(`${BASE_URL}/cupones/${id}`),

  /**
   * Crear nuevo cupón
   * @param {Object} data - { codigo, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, max_usos, activo }
   * @returns {Promise<Object>}
   */
  crearCupon: (data) =>
    apiClient.post(`${BASE_URL}/cupones`, data),

  /**
   * Actualizar cupón existente
   * @param {number} id - ID del cupón
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object>}
   */
  actualizarCupon: (id, data) =>
    apiClient.put(`${BASE_URL}/cupones/${id}`, data),

  /**
   * Desactivar cupón
   * @param {number} id - ID del cupón
   * @returns {Promise<Object>}
   */
  desactivarCupon: (id) =>
    apiClient.patch(`${BASE_URL}/cupones/${id}/desactivar`),

  /**
   * Eliminar cupón (solo si no tiene usos)
   * @param {number} id - ID del cupón
   * @returns {Promise<Object>}
   */
  eliminarCupon: (id) =>
    apiClient.delete(`${BASE_URL}/cupones/${id}`),

  // ========================================================================
  // PAGOS
  // ========================================================================

  /**
   * Listar pagos con paginación y filtros
   * @param {Object} params - { page, limit, estado, suscripcion_id, metodo_pago, fecha_desde, fecha_hasta, orden, direccion }
   * @returns {Promise<Object>} { pagos, total, paginacion }
   */
  listarPagos: (params = {}) =>
    apiClient.get(`${BASE_URL}/pagos`, { params }),

  /**
   * Obtener resumen de pagos (dashboard)
   * @param {Object} params - { fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} { total_ingresos, total_pagos, promedio_pago, por_estado, por_metodo }
   */
  obtenerResumenPagos: (params = {}) =>
    apiClient.get(`${BASE_URL}/pagos/resumen`, { params }),

  /**
   * Buscar pago por transaction_id del gateway
   * @param {string} gateway - Nombre del gateway (stripe, mercadopago)
   * @param {string} transactionId - ID de transacción del gateway
   * @returns {Promise<Object>}
   */
  buscarPagoPorTransaccion: (gateway, transactionId) =>
    apiClient.get(`${BASE_URL}/pagos/transaccion/${gateway}/${transactionId}`),

  /**
   * Obtener pago por ID
   * @param {number} id - ID del pago
   * @returns {Promise<Object>}
   */
  obtenerPago: (id) =>
    apiClient.get(`${BASE_URL}/pagos/${id}`),

  /**
   * Crear registro de pago manual
   * @param {Object} data - { suscripcion_id, monto, moneda, metodo_pago, referencia_externa, notas }
   * @returns {Promise<Object>}
   */
  crearPago: (data) =>
    apiClient.post(`${BASE_URL}/pagos`, data),

  /**
   * Actualizar estado del pago
   * @param {number} id - ID del pago
   * @param {Object} data - { estado, notas }
   * @returns {Promise<Object>}
   */
  actualizarEstadoPago: (id, data) =>
    apiClient.patch(`${BASE_URL}/pagos/${id}/estado`, data),

  /**
   * Procesar reembolso
   * @param {number} id - ID del pago
   * @param {Object} data - { monto_reembolso, motivo, reembolso_parcial }
   * @returns {Promise<Object>}
   */
  procesarReembolso: (id, data) =>
    apiClient.post(`${BASE_URL}/pagos/${id}/reembolso`, data),

  // ========================================================================
  // MÉTRICAS SAAS
  // ========================================================================

  /**
   * Obtener dashboard completo de métricas
   * @param {Object} params - { anio, mes }
   * @returns {Promise<Object>} { mrr, arr, churn_rate, ltv, suscriptores_activos, crecimiento }
   */
  obtenerDashboardMetricas: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/dashboard`, { params }),

  /**
   * Calcular MRR (Monthly Recurring Revenue)
   * @param {Object} params - { fecha }
   * @returns {Promise<Object>} { mrr, fecha }
   */
  calcularMRR: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/mrr`, { params }),

  /**
   * Calcular ARR (Annual Recurring Revenue)
   * @param {Object} params - { fecha }
   * @returns {Promise<Object>} { arr, fecha }
   */
  calcularARR: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/arr`, { params }),

  /**
   * Calcular Churn Rate (tasa de cancelación)
   * @param {Object} params - { anio, mes }
   * @returns {Promise<Object>} { churn_rate, periodo }
   */
  calcularChurnRate: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/churn`, { params }),

  /**
   * Calcular LTV (Lifetime Value)
   * @returns {Promise<Object>} { ltv, datos }
   */
  calcularLTV: () =>
    apiClient.get(`${BASE_URL}/metricas/ltv`),

  /**
   * Obtener número de suscriptores activos
   * @param {Object} params - { fecha }
   * @returns {Promise<Object>} { suscriptores_activos, fecha }
   */
  obtenerSuscriptoresActivos: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/suscriptores-activos`, { params }),

  /**
   * Obtener crecimiento mensual de MRR
   * @param {Object} params - { anio, mes }
   * @returns {Promise<Object>} { crecimiento, periodo }
   */
  obtenerCrecimientoMensual: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/crecimiento`, { params }),

  /**
   * Obtener distribución de suscriptores por estado
   * @returns {Promise<Object>} { distribucion }
   */
  obtenerDistribucionEstado: () =>
    apiClient.get(`${BASE_URL}/metricas/distribucion-estado`),

  /**
   * Obtener top planes más populares
   * @param {Object} params - { limite }
   * @returns {Promise<Object>} { planes }
   */
  obtenerTopPlanes: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/top-planes`, { params }),

  /**
   * Obtener evolución de MRR (últimos N meses)
   * @param {Object} params - { meses }
   * @returns {Promise<Object>} { evolucion }
   */
  obtenerEvolucionMRR: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/evolucion-mrr`, { params }),

  /**
   * Obtener evolución de Churn Rate (últimos N meses)
   * @param {Object} params - { meses }
   * @returns {Promise<Object>} { evolucion }
   */
  obtenerEvolucionChurn: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/evolucion-churn`, { params }),

  /**
   * Obtener evolución de suscriptores (nuevos, cancelados, neto)
   * @param {Object} params - { meses }
   * @returns {Promise<Object>} { evolucion }
   */
  obtenerEvolucionSuscriptores: (params = {}) =>
    apiClient.get(`${BASE_URL}/metricas/evolucion-suscriptores`, { params }),

  // ========================================================================
  // CHECKOUT
  // ========================================================================

  /**
   * Iniciar proceso de checkout
   * Crea suscripción pendiente y retorna init_point de MercadoPago
   * @param {Object} data - { plan_id, periodo?, cupon_codigo?, suscriptor_externo? }
   * @returns {Promise<Object>} { init_point, suscripcion_id, pago_id, precio }
   */
  iniciarCheckout: (data) =>
    apiClient.post(`${BASE_URL}/checkout/iniciar`, data),

  /**
   * Validar cupón de descuento
   * @param {Object} data - { codigo, plan_id, precio_base? }
   * @returns {Promise<Object>} { valido, cupon?, descuento_calculado?, precio_final? }
   */
  validarCupon: (data) =>
    apiClient.post(`${BASE_URL}/checkout/validar-cupon`, data),

  /**
   * Obtener resultado del checkout (después del callback de MercadoPago)
   * @param {Object} params - { suscripcion_id?, external_reference?, collection_status? }
   * @returns {Promise<Object>} { suscripcion, resultado_pago }
   */
  obtenerResultadoCheckout: (params = {}) =>
    apiClient.get(`${BASE_URL}/checkout/resultado`, { params }),
};
