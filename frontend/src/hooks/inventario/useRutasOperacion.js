import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hook para listar rutas de operación
 * @param {Object} filtros - { tipo?, activo? }
 */
export function useRutasOperacion(filtros = {}) {
  return useQuery({
    queryKey: ['rutas-operacion', filtros],
    queryFn: async () => {
      const response = await inventarioApi.listarRutas(filtros);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook para obtener ruta por ID
 */
export function useRutaOperacion(id) {
  return useQuery({
    queryKey: ['ruta-operacion', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerRuta(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para inicializar rutas por defecto
 */
export function useInicializarRutas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await inventarioApi.inicializarRutas();
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas-operacion'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para crear ruta de operación
 */
export function useCrearRuta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await inventarioApi.crearRuta(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas-operacion'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para actualizar ruta de operación
 */
export function useActualizarRuta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await inventarioApi.actualizarRuta(id, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rutas-operacion'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ruta-operacion', variables.id], refetchType: 'active' });
    },
  });
}

/**
 * Hook para eliminar ruta de operación
 */
export function useEliminarRuta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarRuta(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas-operacion'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para obtener rutas asignadas a un producto
 */
export function useRutasProducto(productoId) {
  return useQuery({
    queryKey: ['producto-rutas', productoId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerRutasProducto(productoId);
      return response.data.data || [];
    },
    enabled: !!productoId,
  });
}

/**
 * Hook para asignar ruta a producto
 */
export function useAsignarRutaProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productoId, ...data }) => {
      const response = await inventarioApi.asignarRutaProducto(productoId, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['producto-rutas', variables.productoId], refetchType: 'active' });
    },
  });
}

/**
 * Hook para quitar ruta de producto
 */
export function useQuitarRutaProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productoId, rutaId }) => {
      const response = await inventarioApi.quitarRutaProducto(productoId, rutaId);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['producto-rutas', variables.productoId], refetchType: 'active' });
    },
  });
}
