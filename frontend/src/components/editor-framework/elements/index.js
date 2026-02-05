/**
 * ====================================================================
 * ELEMENTS MODULE
 * ====================================================================
 * Módulo de elementos built-in para canvas de posición libre.
 * Los módulos específicos registran sus propios tipos dinámicamente.
 *
 * @version 2.0.0
 * @since 2026-02-04
 * @updated 2026-02-05 - Desacoplado de elementos de invitación
 */

// Element Types Registry
export {
  BUILT_IN_ELEMENT_TYPES,
  ELEMENT_CATEGORIES,
  registerElementType,
  registerElementTypes,
  getElementType,
  getAllElementTypes,
  getElementTypesByCategory,
  clearElementTypesRegistry,
  createElementFromType,
} from './elementTypes';

// Element Wrapper (HOC con interacción)
export { default as ElementWrapper } from './ElementWrapper';

// Renderers (built-in only)
export {
  TextoElementRenderer,
  ImagenElementRenderer,
  BotonElementRenderer,
  FormaElementRenderer,
  SeparadorElementRenderer,
  getElementRenderer,
} from './renderers';

// Editors (built-in only)
export {
  TextoElementEditor,
  ImagenElementEditor,
  BotonElementEditor,
  getElementEditor,
} from './editors';
