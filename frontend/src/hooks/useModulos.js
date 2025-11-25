import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulosApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';

/**
 * QUERY KEYS para módulos
 */
export const MODULOS_KEYS = {
  all: ['modulos'],
  disponibles: () => [...MODULOS_KEYS.all, 'disponibles'],
  activos: () => [...MODULOS_KEYS.all, 'activos'],
  verificar: (modulo) => [...MODULOS_KEYS.all, 'verificar', modulo],
};

// ==================== QUERIES ====================

/**
 * Hook para obtener módulos disponibles en el sistema
 * No requiere autenticación
 */
export function useModulosDisponibles() {
  return useQuery({
    queryKey: MODULOS_KEYS.disponibles(),
    queryFn: async () => {
      const response = await modulosApi.listarDisponibles();
      return response.data.data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutos (datos estáticos)
  });
}

/**
 * Hook para obtener módulos activos de la organización
 * Requiere autenticación
 */
export function useModulosActivos() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: MODULOS_KEYS.activos(),
    queryFn: async () => {
      const response = await modulosApi.obtenerActivos();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
  });
}

/**
 * Hook para verificar si un módulo específico está activo
 * @param {string} modulo - Nombre del módulo
 */
export function useVerificarModulo(modulo) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: MODULOS_KEYS.verificar(modulo),
    queryFn: async () => {
      const response = await modulosApi.verificarModulo(modulo);
      return response.data.data;
    },
    enabled: isAuthenticated && !!modulo,
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para activar un módulo
 */
export function useActivarModulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modulo) => {
      const response = await modulosApi.activarModulo(modulo);
      return response.data.data;
    },
    onSuccess: (data, modulo) => {
      // Invalidar queries de módulos
      queryClient.invalidateQueries({ queryKey: MODULOS_KEYS.all });

      // También invalidar queries del módulo específico si existen
      const moduloQueries = {
        inventario: ['productos', 'categorias', 'proveedores', 'alertas'],
        pos: ['ventas', 'corte-caja'],
        comisiones: ['comisiones', 'configuracion-comisiones'],
        marketplace: ['marketplace-perfil'],
        chatbots: ['chatbots'],
      };

      const queriesToInvalidate = moduloQueries[modulo] || [];
      queriesToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw new Error('Error al activar módulo');
    },
  });
}

/**
 * Hook para desactivar un módulo
 */
export function useDesactivarModulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modulo) => {
      const response = await modulosApi.desactivarModulo(modulo);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar queries de módulos
      queryClient.invalidateQueries({ queryKey: MODULOS_KEYS.all });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw new Error('Error al desactivar módulo');
    },
  });
}

// ==================== HELPERS ====================

/**
 * Hook combinado para obtener estado completo de módulos
 * Retorna helpers útiles para verificar módulos
 */
export function useModulos() {
  const { data: modulosData, isLoading, error, refetch } = useModulosActivos();

  // Extraer módulos activos como objeto simple { inventario: true, pos: false, ... }
  const modulosActivos = modulosData?.modulos_activos || { core: true };

  // Helpers para verificar módulos
  const tieneModulo = (modulo) => modulosActivos[modulo] === true;

  const tieneAlgunModulo = (...modulos) => modulos.some((m) => tieneModulo(m));

  const tieneTodosModulos = (...modulos) => modulos.every((m) => tieneModulo(m));

  // Lista de módulos con metadata
  const modulos = modulosData?.modulos || {};

  // Contar módulos activos
  const totalActivos = Object.values(modulosActivos).filter(Boolean).length;

  return {
    // Data
    modulosActivos,
    modulos,
    totalActivos,
    organizacionId: modulosData?.organizacion_id,

    // Estado
    isLoading,
    error,

    // Helpers
    tieneModulo,
    tieneAlgunModulo,
    tieneTodosModulos,

    // Acciones
    refetch,

    // Shortcuts comunes
    tieneInventario: tieneModulo('inventario'),
    tienePOS: tieneModulo('pos'),
    tieneComisiones: tieneModulo('comisiones'),
    tieneMarketplace: tieneModulo('marketplace'),
    tieneChatbots: tieneModulo('chatbots'),
    tieneAgendamiento: tieneModulo('agendamiento'),
  };
}

export default useModulos;
