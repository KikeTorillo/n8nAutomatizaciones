import { createModuleLayout } from '@/components/ui/templates';
import POSNavTabs from './POSNavTabs';

export default createModuleLayout({
  moduleTitle: 'Punto de Venta',
  moduleDescription: 'Ventas, promociones y cupones de descuento',
  NavTabsComponent: POSNavTabs,
});
