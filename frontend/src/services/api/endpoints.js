/**
 * API Endpoints - Re-exports centralizados
 *
 * NOTA: Este archivo ha sido modularizado.
 * Las APIs ahora están en archivos individuales en ./modules/
 *
 * Para agregar nuevas APIs:
 * 1. Crear archivo en ./modules/nombre.api.js
 * 2. Exportarlo aquí y en ./modules/index.js
 *
 * Los imports existentes siguen funcionando:
 *   import { authApi, clientesApi } from '@/services/api/endpoints';
 *
 * También puedes importar directamente desde módulos:
 *   import { authApi } from '@/services/api/modules/auth.api';
 */

// Re-exportar todo desde módulos
export * from './modules';
