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
import { usuariosApi } from '@/services/api/endpoints';

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
      // Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await usuariosApi.listarConFiltros(sanitizedParams);
      // Backend retorna: { success, data: { data: [...], pagination, resumen } }
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
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
    staleTime: 1000 * 60 * 5,
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
    staleTime: 1000 * 60 * 2, // 2 minutos
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
      queryClient.invalidateQueries(['usuarios']);
      queryClient.invalidateQueries(['profesionales-sin-usuario']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        409: 'Ya existe un usuario con ese email',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear usuarios',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error inesperado';
      throw new Error(message);
    },
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
      queryClient.invalidateQueries(['usuarios']);
      queryClient.invalidateQueries(['usuario', data.usuario?.id]);
      // Si afectó un profesional, invalidar también
      if (data.profesional) {
        queryClient.invalidateQueries(['profesionales']);
        queryClient.invalidateQueries(['profesional', data.profesional.id]);
      }
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw new Error('Error al cambiar estado del usuario');
    },
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
      queryClient.invalidateQueries(['usuarios']);
      queryClient.invalidateQueries(['usuario', data.usuario?.id]);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Usuario no encontrado',
        400: 'Rol no válido',
        403: 'No tienes permisos para cambiar roles',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al cambiar rol');
    },
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
      queryClient.invalidateQueries(['usuarios']);
      queryClient.invalidateQueries(['usuario', data.usuario?.id]);
      queryClient.invalidateQueries(['profesionales-sin-usuario']);
      queryClient.invalidateQueries(['profesionales']);
      if (data.profesional) {
        queryClient.invalidateQueries(['profesional', data.profesional.id]);
      }
      if (data.profesional_anterior) {
        queryClient.invalidateQueries(['profesional', data.profesional_anterior]);
      }
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw new Error(error.response?.status === 409
        ? 'El profesional ya está vinculado a otro usuario'
        : 'Error al vincular profesional');
    },
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
      queryClient.invalidateQueries(['usuarios']);
      queryClient.invalidateQueries(['usuario', data.id]);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw new Error('Error al actualizar usuario');
    },
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
