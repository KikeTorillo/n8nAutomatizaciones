/**
 * API de Inventario - Modularizada
 * Re-exports para mantener compatibilidad retroactiva con inventarioApi
 */

// Imports de sub-módulos
import { catalogoApi } from './catalogo.api';
import { variantesApi } from './variantes.api';
import { stockApi } from './stock.api';
import { reservasApi } from './reservas.api';
import { valoracionApi } from './valoracion.api';
import { trazabilidadApi } from './trazabilidad.api';
import { operacionesApi } from './operaciones.api';
import { inteligenciaApi } from './inteligencia.api';

/**
 * API unificada de Inventario
 * Combina todos los sub-módulos para mantener compatibilidad retroactiva
 *
 * Uso original (sigue funcionando):
 *   import { inventarioApi } from '@/services/api';
 *   inventarioApi.crearProducto(data);
 *
 * Uso granular (nuevo):
 *   import { catalogoApi, stockApi } from '@/services/api/modules/inventario';
 *   catalogoApi.crearProducto(data);
 *   stockApi.ajustarStock(id, data);
 */
export const inventarioApi = {
  // Catálogo: Categorías, proveedores, productos CRUD básico
  ...catalogoApi,

  // Variantes: Atributos, valores, variantes de productos
  ...variantesApi,

  // Stock: Movimientos, ajustes, kardex, estadísticas
  ...stockApi,

  // Reservas: Gestión de reservas de stock
  ...reservasApi,

  // Valoración: FIFO, AVCO, reportes de valoración
  ...valoracionApi,

  // Trazabilidad: Números de serie, lotes, garantías
  ...trazabilidadApi,

  // Operaciones: Transferencias, rutas, reorden, WMS
  ...operacionesApi,

  // Inteligencia: Reportes, alertas, analytics, snapshots
  ...inteligenciaApi,
};

// Exports granulares para uso futuro
export { catalogoApi } from './catalogo.api';
export { variantesApi } from './variantes.api';
export { stockApi } from './stock.api';
export { reservasApi } from './reservas.api';
export { valoracionApi } from './valoracion.api';
export { trazabilidadApi } from './trazabilidad.api';
export { operacionesApi } from './operaciones.api';
export { inteligenciaApi } from './inteligencia.api';
