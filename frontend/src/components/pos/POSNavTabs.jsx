import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, History, Calculator, BarChart3 } from 'lucide-react';

/**
 * Tabs de navegación para el módulo POS
 * Permite navegar entre las diferentes secciones del Punto de Venta
 */
const tabs = [
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
    id: 'corte-caja',
    label: 'Corte de Caja',
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
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              border-b-2 -mb-[1px]
              ${active
                ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400 bg-white dark:bg-gray-800'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
