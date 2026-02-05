/**
 * ====================================================================
 * UTILS MODULE
 * ====================================================================
 * Utilidades del editor framework.
 *
 * @version 1.1.0
 * @since 2026-02-04
 * @updated 2026-02-04 - Agregadas utilidades de conversión secciones/bloques
 */

export {
  // Bloques genéricos
  migrateHeroBlock,
  migrateTextoBlock,
  migrateImagenBlock,
  migrateGenericBlock,
  // Bloques específicos de invitaciones
  migrateHeroInvitacionBlock,
  migrateCountdownBlock,
  migrateCalendarioBlock,
  migrateTimelineBlock,
  migrateRsvpBlock,
  migrateUbicacionBlock,
  migrateGaleriaBlock,
  migrateFaqBlock,
  migrateMesaRegalosBlock,
  migrateSeparadorBlock,
  migrateVideoBlock,
  // Funciones de utilidad
  migrateBlocksToSections,
  detectDataFormat,
  ensureSectionsFormat,
} from './migrationUtils';

export {
  seccionesToBloques,
  seccionesToBloquesTrad,
  bloquesToSecciones,
  detectarModoLibre,
  hashSecciones,
  seccionesEqual,
} from './seccionesToBloques';
