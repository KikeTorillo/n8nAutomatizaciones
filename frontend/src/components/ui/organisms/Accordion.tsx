import { useState, useCallback, memo, forwardRef, type ReactNode, type ComponentType } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  /** Identificador único del item */
  id: string;
  /** Título del item */
  title: string;
  /** Icono opcional */
  icon?: ComponentType<{ className?: string }>;
  /** Contenido expandible */
  content: ReactNode;
  /** Deshabilitar el item */
  disabled?: boolean;
}

export interface AccordionProps {
  /** Items del accordion */
  items: AccordionItem[];
  /** Tipo: single permite solo uno abierto, multiple permite varios */
  type?: 'single' | 'multiple';
  /** IDs de items abiertos por defecto */
  defaultOpenIds?: string[];
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Accordion - Componente de secciones expandibles/colapsables
 *
 * @example
 * // Single mode (solo uno abierto a la vez)
 * <Accordion
 *   type="single"
 *   items={[
 *     { id: 'faq1', title: 'Pregunta 1', content: <p>Respuesta 1</p> },
 *     { id: 'faq2', title: 'Pregunta 2', content: <p>Respuesta 2</p> },
 *   ]}
 * />
 *
 * @example
 * // Multiple mode con icons
 * <Accordion
 *   type="multiple"
 *   defaultOpenIds={['section1']}
 *   items={[
 *     { id: 'section1', title: 'General', icon: Settings, content: <GeneralSection /> },
 *   ]}
 * />
 */
const Accordion = memo(forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    items,
    type = 'single',
    defaultOpenIds = [],
    className,
  },
  ref
) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenIds));

  const toggle = useCallback((id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (type === 'single') {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  }, [type]);

  return (
    <div
      ref={ref}
      className={cn('divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg', className)}
    >
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        const Icon = item.icon;

        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => !item.disabled && toggle(item.id)}
              disabled={item.disabled}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div
                id={`accordion-content-${item.id}`}
                role="region"
                aria-labelledby={`accordion-trigger-${item.id}`}
                className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}));

Accordion.displayName = 'Accordion';

export { Accordion };
