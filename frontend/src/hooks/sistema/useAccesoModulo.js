import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { profesionalesApi, permisosApi } from '@/services/api/endpoints';
import useAuthStore, { selectUser, selectIsAuthenticated } from '@/store/authStore';
import usePermisosStore from '@/store/permisosStore';

/**
 * Hook para validar acceso a módulos y obtener profesional vinculado
 *
 * ACTUALIZADO Ene 2026:
 * Integrado con permisosStore para cache local optimizada.
 * Los permisos se cachean en localStorage y se invalidan al cambiar sucursal.
 * Migrado a selectores Zustand para evitar re-renders.
 *
 * @param {string} modulo - Módulo a validar: 'agendamiento' | 'pos' | 'inventario'
 * @returns {Object} { tieneAcceso, profesional, isLoading, error }
 */
export function useAccesoModulo(modulo) {
  // Ene 2026: Usar selectores para evitar re-renders
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const {
    tienePermiso: tienePermisoCache,
    setPermisoVerificado,
  } = usePermisosStore();

  // Obtener profesional vinculado
  const {
    data: profesional,
    isLoading: loadingProfesional,
    error: errorProfesional,
    isError: isErrorProfesional
  } = useQuery({
    queryKey: ['profesional-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await profesionalesApi.buscarPorUsuario(user.id);
      return response.data.data || null;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
  });

  // Obtener sucursal del usuario (primera sucursal disponible o la actual)
  const sucursalId = user?.sucursal_id || user?.sucursales?.[0]?.id;

  // Verificar permiso de acceso al módulo
  const codigoPermiso = `${modulo}.acceso`;

  // Consultar cache del store primero
  const permisoCacheado = tienePermisoCache(codigoPermiso, sucursalId);

  const {
    data: permisoData,
    isLoading: loadingPermiso,
    error: errorPermiso
  } = useQuery({
    queryKey: ['permiso', codigoPermiso, sucursalId],
    queryFn: async () => {
      if (!sucursalId) return { tiene: false };

      try {
        const response = await permisosApi.verificar(codigoPermiso, sucursalId);
        const resultado = response.data.data || { tiene: false };

        // Guardar en el store para cache local
        setPermisoVerificado(codigoPermiso, sucursalId, resultado.tiene);

        return resultado;
      } catch (err) {
        // Si el endpoint falla, fallback a lógica por rol
        console.warn(`Error verificando permiso ${codigoPermiso}:`, err);
        return null;
      }
    },
    enabled: isAuthenticated && !!user?.id && !!sucursalId && permisoCacheado === null,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Calcular acceso
  // Prioridad: 1) Cache local, 2) Respuesta de API, 3) Fallback por rol
  const rolesConAccesoCompleto = ['admin', 'propietario', 'super_admin'];
  const tieneAccesoPorRol = rolesConAccesoCompleto.includes(user?.rol);

  let tieneAcceso = false;

  if (permisoCacheado !== null) {
    // Usar cache del store
    tieneAcceso = permisoCacheado;
  } else if (permisoData !== undefined && permisoData !== null) {
    // Usar respuesta de la API
    tieneAcceso = permisoData.tiene === true;
  } else {
    // Fallback: admin/propietario tienen acceso completo
    // Empleados tienen acceso si tienen profesional vinculado
    tieneAcceso = tieneAccesoPorRol || (profesional?.id && user?.rol === 'empleado');
  }

  // Si usamos cache, no estamos cargando el permiso
  const isLoading = loadingProfesional || (permisoCacheado === null && loadingPermiso);
  const error = errorProfesional || errorPermiso;

  return {
    tieneAcceso,
    profesional,
    isLoading,
    error,
    isError: isErrorProfesional || !!errorPermiso,
    // Helpers adicionales
    profesionalId: profesional?.id || null,
    profesionalNombre: profesional?.nombre_completo || null,
    sucursalId,
    // Información de cache
    desdeCache: permisoCacheado !== null,
  };
}

/**
 * Hook para verificar un permiso específico
 * Integrado con permisosStore para cache optimizada
 *
 * @param {string} codigoPermiso - Código del permiso (ej: 'pos.descuentos', 'inventario.ordenes_compra')
 * @param {number} sucursalId - ID de la sucursal (opcional, usa la del usuario si no se especifica)
 * @returns {Object} { tiene, valor, isLoading, error, desdeCache }
 */
export function usePermiso(codigoPermiso, sucursalIdParam) {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const sucursalId = sucursalIdParam || user?.sucursal_id || user?.sucursales?.[0]?.id;

  const {
    tienePermiso: tienePermisoCache,
    setPermisoVerificado,
  } = usePermisosStore();

  // Consultar cache del store primero
  const permisoCacheado = tienePermisoCache(codigoPermiso, sucursalId);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['permiso', codigoPermiso, sucursalId],
    queryFn: async () => {
      if (!sucursalId) return { tiene: false, valor: null };

      const response = await permisosApi.verificar(codigoPermiso, sucursalId);
      const resultado = response.data.data || { tiene: false };

      // Guardar en el store
      setPermisoVerificado(codigoPermiso, sucursalId, resultado.tiene);

      return resultado;
    },
    enabled: isAuthenticated && !!user?.id && !!sucursalId && !!codigoPermiso && permisoCacheado === null,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Roles con acceso completo
  const rolesConAccesoCompleto = ['admin', 'propietario', 'super_admin'];
  const tieneAccesoPorRol = rolesConAccesoCompleto.includes(user?.rol);

  // Determinar si tiene el permiso
  let tiene = false;
  if (tieneAccesoPorRol) {
    tiene = true;
  } else if (permisoCacheado !== null) {
    tiene = permisoCacheado;
  } else if (data?.tiene !== undefined) {
    tiene = data.tiene === true;
  }

  return {
    tiene,
    valor: data?.valor,
    isLoading: permisoCacheado === null && isLoading,
    error,
    isError,
    desdeCache: permisoCacheado !== null,
  };
}

/**
 * Hook para obtener resumen de permisos del usuario
 * Útil para el sidebar/menú
 *
 * @param {number} sucursalId - ID de la sucursal (opcional)
 * @returns {Object} { permisos, isLoading, error }
 */
export function useResumenPermisos(sucursalIdParam) {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const sucursalId = sucursalIdParam || user?.sucursal_id || user?.sucursales?.[0]?.id;

  const { setMultiplesPermisos } = usePermisosStore();

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['permisos-resumen', user?.id, sucursalId],
    queryFn: async () => {
      if (!sucursalId) return {};

      const response = await permisosApi.obtenerResumen(sucursalId);
      const permisos = response.data.data || {};

      // Guardar todos los permisos en el store
      if (permisos && typeof permisos === 'object') {
        const permisosArray = Object.entries(permisos).map(([codigo, tiene]) => ({
          codigo,
          sucursalId,
          tiene: Boolean(tiene),
        }));
        setMultiplesPermisos(permisosArray);
      }

      return permisos;
    },
    enabled: isAuthenticated && !!user?.id && !!sucursalId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    permisos: data || {},
    isLoading,
    error,
    isError,
    refetch,
  };
}

/**
 * Hook para obtener profesional del usuario logueado
 * Útil cuando solo necesitas los datos del profesional, no validar acceso
 *
 * @returns {Object} { profesional, isLoading, error }
 */
export function useProfesionalUsuario() {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    queryKey: ['profesional-usuario', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await profesionalesApi.buscarPorUsuario(user.id);
      return response.data.data || null;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para listar usuarios disponibles para vincular
 * Solo para admins en el formulario de profesionales
 *
 * @returns {Object} { usuarios, isLoading, error }
 */
export function useUsuariosDisponibles() {
  return useQuery({
    queryKey: ['usuarios-disponibles'],
    queryFn: async () => {
      const response = await profesionalesApi.usuariosDisponibles();
      return response.data.data?.usuarios || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para invalidar cache de permisos al cambiar de sucursal
 * Debe usarse en componentes de alto nivel (ej: SucursalSelector)
 *
 * @param {number} sucursalId - ID de la sucursal actual
 */
export function useInvalidarPermisosAlCambiarSucursal(sucursalId) {
  const { invalidarCache } = usePermisosStore();

  useEffect(() => {
    // Invalidar cache cuando cambia la sucursal
    invalidarCache();
  }, [sucursalId, invalidarCache]);
}

export default useAccesoModulo;
