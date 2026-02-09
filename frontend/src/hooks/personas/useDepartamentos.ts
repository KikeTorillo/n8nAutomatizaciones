/**
 * ====================================================================
 * HOOKS CRUD DEPARTAMENTOS
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reduccion de ~175 lineas a ~90 lineas
 * Migrado a TypeScript - Feb 2026
 * ====================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { departamentosApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';

// ==================== INTERFACES ====================

interface Departamento {
  id: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  parent_id?: number | null;
  gerente_id?: number | null;
  activo: boolean;
  organizacion_id: number;
  created_at: string;
  updated_at: string;
  children?: Departamento[];
}

// ==================== HOOKS CRUD ====================

// Sanitizador para datos de departamento
// NOTA: codigo/descripcion NO se incluyen aqui porque preparePayload ya los maneja
// y el sanitizer generico convierte null a undefined, causando que no se actualicen
const sanitizeDepartamento = createSanitizer([
  { name: 'parent_id', type: 'id' },
  { name: 'gerente_id', type: 'id' },
]);

// Crear hooks CRUD
const hooks = createCRUDHooks<Departamento>({
  name: 'departamento',
  namePlural: 'departamentos',
  api: departamentosApi,
  baseKey: 'departamentos',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  sanitize: sanitizeDepartamento,
  invalidateOnCreate: queryKeys.personas.departamentos.all,
  invalidateOnUpdate: queryKeys.personas.departamentos.all,
  invalidateOnDelete: queryKeys.personas.departamentos.all,
  errorMessages: {
    create: { 409: 'Ya existe un departamento con ese código' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true, // Evita flash de loading durante paginacion
});

// Exportar hooks con nombres descriptivos
export const useDepartamentos = hooks.useList;
export const useDepartamento = hooks.useDetail;
export const useCrearDepartamento = hooks.useCreate;
export const useActualizarDepartamento = hooks.useUpdate;
export const useEliminarDepartamento = hooks.useDelete;

// Hooks auxiliares
export const useDepartamentosActivos = hooks.useListActive;

/**
 * Hook para obtener arbol jerarquico de departamentos
 * Retorna departamentos anidados con children[]
 */
export function useArbolDepartamentos() {
  return useQuery({
    queryKey: queryKeys.personas.departamentos.arbol,
    queryFn: async () => {
      const response = await departamentosApi.obtenerArbol();
      const lista: Departamento[] = (response as any).data.data || [];

      // Construir arbol desde lista plana
      const map = new Map<number, Departamento>();
      const roots: Departamento[] = [];

      // Primero crear mapa de todos los nodos
      lista.forEach((item) => {
        map.set(item.id, { ...item, children: [] });
      });

      // Luego asignar hijos a sus padres
      lista.forEach((item) => {
        const node = map.get(item.id)!;
        if (item.parent_id && map.has(item.parent_id)) {
          map.get(item.parent_id)!.children!.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener departamentos raiz (sin parent)
 */
export function useDepartamentosRaiz() {
  return useQuery({
    queryKey: ['departamentos', { parent_id: null }],
    queryFn: async () => {
      const response = await departamentosApi.listar({ activo: true });
      const departamentos: Departamento[] =
        (response as any).data.data?.departamentos || (response as any).data.data || [];
      // Filtrar solo los que no tienen parent
      return departamentos.filter((d) => !d.parent_id);
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
