/**
 * Constantes para el módulo de Agendamiento
 * Query keys y configuración compartida
 * Ene 2026 - Centralización de query keys
 *
 * NOTA: Las query keys han sido migradas a `@/hooks/config/queryKeys.js`.
 * Usar `import { queryKeys } from '@/hooks/config'` y acceder via
 * `queryKeys.agendamiento.*` en lugar de AGENDAMIENTO_KEYS.
 */
import { queryKeys } from '@/hooks/config';

/**
 * @deprecated Usar `queryKeys.agendamiento` de `@/hooks/config` directamente.
 */
export const AGENDAMIENTO_KEYS = queryKeys.agendamiento;

/**
 * Estados de Citas
 */
export const ESTADOS_CITA = {
  PROGRAMADA: 'programada',
  CONFIRMADA: 'confirmada',
  EN_SALA: 'en_sala',
  EN_SERVICIO: 'en_servicio',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  NO_SHOW: 'no_show',
};

/**
 * Tipos de Bloqueo
 */
export const TIPOS_BLOQUEO = {
  VACACIONES: 'vacaciones',
  FERIADO: 'feriado',
  MANTENIMIENTO: 'mantenimiento',
  CAPACITACION: 'capacitacion',
  PERSONAL: 'personal',
  OTRO: 'otro',
};

/**
 * Tipos de Recurrencia
 */
export const TIPOS_RECURRENCIA = {
  NINGUNA: 'ninguna',
  DIARIA: 'diaria',
  SEMANAL: 'semanal',
  BISEMANAL: 'bisemanal',
  MENSUAL: 'mensual',
};

/**
 * Estados de Recordatorio
 */
export const ESTADOS_RECORDATORIO = {
  PENDIENTE: 'pendiente',
  ENVIADO: 'enviado',
  FALLIDO: 'fallido',
  CONFIRMADO: 'confirmado',
};
