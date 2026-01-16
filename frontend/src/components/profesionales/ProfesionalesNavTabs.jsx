import { Users, Network, ClipboardList } from 'lucide-react';
import GenericNavTabs from '@/components/ui/GenericNavTabs';

/**
 * Definición de items de navegación para Profesionales
 */
const NAV_ITEMS = [
  { id: 'lista', label: 'Lista', icon: Users, path: '/profesionales' },
  { id: 'organigrama', label: 'Organigrama', icon: Network, path: '/profesionales/organigrama' },
  { id: 'onboarding', label: 'Onboarding', icon: ClipboardList, path: '/onboarding-empleados' },
];

/**
 * ProfesionalesNavTabs - Navegación principal del módulo Profesionales
 * Usa GenericNavTabs en modo flat
 */
export default function ProfesionalesNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/profesionales"
      fallbackLabel="Profesionales"
      fallbackIcon={Users}
    />
  );
}
