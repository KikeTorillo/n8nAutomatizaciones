import { LayoutDashboard, Store, Palette } from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Definición de items de navegación para Super Admin
 *
 * Dashboard ahora incluye el listado de organizaciones consolidado
 * Planes se accede desde Home → Suscripciones
 */
const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/superadmin' },
    { id: 'marketplace', label: 'Marketplace', icon: Store, path: '/superadmin/marketplace' },
    { id: 'plantillas', label: 'Plantillas', icon: Palette, path: '/superadmin/plantillas-eventos' },
];

/**
 * SuperAdminNavTabs - Navegación principal del panel Super Admin
 * Usa GenericNavTabs en modo flat
 */
export default function SuperAdminNavTabs() {
    return (
        <GenericNavTabs
            items={NAV_ITEMS}
            defaultPath="/superadmin"
            fallbackLabel="Super Admin"
            fallbackIcon={LayoutDashboard}
        />
    );
}
