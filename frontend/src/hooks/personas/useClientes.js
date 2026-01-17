import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesApi, citasApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';

/**
 * Hook para listar clientes con paginación
 */
export function useClientes(params = {}) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: async () => {
      const response = await clientesApi.listar(sanitizeParams(params));
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
    staleTime: 1000 * 60 * 2, // 2 minutos - Ene 2026: aumentado para reducir requests
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
    staleTime: 1000 * 60 * 2, // 2 minutos - Ene 2026: aumentado para reducir requests
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
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;

      // Si el backend envió un mensaje específico (ej: límite de plan), usarlo
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      // Fallback a mensajes genéricos por código de error
      const errorMessages = {
        409: 'Ya existe un cliente con ese email o teléfono',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear clientes',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error inesperado';

      // Re-throw con mensaje amigable
      throw new Error(message);
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
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Cliente no encontrado',
        400: 'Datos inválidos',
        409: 'Ya existe un cliente con ese email o teléfono',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al actualizar';

      throw new Error(message);
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
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Cliente no encontrado',
        400: 'No se puede eliminar el cliente (puede tener citas asociadas)',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar cliente';

      throw new Error(message);
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

/**
 * Hook para obtener estadísticas generales de clientes
 */
export function useEstadisticasClientes() {
  return useQuery({
    queryKey: ['clientes-estadisticas'],
    queryFn: async () => {
      const response = await clientesApi.obtenerEstadisticas();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener estadísticas de un cliente específico (Vista 360°)
 * Ene 2026: Usado por ClienteDetailPage para Smart Buttons
 * @param {number|string} clienteId - ID del cliente
 */
export function useEstadisticasCliente(clienteId) {
  return useQuery({
    queryKey: ['cliente-estadisticas', clienteId],
    queryFn: async () => {
      const response = await clientesApi.obtenerEstadisticasCliente(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para importar clientes desde CSV
 * Ene 2026: Importacion masiva de clientes
 */
export function useImportarClientesCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await clientesApi.importarCSV(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['clientes']);
      queryClient.invalidateQueries(['clientes-estadisticas']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al importar clientes';
      throw new Error(message);
    },
  });
}
