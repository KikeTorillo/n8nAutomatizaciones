import { memo } from 'react';
import { cn } from '@/lib/utils';
import { BackButton } from '../../molecules/BackButton';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface FormHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  backTo?: string;
  backLabel?: string;
  className?: string;
}

const FormHeader = memo(function FormHeader({
  title,
  subtitle,
  icon: Icon,
  backTo,
  backLabel,
  className,
}: FormHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {backTo && (
        <div className="mb-4">
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}

      <div className="flex items-center gap-3">
        {Icon && (
          <div className={cn('flex-shrink-0 p-2 rounded-lg', SEMANTIC_COLORS.primary.bg)}>
            <Icon className={cn('w-6 h-6', SEMANTIC_COLORS.primary.icon)} />
          </div>
        )}

        <div>
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

FormHeader.displayName = 'FormHeader';

export { FormHeader };
