/**
 * ====================================================================
 * HOOKS CRUD PUESTOS
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reduccion de ~135 lineas a ~65 lineas
 * Migrado a TypeScript - Feb 2026
 * ====================================================================
 */

import { puestosApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';

// ==================== INTERFACES ====================

interface Puesto {
  id: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  departamento_id?: number | null;
  salario_minimo?: number | null;
  salario_maximo?: number | null;
  activo: boolean;
  organizacion_id: number;
  created_at: string;
  updated_at: string;
}

// ==================== HOOKS CRUD ====================

// Sanitizador para datos de puesto
const sanitizePuesto = createSanitizer([
  'codigo',
  'descripcion',
  { name: 'departamento_id', type: 'id' },
  { name: 'salario_minimo', type: 'number' },
  { name: 'salario_maximo', type: 'number' },
]);

// Crear hooks CRUD
const hooks = createCRUDHooks<Puesto>({
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
  invalidateOnCreate: queryKeys.personas.puestos.all,
  invalidateOnUpdate: queryKeys.personas.puestos.all,
  invalidateOnDelete: queryKeys.personas.puestos.all,
  errorMessages: {
    create: { 409: 'Ya existe un puesto con ese código' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true, // Evita flash de loading durante paginacion
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
 */
export function usePuestosPorDepartamento(departamentoId: number | string | null | undefined) {
  return hooks.useList({
    activo: true,
    departamento_id: departamentoId,
  });
}
