/**
 * ====================================================================
 * INLINE RICH TEXT
 * ====================================================================
 * Componente para edición inline de HTML enriquecido.
 * Usa TipTap para funcionalidades avanzadas (bold, italic, links, etc.)
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useState, useEffect, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';
import RichTextToolbar from './RichTextToolbar';

/**
 * Componente para edición inline de HTML enriquecido
 * Usa TipTap para funcionalidades avanzadas (bold, italic, links, etc.)
 *
 * @param {Object} props
 * @param {string} props.value - HTML actual
 * @param {Function} props.onChange - Callback al cambiar
 * @param {string} props.placeholder - Placeholder cuando está vacío
 * @param {string} props.className - Clases adicionales
 * @param {boolean} props.disabled - Deshabilitar edición
 * @param {boolean} props.showToolbar - Mostrar toolbar flotante
 */
export const InlineRichText = memo(function InlineRichText({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  className = '',
  disabled = false,
  showToolbar = true,
}) {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Solo notificar si el contenido realmente cambió
      if (html !== value) {
        onChange(html);
      }
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // Sincronizar valor externo
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar flotante */}
      {showToolbar && isFocused && (
        <RichTextToolbar editor={editor} className="mb-2" />
      )}

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'outline-none transition-colors',
          'focus-within:bg-primary-50/50 dark:focus-within:bg-primary-900/20',
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror-focused]:outline-none',
          // Placeholder styles
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:dark:text-gray-500',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0'
        )}
      />
    </div>
  );
});

export default InlineRichText;
