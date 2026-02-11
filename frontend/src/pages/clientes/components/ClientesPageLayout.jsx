import { createModuleLayout } from '@nexo2/ui/templates';
import ClientesNavTabs from './ClientesNavTabs';

/**
 * ClientesPageLayout - Layout wrapper para todas las páginas del módulo Clientes
 *
 * Usa el factory createModuleLayout para generar el layout con la configuración específica.
 *
 * Props aceptadas:
 * @param {React.ComponentType} icon - Icono lucide-react para la sección
 * @param {string} title - Título de la sección
 * @param {string} [subtitle] - Subtítulo o contador
 * @param {React.ReactNode} [actions] - Botones de acción
 * @param {React.ReactNode} children - Contenido principal
 * @param {string} [className] - Clases adicionales
 */
const ClientesPageLayout = createModuleLayout({
  moduleTitle: 'Clientes',
  moduleDescription: 'Gestiona tu base de clientes y relaciones comerciales',
  NavTabsComponent: ClientesNavTabs,
});

export default ClientesPageLayout;
