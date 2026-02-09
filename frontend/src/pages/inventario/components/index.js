/**
 * ====================================================================
 * COMPONENTES INVENTARIO - BARREL EXPORTS
 * ====================================================================
 *
 * Re-exports centralizados de componentes del modulo Inventario
 *
 * Ene 2026 - Refactorizacion Frontend
 * ====================================================================
 */

// Layout y Navegacion
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

// Tablas y Acciones
export { default as ProductoRowActions } from './ProductoRowActions';
export * from './ProductosColumns';
export { ReglaCard } from './ReglaCard';
export { default as ReglaForm } from './ReglaForm';

// Ordenes de Compra
export * from './OrdenesCompraColumns';
export { default as OrdenesCompraFilters } from './OrdenesCompraFilters';
export { default as OrdenesCompraStatsGrid } from './OrdenesCompraStatsGrid';
export * from './ConsignaColumns';

// Conteo Detalle
export { default as ConteoDetalleHeader } from './ConteoDetalleHeader';
export { default as ConteoDetalleBusqueda } from './ConteoDetalleBusqueda';
export { default as ConteoDetalleItemForm } from './ConteoDetalleItemForm';
export { default as ConteoDetalleResumen } from './ConteoDetalleResumen';
export { default as ConteoDetalleItems } from './ConteoDetalleItems';

// Reportes de Inventario
export { default as ReporteValorInventario } from './ReporteValorInventario';
export { default as ReporteValoracionFIFOAVCO } from './ReporteValoracionFIFOAVCO';
export { default as ReporteAnalisisABC } from './ReporteAnalisisABC';
export { default as ReporteRotacion } from './ReporteRotacion';
export { default as ReporteAlertas } from './ReporteAlertas';
