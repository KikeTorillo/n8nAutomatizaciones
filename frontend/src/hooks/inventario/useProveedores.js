import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { sanitizeParams } from '@/lib/params';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar proveedores con filtros
 * @param {Object} params - { activo?, busqueda?, ciudad?, rfc?, limit?, offset? }
 */
export function useProveedores(params = {}) {
  return useQuery({
    queryKey: ['proveedores', params],
    queryFn: async () => {
      const response = await inventarioApi.listarProveedores(sanitizeParams(params));
      return response.data.data || { proveedores: [], total: 0 };
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
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
    staleTime: STALE_TIMES.SEMI_STATIC,
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
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: createCRUDErrorHandler('create', 'Proveedor', {
      409: 'Ya existe un proveedor con ese RFC o nombre',
    }),
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
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      queryClient.invalidateQueries({ queryKey: ['proveedor', variables.id] });
    },
    onError: createCRUDErrorHandler('update', 'Proveedor', {
      409: 'Ya existe otro proveedor con ese RFC',
    }),
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
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
    },
    onError: createCRUDErrorHandler('delete', 'Proveedor', {
      409: 'No se puede eliminar el proveedor porque tiene productos asociados',
    }),
  });
}
