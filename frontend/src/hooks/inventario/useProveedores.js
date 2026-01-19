/**
 * ====================================================================
 * HOOKS CRUD PROVEEDORES
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~130 líneas a ~60 líneas
 * ====================================================================
 */

import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

// Sanitizador para datos de proveedor
const sanitizeProveedor = createSanitizer([
  'razon_social',
  'rfc',
  'telefono',
  'email',
  'sitio_web',
  'direccion',
  'codigo_postal',
  'notas',
  { name: 'pais_id', type: 'id' },
  { name: 'estado_id', type: 'id' },
  { name: 'ciudad_id', type: 'id' },
  { name: 'dias_entrega_estimados', type: 'number' },
  { name: 'monto_minimo_compra', type: 'number' },
]);

// Crear hooks CRUD
const hooks = createCRUDHooks({
  name: 'proveedor',
  namePlural: 'proveedores',
  api: inventarioApi,
  baseKey: 'proveedores',
  apiMethods: {
    list: 'listarProveedores',
    get: 'obtenerProveedor',
    create: 'crearProveedor',
    update: 'actualizarProveedor',
    delete: 'eliminarProveedor',
  },
  sanitize: sanitizeProveedor,
  invalidateOnCreate: ['proveedores'],
  invalidateOnUpdate: ['proveedores'],
  invalidateOnDelete: ['proveedores'],
  errorMessages: {
    create: { 409: 'Ya existe un proveedor con ese RFC o nombre' },
    update: { 409: 'Ya existe otro proveedor con ese RFC' },
    delete: { 409: 'No se puede eliminar el proveedor porque tiene productos asociados' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true, // Evita flash de loading durante paginación
  responseKey: 'proveedores',
});

// Exportar hooks con nombres descriptivos
export const useProveedores = hooks.useList;
export const useProveedor = hooks.useDetail;
export const useCrearProveedor = hooks.useCreate;
export const useActualizarProveedor = hooks.useUpdate;
export const useEliminarProveedor = hooks.useDelete;
export const useProveedoresActivos = hooks.useListActive;
