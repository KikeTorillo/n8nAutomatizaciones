/**
 * ====================================================================
 * WEBSITE EDITOR HOOKS - Barrel Export
 * ====================================================================
 */

export { useAutosave, useEstadoGuardado } from './useAutosave';
export { useEditorShortcuts, ShortcutsHelp } from './useEditorShortcuts';
export {
  useResponsiveConfig,
  useResponsiveUpdate,
  RESPONSIVE_DEFAULTS,
  getResponsiveClasses,
} from './useResponsiveConfig';
// Re-export del framework (el hook local está deprecado)
export { useEditorLayout, PANEL_TYPES } from '@/components/editor-framework';
export { recargarDatosServidor } from './useAutosave';
export { useSlashMenu } from './useSlashMenu';
export { useERPData } from './useERPData';
