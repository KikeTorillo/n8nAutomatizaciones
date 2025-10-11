import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi, citasApi } from '@/services/api/endpoints';

/**
 * Hook para listar clientes con paginación
 */
export function useClientes(params = {}) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Sanitizar params - eliminar strings vacíos
      // Backend Joi rechaza busqueda="" (requiere min 2 caracteres si se envía)
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await clientesApi.listar(sanitizedParams);
      return {
        clientes: response.data.data,
        pagination: response.data.pagination,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    keepPreviousData: true, // Mantener datos anteriores durante cambio de página
  });
}

/**
 * Hook para obtener cliente por ID
 */
export function useCliente(id) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const response = await clientesApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para buscar clientes (búsqueda rápida)
 */
export function useBuscarClientes(termino, options = {}) {
  return useQuery({
    queryKey: ['buscar-clientes', termino],
    queryFn: async () => {
      const response = await clientesApi.buscar({ q: termino, ...options });
      return response.data.data;
    },
    enabled: termino.length >= 2, // Solo buscar si hay al menos 2 caracteres
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para buscar cliente por teléfono (útil para walk-in)
 */
export function useBuscarPorTelefono(telefono, enabled = false) {
  return useQuery({
    queryKey: ['cliente-telefono', telefono],
    queryFn: async () => {
      const response = await clientesApi.buscarPorTelefono({ telefono });
      return response.data.data;
    },
    enabled: enabled && telefono.length >= 10,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook para crear cliente
 */
export function useCrearCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await clientesApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar lista de clientes para refrescar
      queryClient.invalidateQueries(['clientes']);
    },
  });
}

/**
 * Hook para actualizar cliente
 */
export function useActualizarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await clientesApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Invalidar cache del cliente específico y la lista
      queryClient.invalidateQueries(['cliente', data.id]);
      queryClient.invalidateQueries(['clientes']);
    },
  });
}

/**
 * Hook para eliminar cliente
 */
export function useEliminarCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await clientesApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
    },
  });
}

/**
 * Hook para crear cita walk-in
 */
export function useCrearWalkIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await citasApi.crearWalkIn(data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar citas y clientes
      queryClient.invalidateQueries(['citas']);
      queryClient.invalidateQueries(['citas-del-dia']);
    },
  });
}

/**
 * Hook para consultar disponibilidad inmediata
 */
export function useDisponibilidadInmediata(servicioId, profesionalId = null) {
  return useQuery({
    queryKey: ['disponibilidad-inmediata', servicioId, profesionalId],
    queryFn: async () => {
      const response = await citasApi.disponibilidadInmediata({
        servicio_id: servicioId,
        profesional_id: profesionalId,
      });
      return response.data.data;
    },
    enabled: !!servicioId,
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 60, // Refetch cada minuto
  });
}
