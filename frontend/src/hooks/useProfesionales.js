import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profesionalesApi } from '@/services/api/endpoints';

/**
 * Hook para listar profesionales con filtros
 * @param {Object} params - { activo, tipo_profesional, busqueda, etc. }
 */
export function useProfesionales(params = {}) {
  return useQuery({
    queryKey: ['profesionales', params],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        // Excluir: "", null, undefined
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await profesionalesApi.listar(sanitizedParams);

      // Backend retorna: { success, data: { profesionales: [...], total, filtros_aplicados } }
      return response.data.data.profesionales || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener profesional por ID
 */
export function useProfesional(id) {
  return useQuery({
    queryKey: ['profesional', id],
    queryFn: async () => {
      const response = await profesionalesApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para crear profesional
 */
export function useCrearProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
      };
      const response = await profesionalesApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar múltiples queries
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['profesionales-dashboard']);
      queryClient.invalidateQueries(['estadisticas']);
    },
    onError: (error) => {
      // Mapear errores del backend a mensajes user-friendly
      const errorMessages = {
        409: 'Ya existe un profesional con ese email o teléfono',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear profesionales',
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
 * Hook para actualizar profesional
 */
export function useActualizarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
      };
      const response = await profesionalesApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profesional', data.id]);
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['profesionales-dashboard']);
    },
    onError: (error) => {
      const errorMessages = {
        404: 'Profesional no encontrado',
        400: 'Datos inválidos',
        409: 'Ya existe un profesional con ese email o teléfono',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al actualizar';

      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar profesional (soft delete)
 */
export function useEliminarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await profesionalesApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['profesionales-dashboard']);
      queryClient.invalidateQueries(['estadisticas']);
    },
    onError: (error) => {
      const errorMessages = {
        404: 'Profesional no encontrado',
        400: 'No se puede eliminar el profesional (puede tener citas asociadas)',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar profesional';

      throw new Error(message);
    },
  });
}

/**
 * Hook para buscar profesionales (búsqueda rápida)
 */
export function useBuscarProfesionales(termino, options = {}) {
  return useQuery({
    queryKey: ['buscar-profesionales', termino, options],
    queryFn: async () => {
      const params = {
        busqueda: termino,
        ...options,
      };
      const response = await profesionalesApi.listar(params);
      return response.data.data.profesionales || [];
    },
    enabled: termino.length >= 2, // Solo buscar si hay al menos 2 caracteres
    staleTime: 1000 * 30, // 30 segundos
  });
}
