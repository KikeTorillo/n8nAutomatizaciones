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
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales-sin-usuario'] });
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
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.usuario?.id] });
      // Si afectó un profesional, invalidar también
      if (data.profesional) {
        queryClient.invalidateQueries({ queryKey: ['profesionales'] });
        queryClient.invalidateQueries({ queryKey: ['profesional', data.profesional.id] });
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
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.usuario?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.usuario?.id] });
      queryClient.invalidateQueries({ queryKey: ['profesionales-sin-usuario'] });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      if (data.profesional) {
        queryClient.invalidateQueries({ queryKey: ['profesional', data.profesional.id] });
      }
      if (data.profesional_anterior) {
        queryClient.invalidateQueries({ queryKey: ['profesional', data.profesional_anterior] });
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
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', data.id] });
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
  propietario: {
    label: 'Propietario',
    description: 'Acceso operativo completo',
    color: 'blue',
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
