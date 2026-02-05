/**
 * ====================================================================
 * ELEMENTS MODULE
 * ====================================================================
 * Módulo de elementos para canvas de posición libre.
 *
 * @version 1.1.0
 * @since 2026-02-04
 */

// Element Types Registry
export {
  BUILT_IN_ELEMENT_TYPES,
  INVITACION_ELEMENT_TYPES,
  ELEMENT_CATEGORIES,
  registerElementType,
  registerElementTypes,
  registerInvitacionElementTypes,
  getElementType,
  getAllElementTypes,
  getElementTypesByCategory,
  clearElementTypesRegistry,
  createElementFromType,
  INVITACION_ALLOWED_TYPES,
} from './elementTypes';

// Element Wrapper (HOC con interacción)
export { default as ElementWrapper } from './ElementWrapper';

// Renderers
export {
  TextoElementRenderer,
  ImagenElementRenderer,
  BotonElementRenderer,
  FormaElementRenderer,
  SeparadorElementRenderer,
  CountdownElementRenderer,
  CalendarioElementRenderer,
  RsvpButtonElementRenderer,
  TimelineElementRenderer,
  HeroInvitacionElementRenderer,
  ProtagonistasElementRenderer,
  UbicacionElementRenderer,
  GaleriaElementRenderer,
  FaqElementRenderer,
  MesaRegalosElementRenderer,
  getElementRenderer,
} from './renderers';

// Editors
export {
  TextoElementEditor,
  ImagenElementEditor,
  BotonElementEditor,
  CountdownElementEditor,
  CalendarioElementEditor,
  RsvpButtonElementEditor,
  TimelineElementEditor,
  getElementEditor,
} from './editors';
