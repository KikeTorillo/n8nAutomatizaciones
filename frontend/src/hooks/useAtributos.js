import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hook para listar atributos de producto
 * @param {Object} params - { incluir_inactivos? }
 */
export function useAtributos(params = {}) {
  return useQuery({
    queryKey: ['atributos', params],
    queryFn: async () => {
      const response = await inventarioApi.listarAtributos(params);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos (atributos cambian poco)
  });
}

/**
 * Hook para obtener atributo por ID con sus valores
 */
export function useAtributo(id) {
  return useQuery({
    queryKey: ['atributo', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerAtributo(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para crear atributo
 */
export function useCrearAtributo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await inventarioApi.crearAtributo(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
    },
  });
}

/**
 * Hook para actualizar atributo
 */
export function useActualizarAtributo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await inventarioApi.actualizarAtributo(id, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
      queryClient.invalidateQueries({ queryKey: ['atributo', id] });
    },
  });
}

/**
 * Hook para eliminar atributo
 */
export function useEliminarAtributo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarAtributo(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['atributo', atributoId] });
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
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
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
      // Invalidar todos los atributos individuales
      queryClient.invalidateQueries({ queryKey: ['atributo'] });
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
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
      queryClient.invalidateQueries({ queryKey: ['atributo'] });
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
      queryClient.invalidateQueries({ queryKey: ['atributos'] });
    },
  });
}
