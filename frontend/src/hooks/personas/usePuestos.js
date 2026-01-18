import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { puestosApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';

// ==================== HOOKS CRUD PUESTOS ====================

/**
 * Hook para listar puestos con filtros
 * @param {Object} params - { activo, departamento_id, limit, offset }
 */
export function usePuestos(params = {}) {
  return useQuery({
    queryKey: ['puestos', params],
    queryFn: async () => {
      const response = await puestosApi.listar(sanitizeParams(params));
      // La API retorna { data: [...], meta: {...} } sin wrapper 'puestos'
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener puesto por ID
 * @param {number} id
 */
export function usePuesto(id) {
  return useQuery({
    queryKey: ['puesto', id],
    queryFn: async () => {
      const response = await puestosApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para crear puesto
 */
export function useCrearPuesto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        codigo: data.codigo?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        departamento_id: data.departamento_id || undefined,
        salario_minimo: data.salario_minimo || undefined,
        salario_maximo: data.salario_maximo || undefined,
      };
      const response = await puestosApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puestos'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        409: 'Ya existe un puesto con ese código',
        400: 'Datos inválidos. Revisa los campos',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al crear puesto');
    },
  });
}

/**
 * Hook para actualizar puesto
 */
export function useActualizarPuesto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        codigo: data.codigo?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        departamento_id: data.departamento_id || undefined,
        salario_minimo: data.salario_minimo || undefined,
        salario_maximo: data.salario_maximo || undefined,
      };
      const response = await puestosApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['puesto', data.id] });
      queryClient.invalidateQueries({ queryKey: ['puestos'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error('Error al actualizar puesto');
    },
  });
}

/**
 * Hook para eliminar puesto (soft delete)
 */
export function useEliminarPuesto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await puestosApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['puestos'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      if (error.response?.data?.error?.includes('profesionales')) {
        throw new Error('No se puede eliminar: hay profesionales con este puesto');
      }
      throw new Error('Error al eliminar puesto');
    },
  });
}

// ==================== HOOKS AUXILIARES ====================

/**
 * Hook para obtener puestos activos (para selectores)
 */
export function usePuestosActivos() {
  return usePuestos({ activo: true });
}

/**
 * Hook para obtener puestos por departamento
 * @param {number} departamentoId
 */
export function usePuestosPorDepartamento(departamentoId) {
  return usePuestos({
    activo: true,
    departamento_id: departamentoId
  });
}
