/**
 * Barrel export para componentes de layout del editor framework
 */

// Componentes de UI
export { default as PropertiesPanel } from './PropertiesPanel';
export { default as BreakpointSelector } from './BreakpointSelector';
export { default as ResponsiveCanvas } from './ResponsiveCanvas';
export { default as EditorFAB } from './EditorFAB';
export { default as EditorDrawer } from './EditorDrawer';

// Context y Provider
export {
  EditorLayoutProvider,
  useEditorLayoutContext,
  withEditorLayout,
} from './EditorLayoutContext';

// Hooks
export { useEditorLayout, PANEL_TYPES } from './useEditorLayout';

// Constants
export { BREAKPOINTS } from './breakpointConfig';
