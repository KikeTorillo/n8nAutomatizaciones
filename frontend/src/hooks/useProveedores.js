import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hook para listar proveedores con filtros
 * @param {Object} params - { activo?, busqueda?, ciudad?, rfc?, limit?, offset? }
 */
export function useProveedores(params = {}) {
  return useQuery({
    queryKey: ['proveedores', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.listarProveedores(sanitizedParams);
      return response.data.data || { proveedores: [], total: 0 };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener proveedor por ID
 */
export function useProveedor(id) {
  return useQuery({
    queryKey: ['proveedor', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerProveedor(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para crear proveedor
 */
export function useCrearProveedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        razon_social: data.razon_social?.trim() || undefined,
        rfc: data.rfc?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email?.trim() || undefined,
        sitio_web: data.sitio_web?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        // IDs de ubicación (números, no strings)
        pais_id: data.pais_id || undefined,
        estado_id: data.estado_id || undefined,
        ciudad_id: data.ciudad_id || undefined,
        codigo_postal: data.codigo_postal?.trim() || undefined,
        dias_entrega_estimados: data.dias_entrega_estimados || undefined,
        monto_minimo_compra: data.monto_minimo_compra || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await inventarioApi.crearProveedor(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proveedores']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        409: 'Ya existe un proveedor con ese RFC o nombre',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear proveedores o alcanzaste el límite de tu plan',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al crear proveedor';
      throw new Error(message);
    },
  });
}

/**
 * Hook para actualizar proveedor
 */
export function useActualizarProveedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        ...data,
        razon_social: data.razon_social?.trim() || undefined,
        rfc: data.rfc?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email?.trim() || undefined,
        sitio_web: data.sitio_web?.trim() || undefined,
        direccion: data.direccion?.trim() || undefined,
        // IDs de ubicación (números, no strings)
        pais_id: data.pais_id || undefined,
        estado_id: data.estado_id || undefined,
        ciudad_id: data.ciudad_id || undefined,
        codigo_postal: data.codigo_postal?.trim() || undefined,
        dias_entrega_estimados: data.dias_entrega_estimados || undefined,
        monto_minimo_compra: data.monto_minimo_compra || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await inventarioApi.actualizarProveedor(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['proveedores']);
      queryClient.invalidateQueries(['proveedor', variables.id]);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Proveedor no encontrado',
        409: 'Ya existe otro proveedor con ese RFC',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para actualizar proveedores',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al actualizar proveedor';
      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar proveedor (soft delete)
 */
export function useEliminarProveedor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarProveedor(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['proveedores']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Proveedor no encontrado',
        403: 'No tienes permisos para eliminar proveedores',
        409: 'No se puede eliminar el proveedor porque tiene productos asociados',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar proveedor';
      throw new Error(message);
    },
  });
}
