/**
 * ====================================================================
 * HOOKS CRUD PUESTOS
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~135 líneas a ~65 líneas
 * ====================================================================
 */

import { puestosApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

// Sanitizador para datos de puesto
const sanitizePuesto = createSanitizer([
  'codigo',
  'descripcion',
  { name: 'departamento_id', type: 'id' },
  { name: 'salario_minimo', type: 'number' },
  { name: 'salario_maximo', type: 'number' },
]);

// Crear hooks CRUD
const hooks = createCRUDHooks({
  name: 'puesto',
  namePlural: 'puestos',
  api: puestosApi,
  baseKey: 'puestos',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  sanitize: sanitizePuesto,
  invalidateOnCreate: ['puestos'],
  invalidateOnUpdate: ['puestos'],
  invalidateOnDelete: ['puestos'],
  errorMessages: {
    create: { 409: 'Ya existe un puesto con ese código' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
});

// Exportar hooks con nombres descriptivos
export const usePuestos = hooks.useList;
export const usePuesto = hooks.useDetail;
export const useCrearPuesto = hooks.useCreate;
export const useActualizarPuesto = hooks.useUpdate;
export const useEliminarPuesto = hooks.useDelete;

// Hooks auxiliares
export const usePuestosActivos = hooks.useListActive;

/**
 * Hook para obtener puestos por departamento
 * @param {number} departamentoId
 */
export function usePuestosPorDepartamento(departamentoId) {
  return hooks.useList({
    activo: true,
    departamento_id: departamentoId,
  });
}
