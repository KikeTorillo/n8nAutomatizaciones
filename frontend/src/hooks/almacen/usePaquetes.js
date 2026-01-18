/**
 * ====================================================================
 * HOOKS: Paquetes de Envio
 * ====================================================================
 * React Query hooks para gestion de paquetes/bultos durante empaque
 * Fecha: 31 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { paquetesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * QUERY KEYS para paquetes
 */
export const PAQUETES_KEYS = {
  all: ['paquetes'],
  porOperacion: (operacionId) => [...PAQUETES_KEYS.all, 'operacion', operacionId],
  detail: (id) => [...PAQUETES_KEYS.all, 'detail', id],
  itemsDisponibles: (operacionId) => [...PAQUETES_KEYS.all, 'items-disponibles', operacionId],
  resumen: (operacionId) => [...PAQUETES_KEYS.all, 'resumen', operacionId],
  etiqueta: (id) => [...PAQUETES_KEYS.all, 'etiqueta', id],
};

// ==================== QUERIES ====================

/**
 * Hook para listar paquetes de una operacion
 * @param {number} operacionId - ID de la operacion de empaque
 */
export function usePaquetesOperacion(operacionId) {
  return useQuery({
    queryKey: PAQUETES_KEYS.porOperacion(operacionId),
    queryFn: async () => {
      const response = await paquetesApi.listarPorOperacion(operacionId);
      return response.data.data || [];
    },
    enabled: !!operacionId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener paquete por ID con items
 * @param {number} id - ID del paquete
 */
export function usePaquete(id) {
  return useQuery({
    queryKey: PAQUETES_KEYS.detail(id),
    queryFn: async () => {
      const response = await paquetesApi.obtenerPorId(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener items disponibles para empacar
 * @param {number} operacionId - ID de la operacion de empaque
 */
export function useItemsDisponibles(operacionId) {
  return useQuery({
    queryKey: PAQUETES_KEYS.itemsDisponibles(operacionId),
    queryFn: async () => {
      const response = await paquetesApi.obtenerItemsDisponibles(operacionId);
      return response.data.data || [];
    },
    enabled: !!operacionId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos (cambia frecuentemente)
  });
}

/**
 * Hook para obtener resumen de empaque de la operacion
 * @param {number} operacionId - ID de la operacion de empaque
 */
export function useResumenEmpaque(operacionId) {
  return useQuery({
    queryKey: PAQUETES_KEYS.resumen(operacionId),
    queryFn: async () => {
      const response = await paquetesApi.obtenerResumen(operacionId);
      return response.data.data;
    },
    enabled: !!operacionId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Hook para obtener datos de etiqueta
 * @param {number} id - ID del paquete
 */
export function useEtiquetaPaquete(id) {
  return useQuery({
    queryKey: PAQUETES_KEYS.etiqueta(id),
    queryFn: async () => {
      const response = await paquetesApi.generarEtiqueta(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear un nuevo paquete
 */
export function useCrearPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ operacionId, data }) => paquetesApi.crear(operacionId, data),
    onSuccess: (response, { operacionId }) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.porOperacion(operacionId) });
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.resumen(operacionId) });
      toast.success('Paquete creado');
    },
    onError: createCRUDErrorHandler('create', 'Paquete'),
  });
}

/**
 * Hook para actualizar paquete (dimensiones, peso, notas)
 */
export function useActualizarPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => paquetesApi.actualizar(id, data),
    onSuccess: (response, { id }) => {
      const paquete = response.data.data;
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.detail(id) });
      if (paquete?.operacion_id) {
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.porOperacion(paquete.operacion_id) });
      }
      toast.success('Paquete actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Paquete'),
  });
}

/**
 * Hook para agregar item a paquete
 */
export function useAgregarItemPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ paqueteId, data }) => paquetesApi.agregarItem(paqueteId, data),
    onSuccess: (response, { paqueteId, operacionId }) => {
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.detail(paqueteId) });
      if (operacionId) {
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.itemsDisponibles(operacionId) });
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.resumen(operacionId) });
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.porOperacion(operacionId) });
      }
      toast.success('Item agregado al paquete');
    },
    onError: createCRUDErrorHandler('create', 'Item'),
  });
}

/**
 * Hook para remover item de paquete
 */
export function useRemoverItemPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ paqueteId, itemId }) => paquetesApi.removerItem(paqueteId, itemId),
    onSuccess: (response, { paqueteId, operacionId }) => {
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.detail(paqueteId) });
      if (operacionId) {
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.itemsDisponibles(operacionId) });
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.resumen(operacionId) });
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.porOperacion(operacionId) });
      }
      toast.success('Item removido del paquete');
    },
    onError: createCRUDErrorHandler('delete', 'Item'),
  });
}

/**
 * Hook para cerrar paquete
 */
export function useCerrarPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => paquetesApi.cerrar(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.all });
      toast.success('Paquete cerrado');
    },
    onError: createCRUDErrorHandler('update', 'Paquete'),
  });
}

/**
 * Hook para cancelar paquete
 */
export function useCancelarPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, motivo }) => paquetesApi.cancelar(id, { motivo }),
    onSuccess: (response, { id, operacionId }) => {
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.detail(id) });
      if (operacionId) {
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.itemsDisponibles(operacionId) });
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.resumen(operacionId) });
        queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.porOperacion(operacionId) });
      }
      toast.success('Paquete cancelado');
    },
    onError: createCRUDErrorHandler('delete', 'Paquete'),
  });
}

/**
 * Hook para etiquetar paquete
 */
export function useEtiquetarPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => paquetesApi.etiquetar(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.etiqueta(id) });
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.all });
      toast.success('Paquete etiquetado');
    },
    onError: createCRUDErrorHandler('update', 'Paquete'),
  });
}

/**
 * Hook para marcar paquete como enviado
 */
export function useEnviarPaquete() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => paquetesApi.enviar(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PAQUETES_KEYS.all });
      toast.success('Paquete marcado como enviado');
    },
    onError: createCRUDErrorHandler('update', 'Paquete'),
  });
}
