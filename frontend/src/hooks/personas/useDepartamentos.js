import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { departamentosApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// ==================== HOOKS CRUD DEPARTAMENTOS ====================

/**
 * Hook para listar departamentos con filtros
 * @param {Object} params - { activo, parent_id, limit, offset }
 */
export function useDepartamentos(params = {}) {
  return useQuery({
    queryKey: ['departamentos', params],
    queryFn: async () => {
      const response = await departamentosApi.listar(sanitizeParams(params));
      // La API retorna { data: [...], meta: {...} } sin wrapper 'departamentos'
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener árbol jerárquico de departamentos
 * Retorna departamentos anidados con children[]
 */
export function useArbolDepartamentos() {
  return useQuery({
    queryKey: ['departamentos-arbol'],
    queryFn: async () => {
      const response = await departamentosApi.obtenerArbol();
      const lista = response.data.data || [];

      // Construir árbol desde lista plana
      const map = new Map();
      const roots = [];

      // Primero crear mapa de todos los nodos
      lista.forEach(item => {
        map.set(item.id, { ...item, children: [] });
      });

      // Luego asignar hijos a sus padres
      lista.forEach(item => {
        const node = map.get(item.id);
        if (item.parent_id && map.has(item.parent_id)) {
          map.get(item.parent_id).children.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener departamento por ID
 * @param {number} id
 */
export function useDepartamento(id) {
  return useQuery({
    queryKey: ['departamento', id],
    queryFn: async () => {
      const response = await departamentosApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para crear departamento
 */
export function useCrearDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        codigo: data.codigo?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        parent_id: data.parent_id || undefined,
        gerente_id: data.gerente_id || undefined,
      };
      const response = await departamentosApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['departamentos-arbol'] });
    },
    onError: createCRUDErrorHandler('create', 'Departamento', {
      409: 'Ya existe un departamento con ese código',
    }),
  });
}

/**
 * Hook para actualizar departamento
 */
export function useActualizarDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        codigo: data.codigo?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
        parent_id: data.parent_id || undefined,
        gerente_id: data.gerente_id || undefined,
      };
      const response = await departamentosApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['departamento', data.id] });
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['departamentos-arbol'] });
    },
    onError: createCRUDErrorHandler('update', 'Departamento'),
  });
}

/**
 * Hook para eliminar departamento (soft delete)
 */
export function useEliminarDepartamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await departamentosApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['departamentos-arbol'] });
    },
    onError: createCRUDErrorHandler('delete', 'Departamento'),
  });
}

// ==================== HOOKS AUXILIARES ====================

/**
 * Hook para obtener departamentos activos (para selectores)
 */
export function useDepartamentosActivos() {
  return useDepartamentos({ activo: true });
}

/**
 * Hook para obtener departamentos raíz (sin parent)
 */
export function useDepartamentosRaiz() {
  return useQuery({
    queryKey: ['departamentos', { parent_id: null }],
    queryFn: async () => {
      const response = await departamentosApi.listar({ activo: true });
      const departamentos = response.data.data?.departamentos || [];
      // Filtrar solo los que no tienen parent
      return departamentos.filter(d => !d.parent_id);
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
