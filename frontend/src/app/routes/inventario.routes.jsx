/**
 * Rutas de Inventario
 * Incluye productos, categorías, proveedores, órdenes de compra, almacén, etc.
 */

import { lazy } from 'react';
import { protectedRoute, ROLES } from './helpers/routeHelpers';

// Productos y Catálogos
const ProductosPage = lazy(() => import('@/pages/inventario/ProductosPage'));
const CategoriasPage = lazy(() => import('@/pages/inventario/CategoriasPage'));
const ProveedoresPage = lazy(() => import('@/pages/inventario/ProveedoresPage'));
const CombosPage = lazy(() => import('@/pages/inventario/CombosPage'));

// Movimientos e Inventario
const MovimientosPage = lazy(() => import('@/pages/inventario/MovimientosPage'));
const AlertasPage = lazy(() => import('@/pages/inventario/AlertasPage'));
const ReportesInventarioPage = lazy(() => import('@/pages/inventario/ReportesInventarioPage'));
const InventarioHistoricoPage = lazy(() => import('@/pages/inventario/InventarioHistoricoPage'));

// Órdenes de Compra
const OrdenesCompraPage = lazy(() => import('@/pages/inventario/OrdenesCompraPage'));

// Ubicaciones y Almacén (WMS)
const UbicacionesAlmacenPage = lazy(() => import('@/pages/inventario/UbicacionesAlmacenPage'));
const ConfiguracionAlmacenPage = lazy(() => import('@/pages/inventario/ConfiguracionAlmacenPage'));

// Series y Lotes
const NumerosSeriesPage = lazy(() => import('@/pages/inventario/NumerosSeriesPage'));

// Rutas de Operación
const RutasOperacionPage = lazy(() => import('@/pages/inventario/RutasOperacionPage'));

// Conteos e Inventario Físico
const ConteosPage = lazy(() => import('@/pages/inventario/ConteosPage'));
const ConteoDetallePage = lazy(() => import('@/pages/inventario/ConteoDetallePage'));
const AjustesMasivosPage = lazy(() => import('@/pages/inventario/AjustesMasivosPage'));
const AjusteMasivoDetallePage = lazy(() => import('@/pages/inventario/AjusteMasivoDetallePage'));

// Reorden Automático
const ReordenPage = lazy(() => import('@/pages/inventario/ReordenPage'));
const ReglasReordenPage = lazy(() => import('@/pages/inventario/ReglasReordenPage'));

// Dropship y Consigna
const DropshipPage = lazy(() => import('@/pages/inventario/DropshipPage'));
const ConsignaPage = lazy(() => import('@/pages/inventario/ConsignaPage'));

// Operaciones de Almacén
const OperacionesAlmacenPage = lazy(() => import('@/pages/inventario/OperacionesAlmacenPage'));
const BatchPickingPage = lazy(() => import('@/pages/inventario/BatchPickingPage'));

// Precios
const ListasPreciosPage = lazy(() => import('@/pages/precios/ListasPreciosPage'));

export const inventarioRoutes = [
  // Productos y Catálogos
  protectedRoute('inventario/productos', ProductosPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/categorias', CategoriasPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/proveedores', ProveedoresPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/combos', CombosPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),

  // Movimientos e Inventario
  protectedRoute('inventario/movimientos', MovimientosPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/alertas', AlertasPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/reportes', ReportesInventarioPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),
  protectedRoute('inventario/historico', InventarioHistoricoPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),

  // Órdenes de Compra
  protectedRoute('inventario/ordenes-compra', OrdenesCompraPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),

  // Ubicaciones y Almacén (WMS)
  protectedRoute('inventario/ubicaciones', UbicacionesAlmacenPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/configuracion-almacen', ConfiguracionAlmacenPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),

  // Series y Lotes
  protectedRoute('inventario/numeros-serie', NumerosSeriesPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),

  // Rutas de Operación
  protectedRoute('inventario/rutas-operacion', RutasOperacionPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),

  // Conteos e Inventario Físico
  protectedRoute('inventario/conteos', ConteosPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/conteos/:id', ConteoDetallePage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/ajustes-masivos', AjustesMasivosPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),
  protectedRoute('inventario/ajustes-masivos/:id', AjusteMasivoDetallePage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),

  // Reorden Automático
  protectedRoute('inventario/reorden', ReordenPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),
  protectedRoute('inventario/reorden/reglas', ReglasReordenPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),

  // Dropship y Consigna
  protectedRoute('inventario/dropship', DropshipPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),
  protectedRoute('inventario/consigna', ConsignaPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),

  // Operaciones de Almacén
  protectedRoute('inventario/operaciones', OperacionesAlmacenPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/operaciones/:id', OperacionesAlmacenPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/batch-picking', BatchPickingPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),
  protectedRoute('inventario/batch-picking/:id', BatchPickingPage, { requiredRole: ROLES.TEAM, requiredModule: 'inventario' }),

  // Listas de Precios
  protectedRoute('inventario/listas-precios', ListasPreciosPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),
  // Alias legacy para compatibilidad
  protectedRoute('listas-precios', ListasPreciosPage, { requiredRole: ROLES.ADMIN_ONLY, requiredModule: 'inventario' }),
];
