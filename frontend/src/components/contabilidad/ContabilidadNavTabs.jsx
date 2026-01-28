import { LayoutDashboard, BookOpen, FileSpreadsheet, Settings, BarChart3 } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Definición de items de navegación para Contabilidad
 */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/contabilidad' },
  { id: 'cuentas', label: 'Catálogo', icon: BookOpen, path: '/contabilidad/cuentas' },
  { id: 'asientos', label: 'Asientos', icon: FileSpreadsheet, path: '/contabilidad/asientos' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, path: '/contabilidad/reportes' },
  { id: 'configuracion', label: 'Configuración', icon: Settings, path: '/contabilidad/configuracion' },
];

/**
 * ContabilidadNavTabs - Navegación principal del módulo Contabilidad
 * Usa GenericNavTabs en modo flat
 */
export default function ContabilidadNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/contabilidad"
      fallbackLabel="Contabilidad"
      fallbackIcon={LayoutDashboard}
    />
  );
}
