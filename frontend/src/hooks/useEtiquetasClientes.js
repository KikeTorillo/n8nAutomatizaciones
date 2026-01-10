/**
 * ====================================================================
 * HOOKS - ETIQUETAS DE CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * Hooks TanStack Query para gestión de etiquetas
 *
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi } from '@/services/api/endpoints';

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

/**
 * Hook para listar etiquetas de la organización
 */
export function useEtiquetas(params = {}) {
  return useQuery({
    queryKey: ['etiquetas-clientes', params],
    queryFn: async () => {
      const response = await clientesApi.listarEtiquetas(params);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener una etiqueta por ID
 */
export function useEtiqueta(id) {
  return useQuery({
    queryKey: ['etiqueta-cliente', id],
    queryFn: async () => {
      const response = await clientesApi.obtenerEtiqueta(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para crear etiqueta
 */
export function useCrearEtiqueta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await clientesApi.crearEtiqueta(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['etiquetas-clientes']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        409: 'Ya existe una etiqueta con ese nombre',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear etiquetas',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error inesperado';

      throw new Error(message);
    },
  });
}

/**
 * Hook para actualizar etiqueta
 */
export function useActualizarEtiqueta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await clientesApi.actualizarEtiqueta(id, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['etiqueta-cliente', data.id]);
      queryClient.invalidateQueries(['etiquetas-clientes']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Etiqueta no encontrada',
        409: 'Ya existe una etiqueta con ese nombre',
        400: 'Datos inválidos',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al actualizar';

      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar etiqueta
 */
export function useEliminarEtiqueta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await clientesApi.eliminarEtiqueta(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['etiquetas-clientes']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Etiqueta no encontrada',
        400: 'No se puede eliminar la etiqueta (tiene clientes asignados)',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar etiqueta';

      throw new Error(message);
    },
  });
}

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
    staleTime: 1000 * 60 * 2, // 2 minutos
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
      // Invalidar etiquetas del cliente
      queryClient.invalidateQueries(['cliente-etiquetas', variables.clienteId]);
      // Invalidar cliente específico (tiene etiquetas en la respuesta)
      queryClient.invalidateQueries(['cliente', variables.clienteId]);
      // Invalidar lista de clientes (incluye etiquetas)
      queryClient.invalidateQueries(['clientes']);
      // Invalidar contadores de etiquetas
      queryClient.invalidateQueries(['etiquetas-clientes']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      throw new Error('Error al asignar etiquetas');
    },
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
      queryClient.invalidateQueries(['cliente-etiquetas', variables.clienteId]);
      queryClient.invalidateQueries(['cliente', variables.clienteId]);
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['etiquetas-clientes']);
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
      queryClient.invalidateQueries(['cliente-etiquetas', variables.clienteId]);
      queryClient.invalidateQueries(['cliente', variables.clienteId]);
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['etiquetas-clientes']);
    },
  });
}
