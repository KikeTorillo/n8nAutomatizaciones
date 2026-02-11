import { createModuleLayout } from '@/components/ui/templates';
import InventarioNavTabs from './InventarioNavTabs';

const InventarioPageLayout = createModuleLayout({
  moduleTitle: 'Inventario',
  moduleDescription: 'Gestiona productos, proveedores y stock',
  NavTabsComponent: InventarioNavTabs,
});

export default InventarioPageLayout;
