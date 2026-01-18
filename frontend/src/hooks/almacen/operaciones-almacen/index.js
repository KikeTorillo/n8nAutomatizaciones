/**
 * ====================================================================
 * HOOKS: Operaciones de Almacén
 * ====================================================================
 * Barrel exports para operaciones de almacén
 * Ene 2026 - Fragmentación de hooks
 */

// Constantes
export {
  OPERACIONES_ALMACEN_KEYS,
  TIPOS_OPERACION,
  ESTADOS_OPERACION,
  LABELS_TIPO_OPERACION,
  LABELS_ESTADO_OPERACION,
  COLORES_ESTADO_OPERACION,
} from './constants';

// Queries
export {
  useOperacionesAlmacen,
  useOperacionAlmacen,
  useCadenaOperaciones,
  useOperacionesPendientes,
  useEstadisticasOperaciones,
  useOperacionesKanban,
} from './queries';

// Mutations
export {
  useCrearOperacion,
  useActualizarOperacion,
  useAsignarOperacion,
  useIniciarOperacion,
  useCompletarOperacion,
  useCancelarOperacion,
  useProcesarItem,
  useCancelarItem,
} from './mutations';

// Manager
export { useOperacionesAlmacenManager } from './manager';
