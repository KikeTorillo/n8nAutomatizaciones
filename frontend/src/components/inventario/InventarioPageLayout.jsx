import { createModuleLayout } from '@/components/ui/templates';
import InventarioNavTabs from './InventarioNavTabs';

export default createModuleLayout({
  moduleTitle: 'Inventario',
  moduleDescription: 'Gestiona productos, proveedores y stock',
  NavTabsComponent: InventarioNavTabs,
});
