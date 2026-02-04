/**
 * ====================================================================
 * INLINE EDITOR COMPONENTS (RE-EXPORT)
 * ====================================================================
 * Re-exporta componentes de edición inline desde editor-framework.
 * Mantiene backward compatibility con imports existentes.
 *
 * @version 2.0.0
 * @since 2026-02-04
 * @deprecated Importar directamente desde '@/components/editor-framework'
 */

export {
  InlineText,
  InlineRichText,
  RichTextToolbar,
  InlineEditableWrapper,
  useInlineEditing,
} from '@/components/editor-framework';

// Default export para compatibilidad
export { InlineText as default } from '@/components/editor-framework';
