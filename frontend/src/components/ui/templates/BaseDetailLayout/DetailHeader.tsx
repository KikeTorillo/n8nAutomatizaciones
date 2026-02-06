import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BackButton } from '../../molecules/BackButton';
import { Badge } from '../../atoms/Badge';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';
import type { BadgeVariantWithAliases } from '@/types/ui';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface BadgeItem {
  label: string;
  variant?: string;
}

interface DetailHeaderProps {
  backTo?: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badges?: BadgeItem[];
  actions?: ReactNode;
  className?: string;
}

const DetailHeader = memo(function DetailHeader({
  backTo,
  backLabel,
  title,
  subtitle,
  icon: Icon,
  badges = [],
  actions,
  className,
}: DetailHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {/* Back button */}
      {backTo && (
        <div className="mb-4">
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className={cn('flex-shrink-0 p-2 rounded-lg', SEMANTIC_COLORS.primary.bg)}>
              <Icon className={cn('w-6 h-6', SEMANTIC_COLORS.primary.icon)} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                  {title}
                </h1>
              )}

              {badges.map((badge, idx) => (
                <Badge key={idx} variant={(badge.variant || 'default') as BadgeVariantWithAliases}>
                  {badge.label}
                </Badge>
              ))}
            </div>

            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

DetailHeader.displayName = 'DetailHeader';

export { DetailHeader };
