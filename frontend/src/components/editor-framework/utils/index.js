/**
 * ====================================================================
 * UTILS MODULE
 * ====================================================================
 * Utilidades del editor framework.
 *
 * @version 2.0.0
 * @since 2026-02-04
 * @updated 2026-02-05 - Desacoplado migradores de invitación + registry dinámico
 */

export {
  // Bloques genéricos
  migrateHeroBlock,
  migrateTextoBlock,
  migrateImagenBlock,
  migrateGenericBlock,
  migrateSeparadorBlock,
  migrateVideoBlock,
  // Registry de migradores
  registerBlockMigrator,
  registerBlockMigrators,
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
  registerElementoToBloqueMapping,
} from './seccionesToBloques';
