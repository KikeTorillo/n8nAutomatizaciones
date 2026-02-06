import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DetailHeader } from './DetailHeader';
import { DetailLoadingState } from './DetailLoadingState';
import { DetailNotFoundState } from './DetailNotFoundState';
import StateNavTabs from '../../organisms/state-nav-tabs';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface BadgeItem {
  label: string;
  variant?: string;
}

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface NotFoundConfig {
  title?: string;
  description?: string;
  backLabel?: string;
}

interface BaseDetailLayoutProps {
  backTo?: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badges?: BadgeItem[];
  actions?: ReactNode;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  beforeTabs?: ReactNode;
  children?: ReactNode;
  isLoading?: boolean;
  error?: { response?: { status?: number }; message?: string } | null;
  notFound?: boolean;
  notFoundConfig?: NotFoundConfig;
  className?: string;
}

const BaseDetailLayout = memo(function BaseDetailLayout({
  backTo,
  backLabel,
  title,
  subtitle,
  icon,
  badges = [],
  actions,
  tabs = [],
  activeTab,
  onTabChange,
  beforeTabs,
  children,
  isLoading = false,
  error,
  notFound = false,
  notFoundConfig = {},
  className,
}: BaseDetailLayoutProps) {
  // Estado de carga
  if (isLoading) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        {backTo && (
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        )}
        <DetailLoadingState />
      </div>
    );
  }

  // Estado no encontrado
  if (notFound || error?.response?.status === 404) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        <DetailNotFoundState config={{ backTo, ...notFoundConfig }} />
      </div>
    );
  }

  // Estado de error generico
  if (error) {
    return (
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        <DetailNotFoundState
          config={{
            title: 'Error',
            description: error.message || 'Ocurrio un error al cargar los datos.',
            backTo,
            ...notFoundConfig,
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      {/* Header */}
      <DetailHeader
        backTo={backTo}
        backLabel={backLabel}
        title={title}
        subtitle={subtitle}
        icon={icon}
        badges={badges}
        actions={actions}
      />

      {/* Before tabs content */}
      {beforeTabs}

      {/* Tabs */}
      {tabs.length > 0 && activeTab && onTabChange && (
        <div className="mb-6">
          <StateNavTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            sticky={false}
          />
        </div>
      )}

      {/* Main content */}
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
});

BaseDetailLayout.displayName = 'BaseDetailLayout';

export { BaseDetailLayout };
