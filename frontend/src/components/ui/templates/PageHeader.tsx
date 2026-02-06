import { memo } from 'react';
import { cn } from '@/lib/utils';
import { BackButton } from '../molecules/BackButton';
import { Badge } from '../atoms/Badge';
import { PAGE_HEADER_STYLES, getPageHeaderIconColor } from '@/lib/uiConstants/pageHeader';
import type { BadgeVariantWithAliases } from '@/types/ui';

type LucideIcon = React.ComponentType<{ className?: string }>;
type PageHeaderIconColor = 'primary' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'yellow' | 'cyan' | 'neutral';

interface BadgeItem {
  label: string;
  variant?: string;
}

interface MetadataItem {
  icon?: LucideIcon;
  label: string;
}

interface PageHeaderProps {
  backTo?: string;
  backLabel?: string;
  icon?: LucideIcon;
  iconColor?: PageHeaderIconColor;
  title: string;
  subtitle?: string;
  badges?: BadgeItem[];
  metadata?: MetadataItem[];
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader = memo(function PageHeader({
  backTo,
  backLabel,
  icon: Icon,
  iconColor = 'primary',
  title,
  subtitle,
  badges = [],
  metadata = [],
  actions,
  className,
}: PageHeaderProps) {
  const iconColors = getPageHeaderIconColor(iconColor) as { bg: string; icon: string };

  return (
    <div className={cn(PAGE_HEADER_STYLES.container, className)}>
      {/* Back button */}
      {backTo && (
        <div className={PAGE_HEADER_STYLES.backButton}>
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}

      {/* Title row */}
      <div className={PAGE_HEADER_STYLES.titleRow}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          {Icon && (
            <div className={cn(PAGE_HEADER_STYLES.iconWrapper, iconColors.bg)}>
              <Icon className={cn('w-6 h-6', iconColors.icon)} />
            </div>
          )}

          {/* Title content */}
          <div className={PAGE_HEADER_STYLES.titleContainer}>
            {/* Title + Badges row */}
            <div className={PAGE_HEADER_STYLES.titleBadgeRow}>
              {title && (
                <h1 className={cn(PAGE_HEADER_STYLES.title, 'truncate')}>
                  {title}
                </h1>
              )}

              {badges.map((badge, idx) => (
                <Badge key={idx} variant={(badge.variant || 'default') as BadgeVariantWithAliases}>
                  {badge.label}
                </Badge>
              ))}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className={PAGE_HEADER_STYLES.subtitle}>
                {subtitle}
              </p>
            )}

            {/* Metadata */}
            {metadata.length > 0 && (
              <div className={PAGE_HEADER_STYLES.metadataContainer}>
                {metadata.map((item, idx) => {
                  const MetaIcon = item.icon;
                  return (
                    <span key={idx} className={PAGE_HEADER_STYLES.metadataItem}>
                      {MetaIcon && (
                        <MetaIcon className={PAGE_HEADER_STYLES.metadataIcon} />
                      )}
                      {item.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className={PAGE_HEADER_STYLES.actionsContainer}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});

PageHeader.displayName = 'PageHeader';

export { PageHeader };
export type { PageHeaderProps, PageHeaderIconColor, BadgeItem, MetadataItem };
