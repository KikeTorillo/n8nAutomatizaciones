/**
 * API de Inventario - Re-export para compatibilidad retroactiva
 *
 * NOTA: Este archivo ahora re-exporta desde la versión modularizada.
 * Para imports granulares, usar:
 *   import { catalogoApi, stockApi } from '@/services/api/modules/inventario';
 *
 * El import tradicional sigue funcionando:
 *   import { inventarioApi } from '@/services/api/modules/inventario.api';
 */
export {
  inventarioApi,
  catalogoApi,
  variantesApi,
  stockApi,
  reservasApi,
  valoracionApi,
  trazabilidadApi,
  operacionesApi,
  inteligenciaApi,
} from './inventario/index';
