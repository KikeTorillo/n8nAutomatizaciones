import { ShoppingCart, History, Calculator, BarChart3, Sparkles, Ticket, Gift } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Tabs de navegación para el módulo POS
 * Permite navegar entre las diferentes secciones del Punto de Venta
 *
 * Usa GenericNavTabs en modo flat (items simples):
 * - Desktop: tabs horizontales
 * - Mobile: dropdown selector
 */
const NAV_ITEMS = [
  {
    id: 'nueva-venta',
    label: 'Nueva Venta',
    path: '/pos/venta',
    icon: ShoppingCart,
  },
  {
    id: 'historial',
    label: 'Historial',
    path: '/pos/ventas',
    icon: History,
  },
  {
    id: 'promociones',
    label: 'Promociones',
    path: '/pos/promociones',
    icon: Sparkles,
  },
  {
    id: 'cupones',
    label: 'Cupones',
    path: '/pos/cupones',
    icon: Ticket,
  },
  {
    id: 'lealtad',
    label: 'Lealtad',
    path: '/pos/lealtad',
    icon: Gift,
  },
  {
    id: 'corte-caja',
    label: 'Corte',
    path: '/pos/corte-caja',
    icon: Calculator,
  },
  {
    id: 'reportes',
    label: 'Reportes',
    path: '/pos/reportes',
    icon: BarChart3,
  },
];

export default function POSNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/pos"
      fallbackLabel="Punto de Venta"
      fallbackIcon={ShoppingCart}
    />
  );
}
