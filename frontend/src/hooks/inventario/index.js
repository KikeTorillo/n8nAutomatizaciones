/**
 * Hooks de Inventario
 * Re-exports centralizados para el módulo de inventario
 */

export * from './useInventario';
export * from './useProductos';
export * from './useNumerosSerie';
export * from './useVariantes';
export * from './useAtributos';
export * from './useCategorias';
export * from './useProveedores';
export * from './useOrdenesCompra';
export * from './useValoracion';
export * from './useUbicacionesAlmacen';
export * from './useConteos';
export * from './useAjustesMasivos';
export * from './useLandedCosts';
export * from './useInventoryAtDate';

// Aliases para compatibilidad con código que usaba nombres de useInventario.js
// (los hooks de ubicaciones fueron consolidados en useUbicacionesAlmacen.js)
export {
  useUbicacionesAlmacen as useUbicaciones,
  useUbicacionAlmacen as useUbicacion,
} from './useUbicacionesAlmacen';
