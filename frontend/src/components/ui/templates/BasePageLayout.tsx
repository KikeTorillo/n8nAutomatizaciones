import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BackButton } from '../molecules/BackButton';
import { SEMANTIC_COLORS } from '@/lib/uiConstants';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface BasePageLayoutProps {
  moduleTitle: string;
  moduleDescription: string;
  backTo?: string;
  backLabel?: string;
  navTabs?: ReactNode;
  sectionIcon?: LucideIcon;
  sectionTitle?: string;
  sectionSubtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  hideSectionHeader?: boolean;
}

const BasePageLayout = memo(function BasePageLayout({
  moduleTitle,
  moduleDescription,
  backTo = '/home',
  backLabel = 'Volver al Inicio',
  navTabs,
  sectionIcon: Icon,
  sectionTitle,
  sectionSubtitle,
  actions,
  children,
  className,
  hideSectionHeader = false,
}: BasePageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header fijo del modulo */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <BackButton to={backTo} label={backLabel} className="mb-3" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{moduleTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{moduleDescription}</p>
      </div>

      {/* NavTabs del modulo */}
      {navTabs}

      {/* Container principal */}
      <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
        {/* Header de seccion - Mobile First */}
        {!hideSectionHeader && sectionTitle && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                {Icon && (
                  <Icon className={cn('h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0', SEMANTIC_COLORS.primary.icon)} />
                )}
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {sectionTitle}
                  </h2>
                  {sectionSubtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{sectionSubtitle}</p>
                  )}
                </div>
              </div>
              {actions && <div className="flex gap-2 sm:gap-3">{actions}</div>}
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {children}
      </div>
    </div>
  );
});

BasePageLayout.displayName = 'BasePageLayout';

export { BasePageLayout };
export default BasePageLayout;
