import { memo } from 'react';
import PropTypes from 'prop-types';
import { BasePageLayout } from './BasePageLayout';

/**
 * Factory para crear layouts de módulo
 *
 * Reduce la duplicación de código en ClientesPageLayout, InventarioPageLayout, etc.
 * Cada módulo solo necesita especificar su título, descripción y componente de navegación.
 *
 * @param {Object} config
 * @param {string} config.moduleTitle - Título del módulo (ej: "Clientes", "Inventario")
 * @param {string} config.moduleDescription - Descripción del módulo
 * @param {React.ComponentType} config.NavTabsComponent - Componente de navegación de tabs
 * @returns {React.ComponentType} Componente layout configurado
 *
 * @example
 * // En ClientesPageLayout.jsx
 * import { createModuleLayout } from '@/components/ui/templates/createModuleLayout';
 * import ClientesNavTabs from './ClientesNavTabs';
 *
 * export default createModuleLayout({
 *   moduleTitle: 'Clientes',
 *   moduleDescription: 'Gestiona tu base de clientes y relaciones comerciales',
 *   NavTabsComponent: ClientesNavTabs,
 * });
 */
export function createModuleLayout(config) {
  const { moduleTitle, moduleDescription, NavTabsComponent } = config;

  const ModuleLayout = memo(function ModuleLayout({
    icon,
    title,
    subtitle,
    actions,
    children,
    className,
    hideSectionHeader = false,
  }) {
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

  ModuleLayout.propTypes = {
    icon: PropTypes.elementType,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    actions: PropTypes.node,
    children: PropTypes.node,
    className: PropTypes.string,
    hideSectionHeader: PropTypes.bool,
  };

  return ModuleLayout;
}

export default createModuleLayout;
