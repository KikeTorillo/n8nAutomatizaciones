/**
 * ====================================================================
 * HOOKS INDEX - SUSCRIPCIONES NEGOCIO
 * ====================================================================
 * Re-exporta todos los hooks del módulo.
 */

// Constantes
export * from './constants';

// Conectores
export {
  useConectores,
  useConector,
  useCrearConector,
  useActualizarConector,
  useEliminarConector,
  useGatewaysSoportados,
  useVerificarConector,
} from './useConectores';

// Planes
export {
  usePlanes,
  usePlan,
  useCrearPlan,
  useActualizarPlan,
  useEliminarPlan,
  usePlanesActivos,
  useSuscripcionesActivasPlan,
  usePlanesPublicos,
} from './usePlanes';

// Suscripciones
export {
  useSuscripciones,
  useSuscripcion,
  useSuscripcionesCliente,
  useHistorialSuscripcion,
  useMiSuscripcion,
  useCrearSuscripcion,
  useActualizarSuscripcion,
  useCambiarEstadoSuscripcion,
  useCambiarPlanSuscripcion,
  useCambiarMiPlan,
  useCancelarSuscripcion,
  usePausarSuscripcion,
  useReactivarSuscripcion,
  useActualizarProximoCobro,
} from './useSuscripciones';

// Cupones
export {
  useCupones,
  useCupon,
  useCrearCupon,
  useActualizarCupon,
  useEliminarCupon,
  useCuponesActivos,
  useCuponPorCodigo,
  useValidarCupon,
  useDesactivarCupon,
} from './useCupones';

// Pagos
export {
  usePagos,
  usePago,
  useResumenPagos,
  usePagoPorTransaccion,
  useCrearPago,
  useActualizarEstadoPago,
  useProcesarReembolso,
} from './usePagos';

// Métricas
export {
  useMetricasDashboard,
  useMRR,
  useARR,
  useChurnRate,
  useLTV,
  useSuscriptoresActivos,
  useCrecimientoMensual,
  useDistribucionEstado,
  useTopPlanes,
  useEvolucionMRR,
  useEvolucionChurn,
  useEvolucionSuscriptores,
} from './useMetricas';

// Customer Billing (Suscripciones de Clientes)
export {
  useCheckoutTokens,
  useCrearSuscripcionCliente,
  useCancelarCheckoutToken,
  useCheckoutPublico,
  useIniciarPagoPublico,
} from './useClienteSuscripciones';
