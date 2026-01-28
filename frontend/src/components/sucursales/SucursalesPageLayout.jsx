import { createModuleLayout } from '@/components/ui/templates/createModuleLayout';
import SucursalesNavTabs from './SucursalesNavTabs';

/**
 * SucursalesPageLayout - Layout wrapper para todas las paginas del modulo Sucursales
 *
 * Usa el factory createModuleLayout para generar el layout con la configuracion especifica.
 *
 * Props aceptadas:
 * @param {React.ComponentType} icon - Icono lucide-react para la seccion
 * @param {string} title - Titulo de la seccion
 * @param {string} [subtitle] - Subtitulo o contador
 * @param {React.ReactNode} [actions] - Botones de accion
 * @param {React.ReactNode} children - Contenido principal
 * @param {string} [className] - Clases adicionales
 */
export default createModuleLayout({
  moduleTitle: 'Sucursales',
  moduleDescription: 'Gestiona las sucursales de tu negocio',
  NavTabsComponent: SucursalesNavTabs,
});
