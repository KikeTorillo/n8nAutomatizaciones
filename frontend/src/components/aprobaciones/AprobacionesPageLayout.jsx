import { createModuleLayout } from '@/components/ui/templates/createModuleLayout';
import AprobacionesNavTabs from './AprobacionesNavTabs';

/**
 * AprobacionesPageLayout - Layout wrapper para todas las páginas del módulo Aprobaciones
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
export default createModuleLayout({
  moduleTitle: 'Aprobaciones',
  moduleDescription: 'Solicitudes pendientes de aprobación',
  NavTabsComponent: AprobacionesNavTabs,
});
