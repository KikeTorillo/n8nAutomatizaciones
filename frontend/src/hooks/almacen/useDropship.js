/**
 * Hook para Dropshipping
 * Queries y mutations para gestion de OC dropship
 * Fecha: 30 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dropshipApi } from '@/services/api/endpoints';

// ==================== QUERIES ====================

/**
 * Hook para obtener estadisticas de dropship
 */
export function useDropshipEstadisticas() {
  return useQuery({
    queryKey: ['dropship', 'estadisticas'],
    queryFn: async () => {
      const response = await dropshipApi.obtenerEstadisticas();
      return response.data.data;
    },
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para obtener configuracion de dropship
 */
export function useDropshipConfiguracion() {
  return useQuery({
    queryKey: ['dropship', 'configuracion'],
    queryFn: async () => {
      const response = await dropshipApi.obtenerConfiguracion();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener ventas pendientes de generar OC
 */
export function useVentasPendientesDropship() {
  return useQuery({
    queryKey: ['dropship', 'pendientes'],
    queryFn: async () => {
      const response = await dropshipApi.obtenerVentasPendientes();
      return response.data.data;
    },
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para listar OC dropship
 * @param {Object} filtros - { estado?, proveedor_id?, fecha_desde?, fecha_hasta? }
 */
export function useOrdenesDropship(filtros = {}) {
  return useQuery({
    queryKey: ['dropship', 'ordenes', filtros],
    queryFn: async () => {
      const response = await dropshipApi.listarOrdenes(filtros);
      return response.data.data;
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Hook para obtener detalle de una OC dropship
 * @param {number} id - ID de la OC
 */
export function useOrdenDropship(id) {
  return useQuery({
    queryKey: ['dropship', 'ordenes', id],
    queryFn: async () => {
      const response = await dropshipApi.obtenerOrden(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para actualizar configuracion de dropship
 */
export function useActualizarConfigDropship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => dropshipApi.actualizarConfiguracion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropship', 'configuracion'] });
    },
  });
}

/**
 * Hook para crear OC desde una venta
 */
export function useCrearOCDesdeVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ventaId) => dropshipApi.crearDesdeVenta(ventaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropship'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
    },
  });
}

/**
 * Hook para confirmar entrega de OC dropship
 */
export function useConfirmarEntregaDropship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notas }) => dropshipApi.confirmarEntrega(id, { notas }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dropship'] });
      queryClient.invalidateQueries({ queryKey: ['dropship', 'ordenes', id] });
    },
  });
}

/**
 * Hook para cancelar OC dropship
 */
export function useCancelarDropship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }) => dropshipApi.cancelar(id, { motivo }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['dropship'] });
      queryClient.invalidateQueries({ queryKey: ['dropship', 'ordenes', id] });
    },
  });
}
