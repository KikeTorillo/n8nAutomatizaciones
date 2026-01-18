/**
 * ====================================================================
 * HOOKS - ETIQUETAS DE CLIENTES
 * ====================================================================
 *
 * Migrado a factory - Ene 2026
 * Reducción de ~200 líneas a ~130 líneas
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { clientesApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// Colores predefinidos para el selector
export const COLORES_ETIQUETAS = [
  { value: '#EF4444', label: 'Rojo', description: 'VIP, Urgente' },
  { value: '#F59E0B', label: 'Naranja', description: 'Nuevo, Pendiente' },
  { value: '#10B981', label: 'Verde', description: 'Activo, Frecuente' },
  { value: '#3B82F6', label: 'Azul', description: 'Corporativo' },
  { value: '#8B5CF6', label: 'Morado', description: 'Premium' },
  { value: '#EC4899', label: 'Rosa', description: 'Especial' },
  { value: '#6366F1', label: 'Indigo', description: 'Default' },
  { value: '#14B8A6', label: 'Teal', description: 'Referido' },
];

// Crear hooks CRUD
const hooks = createCRUDHooks({
  name: 'etiqueta-cliente',
  namePlural: 'etiquetas-clientes',
  api: clientesApi,
  baseKey: 'etiquetas-clientes',
  apiMethods: {
    list: 'listarEtiquetas',
    get: 'obtenerEtiqueta',
    create: 'crearEtiqueta',
    update: 'actualizarEtiqueta',
    delete: 'eliminarEtiqueta',
  },
  invalidateOnCreate: ['etiquetas-clientes'],
  invalidateOnUpdate: ['etiquetas-clientes'],
  invalidateOnDelete: ['etiquetas-clientes'],
  errorMessages: {
    create: { 409: 'Ya existe una etiqueta con ese nombre' },
    update: { 409: 'Ya existe una etiqueta con ese nombre' },
    delete: { 400: 'No se puede eliminar la etiqueta (tiene clientes asignados)' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
});

// Exportar hooks CRUD
export const useEtiquetas = hooks.useList;
export const useEtiqueta = hooks.useDetail;
export const useCrearEtiqueta = hooks.useCreate;
export const useActualizarEtiqueta = hooks.useUpdate;
export const useEliminarEtiqueta = hooks.useDelete;

// ====================================================================
// ASIGNACIÓN DE ETIQUETAS A CLIENTES
// ====================================================================

/**
 * Hook para obtener etiquetas de un cliente
 */
export function useEtiquetasCliente(clienteId) {
  return useQuery({
    queryKey: ['cliente-etiquetas', clienteId],
    queryFn: async () => {
      const response = await clientesApi.obtenerEtiquetasCliente(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para asignar etiquetas a un cliente (reemplaza las existentes)
 */
export function useAsignarEtiquetasCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, etiquetaIds }) => {
      const response = await clientesApi.asignarEtiquetasCliente(clienteId, etiquetaIds);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-etiquetas', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['etiquetas-clientes'] });
    },
    onError: createCRUDErrorHandler('update', 'Etiquetas'),
  });
}

/**
 * Hook para agregar una etiqueta a un cliente
 */
export function useAgregarEtiquetaCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, etiquetaId }) => {
      const response = await clientesApi.agregarEtiquetaCliente(clienteId, etiquetaId);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-etiquetas', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['etiquetas-clientes'] });
    },
  });
}

/**
 * Hook para quitar una etiqueta de un cliente
 */
export function useQuitarEtiquetaCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, etiquetaId }) => {
      const response = await clientesApi.quitarEtiquetaCliente(clienteId, etiquetaId);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cliente-etiquetas', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.clienteId] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['etiquetas-clientes'] });
    },
  });
}
