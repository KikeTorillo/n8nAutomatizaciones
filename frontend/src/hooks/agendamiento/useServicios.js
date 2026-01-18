import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { serviciosApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';

/**
 * Hook para listar servicios con filtros y paginación
 * @param {Object} params - { pagina, limite, busqueda, activo, categoria, precio_min, precio_max }
 */
export function useServicios(params = {}) {
  return useQuery({
    queryKey: ['servicios', params],
    queryFn: async () => {
      // Sanitizar y validar números específicos para precios
      const cleanParams = sanitizeParams(params);
      if (cleanParams.precio_min !== undefined) {
        const num = parseFloat(cleanParams.precio_min);
        cleanParams.precio_min = (!isNaN(num) && num >= 0) ? num : undefined;
      }
      if (cleanParams.precio_max !== undefined) {
        const num = parseFloat(cleanParams.precio_max);
        cleanParams.precio_max = (!isNaN(num) && num >= 0) ? num : undefined;
      }

      const response = await serviciosApi.listar(sanitizeParams(cleanParams));

      // Backend retorna: { success, data: { servicios, paginacion, filtros_aplicados } }
      return {
        servicios: response.data.data.servicios || [],
        paginacion: response.data.data.paginacion || null,
        filtros_aplicados: response.data.data.filtros_aplicados || {},
      };
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    keepPreviousData: true, // ⚠️ Mantener datos durante cambio de página (debouncing)
  });
}

/**
 * Hook para obtener servicio por ID
 */
export function useServicio(id) {
  return useQuery({
    queryKey: ['servicio', id],
    queryFn: async () => {
      const response = await serviciosApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para buscar servicios (búsqueda rápida)
 * Similar a useBuscarClientes
 */
export function useBuscarServicios(termino, options = {}) {
  return useQuery({
    queryKey: ['buscar-servicios', termino],
    queryFn: async () => {
      const response = await serviciosApi.buscar({ termino, ...options });
      return response.data.data;
    },
    enabled: termino.length >= 2, // Solo buscar si hay al menos 2 caracteres
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para crear servicio
 */
export function useCrearServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        categoria: data.categoria?.trim() || undefined,
      };
      const response = await serviciosApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar múltiples queries
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-dashboard'] }); // Dashboard
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] }); // Stats
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
        409: 'Ya existe un servicio con ese nombre',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear servicios',
        422: 'Uno o más profesionales no existen',
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
 * Hook para actualizar servicio
 * ⚠️ NO maneja profesionales_ids (usar endpoints separados)
 */
export function useActualizarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        categoria: data.categoria?.trim() || undefined,
      };
      const response = await serviciosApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['servicio', data.id] });
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-dashboard'] });
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Servicio no encontrado',
        400: 'Datos inválidos',
        409: 'Ya existe un servicio con ese nombre',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al actualizar';

      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar servicio (soft delete)
 */
export function useEliminarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await serviciosApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Servicio no encontrado',
        400: 'No se puede eliminar el servicio (puede tener citas asociadas)',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar servicio';

      throw new Error(message);
    },
  });
}

/**
 * Hook para obtener profesionales del servicio
 */
export function useProfesionalesServicio(servicioId) {
  return useQuery({
    queryKey: ['servicio-profesionales', servicioId],
    queryFn: async () => {
      const response = await serviciosApi.obtenerProfesionales(servicioId);
      // Backend retorna: { data: [ { profesional_id, nombre_completo, ... } ] }
      return response.data.data;
    },
    enabled: !!servicioId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto de cache para evitar refetches excesivos
  });
}

/**
 * Hook para asignar profesional al servicio
 */
export function useAsignarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ servicioId, profesionalId, configuracion = {} }) => {
      const response = await serviciosApi.asignarProfesional(servicioId, {
        profesional_id: profesionalId,
        configuracion,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // ✅ Invalidar cache del lado de servicios (específico)
      queryClient.invalidateQueries({
        queryKey: ['servicio-profesionales', variables.servicioId],
        exact: true
      });
      queryClient.invalidateQueries({
        queryKey: ['servicios']  // Sin exact:true para invalidar ['servicios', {...params}]
      });
      queryClient.invalidateQueries({
        queryKey: ['servicios-dashboard'],
        exact: true
      });

      // ✅ CRÍTICO: Resetear cache del lado de profesionales (bidireccional)
      // Usar resetQueries en lugar de invalidateQueries para eliminar el cache
      // y forzar refetch cuando se acceda (incluso si está dentro de staleTime)
      queryClient.resetQueries({
        queryKey: ['profesional-servicios', variables.profesionalId],
        exact: true
      });
      queryClient.invalidateQueries({
        queryKey: ['profesionales']  // Sin exact:true para invalidar ['profesionales', {...params}]
      });

      // ✅ Invalidar estadísticas de asignaciones
      queryClient.invalidateQueries({
        queryKey: ['estadisticas-asignaciones'],
        exact: true
      });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Error al asignar profesional';
      throw new Error(message);
    },
  });
}

/**
 * Hook para desasignar profesional del servicio
 */
export function useDesasignarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ servicioId, profesionalId }) => {
      await serviciosApi.desasignarProfesional(servicioId, profesionalId);
      return { servicioId, profesionalId };
    },
    onSuccess: (data) => {
      // ✅ Invalidar cache del lado de servicios (específico)
      queryClient.invalidateQueries({
        queryKey: ['servicio-profesionales', data.servicioId],
        exact: true
      });
      queryClient.invalidateQueries({
        queryKey: ['servicios']  // Sin exact:true para invalidar ['servicios', {...params}]
      });
      queryClient.invalidateQueries({
        queryKey: ['servicios-dashboard'],
        exact: true
      });

      // ✅ CRÍTICO: Resetear cache del lado de profesionales (bidireccional)
      // Usar resetQueries en lugar de invalidateQueries para eliminar el cache
      // y forzar refetch cuando se acceda (incluso si está dentro de staleTime)
      queryClient.resetQueries({
        queryKey: ['profesional-servicios', data.profesionalId],
        exact: true
      });
      queryClient.invalidateQueries({
        queryKey: ['profesionales']  // Sin exact:true para invalidar ['profesionales', {...params}]
      });

      // ✅ Invalidar estadísticas de asignaciones
      queryClient.invalidateQueries({
        queryKey: ['estadisticas-asignaciones'],
        exact: true
      });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Error al desasignar profesional';
      throw new Error(message);
    },
  });
}
