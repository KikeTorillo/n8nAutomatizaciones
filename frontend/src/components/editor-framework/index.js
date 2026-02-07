/**
 * ====================================================================
 * EDITOR FRAMEWORK
 * ====================================================================
 * Framework compartido para editores de bloques y posición libre.
 * Usado por Website Builder y Editor de Invitaciones.
 *
 * @version 4.0.0
 * @since 2026-02-03
 * @updated 2026-02-05 - Desacoplado de lógica específica de invitaciones
 */

// ========== SHARED CONTEXT ==========
export { EditorContext, useEditor } from './context/EditorContext';

// ========== HOOKS ==========
export { useBlockEditor } from './hooks/useBlockEditor';
export { useBlockSelection } from './hooks/useBlockSelection';
export { useArrayItems } from './hooks/useArrayItems';
export { useArrayItemHandlers } from './hooks/useArrayItemHandlers';
export { usePropertiesState } from './hooks/usePropertiesState';
export { useAutosave } from './hooks/useAutosave';
export { useCanvasBreakpoint } from './hooks/useCanvasBreakpoint';
export { useDndHandlers } from './hooks/useDndHandlers';
export { useEditorShortcuts, ShortcutsHelp } from './hooks/useEditorShortcuts';
export { deepEqual, hashBloques, bloquesEqual } from './hooks/compareUtils';
export { useCanvasInteraction } from './hooks/useCanvasInteraction';
export { useSlashMenu } from './hooks/useSlashMenu';
export { useImageHandlers } from './hooks/useImageHandlers';
export { useThemeSave } from './hooks/useThemeSave';
export { useEditorBlockHandlers } from './hooks/useEditorBlockHandlers';

// Common Blocks (bloques compartidos)
export * from './common-blocks';

// Blocks List (acordeón de bloques)
export { BlockListEditor, BlockAccordionItem } from './blocks-list';

// DnD
export { DndEditorProvider, useDndEditor } from './dnd/DndEditorProvider';
export { BlockDragPreview } from './dnd/BlockDragPreview';
export { PreviewRenderer } from './dnd/PreviewRenderer';
export { registerBlockPreview, registerBlockPreviews, getBlockPreview } from './dnd/previewRegistry';

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
  ImagePositionField,
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

// Palette
export {
  BlockPalette,
  BlockCategoryGroup,
  DraggableBlockCard,
  DraggableBlockItem,
  agruparBloquesPorCategoria,
  getBlockColor,
  getDraggableId,
  DEFAULT_UNIFORM_COLOR,
} from './palette';

// Inline Editing
export {
  InlineText,
  InlineRichText,
  RichTextToolbar,
  InlineEditableWrapper,
  useInlineEditing,
} from './inline';

// ========== FREE POSITION CANVAS (Wix-style) ==========

// Canvas Components
export {
  FreePositionCanvas,
  CanvasSection,
  CanvasElement,
  SnapGuides,
  calculateSnapGuides,
} from './canvas';

// Elements Registry & Types (built-in only)
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
  ElementWrapper,
} from './elements';

// Element Renderers (built-in + registry)
export {
  TextoElementRenderer,
  ImagenElementRenderer,
  BotonElementRenderer,
  FormaElementRenderer,
  SeparadorElementRenderer,
  getElementRenderer,
  registerElementRenderer,
  registerElementRenderers,
} from './elements/renderers';

// Element Editors (built-in + registry)
export {
  TextoElementEditor,
  ImagenElementEditor,
  BotonElementEditor,
  getElementEditor,
  registerElementEditor,
  registerElementEditors,
} from './elements/editors';

// Panels
export {
  ElementsPalette,
  ElementPropertiesPanel,
  SectionPropertiesPanel,
  LayersPanel,
  ThemeEditorPanel,
  FUENTES_DISPONIBLES,
  TemplateGalleryPanel,
  TemplateGalleryModal,
} from './panels';

// Store Actions & Factories
export {
  createSectionActions,
  createSection,
  createElementActions,
  createFreePositionStore,
  createFreePositionSelectors,
} from './store';

// Migration Utils (bloques → secciones)
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
} from './utils';

// Secciones ↔ Bloques Conversion (autosave modo libre)
export {
  seccionesToBloques,
  seccionesToBloquesTrad,
  bloquesToSecciones,
  detectarModoLibre,
  hashSecciones,
  seccionesEqual,
  registerElementoToBloqueMapping,
} from './utils';
