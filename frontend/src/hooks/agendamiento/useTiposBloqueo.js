/**
 * Hooks para gestión de Tipos de Bloqueo
 * Migrado a createCRUDHooks - Ene 2026
 */

import { createCRUDHooks } from '@/hooks/factories';
import { tiposBloqueoApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Query Keys para tipos de bloqueo
 */
export const tiposBloqueoKeys = {
  all: ['tipos-bloqueo'],
  lists: () => [...tiposBloqueoKeys.all, 'list'],
  list: (filters) => [...tiposBloqueoKeys.lists(), { filters }],
  details: () => [...tiposBloqueoKeys.all, 'detail'],
  detail: (id) => [...tiposBloqueoKeys.details(), id],
};

/**
 * Hooks CRUD generados por factory
 */
const crudHooks = createCRUDHooks({
  name: 'tipo-bloqueo',
  namePlural: 'tipos-bloqueo',
  api: tiposBloqueoApi,
  baseKey: 'tipos-bloqueo',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  // Transformar respuesta del list para mantener compatibilidad
  transformList: (data, pagination) => ({
    tipos: data,
    total: pagination?.total || data?.length || 0,
    filtros_aplicados: {},
  }),
});

// Exportar hooks con nombres compatibles con el código existente
export const useTiposBloqueo = crudHooks.useList;
export const useTipoBloqueo = crudHooks.useDetail;
export const useCrearTipoBloqueo = crudHooks.useCreate;
export const useActualizarTipoBloqueo = crudHooks.useUpdate;
export const useEliminarTipoBloqueo = crudHooks.useDelete;

export default {
  useTiposBloqueo,
  useTipoBloqueo,
  useCrearTipoBloqueo,
  useActualizarTipoBloqueo,
  useEliminarTipoBloqueo,
};
