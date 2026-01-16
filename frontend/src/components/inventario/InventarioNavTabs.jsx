import {
  Package, FolderTree, Truck, ArrowLeftRight, AlertTriangle, BarChart3,
  ShoppingCart, Tag, MapPin, Hash, Route, ArrowRightLeft, Clock,
  ClipboardList, FileSpreadsheet, RefreshCw, Send, Handshake, Boxes, Layers,
} from 'lucide-react';
import { GenericNavTabs } from '@/components/ui';

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
 * InventarioNavTabs - Navegación principal del módulo Inventario
 * Usa GenericNavTabs en modo grouped (dropdowns)
 */
export default function InventarioNavTabs() {
  return (
    <GenericNavTabs
      groups={NAV_GROUPS}
      fallbackLabel="Inventario"
      fallbackIcon={Package}
    />
  );
}
