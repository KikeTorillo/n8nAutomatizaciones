/**
 * ====================================================================
 * HOOK - useUsuarios
 * ====================================================================
 *
 * Hook para gestión de usuarios estilo Odoo (res.users)
 * Fase 5.2 - Diciembre 2025
 *
 * Modelo Odoo:
 * - Usuario = acceso al sistema (res.users)
 * - Profesional = datos laborales (hr.employee)
 * - Relación 1:1 opcional
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { usuariosApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { sanitizeParams } from '@/lib/params';

// ====================================================================
// QUERIES
// ====================================================================

/**
 * Hook para listar usuarios con filtros y paginación
 * @param {Object} params - { rol?, activo?, buscar?, page?, limit? }
 */
export function useUsuarios(params = {}) {
  return useQuery({
    queryKey: ['usuarios', params],
    queryFn: async () => {
      const response = await usuariosApi.listarConFiltros(sanitizeParams(params));
      // Backend retorna: { success, data: { data: [...], pagination, resumen } }
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener usuario por ID
 * @param {number} id
 */
export function useUsuario(id) {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      const response = await usuariosApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener profesionales sin usuario vinculado (para selector)
 */
export function useProfesionalesSinUsuario() {
  return useQuery({
    queryKey: ['profesionales-sin-usuario'],
    queryFn: async () => {
      const response = await usuariosApi.profesionalesDisponibles();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener usuarios sin profesional vinculado
 * Dic 2025: Para vincular usuario existente al crear profesional
 */
export function useUsuariosSinProfesional() {
  return useQuery({
    queryKey: ['usuarios-sin-profesional'],
    queryFn: async () => {
      const response = await usuariosApi.sinProfesional();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

// ====================================================================
// MUTATIONS
// ====================================================================

/**
 * Hook para crear usuario directamente (sin invitación)
 * Similar a crear res.users en Odoo
 */
export function useCrearUsuarioDirecto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        apellidos: data.apellidos?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        profesional_id: data.profesional_id || undefined,
      };
      const response = await usuariosApi.crearDirecto(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['profesionales-sin-usuario'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Usuario', {
      409: 'Ya existe un usuario con ese email',
    }),
  });
}

/**
 * Hook para cambiar estado activo de usuario
 * Cuando se desactiva, también desactiva el profesional vinculado
 */
export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }) => {
      const response = await usuariosApi.cambiarEstado(id, activo);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.usuario?.id], refetchType: 'active' });
      // Si afectó un profesional, invalidar también
      if (data.profesional) {
        queryClient.invalidateQueries({ queryKey: ['profesionales'], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['profesional', data.profesional.id], refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('update', 'Usuario'),
  });
}

/**
 * Hook para cambiar rol de usuario
 */
export function useCambiarRolUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rol }) => {
      const response = await usuariosApi.cambiarRol(id, rol);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.usuario?.id], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Usuario', {
      400: 'Rol no válido',
    }),
  });
}

/**
 * Hook para vincular/desvincular profesional a usuario
 */
export function useVincularProfesionalAUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profesionalId }) => {
      const response = await usuariosApi.vincularProfesional(id, profesionalId);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.usuario?.id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['profesionales-sin-usuario'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['profesionales'], refetchType: 'active' });
      if (data.profesional) {
        queryClient.invalidateQueries({ queryKey: ['profesional', data.profesional.id], refetchType: 'active' });
      }
      if (data.profesional_anterior) {
        queryClient.invalidateQueries({ queryKey: ['profesional', data.profesional_anterior], refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('update', 'Usuario', {
      409: 'El profesional ya está vinculado a otro usuario',
    }),
  });
}

/**
 * Hook para actualizar usuario
 */
export function useActualizarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        ...data,
        apellidos: data.apellidos?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
      };
      const response = await usuariosApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.id], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Usuario'),
  });
}

// ====================================================================
// CONSTANTES
// ====================================================================

export const ROLES_USUARIO = {
  admin: {
    label: 'Administrador',
    description: 'Acceso total a la organización',
    color: 'purple',
  },
  empleado: {
    label: 'Empleado',
    description: 'Acceso limitado según permisos',
    color: 'green',
  },
};

export const ESTADOS_USUARIO = {
  activo: { label: 'Activo', color: 'green' },
  inactivo: { label: 'Inactivo', color: 'gray' },
};

// ====================================================================
// UBICACIONES DE USUARIO - Ene 2026
// ====================================================================

/**
 * Hook para obtener ubicaciones asignadas a un usuario
 * @param {number} usuarioId - ID del usuario
 */
export function useUbicacionesUsuario(usuarioId) {
  return useQuery({
    queryKey: ['usuario-ubicaciones', usuarioId],
    queryFn: async () => {
      const response = await usuariosApi.obtenerUbicaciones(usuarioId);
      return response.data.data || [];
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener ubicaciones disponibles para asignar a un usuario
 * Solo ubicaciones de sucursales donde el usuario está asignado
 * @param {number} usuarioId - ID del usuario
 */
export function useUbicacionesDisponiblesUsuario(usuarioId) {
  return useQuery({
    queryKey: ['usuario-ubicaciones-disponibles', usuarioId],
    queryFn: async () => {
      const response = await usuariosApi.ubicacionesDisponibles(usuarioId);
      return response.data.data || [];
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para asignar ubicación a usuario
 */
export function useAsignarUbicacionUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, data }) => {
      const response = await usuariosApi.asignarUbicacion(usuarioId, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones', variables.usuarioId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones-disponibles', variables.usuarioId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Asignación de ubicación', {
      400: 'El usuario no está asignado a la sucursal de esta ubicación',
    }),
  });
}

/**
 * Hook para actualizar permisos de asignación de ubicación
 */
export function useActualizarAsignacionUbicacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, ubicacionId, data }) => {
      const response = await usuariosApi.actualizarAsignacionUbicacion(usuarioId, ubicacionId, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones', variables.usuarioId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Asignación de ubicación'),
  });
}

/**
 * Hook para desasignar ubicación de usuario
 */
export function useDesasignarUbicacionUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, ubicacionId }) => {
      const response = await usuariosApi.desasignarUbicacion(usuarioId, ubicacionId);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones', variables.usuarioId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones-disponibles', variables.usuarioId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Asignación de ubicación'),
  });
}
