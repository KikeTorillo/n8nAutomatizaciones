/**
 * ====================================================================
 * HOOKS CRUD DEPARTAMENTOS
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~175 líneas a ~90 líneas
 * ====================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { departamentosApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

// Sanitizador para datos de departamento
// NOTA: codigo/descripcion NO se incluyen aquí porque preparePayload ya los maneja
// y el sanitizer genérico convierte null a undefined, causando que no se actualicen
const sanitizeDepartamento = createSanitizer([
  { name: 'parent_id', type: 'id' },
  { name: 'gerente_id', type: 'id' },
]);

// Crear hooks CRUD
const hooks = createCRUDHooks({
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
  invalidateOnCreate: ['departamentos', 'departamentos-arbol'],
  invalidateOnUpdate: ['departamentos', 'departamentos-arbol'],
  invalidateOnDelete: ['departamentos', 'departamentos-arbol'],
  errorMessages: {
    create: { 409: 'Ya existe un departamento con ese código' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true, // Evita flash de loading durante paginación
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
 * Hook para obtener árbol jerárquico de departamentos
 * Retorna departamentos anidados con children[]
 */
export function useArbolDepartamentos() {
  return useQuery({
    queryKey: ['departamentos-arbol'],
    queryFn: async () => {
      const response = await departamentosApi.obtenerArbol();
      const lista = response.data.data || [];

      // Construir árbol desde lista plana
      const map = new Map();
      const roots = [];

      // Primero crear mapa de todos los nodos
      lista.forEach((item) => {
        map.set(item.id, { ...item, children: [] });
      });

      // Luego asignar hijos a sus padres
      lista.forEach((item) => {
        const node = map.get(item.id);
        if (item.parent_id && map.has(item.parent_id)) {
          map.get(item.parent_id).children.push(node);
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
 * Hook para obtener departamentos raíz (sin parent)
 */
export function useDepartamentosRaiz() {
  return useQuery({
    queryKey: ['departamentos', { parent_id: null }],
    queryFn: async () => {
      const response = await departamentosApi.listar({ activo: true });
      const departamentos = response.data.data?.departamentos || response.data.data || [];
      // Filtrar solo los que no tienen parent
      return departamentos.filter((d) => !d.parent_id);
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
