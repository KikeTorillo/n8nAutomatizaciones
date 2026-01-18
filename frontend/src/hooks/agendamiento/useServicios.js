import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { serviciosApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

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
    onError: createCRUDErrorHandler('create', 'Servicio', {
      409: 'Ya existe un servicio con ese nombre',
      422: 'Uno o más profesionales no existen',
    }),
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
    onError: createCRUDErrorHandler('update', 'Servicio', {
      409: 'Ya existe un servicio con ese nombre',
    }),
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
    onError: createCRUDErrorHandler('delete', 'Servicio', {
      400: 'No se puede eliminar el servicio (puede tener citas asociadas)',
    }),
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
    onError: createCRUDErrorHandler('create', 'Asignacion de profesional'),
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
    onError: createCRUDErrorHandler('delete', 'Asignacion de profesional'),
  });
}
