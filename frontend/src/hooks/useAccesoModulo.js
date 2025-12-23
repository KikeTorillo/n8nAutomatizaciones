import { useQuery } from '@tanstack/react-query';
import { profesionalesApi, permisosApi } from '@/services/api/endpoints';
import useAuthStore from '@/store/authStore';

/**
 * Hook para validar acceso a módulos y obtener profesional vinculado
 *
 * ACTUALIZADO Dic 2025:
 * Los permisos ahora se gestionan via sistema normalizado en BD
 * (permisos_catalogo, permisos_rol, permisos_usuario_sucursal)
 *
 * El hook ahora consulta la API de permisos para validación real.
 *
 * @param {string} modulo - Módulo a validar: 'agendamiento' | 'pos' | 'inventario'
 * @returns {Object} { tieneAcceso, profesional, isLoading, error }
 */
export function useAccesoModulo(modulo) {
  const { user, isAuthenticated } = useAuthStore();

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
        return response.data.data || { tiene: false };
      } catch (err) {
        // Si el endpoint falla, fallback a lógica por rol
        console.warn(`Error verificando permiso ${codigoPermiso}:`, err);
        return null;
      }
    },
    enabled: isAuthenticated && !!user?.id && !!sucursalId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Calcular acceso
  // Prioridad: 1) Respuesta de API, 2) Fallback por rol
  const rolesConAccesoCompleto = ['admin', 'propietario', 'super_admin'];
  const tieneAccesoPorRol = rolesConAccesoCompleto.includes(user?.rol);

  let tieneAcceso = false;
  if (permisoData !== undefined && permisoData !== null) {
    // Usar respuesta de la API
    tieneAcceso = permisoData.tiene === true;
  } else {
    // Fallback: admin/propietario tienen acceso completo
    // Empleados tienen acceso si tienen profesional vinculado
    tieneAcceso = tieneAccesoPorRol || (profesional?.id && user?.rol === 'empleado');
  }

  const isLoading = loadingProfesional || loadingPermiso;
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
  };
}

/**
 * Hook para verificar un permiso específico
 *
 * @param {string} codigoPermiso - Código del permiso (ej: 'pos.descuentos', 'inventario.ordenes_compra')
 * @param {number} sucursalId - ID de la sucursal (opcional, usa la del usuario si no se especifica)
 * @returns {Object} { tiene, valor, isLoading, error }
 */
export function usePermiso(codigoPermiso, sucursalIdParam) {
  const { user, isAuthenticated } = useAuthStore();
  const sucursalId = sucursalIdParam || user?.sucursal_id || user?.sucursales?.[0]?.id;

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['permiso', codigoPermiso, sucursalId],
    queryFn: async () => {
      if (!sucursalId) return { tiene: false, valor: null };

      const response = await permisosApi.verificar(codigoPermiso, sucursalId);
      return response.data.data || { tiene: false };
    },
    enabled: isAuthenticated && !!user?.id && !!sucursalId && !!codigoPermiso,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Roles con acceso completo
  const rolesConAccesoCompleto = ['admin', 'propietario', 'super_admin'];
  const tieneAccesoPorRol = rolesConAccesoCompleto.includes(user?.rol);

  return {
    tiene: tieneAccesoPorRol || data?.tiene === true,
    valor: data?.valor,
    isLoading,
    error,
    isError,
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
  const { user, isAuthenticated } = useAuthStore();
  const sucursalId = sucursalIdParam || user?.sucursal_id || user?.sucursales?.[0]?.id;

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['permisos-resumen', user?.id, sucursalId],
    queryFn: async () => {
      if (!sucursalId) return {};

      const response = await permisosApi.obtenerResumen(sucursalId);
      return response.data.data || {};
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
  const { user, isAuthenticated } = useAuthStore();

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

export default useAccesoModulo;
