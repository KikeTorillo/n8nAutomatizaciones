/**
 * ====================================================================
 * EDITOR FRAMEWORK
 * ====================================================================
 * Framework compartido para editores de bloques.
 * Usado por Website Builder y Editor de Invitaciones.
 *
 * @version 1.3.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Separado EditorHeader + EditorToolbar
 */

// Hooks
export { useBlockEditor } from './hooks/useBlockEditor';
export { useBlockSelection } from './hooks/useBlockSelection';
export { useArrayItems } from './hooks/useArrayItems';
export { usePropertiesState } from './hooks/usePropertiesState';
export { useAutosave } from './hooks/useAutosave';
export { useCanvasBreakpoint } from './hooks/useCanvasBreakpoint';
export { deepEqual, hashBloques, bloquesEqual } from './hooks/compareUtils';

// DnD
export { DndEditorProvider, useDndEditor } from './dnd/DndEditorProvider';
export { BlockDragPreview } from './dnd/BlockDragPreview';
export { PreviewRenderer } from './dnd/PreviewRenderer';

// Blocks
export { default as BaseBlockEditor } from './blocks/BaseBlockEditor';
export { default as BaseAutoSaveEditor } from './blocks/BaseAutoSaveEditor';

// Fields
export {
  TextField,
  TextareaField,
  UrlField,
  ImageField,
  SelectField,
  ToggleField,
  NumberField,
  RangeField,
  ColorField,
  AlignmentField,
  ItemsEditorField,
  DateField,
  DateTimeField,
  FieldRenderer,
  TabContent,
} from './fields';

// Layout
export { default as EditorHeader } from './layout/EditorHeader';
export { default as EditorToolbar } from './layout/EditorToolbar';
export { default as PropertiesPanel } from './layout/PropertiesPanel';
export { default as BreakpointSelector } from './layout/BreakpointSelector';
export { BREAKPOINTS } from './layout/breakpointConfig';
export { default as ResponsiveCanvas } from './layout/ResponsiveCanvas';
export { default as EditorFAB } from './layout/EditorFAB';
export { default as EditorDrawer } from './layout/EditorDrawer';

// Layout Context (responsive)
export {
  EditorLayoutProvider,
  useEditorLayoutContext,
  withEditorLayout,
} from './layout/EditorLayoutContext';
export { useEditorLayout, PANEL_TYPES } from './layout/useEditorLayout';

// Constants
export { TABS, TABS_SIMPLE, BREAKPOINT_ICONS, BREAKPOINT_LABELS } from './constants';
