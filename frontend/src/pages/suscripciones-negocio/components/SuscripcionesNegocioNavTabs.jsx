import { CreditCard, Package, Users, Tag, Receipt, BarChart3, Plug } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Definición de items de navegación para Suscripciones-Negocio
 */
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: CreditCard, path: '/suscripciones-negocio' },
  { id: 'planes', label: 'Planes', icon: Package, path: '/suscripciones-negocio/planes' },
  { id: 'suscripciones', label: 'Suscripciones', icon: Users, path: '/suscripciones-negocio/suscripciones' },
  { id: 'cupones', label: 'Cupones', icon: Tag, path: '/suscripciones-negocio/cupones' },
  { id: 'pagos', label: 'Pagos', icon: Receipt, path: '/suscripciones-negocio/pagos' },
  { id: 'metricas', label: 'Métricas', icon: BarChart3, path: '/suscripciones-negocio/metricas' },
  { id: 'conectores', label: 'Conectores', icon: Plug, path: '/suscripciones-negocio/conectores' },
];

/**
 * SuscripcionesNegocioNavTabs - Navegación principal del módulo Suscripciones-Negocio
 * Usa GenericNavTabs en modo flat
 */
export default function SuscripcionesNegocioNavTabs() {
  return (
    <GenericNavTabs
      items={NAV_ITEMS}
      defaultPath="/suscripciones-negocio"
      fallbackLabel="Suscripciones"
      fallbackIcon={CreditCard}
    />
  );
}
