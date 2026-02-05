/**
 * ====================================================================
 * ELEMENT RENDERERS
 * ====================================================================
 * Barrel export de renderers de elementos built-in.
 * Los renderers específicos de cada módulo se registran dinámicamente.
 *
 * @version 2.0.0
 * @since 2026-02-04
 * @updated 2026-02-05 - Movidos renderers de invitación al módulo eventos-digitales
 */

// Built-in renderers
export { default as TextoElementRenderer } from './TextoElementRenderer';
export { default as ImagenElementRenderer } from './ImagenElementRenderer';
export { default as BotonElementRenderer } from './BotonElementRenderer';
export { default as FormaElementRenderer } from './FormaElementRenderer';
export { default as SeparadorElementRenderer } from './SeparadorElementRenderer';

// Imports estáticos para getElementRenderer
import TextoElementRendererStatic from './TextoElementRenderer';
import ImagenElementRendererStatic from './ImagenElementRenderer';
import BotonElementRendererStatic from './BotonElementRenderer';
import FormaElementRendererStatic from './FormaElementRenderer';
import SeparadorElementRendererStatic from './SeparadorElementRenderer';

/**
 * Obtiene el renderer para un tipo de elemento built-in.
 * Los módulos pueden pasar customRenderers al FreePositionCanvas
 * para registrar renderers específicos.
 *
 * @param {string} tipo - Tipo del elemento
 * @returns {React.ComponentType|null}
 */
export function getElementRenderer(tipo) {
  switch (tipo) {
    case 'texto':
      return TextoElementRendererStatic;
    case 'imagen':
      return ImagenElementRendererStatic;
    case 'boton':
      return BotonElementRendererStatic;
    case 'forma':
      return FormaElementRendererStatic;
    case 'separador':
      return SeparadorElementRendererStatic;
    default:
      return null;
  }
}
