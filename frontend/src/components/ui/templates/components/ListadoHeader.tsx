import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../../atoms/Button';
import { Plus } from 'lucide-react';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface ListadoHeaderProps {
  icon?: LucideIcon;
  title?: string;
  subtitle: string;
  actions?: React.ReactNode;
  showNewButton: boolean;
  newButtonLabel: string;
  onNuevo: () => void;
}

export const ListadoHeader = memo(function ListadoHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  showNewButton,
  newButtonLabel,
  onNuevo,
}: ListadoHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && <Icon className={cn('h-7 w-7', SEMANTIC_COLORS.primary.icon)} />}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
      {(actions || showNewButton) && (
        <div className="flex gap-2">
          {actions || (
            <Button onClick={onNuevo} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {newButtonLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
