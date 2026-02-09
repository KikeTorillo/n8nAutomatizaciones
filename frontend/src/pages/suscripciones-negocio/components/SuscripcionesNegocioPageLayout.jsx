import { createModuleLayout } from '@/components/ui/templates';
import SuscripcionesNegocioNavTabs from './SuscripcionesNegocioNavTabs';

export default createModuleLayout({
  moduleTitle: 'Suscripciones',
  moduleDescription: 'Gestión de planes y suscripciones de clientes',
  NavTabsComponent: SuscripcionesNegocioNavTabs,
});
