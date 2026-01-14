import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Package, FolderTree, Truck, ArrowLeftRight, AlertTriangle, BarChart3,
  ShoppingCart, Tag, MapPin, Hash, Route, ArrowRightLeft, Clock,
  ClipboardList, FileSpreadsheet, RefreshCw, Send, Handshake, Boxes, Layers,
  ChevronDown, Check, PackagePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NavDropdown from '@/components/ui/NavDropdown';

/**
 * Definición de grupos de navegación para Inventario
 * Agrupa los 20 submódulos en 5 categorías lógicas
 */
const NAV_GROUPS = [
  {
    id: 'catalogo',
    label: 'Catálogo',
    icon: Package,
    items: [
      { id: 'productos', label: 'Productos', icon: Package, path: '/inventario/productos' },
      { id: 'categorias', label: 'Categorías', icon: FolderTree, path: '/inventario/categorias' },
      { id: 'combos', label: 'Combos/Kits', icon: Layers, path: '/inventario/combos' },
      { id: 'proveedores', label: 'Proveedores', icon: Truck, path: '/inventario/proveedores' },
    ],
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    icon: ArrowLeftRight,
    items: [
      { id: 'movimientos', label: 'Kardex', icon: ArrowLeftRight, path: '/inventario/movimientos' },
      { id: 'ajustes-masivos', label: 'Ajustes CSV', icon: FileSpreadsheet, path: '/inventario/ajustes-masivos' },
      { id: 'transferencias', label: 'Transferencias', icon: ArrowRightLeft, path: '/sucursales/transferencias' },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: ClipboardList,
    items: [
      { id: 'ordenes-compra', label: 'Órdenes Compra', icon: ShoppingCart, path: '/inventario/ordenes-compra' },
      { id: 'conteos', label: 'Conteos', icon: ClipboardList, path: '/inventario/conteos' },
      { id: 'reorden', label: 'Reorden', icon: RefreshCw, path: '/inventario/reorden' },
      { id: 'operaciones', label: 'Picking', icon: Boxes, path: '/inventario/operaciones' },
      { id: 'batch-picking', label: 'Wave Pick', icon: Layers, path: '/inventario/batch-picking' },
    ],
  },
  {
    id: 'almacen',
    label: 'Almacén',
    icon: MapPin,
    items: [
      { id: 'ubicaciones', label: 'Ubicaciones', icon: MapPin, path: '/inventario/ubicaciones' },
      { id: 'numeros-serie', label: 'NS/Lotes', icon: Hash, path: '/inventario/numeros-serie' },
      { id: 'rutas-operacion', label: 'Rutas', icon: Route, path: '/inventario/rutas-operacion' },
      { id: 'consigna', label: 'Consigna', icon: Handshake, path: '/inventario/consigna' },
      { id: 'dropship', label: 'Dropship', icon: Send, path: '/inventario/dropship' },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    items: [
      { id: 'reportes', label: 'Valoración', icon: BarChart3, path: '/inventario/reportes' },
      { id: 'alertas', label: 'Alertas', icon: AlertTriangle, path: '/inventario/alertas' },
      { id: 'historico', label: 'Histórico', icon: Clock, path: '/inventario/historico' },
      { id: 'listas-precios', label: 'Listas Precios', icon: Tag, path: '/inventario/listas-precios' },
    ],
  },
];

/**
 * Encuentra el grupo e item activo basado en la ruta actual
 */
function getActiveInfo(pathname) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.path || pathname.startsWith(item.path + '/')) {
        return { groupId: group.id, itemId: item.id };
      }
    }
  }
  return { groupId: null, itemId: null };
}

/**
 * Selector móvil - Un único dropdown con todos los items agrupados
 */
function MobileNavSelector({ groups, activeGroupId, activeItemId }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Encontrar el item activo para mostrar en el botón
  const activeItem = groups
    .flatMap(g => g.items)
    .find(item => item.id === activeItemId);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleItemClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
          'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
          'text-gray-900 dark:text-gray-100'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-2">
          {activeGroup && <activeGroup.icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
          <span className="text-gray-500 dark:text-gray-400">
            {activeGroup?.label || 'Inventario'}
          </span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
          {activeItem && (
            <>
              <span className="text-gray-900 dark:text-gray-100">{activeItem.label}</span>
            </>
          )}
        </div>
        <ChevronDown className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[70vh] overflow-y-auto"
          role="menu"
        >
          {groups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.id}>
                {/* Header del grupo */}
                <div className="px-4 py-2 flex items-center gap-2">
                  <GroupIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                {/* Items del grupo */}
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isItemActive = item.id === activeItemId;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 pl-10 py-2.5 text-sm text-left transition-colors',
                        isItemActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                      role="menuitem"
                    >
                      <ItemIcon className={cn('h-4 w-4', isItemActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400')} />
                      <span className="flex-1">{item.label}</span>
                      {isItemActive && <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * InventarioNavTabs - Navegación principal del módulo Inventario
 * Desktop: 5 dropdowns con grupos
 * Mobile: 1 selector único con todos los items
 */
export default function InventarioNavTabs() {
  const location = useLocation();
  const { groupId, itemId } = getActiveInfo(location.pathname);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Desktop: Grupos horizontales con dropdowns */}
      <div className="hidden md:flex items-center gap-1 px-4 py-2">
        {NAV_GROUPS.map((group) => (
          <NavDropdown
            key={group.id}
            label={group.label}
            icon={group.icon}
            items={group.items}
            isActive={group.id === groupId}
            activeItemId={itemId}
          />
        ))}
      </div>

      {/* Mobile: Selector único */}
      <div className="md:hidden px-4 py-2">
        <MobileNavSelector
          groups={NAV_GROUPS}
          activeGroupId={groupId}
          activeItemId={itemId}
        />
      </div>
    </nav>
  );
}
