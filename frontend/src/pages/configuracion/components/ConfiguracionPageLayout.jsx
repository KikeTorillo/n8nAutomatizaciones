import { createModuleLayout } from '@/components/ui/templates';
import ConfiguracionNavTabs from './ConfiguracionNavTabs';

/**
 * ConfiguracionPageLayout - Layout unificado para todas las páginas de Configuración
 *
 * Usa createModuleLayout para mantener consistencia con otros módulos como
 * Inventario, Contabilidad y Sucursales.
 *
 * @example
 * <ConfiguracionPageLayout
 *   icon={Users}
 *   title="Usuarios"
 *   subtitle="Gestiona el acceso al sistema"
 *   actions={<Button>Nuevo</Button>}
 * >
 *   {contenido}
 * </ConfiguracionPageLayout>
 */
const ConfiguracionPageLayout = createModuleLayout({
  moduleTitle: 'Configuración',
  moduleDescription: 'Personaliza tu negocio y preferencias del sistema',
  NavTabsComponent: ConfiguracionNavTabs,
});

export default ConfiguracionPageLayout;
