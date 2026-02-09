/**
 * Hooks para niveles de membresía del programa de lealtad
 * Extraído de useLealtad.js — Feb 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar niveles de lealtad
 * GET /pos/lealtad/niveles
 * @param {Object} options - { incluirInactivos: boolean }
 */
export function useNivelesLealtad(options = {}) {
  return useQuery({
    queryKey: queryKeys.pos.lealtad.niveles(options),
    queryFn: async () => {
      const response = await posApi.listarNivelesLealtad({
        incluir_inactivos: options.incluirInactivos ? 'true' : 'false',
      });
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para crear nivel de lealtad
 * POST /pos/lealtad/niveles
 */
export function useCrearNivelLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await posApi.crearNivelLealtad(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.nivelesBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Nivel de lealtad', { 409: 'Ya existe un nivel con ese nombre' }),
  });
}

/**
 * Hook para actualizar nivel de lealtad
 * PUT /pos/lealtad/niveles/:id
 */
export function useActualizarNivelLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await posApi.actualizarNivelLealtad(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.nivelesBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Nivel de lealtad'),
  });
}

/**
 * Hook para eliminar nivel de lealtad
 * DELETE /pos/lealtad/niveles/:id
 */
export function useEliminarNivelLealtad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await posApi.eliminarNivelLealtad(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.nivelesBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Nivel de lealtad'),
  });
}

/**
 * Hook para crear niveles por defecto
 * POST /pos/lealtad/niveles/default
 */
export function useCrearNivelesDefault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await posApi.crearNivelesLealtadDefault();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.nivelesBase, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Niveles por defecto'),
  });
}
