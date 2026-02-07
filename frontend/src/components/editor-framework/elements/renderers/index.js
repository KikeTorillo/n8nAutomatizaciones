/**
 * ====================================================================
 * ELEMENT RENDERERS
 * ====================================================================
 * Registry de renderers de elementos (Map-based).
 * Los renderers específicos de cada módulo se registran dinámicamente
 * con registerElementRenderer/registerElementRenderers.
 *
 * @version 3.0.0
 * @since 2026-02-04
 * @updated 2026-02-07 - Migrado de switch a Map registry
 */

// Built-in renderers
export { default as TextoElementRenderer } from './TextoElementRenderer';
export { default as ImagenElementRenderer } from './ImagenElementRenderer';
export { default as BotonElementRenderer } from './BotonElementRenderer';
export { default as FormaElementRenderer } from './FormaElementRenderer';
export { default as SeparadorElementRenderer } from './SeparadorElementRenderer';

// Imports estáticos para el registry
import TextoElementRendererStatic from './TextoElementRenderer';
import ImagenElementRendererStatic from './ImagenElementRenderer';
import BotonElementRendererStatic from './BotonElementRenderer';
import FormaElementRendererStatic from './FormaElementRenderer';
import SeparadorElementRendererStatic from './SeparadorElementRenderer';

// ========== REGISTRY ==========

const rendererRegistry = new Map([
  ['texto', TextoElementRendererStatic],
  ['imagen', ImagenElementRendererStatic],
  ['boton', BotonElementRendererStatic],
  ['forma', FormaElementRendererStatic],
  ['separador', SeparadorElementRendererStatic],
]);

/**
 * Registra un renderer para un tipo de elemento.
 * @param {string} tipo - Tipo del elemento
 * @param {React.ComponentType} renderer - Componente renderer
 */
export function registerElementRenderer(tipo, renderer) {
  rendererRegistry.set(tipo, renderer);
}

/**
 * Registra múltiples renderers a la vez.
 * @param {Object} map - { tipo: RendererComponent, ... }
 */
export function registerElementRenderers(map) {
  Object.entries(map).forEach(([tipo, renderer]) => rendererRegistry.set(tipo, renderer));
}

/**
 * Obtiene el renderer para un tipo de elemento.
 * Los módulos pueden pasar customRenderers al FreePositionCanvas
 * para override local (prioridad sobre registry).
 *
 * @param {string} tipo - Tipo del elemento
 * @returns {React.ComponentType|null}
 */
export function getElementRenderer(tipo) {
  return rendererRegistry.get(tipo) || null;
}
