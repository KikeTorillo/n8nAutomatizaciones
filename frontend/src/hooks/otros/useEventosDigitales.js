/**
 * Hooks para el módulo de Eventos Digitales (invitaciones de bodas, XV años, etc.)
 *
 * Ene 2026: Refactorizado en módulos más pequeños para mejor mantenibilidad.
 * Este archivo ahora re-exporta desde ./eventos-digitales/ para mantener
 * compatibilidad con imports existentes.
 *
 * Los nuevos módulos están en:
 * - ./eventos-digitales/useEventos.js (~280 líneas)
 * - ./eventos-digitales/useInvitados.js (~240 líneas)
 * - ./eventos-digitales/useGalerias.js (~350 líneas)
 * - ./eventos-digitales/useEventosPublicos.js (~250 líneas)
 */

// Re-exportar todo desde los nuevos módulos
export * from './eventos-digitales';

// Default export para compatibilidad
export { default } from './eventos-digitales';
