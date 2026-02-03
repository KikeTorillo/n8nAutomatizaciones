/**
 * ====================================================================
 * WEBSITE EDITOR CONTEXT - Barrel Export
 * ====================================================================
 */

// Main combined context (backward compatible)
export { EditorProvider, useEditor } from './EditorContext';

// Individual contexts (for optimized usage)
export { SiteProvider, useSite } from './SiteContext';
export { LayoutProvider, useLayout } from './LayoutContext';
export { BlocksProvider, useBlocks } from './BlocksContext';
export { UIProvider, useUI } from './UIContext';
