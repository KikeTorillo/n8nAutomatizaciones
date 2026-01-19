/**
 * ====================================================================
 * HOOKS - Vacaciones (Modular)
 * ====================================================================
 * Re-exportación de todos los hooks del módulo de vacaciones.
 * Mantiene compatibilidad con imports existentes.
 *
 * Estructura:
 * - constants.js: Estados, tipos y query keys
 * - queries.js: Hooks de lectura (useQuery)
 * - mutations.js: Hooks de escritura (useMutation)
 * - utils.js: Funciones utilitarias
 */

// Constantes
export {
  ESTADOS_SOLICITUD,
  TIPOS_APROBADOR,
  TURNOS_MEDIO_DIA,
  VACACIONES_KEYS,
} from './constants';

// Utilidades
export {
  getEstadoSolicitud,
  formatDias,
  calcularProgresoNivel,
} from './utils';

// Queries
export {
  usePoliticaVacaciones,
  useNivelesVacaciones,
  useMiSaldoVacaciones,
  useSaldosVacaciones,
  useMisSolicitudesVacaciones,
  useSolicitudesVacaciones,
  useSolicitudesCalendario,
  useSolicitudesPendientes,
  useSolicitudVacaciones,
  useDashboardVacaciones,
  useEstadisticasVacaciones,
} from './queries';

// Mutations
export {
  useActualizarPoliticaVacaciones,
  useCrearNivelVacaciones,
  useActualizarNivelVacaciones,
  useEliminarNivelVacaciones,
  useCrearNivelesPreset,
  useAjustarSaldo,
  useGenerarSaldosAnio,
  useCrearSolicitudVacaciones,
  useAprobarSolicitud,
  useRechazarSolicitud,
  useCancelarSolicitud,
} from './mutations';
