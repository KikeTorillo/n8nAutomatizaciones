import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { modulosApi } from '@/services/api/endpoints';
import useAuthStore, { selectIsAuthenticated, selectUser } from '@/store/authStore';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

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
    staleTime: STALE_TIMES.LONG, // 30 minutos (datos estáticos)
  });
}

/**
 * Hook para obtener módulos activos de la organización
 * Requiere autenticación
 */
export function useModulosActivos() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: MODULOS_KEYS.activos(),
    queryFn: async () => {
      const response = await modulosApi.obtenerActivos();
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
  });
}

/**
 * Hook para verificar si un módulo específico está activo
 * @param {string} modulo - Nombre del módulo
 */
export function useVerificarModulo(modulo) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: MODULOS_KEYS.verificar(modulo),
    queryFn: async () => {
      const response = await modulosApi.verificarModulo(modulo);
      return response.data.data;
    },
    enabled: isAuthenticated && !!modulo,
    staleTime: STALE_TIMES.SEMI_STATIC,
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
    onError: createCRUDErrorHandler('update', 'Modulo'),
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
    onError: createCRUDErrorHandler('update', 'Modulo'),
  });
}

// ==================== HELPERS ====================

/**
 * Hook combinado para obtener estado completo de módulos
 * Retorna helpers útiles para verificar módulos
 * Actualizado para modelo Free/Pro (Nov 2025)
 * Super Admin tiene acceso a TODOS los módulos (Nov 2025)
 */
export function useModulos() {
  const { data: modulosData, isLoading, error, refetch } = useModulosActivos();
  const user = useAuthStore(selectUser);

  // Super Admin bypass: tiene acceso a TODOS los módulos
  const esSuperAdmin = user?.rol === 'super_admin';

  // Módulos completos para super_admin
  const TODOS_LOS_MODULOS = {
    core: true,
    agendamiento: true,
    inventario: true,
    pos: true,
    comisiones: true,
    contabilidad: true,
    marketplace: true,
    chatbots: true,
    'eventos-digitales': true,
    website: true,
    workflows: true,
    'suscripciones-negocio': true,  // Agregado Ene 2026
  };

  // Extraer módulos activos como objeto simple { inventario: true, pos: false, ... }
  // Super Admin: usa la config real de su org (puede desactivar módulos si quiere)
  // Solo usa TODOS_LOS_MODULOS como fallback si no hay data aún
  const modulosActivos = modulosData?.modulos_activos
    || (esSuperAdmin ? TODOS_LOS_MODULOS : { core: true });

  // Información del plan (Modelo Free/Pro Nov 2025)
  const plan = modulosData?.plan || null;

  // Helpers para verificar módulos
  const tieneModulo = (modulo) => modulosActivos[modulo] === true;

  const tieneAlgunModulo = (...modulos) => modulos.some((m) => tieneModulo(m));

  const tieneTodosModulos = (...modulos) => modulos.every((m) => tieneModulo(m));

  // Lista de módulos con metadata
  const modulos = modulosData?.modulos || {};

  // Contar módulos activos
  const totalActivos = Object.values(modulosActivos).filter(Boolean).length;

  // Helpers del plan (Modelo Free/Pro Nov 2025)
  const esPlanFree = plan?.es_free === true;
  const esPlanPro = plan?.es_pro === true;
  const esPlanTrial = plan?.es_trial === true;
  // Super Admin tiene acceso a todas las apps
  const todasLasApps = esSuperAdmin || plan?.todas_las_apps === true;
  const appSeleccionada = plan?.app_seleccionada || null;

  // Verificar si puede acceder a una app específica
  const puedeAccederApp = (app) => {
    // Super Admin tiene acceso a TODO
    if (esSuperAdmin) return true;

    // Apps que siempre están disponibles (core, agendamiento base)
    const appsBase = ['core'];

    if (appsBase.includes(app)) return true;

    // Si tiene todas las apps (Pro, Trial, Custom)
    if (todasLasApps) return true;

    // Plan Free: solo puede acceder a la app seleccionada
    if (esPlanFree) {
      // Agendamiento es la app por defecto si se eligió 'agendamiento'
      if (app === 'agendamiento' && appSeleccionada === 'agendamiento') return true;
      if (app === 'inventario' && appSeleccionada === 'inventario') return true;
      if (app === 'pos' && appSeleccionada === 'pos') return true;

      return false;
    }

    // Fallback: verificar en modulosActivos
    return tieneModulo(app);
  };

  return {
    // Data
    modulosActivos,
    modulos,
    totalActivos,
    organizacionId: modulosData?.organizacion_id,

    // Información del plan (Nov 2025)
    plan,
    esPlanFree,
    esPlanPro,
    esPlanTrial,
    todasLasApps,
    appSeleccionada,

    // Rol Super Admin (Nov 2025)
    esSuperAdmin,

    // Estado
    isLoading,
    error,

    // Helpers
    tieneModulo,
    tieneAlgunModulo,
    tieneTodosModulos,
    puedeAccederApp,

    // Acciones
    refetch,

    // Shortcuts comunes (basados en modulosActivos de subscripción)
    // Super Admin: todos true
    tieneInventario: tieneModulo('inventario'),
    tienePOS: tieneModulo('pos'),
    tieneComisiones: tieneModulo('comisiones'),
    tieneContabilidad: tieneModulo('contabilidad'),
    tieneMarketplace: tieneModulo('marketplace'),
    tieneChatbots: tieneModulo('chatbots'),
    tieneAgendamiento: tieneModulo('agendamiento'),
    tieneEventosDigitales: tieneModulo('eventos-digitales'),
    tieneWebsite: tieneModulo('website'),
    tieneWorkflows: tieneModulo('workflows'),
    tieneSuscripcionesNegocio: tieneModulo('suscripciones-negocio'),
  };
}

export default useModulos;
