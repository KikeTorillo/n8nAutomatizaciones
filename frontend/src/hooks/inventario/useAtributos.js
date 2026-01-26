/**
 * ====================================================================
 * HOOKS CRUD ATRIBUTOS DE PRODUCTO
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~160 líneas a ~110 líneas
 * ====================================================================
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks } from '@/hooks/factories';

// Crear hooks CRUD
const hooks = createCRUDHooks({
  name: 'atributo',
  namePlural: 'atributos',
  api: inventarioApi,
  baseKey: 'atributos',
  apiMethods: {
    list: 'listarAtributos',
    get: 'obtenerAtributo',
    create: 'crearAtributo',
    update: 'actualizarAtributo',
    delete: 'eliminarAtributo',
  },
  invalidateOnCreate: ['atributos'],
  invalidateOnUpdate: ['atributos'],
  invalidateOnDelete: ['atributos'],
  staleTime: STALE_TIMES.STATIC_DATA,
  usePreviousData: true, // Evita flash de loading durante paginación
});

// Exportar hooks CRUD
export const useAtributos = hooks.useList;
export const useAtributo = hooks.useDetail;
export const useCrearAtributo = hooks.useCreate;
export const useActualizarAtributo = hooks.useUpdate;
export const useEliminarAtributo = hooks.useDelete;

// ====================================================================
// HOOKS PARA VALORES DE ATRIBUTOS
// ====================================================================

/**
 * Hook para agregar valor a un atributo
 */
export function useAgregarValor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ atributoId, data }) => {
      const response = await inventarioApi.agregarValorAtributo(atributoId, data);
      return response.data.data;
    },
    onSuccess: (_, { atributoId }) => {
      queryClient.invalidateQueries({ queryKey: ['atributo', atributoId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['atributos'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para actualizar valor de atributo
 */
export function useActualizarValor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ valorId, data }) => {
      const response = await inventarioApi.actualizarValor(valorId, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['atributo'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para eliminar valor de atributo
 */
export function useEliminarValor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (valorId) => {
      const response = await inventarioApi.eliminarValor(valorId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['atributo'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para crear atributos por defecto (Color, Talla)
 */
export function useCrearAtributosDefecto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await inventarioApi.crearAtributosDefecto();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'], refetchType: 'active' });
    },
  });
}
