import { useState, memo, type ReactNode, type ComponentType } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExpandableSectionProps {
  /** Icono del header */
  icon?: ComponentType<{ className?: string }>;
  /** Titulo de la seccion */
  title: string;
  /** Contador (badge) */
  count?: number;
  /** Si inicia expandido */
  defaultExpanded?: boolean;
  /** Acciones adicionales en el header (botones, etc.) */
  headerActions?: ReactNode;
  /** Contenido expandible */
  children: ReactNode;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Clases CSS para el contenido expandido */
  contentClassName?: string;
}

/**
 * ExpandableSection - Seccion con header clickeable que expande/colapsa contenido
 *
 * Componente UI puro sin logica de negocio (CRUD, drawers, etc.)
 *
 * @example
 * <ExpandableSection title="Servicios" icon={Wrench} count={3}>
 *   <ServiceList />
 * </ExpandableSection>
 */
const ExpandableSection = memo(function ExpandableSection({
  icon: Icon,
  title,
  count,
  defaultExpanded = false,
  headerActions,
  children,
  className,
  contentClassName,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('border-t border-gray-200 dark:border-gray-700 pt-4 mt-4', className)}>
      {/* Header expandible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 mb-4"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{title}</h4>
          {count != null && count > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
              {count}
            </span>
          )}
          {headerActions}
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-500 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className={cn('pl-7', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
});

ExpandableSection.displayName = 'ExpandableSection';

export { ExpandableSection };
