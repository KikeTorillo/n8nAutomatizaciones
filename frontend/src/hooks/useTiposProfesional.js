import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiposProfesionalApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';

/**
 * Hook para listar tipos de profesional con filtros
 * @param {Object} params - { solo_sistema, solo_personalizados, categoria_codigo, activo }
 *
 * ✅ FILTRADO AUTOMÁTICO POR CATEGORÍA (Nov 2025: migrado a tabla dinámica):
 * - Si no se especifica `categoria_codigo` en params, usa automáticamente el de la org del usuario
 * - Esto garantiza que solo se muestren tipos compatibles con la categoría de la organización
 */
export function useTiposProfesional(params = {}) {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['tipos-profesional', params, user?.categoria_codigo],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        // Excluir: "", null, undefined
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // ✅ Filtrado automático por categoría si no se especificó explícitamente (Nov 2025)
      if (!sanitizedParams.categoria_codigo && user?.categoria_codigo) {
        sanitizedParams.categoria_codigo = user.categoria_codigo;
      }

      const response = await tiposProfesionalApi.listar(sanitizedParams);

      // Backend retorna: { success, data: { tipos: [...], total, filtros_aplicados } }
      return response.data.data.tipos || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutos (data más estática que profesionales)
  });
}

/**
 * Hook para obtener tipo de profesional por ID
 */
export function useTipoProfesional(id) {
  return useQuery({
    queryKey: ['tipo-profesional', id],
    queryFn: async () => {
      const response = await tiposProfesionalApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para crear tipo de profesional personalizado
 */
export function useCrearTipoProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        categoria: data.categoria?.trim() || undefined,
        industrias_compatibles: data.industrias_compatibles?.filter(Boolean) || undefined,
      };
      const response = await tiposProfesionalApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['tipos-profesional']);
      queryClient.invalidateQueries(['profesionales']); // Afecta listados de profesionales
    },
    onError: (error) => {
      // Mapear errores del backend a mensajes user-friendly
      const errorMessages = {
        409: 'Ya existe un tipo de profesional con ese código o nombre',
        400: 'Datos inválidos. Revisa los campos requeridos',
        403: 'No tienes permisos para crear tipos personalizados',
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
 * Hook para actualizar tipo de profesional personalizado
 */
export function useActualizarTipoProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        categoria: data.categoria?.trim() || undefined,
        industrias_compatibles: data.industrias_compatibles?.filter(Boolean) || undefined,
      };
      const response = await tiposProfesionalApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tipo-profesional', data.id]);
      queryClient.invalidateQueries(['tipos-profesional']);
      queryClient.invalidateQueries(['profesionales']); // Afecta listados de profesionales
    },
    onError: (error) => {
      const errorMessages = {
        404: 'Tipo de profesional no encontrado',
        400: 'Datos inválidos',
        403: 'No se pueden modificar tipos del sistema',
        409: 'Ya existe un tipo con ese código o nombre',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al actualizar';

      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar tipo de profesional personalizado (soft delete)
 */
export function useEliminarTipoProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await tiposProfesionalApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tipos-profesional']);
      queryClient.invalidateQueries(['profesionales']); // Afecta listados de profesionales
    },
    onError: (error) => {
      const errorMessages = {
        404: 'Tipo de profesional no encontrado',
        400: 'No se puede eliminar el tipo (puede estar en uso por profesionales)',
        403: 'No se pueden eliminar tipos del sistema',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar tipo';

      throw new Error(message);
    },
  });
}

/**
 * Hook para obtener tipos del sistema solamente
 * (útil para dropdowns en formularios)
 */
export function useTiposSistema() {
  return useQuery({
    queryKey: ['tipos-profesional-sistema'],
    queryFn: async () => {
      const response = await tiposProfesionalApi.listar({ solo_sistema: true, activo: true });
      return response.data.data.tipos || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutos (tipos del sistema no cambian)
  });
}

/**
 * Hook para obtener tipos personalizados de la organización
 * (útil para gestión de tipos personalizados)
 */
export function useTiposPersonalizados() {
  return useQuery({
    queryKey: ['tipos-profesional-personalizados'],
    queryFn: async () => {
      const response = await tiposProfesionalApi.listar({ solo_personalizados: true });
      return response.data.data.tipos || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
