import { Clock, History } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Definición de items de navegación para Aprobaciones
 */
const NAV_ITEMS = [
  { id: 'pendientes', label: 'Pendientes', icon: Clock, path: '/aprobaciones' },
  {
    id: 'historial',
    label: 'Historial',
    icon: History,
    path: '/aprobaciones/historial',
  },
];

/**
 * AprobacionesNavTabs - Navegación principal del módulo Aprobaciones
 * Usa GenericNavTabs en modo flat
 */
export default function AprobacionesNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/aprobaciones"
      fallbackLabel="Aprobaciones"
      fallbackIcon={Clock}
    />
  );
}
