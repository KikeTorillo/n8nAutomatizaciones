/**
 * ====================================================================
 * HOOKS CRUD CATEGORIAS
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~130 líneas a ~70 líneas
 * ====================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

// Sanitizador para datos de categoría
const sanitizeCategoria = createSanitizer([
  'descripcion',
  'icono',
  'color',
  { name: 'categoria_padre_id', type: 'id' },
]);

// Crear hooks CRUD
const hooks = createCRUDHooks({
  name: 'categoria',
  namePlural: 'categorias',
  api: inventarioApi,
  baseKey: 'categorias',
  apiMethods: {
    list: 'listarCategorias',
    get: 'obtenerCategoria',
    create: 'crearCategoria',
    update: 'actualizarCategoria',
    delete: 'eliminarCategoria',
  },
  sanitize: sanitizeCategoria,
  invalidateOnCreate: ['categorias', 'categorias-arbol'],
  invalidateOnUpdate: ['categorias', 'categorias-arbol'],
  invalidateOnDelete: ['categorias', 'categorias-arbol'],
  errorMessages: {
    create: { 409: 'Ya existe una categoría con ese nombre' },
    update: {
      409: 'Ya existe otra categoría con ese nombre',
      400: 'Datos inválidos o crearía un ciclo en la jerarquía',
    },
    delete: { 409: 'No se puede eliminar la categoría porque tiene productos o subcategorías asociadas' },
  },
  staleTime: STALE_TIMES.STATIC_DATA,
  responseKey: 'categorias',
});

// Exportar hooks con nombres descriptivos
export const useCategorias = hooks.useList;
export const useCategoria = hooks.useDetail;
export const useCrearCategoria = hooks.useCreate;
export const useActualizarCategoria = hooks.useUpdate;
export const useEliminarCategoria = hooks.useDelete;
export const useCategoriasActivas = hooks.useListActive;

/**
 * Hook para obtener árbol jerárquico de categorías
 * (Hook especializado que no encaja en el CRUD estándar)
 */
export function useArbolCategorias() {
  return useQuery({
    queryKey: ['categorias-arbol'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerArbolCategorias();
      // Backend retorna data directamente como array
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}
