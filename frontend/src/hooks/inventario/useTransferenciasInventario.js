import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hook para listar transferencias
 */
export function useTransferenciasInventario(filtros = {}) {
  return useQuery({
    queryKey: ['transferencias-inventario', filtros],
    queryFn: async () => {
      const response = await inventarioApi.listarTransferencias(filtros);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook para obtener transferencia por ID
 */
export function useTransferenciaInventario(id) {
  return useQuery({
    queryKey: ['transferencia-inventario', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerTransferencia(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear transferencia
 */
export function useCrearTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await inventarioApi.crearTransferencia(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para aprobar transferencia
 */
export function useAprobarTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.aprobarTransferencia(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para rechazar transferencia
 */
export function useRechazarTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await inventarioApi.rechazarTransferencia(id, { motivo });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para enviar transferencia
 */
export function useEnviarTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.enviarTransferencia(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para recibir transferencia
 */
export function useRecibirTransferencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.recibirTransferencia(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transferencias-inventario'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['productos'], refetchType: 'active' });
    },
  });
}
