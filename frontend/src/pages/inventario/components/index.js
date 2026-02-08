/**
 * Componentes auxiliares para páginas de Inventario
 */

export { default as ProductoRowActions } from './ProductoRowActions';
export * from './ProductosColumns';
export { ReglaCard } from './ReglaCard';
export { default as ReglaForm } from './ReglaForm';

// Órdenes de Compra
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
