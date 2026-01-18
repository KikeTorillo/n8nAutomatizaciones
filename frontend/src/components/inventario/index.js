/**
 * ====================================================================
 * COMPONENTES INVENTARIO - BARREL EXPORTS
 * ====================================================================
 *
 * Re-exports centralizados de componentes del módulo Inventario
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

// Layout y Navegación
export { default as InventarioPageLayout } from './InventarioPageLayout';
export { default as InventarioNavTabs } from './InventarioNavTabs';

// Formularios Drawer
export { default as ProductoFormDrawer } from './ProductoFormDrawer';
export { default as CategoriaFormDrawer } from './CategoriaFormDrawer';
export { default as ProveedorFormDrawer } from './ProveedorFormDrawer';
export { default as ComboFormDrawer } from './ComboFormDrawer';

// Modales
export { default as KardexModal } from './KardexModal';
export { default as AjustarStockModal } from './AjustarStockModal';
export { default as BulkProductosModal } from './BulkProductosModal';
export { default as GenerarEtiquetaModal } from './GenerarEtiquetaModal';
export { default as GenerarEtiquetaGS1Modal } from './GenerarEtiquetaGS1Modal';

// Widgets
export { default as AlertasWidget } from './AlertasWidget';
