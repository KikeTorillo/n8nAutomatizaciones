import { memo, type ReactNode } from 'react';
import { BasePageLayout } from './BasePageLayout';

type LucideIcon = React.ComponentType<{ className?: string }>;

interface ModuleLayoutConfig {
  moduleTitle: string;
  moduleDescription: string;
  NavTabsComponent: React.ComponentType;
}

interface ModuleLayoutProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  hideSectionHeader?: boolean;
}

export function createModuleLayout(config: ModuleLayoutConfig) {
  const { moduleTitle, moduleDescription, NavTabsComponent } = config;

  const ModuleLayout = memo(function ModuleLayout({
    icon,
    title,
    subtitle,
    actions,
    children,
    className,
    hideSectionHeader = false,
  }: ModuleLayoutProps) {
    return (
      <BasePageLayout
        moduleTitle={moduleTitle}
        moduleDescription={moduleDescription}
        navTabs={<NavTabsComponent />}
        sectionIcon={icon}
        sectionTitle={title}
        sectionSubtitle={subtitle}
        actions={actions}
        className={className}
        hideSectionHeader={hideSectionHeader}
      >
        {children}
      </BasePageLayout>
    );
  });

  ModuleLayout.displayName = `${moduleTitle.replace(/\s/g, '')}PageLayout`;

  return ModuleLayout;
}

export default createModuleLayout;
