/**
 * ====================================================================
 * WEBSITE EDITOR HOOKS - Barrel Export
 * ====================================================================
 */

// Re-export del framework
export { useAutosave, hashBloques } from '@/components/editor-framework';
export { useEditorLayout, PANEL_TYPES } from '@/components/editor-framework';
export { useEditorShortcuts, ShortcutsHelp } from '@/components/editor-framework';

// Hooks locales
export {
  useResponsiveConfig,
  useResponsiveUpdate,
  RESPONSIVE_DEFAULTS,
  getResponsiveClasses,
} from './useResponsiveConfig';
export { useSlashMenu } from '@/components/editor-framework/hooks';
export { useERPData } from './useERPData';
