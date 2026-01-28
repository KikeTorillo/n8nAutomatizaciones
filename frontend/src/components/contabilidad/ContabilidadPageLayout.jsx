import { createModuleLayout } from '@/components/ui/templates/createModuleLayout';
import ContabilidadNavTabs from './ContabilidadNavTabs';

/**
 * ContabilidadPageLayout - Layout wrapper para todas las páginas del módulo Contabilidad
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
  moduleTitle: 'Contabilidad',
  moduleDescription: 'Gestión contable con catálogo SAT México',
  NavTabsComponent: ContabilidadNavTabs,
});
