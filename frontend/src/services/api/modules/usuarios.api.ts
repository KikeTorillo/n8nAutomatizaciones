import { AxiosResponse } from 'axios';
import apiClient from '../client';
import type {
  Usuario,
  RolUsuario,
  CrearUsuarioData,
  ActualizarUsuarioData,
  AsignacionUbicacion,
} from '@/types/entities/usuario';
import type { ApiResponse, ApiListResponse } from '@/types/entities/common';

// ========== Request Types ==========

interface ListarUsuariosParams {
  rol?: RolUsuario;
  activo?: boolean;
  buscar?: string;
  page?: number;
  limit?: number;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
}

interface CambiarEstadoRequest {
  activo: boolean;
}

interface CambiarRolRequest {
  rol: RolUsuario;
}

interface VincularProfesionalRequest {
  profesional_id: number | null;
}

interface AsignarUbicacionRequest {
  ubicacion_id: number;
  es_default?: boolean;
  puede_recibir?: boolean;
  puede_despachar?: boolean;
}

interface ActualizarAsignacionRequest {
  es_default?: boolean;
  puede_recibir?: boolean;
  puede_despachar?: boolean;
}

// ========== Response Types ==========

type UsuarioResponse = AxiosResponse<ApiResponse<Usuario>>;
type UsuarioListResponse = AxiosResponse<ApiListResponse<Usuario>>;
type AsignacionResponse = AxiosResponse<ApiResponse<AsignacionUbicacion>>;

// ========== API ==========

export const usuariosApi = {
  /** Crear usuario (registro) */
  crear: (data: CrearUsuarioData): Promise<UsuarioResponse> =>
    apiClient.post('/usuarios', data),

  /** Obtener usuario por ID */
  obtener: (id: number): Promise<UsuarioResponse> =>
    apiClient.get(`/usuarios/${id}`),

  /** Listar usuarios */
  listar: (): Promise<UsuarioListResponse> =>
    apiClient.get('/usuarios'),

  /** Actualizar usuario */
  actualizar: (id: number, data: ActualizarUsuarioData): Promise<UsuarioResponse> =>
    apiClient.put(`/usuarios/${id}`, data),

  // ========== Gestion de Usuarios - Dic 2025 ==========

  /** Listar usuarios con filtros y paginacion */
  listarConFiltros: (params: ListarUsuariosParams = {}): Promise<UsuarioListResponse> =>
    apiClient.get('/usuarios', { params }),

  /** Crear usuario directamente (sin invitacion) */
  crearDirecto: (data: CrearUsuarioData): Promise<UsuarioResponse> =>
    apiClient.post('/usuarios/directo', data),

  /** Cambiar estado activo de usuario */
  cambiarEstado: (id: number, activo: boolean): Promise<UsuarioResponse> =>
    apiClient.patch(`/usuarios/${id}/estado`, { activo }),

  /** Cambiar rol de usuario */
  cambiarRol: (id: number, rol: RolUsuario): Promise<UsuarioResponse> =>
    apiClient.patch(`/usuarios/${id}/rol`, { rol }),

  /** Vincular o desvincular profesional a usuario */
  vincularProfesional: (id: number, profesionalId: number | null): Promise<UsuarioResponse> =>
    apiClient.patch(`/usuarios/${id}/vincular-profesional`, { profesional_id: profesionalId }),

  /** Obtener profesionales sin usuario vinculado (para selector) */
  profesionalesDisponibles: (): Promise<AxiosResponse> =>
    apiClient.get('/usuarios/profesionales-disponibles'),

  /** Obtener usuarios sin profesional vinculado */
  sinProfesional: (): Promise<AxiosResponse> =>
    apiClient.get('/usuarios/sin-profesional'),

  // ========== Gestion de Ubicaciones de Usuario - Ene 2026 ==========

  /** Obtener ubicaciones asignadas a un usuario */
  obtenerUbicaciones: (usuarioId: number): Promise<AxiosResponse<ApiResponse<AsignacionUbicacion[]>>> =>
    apiClient.get(`/usuarios/${usuarioId}/ubicaciones`),

  /** Obtener ubicaciones disponibles para asignar a un usuario */
  ubicacionesDisponibles: (usuarioId: number): Promise<AxiosResponse> =>
    apiClient.get(`/usuarios/${usuarioId}/ubicaciones-disponibles`),

  /** Asignar ubicacion a usuario */
  asignarUbicacion: (usuarioId: number, data: AsignarUbicacionRequest): Promise<AsignacionResponse> =>
    apiClient.post(`/usuarios/${usuarioId}/ubicaciones`, data),

  /** Actualizar permisos de asignacion de ubicacion */
  actualizarAsignacionUbicacion: (usuarioId: number, ubicacionId: number, data: ActualizarAsignacionRequest): Promise<AsignacionResponse> =>
    apiClient.patch(`/usuarios/${usuarioId}/ubicaciones/${ubicacionId}`, data),

  /** Desasignar ubicacion de usuario */
  desasignarUbicacion: (usuarioId: number, ubicacionId: number): Promise<AxiosResponse> =>
    apiClient.delete(`/usuarios/${usuarioId}/ubicaciones/${ubicacionId}`),
};
