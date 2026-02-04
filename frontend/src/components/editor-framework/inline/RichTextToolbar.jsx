/**
 * ====================================================================
 * RICH TEXT TOOLBAR
 * ====================================================================
 * Toolbar flotante para el editor de texto enriquecido TipTap.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Toolbar flotante para el editor de texto enriquecido
 *
 * @param {Object} props
 * @param {Object} props.editor - Instancia del editor TipTap
 * @param {string} props.className - Clases adicionales
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

export default memo(RichTextToolbar);
