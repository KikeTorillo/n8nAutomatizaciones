import { useLocation, useNavigate } from 'react-router-dom';
import { Package, FolderTree, Truck, ArrowLeftRight, AlertTriangle, BarChart3, ShoppingCart, Tag, MapPin, Hash, Route, ArrowRightLeft, Clock, ClipboardList, FileSpreadsheet, RefreshCw, Send, Handshake, Boxes, Layers } from 'lucide-react';

/**
 * Tabs de navegación para el módulo de Inventario
 * Permite navegar entre las diferentes secciones del módulo
 */
const tabs = [
  {
    id: 'productos',
    label: 'Productos',
    path: '/inventario/productos',
    icon: Package,
  },
  {
    id: 'categorias',
    label: 'Categorías',
    path: '/inventario/categorias',
    icon: FolderTree,
  },
  {
    id: 'proveedores',
    label: 'Proveedores',
    path: '/inventario/proveedores',
    icon: Truck,
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    path: '/inventario/movimientos',
    icon: ArrowLeftRight,
  },
  {
    id: 'conteos',
    label: 'Conteos',
    path: '/inventario/conteos',
    icon: ClipboardList,
  },
  {
    id: 'ajustes-masivos',
    label: 'Ajustes CSV',
    path: '/inventario/ajustes-masivos',
    icon: FileSpreadsheet,
  },
  {
    id: 'ordenes-compra',
    label: 'Órdenes Compra',
    path: '/inventario/ordenes-compra',
    icon: ShoppingCart,
  },
  {
    id: 'reorden',
    label: 'Reorden',
    path: '/inventario/reorden',
    icon: RefreshCw,
  },
  {
    id: 'dropship',
    label: 'Dropship',
    path: '/inventario/dropship',
    icon: Send,
  },
  {
    id: 'consigna',
    label: 'Consigna',
    path: '/inventario/consigna',
    icon: Handshake,
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    path: '/inventario/operaciones',
    icon: Boxes,
  },
  {
    id: 'batch-picking',
    label: 'Wave Pick',
    path: '/inventario/batch-picking',
    icon: Layers,
  },
  {
    id: 'alertas',
    label: 'Alertas',
    path: '/inventario/alertas',
    icon: AlertTriangle,
  },
  {
    id: 'reportes',
    label: 'Reportes',
    path: '/inventario/reportes',
    icon: BarChart3,
  },
  {
    id: 'listas-precios',
    label: 'Listas Precios',
    path: '/inventario/listas-precios',
    icon: Tag,
  },
  {
    id: 'ubicaciones',
    label: 'Ubicaciones',
    path: '/inventario/ubicaciones',
    icon: MapPin,
  },
  {
    id: 'numeros-serie',
    label: 'NS/Lotes',
    path: '/inventario/numeros-serie',
    icon: Hash,
  },
  {
    id: 'rutas-operacion',
    label: 'Rutas',
    path: '/inventario/rutas-operacion',
    icon: Route,
  },
  {
    id: 'historico',
    label: 'Histórico',
    path: '/inventario/historico',
    icon: Clock,
  },
  {
    id: 'transferencias',
    label: 'Transferencias',
    path: '/sucursales/transferencias',
    icon: ArrowRightLeft,
  },
];

export default function InventarioNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    // Match exact path or sub-paths (e.g., /sucursales/transferencias/123)
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`
              flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap
              border-b-2 -mb-[1px]
              ${active
                ? 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400 bg-white dark:bg-gray-900'
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
