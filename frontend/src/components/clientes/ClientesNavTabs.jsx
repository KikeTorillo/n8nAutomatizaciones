import { Users, Tag, TrendingUp } from 'lucide-react';
import GenericNavTabs from '@/components/ui/GenericNavTabs';

/**
 * Definición de items de navegación para Clientes
 */
const NAV_ITEMS = [
  { id: 'lista', label: 'Lista', icon: Users, path: '/clientes' },
  { id: 'etiquetas', label: 'Etiquetas', icon: Tag, path: '/clientes/etiquetas' },
  { id: 'oportunidades', label: 'Oportunidades', icon: TrendingUp, path: '/clientes/oportunidades' },
];

/**
 * ClientesNavTabs - Navegación principal del módulo Clientes
 * Usa GenericNavTabs en modo flat
 */
export default function ClientesNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/clientes"
      fallbackLabel="Clientes"
      fallbackIcon={Users}
    />
  );
}
