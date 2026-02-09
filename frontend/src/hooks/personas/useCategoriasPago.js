/**
 * Hook para gestionar categorías de pago
 * Clasificación de empleados para nómina
 * Feb 2026 - Migrado a createCRUDHooks
 */
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { categoriasPagoApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';

// =========================================================================
// HOOKS CRUD VIA FACTORY
// =========================================================================

const hooks = createCRUDHooks({
  name: 'categoriaPago',
  namePlural: 'categoriasPago',
  api: categoriasPagoApi,
  baseKey: 'categorias-pago',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
});

// Exportar hooks CRUD
export const useCategoriasPago = hooks.useList;
export const useCategoriaPago = hooks.useDetail;
export const useCrearCategoriaPago = hooks.useCreate;
export const useActualizarCategoriaPago = hooks.useUpdate;
export const useEliminarCategoriaPago = hooks.useDelete;

// =========================================================================
// HOOKS ESPECIALIZADOS
// =========================================================================

/**
 * Hook para obtener estadísticas de uso de categorías
 */
export const useCategoriasPagoEstadisticas = () => {
  return useQuery({
    queryKey: [...queryKeys.catalogos.categoriasPago, 'estadisticas'],
    queryFn: async () => {
      const response = await categoriasPagoApi.estadisticas();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
};

/**
 * Hook para obtener opciones de categoría para select
 * Devuelve las categorías activas formateadas para usar en un Select
 */
export const useCategoriasPagoOptions = () => {
  const query = useCategoriasPago({ activas: true });

  const options = (query.data?.categorias || []).map((categoria) => ({
    value: categoria.id,
    label: categoria.nombre,
    color: categoria.color,
    nivel: categoria.nivel_salarial,
    codigo: categoria.codigo,
    permiteBonos: categoria.permite_bonos,
    permiteComisiones: categoria.permite_comisiones,
    permiteViaticos: categoria.permite_viaticos,
  }));

  return {
    ...query,
    options,
  };
};
