/**
 * Notificaciones — barrel export
 * Split de useNotificaciones.ts — Feb 2026
 */

// Constantes y tipos
export {
  NOTIFICACION_NIVELES,
  NOTIFICACION_CATEGORIAS,
} from './notificacionesConstants';
export type {
  NotificacionListParams,
  Notificacion,
  CrearNotificacionData,
  NotificacionPreferencia,
  ActualizarPreferenciasData,
  NotificacionPlantilla,
  CrearPlantillaData,
  ActualizarPlantillaParams,
} from './notificacionesConstants';

// Feed
export {
  useNotificaciones,
  useNotificacionesCount,
  useNotificacionesTipos,
  useMarcarNotificacionLeida,
  useMarcarTodasNotificacionesLeidas,
  useArchivarNotificacion,
  useEliminarNotificacion,
  useCrearNotificacion,
} from './useNotificacionesFeed';

// Preferencias
export {
  useNotificacionesPreferencias,
  useActualizarNotificacionesPreferencias,
} from './useNotificacionesPreferencias';

// Plantillas (Admin)
export {
  useNotificacionesPlantillas,
  useCrearNotificacionPlantilla,
  useActualizarNotificacionPlantilla,
  useEliminarNotificacionPlantilla,
} from './useNotificacionesPlantillas';
