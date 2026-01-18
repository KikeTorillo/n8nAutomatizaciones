/**
 * useCitas.js - Re-exports de hooks de Citas
 *
 * Este archivo fue modularizado en Enero 2026.
 * Los hooks están organizados en archivos separados por funcionalidad.
 *
 * Archivos modulares:
 * - citas/useCitasBasicas.js - Queries básicos (listar, obtener, del día, pendientes)
 * - citas/useMutacionesCitas.js - Mutaciones de estado (crear, actualizar, confirmar, etc.)
 * - citas/useCitasWalkIn.js - Walk-in y disponibilidad inmediata
 * - citas/useRecordatoriosCitas.js - Recordatorios y envíos
 * - citas/useCitasRecurrentes.js - Series recurrentes
 * - citas/useBusquedaCitas.js - Búsqueda y filtrado
 */

// ==================== QUERIES BÁSICOS ====================
export {
  useCitas,
  useCita,
  useCitasDelDia,
  useCitasPendientes,
} from './citas/useCitasBasicas';

// ==================== MUTACIONES DE ESTADO ====================
export {
  useCrearCita,
  useActualizarCita,
  useCancelarCita,
  useConfirmarCita,
  useIniciarCita,
  useCompletarCita,
  useNoShowCita,
} from './citas/useMutacionesCitas';

// ==================== WALK-IN ====================
export {
  useCrearCitaWalkIn,
  useDisponibilidadInmediata,
} from './citas/useCitasWalkIn';

// ==================== RECORDATORIOS ====================
export {
  useEnviarRecordatorio,
  useRecordatorios,
} from './citas/useRecordatoriosCitas';

// ==================== CITAS RECURRENTES ====================
export {
  useCrearCitaRecurrente,
  useSerieCitas,
  useCancelarSerie,
  usePreviewRecurrencia,
} from './citas/useCitasRecurrentes';

// ==================== BÚSQUEDA ====================
export {
  useBuscarCitas,
  useCitasPorProfesional,
  useCitasPorCliente,
} from './citas/useBusquedaCitas';
