/**
 * ====================================================================
 * HOOKS - CONTABILIDAD (Modular)
 * ====================================================================
 * Re-exportación de todos los hooks del módulo de contabilidad.
 * Mantiene compatibilidad con imports existentes.
 *
 * Estructura:
 * - constants.js: Query keys y constantes compartidas
 * - queries/: Hooks de lectura (useQuery)
 * - mutations/: Hooks de escritura (useMutation)
 */

// Constantes
export {
  CONTABILIDAD_KEYS,
  ESTADOS_ASIENTO,
  TIPOS_CUENTA,
  NATURALEZA_CUENTA,
} from './constants';

// Queries - Dashboard
export { useDashboardContabilidad } from './queries/dashboard';

// Queries - Cuentas
export {
  useCuentasContables,
  useArbolCuentas,
  useCuentasAfectables,
  useCuenta,
} from './queries/cuentas';

// Queries - Asientos
export { useAsientosContables, useAsiento } from './queries/asientos';

// Queries - Períodos
export { usePeriodosContables } from './queries/periodos';

// Queries - Reportes
export {
  useBalanzaComprobacion,
  useLibroMayor,
  useEstadoResultados,
  useBalanceGeneral,
} from './queries/reportes';

// Queries - Configuración
export { useConfiguracionContable } from './queries/configuracion';

// Mutations - Cuentas
export {
  useCrearCuenta,
  useActualizarCuenta,
  useEliminarCuenta,
  useInicializarCatalogoSAT,
} from './mutations/cuentas';

// Mutations - Asientos
export {
  useCrearAsiento,
  useActualizarAsiento,
  usePublicarAsiento,
  useAnularAsiento,
  useEliminarAsiento,
} from './mutations/asientos';

// Mutations - Períodos
export { useCerrarPeriodo } from './mutations/periodos';

// Mutations - Configuración
export { useActualizarConfiguracion } from './mutations/configuracion';
