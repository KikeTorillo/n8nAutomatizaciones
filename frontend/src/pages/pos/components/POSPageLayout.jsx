import { createModuleLayout } from '@/components/ui/templates';
import POSNavTabs from './POSNavTabs';

const POSPageLayout = createModuleLayout({
  moduleTitle: 'Punto de Venta',
  moduleDescription: 'Ventas, promociones y cupones de descuento',
  NavTabsComponent: POSNavTabs,
});

export default POSPageLayout;
