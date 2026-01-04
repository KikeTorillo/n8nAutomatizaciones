import { Pencil } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Card de información editable
 * Muestra un grupo de campos con título, icono y botón de edición
 */
function InfoCard({
  title,
  icon: Icon,
  children,
  onEdit,
  className = '',
  headerActions,
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

export default InfoCard;
