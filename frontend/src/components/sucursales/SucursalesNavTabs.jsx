import { Building2, LayoutDashboard, ArrowRightLeft } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Definicion de items de navegacion para Sucursales
 */
const NAV_ITEMS = [
  { id: 'sucursales', label: 'Sucursales', icon: Building2, path: '/sucursales' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/sucursales/dashboard' },
  { id: 'transferencias', label: 'Transferencias', icon: ArrowRightLeft, path: '/sucursales/transferencias' },
];

/**
 * SucursalesNavTabs - Navegacion principal del modulo Sucursales
 * Usa GenericNavTabs en modo flat
 */
export default function SucursalesNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/sucursales"
      fallbackLabel="Sucursales"
      fallbackIcon={Building2}
    />
  );
}
