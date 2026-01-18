/**
 * Hooks para gestión de citas
 * Refactorizados desde CitaFormDrawer y useCitas.js - Enero 2026
 *
 * Archivos modulares:
 * - useCitasBasicas.js - Queries básicos (listar, obtener, del día, pendientes)
 * - useMutacionesCitas.js - Mutaciones de estado (crear, actualizar, confirmar, etc.)
 * - useCitasWalkIn.js - Walk-in y disponibilidad inmediata
 * - useRecordatoriosCitas.js - Recordatorios y envíos
 * - useCitasRecurrentes.js - Series recurrentes
 * - useBusquedaCitas.js - Búsqueda y filtrado
 * - useRecurrenceState.js - Estado local de recurrencia (UI)
 * - useProfesionalServices.js - Servicios por profesional
 * - useServicesTotalCalculation.js - Cálculo de totales
 */

// ==================== QUERIES BÁSICOS ====================
export {
  useCitas,
  useCita,
  useCitasDelDia,
  useCitasPendientes,
} from './useCitasBasicas';

// ==================== MUTACIONES DE ESTADO ====================
export {
  useCrearCita,
  useActualizarCita,
  useCancelarCita,
  useConfirmarCita,
  useIniciarCita,
  useCompletarCita,
  useNoShowCita,
} from './useMutacionesCitas';

// ==================== WALK-IN ====================
export {
  useCrearCitaWalkIn,
  useDisponibilidadInmediata,
} from './useCitasWalkIn';

// ==================== RECORDATORIOS ====================
export {
  useEnviarRecordatorio,
  useRecordatorios,
} from './useRecordatoriosCitas';

// ==================== CITAS RECURRENTES ====================
export {
  useCrearCitaRecurrente,
  useSerieCitas,
  useCancelarSerie,
  usePreviewRecurrencia,
} from './useCitasRecurrentes';

// ==================== BÚSQUEDA ====================
export {
  useBuscarCitas,
  useCitasPorProfesional,
  useCitasPorCliente,
} from './useBusquedaCitas';

// ==================== HOOKS DE UI (desde refactor CitaFormDrawer) ====================
export {
  useRecurrenceState,
  FRECUENCIAS,
  DIAS_SEMANA,
  TERMINA_EN,
} from './useRecurrenceState';

export { useProfesionalServices } from './useProfesionalServices';
export { useServicesTotalCalculation } from './useServicesTotalCalculation';
