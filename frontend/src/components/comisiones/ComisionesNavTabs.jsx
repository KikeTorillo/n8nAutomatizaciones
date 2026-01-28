import { LayoutDashboard, Settings, FileText } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Definición de items de navegación para Comisiones
 */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/comisiones' },
  { id: 'configuracion', label: 'Configuración', icon: Settings, path: '/comisiones/configuracion' },
  { id: 'reportes', label: 'Reportes', icon: FileText, path: '/comisiones/reportes' },
];

/**
 * ComisionesNavTabs - Navegación principal del módulo Comisiones
 * Usa GenericNavTabs en modo flat
 */
export default function ComisionesNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/comisiones"
      fallbackLabel="Comisiones"
      fallbackIcon={LayoutDashboard}
    />
  );
}
