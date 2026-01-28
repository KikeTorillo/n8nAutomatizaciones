import { memo } from 'react';
import {
  Building2,
  Users,
  Building,
  Settings,
  Store,
  Coins,
  Palette,
  UserCog,
  Shield,
  Lock,
  Network,
  Briefcase,
  CalendarDays,
  Boxes,
  Workflow,
} from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

/**
 * Definición de grupos de navegación para Configuración
 * Agrupa las secciones en 4 categorías lógicas
 */
const NAV_GROUPS = [
  {
    id: 'negocio',
    label: 'Negocio',
    icon: Building2,
    items: [
      { id: 'mi-negocio', label: 'Mi Negocio', icon: Store, path: '/configuracion/negocio' },
      { id: 'monedas', label: 'Monedas', icon: Coins, path: '/configuracion/monedas' },
      { id: 'apariencia', label: 'Apariencia', icon: Palette, path: '/configuracion/apariencia', disabled: true },
    ],
  },
  {
    id: 'equipo',
    label: 'Equipo',
    icon: Users,
    items: [
      { id: 'usuarios', label: 'Usuarios', icon: UserCog, path: '/configuracion/usuarios' },
      { id: 'roles', label: 'Roles', icon: Shield, path: '/configuracion/roles' },
      { id: 'permisos', label: 'Permisos', icon: Lock, path: '/configuracion/permisos' },
    ],
  },
  {
    id: 'organizacion',
    label: 'Organización',
    icon: Building,
    items: [
      { id: 'departamentos', label: 'Departamentos', icon: Network, path: '/configuracion/departamentos' },
      { id: 'puestos', label: 'Puestos', icon: Briefcase, path: '/configuracion/puestos' },
      { id: 'dias-festivos', label: 'Días Festivos', icon: CalendarDays, path: '/configuracion/dias-festivos' },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings,
    items: [
      { id: 'modulos', label: 'Módulos', icon: Boxes, path: '/configuracion/modulos' },
      { id: 'workflows', label: 'Workflows', icon: Workflow, path: '/configuracion/workflows' },
    ],
  },
];

/**
 * ConfiguracionNavTabs - Navegación principal del módulo Configuración
 * Usa GenericNavTabs en modo grouped (dropdowns)
 */
const ConfiguracionNavTabs = memo(function ConfiguracionNavTabs() {
  return (
    <GenericNavTabs
      groups={NAV_GROUPS}
      fallbackLabel="Configuración"
      fallbackIcon={Settings}
    />
  );
});

export default ConfiguracionNavTabs;
