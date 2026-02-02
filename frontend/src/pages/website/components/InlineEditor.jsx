/**
 * ====================================================================
 * INLINE EDITOR COMPONENTS
 * ====================================================================
 * Componentes para edición inline en el canvas WYSIWYG.
 * - InlineText: Para textos simples (contentEditable)
 * - InlineRichText: Para HTML enriquecido (TipTap)
 */

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';

// ========== INLINE TEXT (SIMPLE) ==========

/**
 * Componente para edición inline de texto simple
 * Usa contentEditable nativo para máxima performance
 *
 * @param {Object} props
 * @param {string} props.value - Texto actual
 * @param {Function} props.onChange - Callback al cambiar
 * @param {string} props.placeholder - Placeholder cuando está vacío
 * @param {string} props.className - Clases adicionales
 * @param {boolean} props.multiline - Permitir múltiples líneas
 * @param {boolean} props.disabled - Deshabilitar edición
 * @param {string} props.as - Tag HTML a usar (span, h1, h2, p, etc.)
 */
export const InlineText = memo(function InlineText({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  className = '',
  multiline = false,
  disabled = false,
  as: Component = 'span',
}) {
  const elementRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  // Track el valor local para evitar conflictos durante edición
  const lastValueRef = useRef(value);

  // Sincronizar valor externo con el contenido del elemento
  // Solo cuando no está enfocado y el valor realmente cambió desde afuera
  useEffect(() => {
    if (elementRef.current && !isFocused) {
      // Solo actualizar si el valor cambió desde el exterior (no por nuestra propia edición)
      if (value !== lastValueRef.current) {
        elementRef.current.innerText = value || '';
        lastValueRef.current = value;
      }
    }
  }, [value, isFocused]);

  // Inicializar el contenido solo en el primer render
  useEffect(() => {
    if (elementRef.current && elementRef.current.innerText === '') {
      elementRef.current.innerText = value || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Manejar blur - guardar cambios
   */
  const handleBlur = useCallback(
    (e) => {
      setIsFocused(false);
      const newValue = e.target.innerText;
      if (newValue !== lastValueRef.current) {
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    },
    [onChange]
  );

  /**
   * Manejar focus
   */
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  /**
   * Prevenir Enter en modo single-line
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    },
    [multiline]
  );

  /**
   * Prevenir pegar HTML formateado
   */
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <Component
      ref={elementRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      data-placeholder={placeholder}
      className={cn(
        'outline-none transition-colors cursor-text',
        'focus:bg-primary-50/50 dark:focus:bg-primary-900/20',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500',
        disabled && 'cursor-default pointer-events-none',
        className
      )}
    />
  );
});

// ========== INLINE RICH TEXT (TIPTAP) ==========

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

// ========== RICH TEXT TOOLBAR ==========

/**
 * Toolbar flotante para el editor de texto enriquecido
 */
function RichTextToolbar({ editor, className }) {
  if (!editor) return null;

  const buttons = [
    {
      icon: 'B',
      title: 'Negrita',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: 'I',
      title: 'Cursiva',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      className: 'italic',
    },
    {
      icon: 'S',
      title: 'Tachado',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      className: 'line-through',
    },
    { type: 'divider' },
    {
      icon: 'H1',
      title: 'Título 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: 'H2',
      title: 'Título 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: 'H3',
      title: 'Título 3',
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
    },
    { type: 'divider' },
    {
      icon: '•',
      title: 'Lista',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: '1.',
      title: 'Lista numerada',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-1',
        'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
        'border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {buttons.map((btn, index) =>
        btn.type === 'divider' ? (
          <div
            key={`divider-${index}`}
            className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"
          />
        ) : (
          <button
            key={btn.icon}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className={cn(
              'px-2 py-1 text-sm font-medium rounded transition-colors',
              btn.isActive
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
              btn.className
            )}
          >
            {btn.icon}
          </button>
        )
      )}
    </div>
  );
}

// ========== INLINE EDITABLE WRAPPER ==========

/**
 * Wrapper para hacer cualquier elemento editable inline
 * Usado para envolver elementos del canvas
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a mostrar cuando no edita
 * @param {boolean} props.isEditing - Si está en modo edición
 * @param {Function} props.onStartEdit - Callback al iniciar edición (doble click)
 * @param {Function} props.onStopEdit - Callback al terminar edición
 * @param {React.ReactNode} props.editComponent - Componente de edición
 */
export const InlineEditableWrapper = memo(function InlineEditableWrapper({
  children,
  isEditing,
  onStartEdit,
  onStopEdit,
  editComponent,
  className,
}) {
  const handleDoubleClick = useCallback(
    (e) => {
      e.stopPropagation();
      onStartEdit?.();
    },
    [onStartEdit]
  );

  const handleBlur = useCallback(
    (e) => {
      // Solo si el foco sale del contenedor
      if (!e.currentTarget.contains(e.relatedTarget)) {
        onStopEdit?.();
      }
    },
    [onStopEdit]
  );

  if (isEditing) {
    return (
      <div className={className} onBlur={handleBlur}>
        {editComponent}
      </div>
    );
  }

  return (
    <div
      className={cn('cursor-text', className)}
      onDoubleClick={handleDoubleClick}
    >
      {children}
    </div>
  );
});

export default InlineText;
