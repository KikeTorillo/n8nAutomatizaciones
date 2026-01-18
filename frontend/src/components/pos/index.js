/**
 * ====================================================================
 * COMPONENTES POS - BARREL EXPORTS
 * ====================================================================
 *
 * Re-exports centralizados de componentes del módulo POS
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

// Layouts
export { default as POSPageLayout } from './POSPageLayout';
export { default as POSHeader } from './POSHeader';
export { default as POSPageHeader } from './POSPageHeader';
export { default as POSNavTabs } from './POSNavTabs';

// Carrito y Productos
export { default as CarritoVenta } from './CarritoVenta';
export { default as ProductosGridPOS } from './ProductosGridPOS';
export { default as BuscadorProductosPOS } from './BuscadorProductosPOS';
export { default as POSProductsSection } from './POSProductsSection';
export { default as CategoriasPOS } from './CategoriasPOS';
export { default as ProductoSelectorInline } from './ProductoSelectorInline';

// Clientes
export { default as ClienteSelector } from './ClienteSelector';
export { default as PuntosCliente } from './PuntosCliente';

// Pagos y Caja
export { default as MetodoPagoModal } from './MetodoPagoModal';
export { default as AperturaCajaModal } from './AperturaCajaModal';
export { default as CierreCajaModal } from './CierreCajaModal';
export { default as MovimientosCajaDrawer } from './MovimientosCajaDrawer';
export { default as TecladoBilletes } from './TecladoBilletes';

// Ventas
export { default as VentaDetalleModal } from './VentaDetalleModal';
export { default as CancelarVentaModal } from './CancelarVentaModal';
export { default as DevolverItemsModal } from './DevolverItemsModal';

// Cupones
export { default as InputCupon } from './InputCupon';
export { default as CuponFormDrawer } from './CuponFormDrawer';
export { default as CuponStatsModal } from './CuponStatsModal';

// Promociones
export { default as PromocionFormDrawer } from './PromocionFormDrawer';
export { default as PromocionStatsModal } from './PromocionStatsModal';
export { default as PromocionesAplicadas } from './PromocionesAplicadas';
export { default as PromocionesIndicador } from './PromocionesIndicador';

// Lealtad
export { default as CanjePuntosModal } from './CanjePuntosModal';
export { default as NivelLealtadDrawer } from './NivelLealtadDrawer';

// Modales especiales
export { default as ModificadoresProductoModal } from './ModificadoresProductoModal';
export { default as SeleccionarNSModal } from './SeleccionarNSModal';
