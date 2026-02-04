/**
 * ====================================================================
 * WEBSITE EDITOR CONTEXT - Barrel Export
 * ====================================================================
 */

// Nuevo contexto centralizado (recomendado)
export { WebsiteEditorProvider, useWebsiteEditorContext } from './WebsiteEditorContext';

// Aliases para backward compatibility
export { EditorProvider, useEditor, useSite, useLayout, useBlocks, useUI } from './EditorContext';
