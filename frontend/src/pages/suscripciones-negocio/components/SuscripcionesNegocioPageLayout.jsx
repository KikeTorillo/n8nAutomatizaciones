import { createModuleLayout } from '@/components/ui/templates';
import SuscripcionesNegocioNavTabs from './SuscripcionesNegocioNavTabs';

const SuscripcionesNegocioPageLayout = createModuleLayout({
  moduleTitle: 'Suscripciones',
  moduleDescription: 'Gestión de planes y suscripciones de clientes',
  NavTabsComponent: SuscripcionesNegocioNavTabs,
});

export default SuscripcionesNegocioPageLayout;
