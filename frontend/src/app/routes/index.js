/**
 * Agregador de Rutas
 * Exporta todas las rutas organizadas por módulo y combinadas
 */

// Exportar rutas individuales por módulo
export { authRoutes } from './auth.routes';
export { publicRoutes } from './public.routes';
export { dashboardRoutes } from './dashboard.routes';
export { personasRoutes } from './personas.routes';
export { inventarioRoutes } from './inventario.routes';
export { posRoutes } from './pos.routes';
export { configuracionRoutes } from './configuracion.routes';
export { sucursalesRoutes } from './sucursales.routes';
export { contabilidadRoutes } from './contabilidad.routes';
export { superadminRoutes } from './superadmin.routes';
export { suscripcionesNegocioRoutes } from './suscripciones-negocio.routes';

// Exportar helpers
export * from './helpers/routeHelpers';

// Importar todas las rutas para combinarlas
import { authRoutes } from './auth.routes';
import { publicRoutes } from './public.routes';
import { dashboardRoutes } from './dashboard.routes';
import { personasRoutes } from './personas.routes';
import { inventarioRoutes } from './inventario.routes';
import { posRoutes } from './pos.routes';
import { configuracionRoutes } from './configuracion.routes';
import { sucursalesRoutes } from './sucursales.routes';
import { contabilidadRoutes } from './contabilidad.routes';
import { superadminRoutes } from './superadmin.routes';
import { suscripcionesNegocioRoutes } from './suscripciones-negocio.routes';

/**
 * Todas las rutas combinadas en el orden correcto
 *
 * IMPORTANTE: El orden importa para el matching de rutas
 * - Rutas específicas antes de rutas dinámicas
 * - publicRoutes debe ir AL FINAL porque incluye el catch-all /:slug
 */
export const allRoutes = [
  // Autenticación (login, registro, etc.)
  ...authRoutes,

  // Dashboard y módulos principales
  ...dashboardRoutes,

  // Personas (clientes, profesionales, etc.)
  ...personasRoutes,

  // Inventario
  ...inventarioRoutes,

  // Punto de Venta
  ...posRoutes,

  // Configuración
  ...configuracionRoutes,

  // Sucursales
  ...sucursalesRoutes,

  // Contabilidad
  ...contabilidadRoutes,

  // Suscripciones Negocio
  ...suscripcionesNegocioRoutes,

  // Super Admin (rutas anidadas)
  ...superadminRoutes,

  // Rutas públicas (SIEMPRE AL FINAL - incluye catch-all /:slug)
  ...publicRoutes,
];
