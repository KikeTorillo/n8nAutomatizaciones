/**
 * ====================================================================
 * HOOKS CUSTOM FIELDS
 * ====================================================================
 *
 * Definiciones, valores, validacion y utilidades de campos personalizados.
 * Migrado a TypeScript - Feb 2026
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { customFieldsApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== TIPOS ====================

interface CustomFieldDefinicionParams {
  entidad_tipo?: string;
  activo?: boolean;
  seccion?: string;
  visible_en_formulario?: boolean;
  visible_en_listado?: boolean;
}

interface CustomFieldDefinicion {
  id: number;
  nombre: string;
  nombre_clave: string;
  entidad_tipo: string;
  tipo_dato: string;
  opciones?: string[];
  requerido: boolean;
  valor_defecto?: unknown;
  seccion?: string;
  orden: number;
  visible_en_formulario: boolean;
  visible_en_listado: boolean;
  activo: boolean;
  ancho?: number;
}

interface CrearDefinicionData {
  nombre: string;
  entidad_tipo: string;
  tipo_dato: string;
  opciones?: string[];
  requerido?: boolean;
  valor_defecto?: unknown;
  seccion?: string;
  visible_en_formulario?: boolean;
  visible_en_listado?: boolean;
  ancho?: number;
}

interface ActualizarDefinicionParams {
  id: number;
  data: Partial<CrearDefinicionData>;
}

interface ReordenarDefinicionesParams {
  entidadTipo: string;
  orden: Array<{ id: number; orden: number }>;
}

interface GuardarValoresParams {
  entidadTipo: string;
  entidadId: number;
  valores: Record<string, unknown>;
}

interface ValidarValoresParams {
  entidadTipo: string;
  valores: Record<string, unknown>;
}

interface ValidationError {
  campo: string;
  error: string;
}

/** Error de API con response HTTP */
interface ApiError extends Error {
  response?: {
    data?: {
      data?: {
        errores?: ValidationError[];
      };
    };
  };
}

interface TipoDatoOption {
  value: string;
  label: string;
  icon: string;
}

interface EntidadTipoOption {
  value: string;
  label: string;
  icon: string;
}

interface AnchoOption {
  value: number;
  label: string;
}

// ==================== DEFINICIONES ====================

/**
 * Hook para listar definiciones de campos personalizados
 */
export function useCustomFieldsDefiniciones(params: CustomFieldDefinicionParams = {}) {
  return useQuery({
    queryKey: queryKeys.sistema.customFields.definiciones(params),
    queryFn: async () => {
      // Sanitizar params
      const sanitizedParams = Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await customFieldsApi.listarDefiniciones(sanitizedParams);
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener definicion por ID
 */
export function useCustomFieldDefinicion(id: number | null | undefined) {
  return useQuery({
    queryKey: ['custom-field-definicion', id],
    queryFn: async () => {
      const response = await customFieldsApi.obtenerDefinicion(id!);
      return (response as any).data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para crear definicion de campo
 */
export function useCrearCustomFieldDefinicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearDefinicionData) => {
      // Sanitizar campos opcionales vacios
      const sanitized = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await customFieldsApi.crearDefinicion(sanitized);
      return (response as any).data.data;
    },
    onSuccess: (_: unknown, variables: CrearDefinicionData) => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definiciones'], refetchType: 'active' });
      if (variables.entidad_tipo) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sistema.customFields.definiciones({ entidad_tipo: variables.entidad_tipo }), refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('create', 'Campo personalizado'),
  });
}

/**
 * Hook para actualizar definicion de campo
 */
export function useActualizarCustomFieldDefinicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: ActualizarDefinicionParams) => {
      // Sanitizar campos opcionales
      const sanitized = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value === '' ? null : value;
        }
        return acc;
      }, {});

      const response = await customFieldsApi.actualizarDefinicion(id, sanitized);
      return (response as any).data.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definicion', data.id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definiciones'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Campo personalizado'),
  });
}

/**
 * Hook para eliminar definicion de campo
 */
export function useEliminarCustomFieldDefinicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await customFieldsApi.eliminarDefinicion(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definiciones'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Campo personalizado'),
  });
}

/**
 * Hook para reordenar definiciones
 */
export function useReordenarCustomFieldDefiniciones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entidadTipo, orden }: ReordenarDefinicionesParams) => {
      const response = await customFieldsApi.reordenarDefiniciones({
        entidad_tipo: entidadTipo,
        orden,
      });
      return (response as any).data.data;
    },
    onSuccess: (_: unknown, variables: ReordenarDefinicionesParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.customFields.definiciones({ entidad_tipo: variables.entidadTipo }), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Campos'),
  });
}

// ==================== VALORES ====================

/**
 * Hook para obtener valores de campos personalizados de una entidad
 */
export function useCustomFieldsValores(entidadTipo: string | null | undefined, entidadId: number | null | undefined) {
  return useQuery({
    queryKey: queryKeys.sistema.customFields.valores(entidadTipo, entidadId),
    queryFn: async () => {
      const response = await customFieldsApi.obtenerValores(entidadTipo!, entidadId!);
      return (response as any).data.data || [];
    },
    enabled: !!entidadTipo && !!entidadId,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para guardar valores de campos personalizados
 */
export function useGuardarCustomFieldsValores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entidadTipo, entidadId, valores }: GuardarValoresParams) => {
      const response = await customFieldsApi.guardarValores(entidadTipo, entidadId, valores);
      return (response as any).data.data;
    },
    onSuccess: (_: unknown, variables: GuardarValoresParams) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.customFields.valores(variables.entidadTipo, variables.entidadId), refetchType: 'active' });
    },
    onError: (error: Error) => {
      // Si hay errores de validacion, retornarlos
      const apiError = error as ApiError;
      const errores = apiError.response?.data?.data?.errores;
      if (errores && errores.length > 0) {
        const errorMessages = errores.map((e) => `${e.campo}: ${e.error}`).join(', ');
        throw new Error(errorMessages);
      }

      // Usar el handler estandar para otros errores
      const handler = createCRUDErrorHandler('update', 'Campos personalizados');
      handler(error);
    },
  });
}

/**
 * Hook para validar valores de campos personalizados (sin guardar)
 */
export function useValidarCustomFieldsValores() {
  return useMutation({
    mutationFn: async ({ entidadTipo, valores }: ValidarValoresParams) => {
      const response = await customFieldsApi.validarValores(entidadTipo, valores);
      return (response as any).data.data;
    },
  });
}

// ==================== UTILIDADES ====================

/**
 * Hook para obtener secciones disponibles
 */
export function useCustomFieldsSecciones(entidadTipo: string | null | undefined) {
  return useQuery({
    queryKey: ['custom-fields-secciones', entidadTipo],
    queryFn: async () => {
      const response = await customFieldsApi.obtenerSecciones(entidadTipo!);
      return (response as any).data.data || [];
    },
    enabled: !!entidadTipo,
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos
  });
}

// ==================== CONSTANTES ====================

/**
 * Tipos de datos soportados para campos personalizados
 */
export const CUSTOM_FIELD_TIPOS_DATO: readonly TipoDatoOption[] = [
  { value: 'texto', label: 'Texto corto', icon: 'Type' },
  { value: 'texto_largo', label: 'Texto largo', icon: 'AlignLeft' },
  { value: 'numero', label: 'Numero', icon: 'Hash' },
  { value: 'fecha', label: 'Fecha', icon: 'Calendar' },
  { value: 'hora', label: 'Hora', icon: 'Clock' },
  { value: 'booleano', label: 'Si/No', icon: 'ToggleLeft' },
  { value: 'select', label: 'Lista desplegable', icon: 'ChevronDown' },
  { value: 'multiselect', label: 'Seleccion multiple', icon: 'CheckSquare' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'telefono', label: 'Telefono', icon: 'Phone' },
  { value: 'url', label: 'URL', icon: 'Link' },
  { value: 'archivo', label: 'Archivo', icon: 'Paperclip' },
] as const;

/**
 * Tipos de entidad que soportan campos personalizados
 */
export const CUSTOM_FIELD_ENTIDAD_TIPOS: readonly EntidadTipoOption[] = [
  { value: 'cliente', label: 'Clientes', icon: 'Users' },
  { value: 'profesional', label: 'Profesionales', icon: 'UserCheck' },
  { value: 'servicio', label: 'Servicios', icon: 'Scissors' },
  { value: 'producto', label: 'Productos', icon: 'Package' },
  { value: 'cita', label: 'Citas', icon: 'CalendarCheck' },
  { value: 'evento_digital', label: 'Eventos digitales', icon: 'PartyPopper' },
  { value: 'invitado_evento', label: 'Invitados a eventos', icon: 'UserPlus' },
] as const;

/**
 * Anchos de columna disponibles (grid de 12)
 */
export const CUSTOM_FIELD_ANCHOS: readonly AnchoOption[] = [
  { value: 3, label: '1/4 ancho' },
  { value: 4, label: '1/3 ancho' },
  { value: 6, label: '1/2 ancho' },
  { value: 8, label: '2/3 ancho' },
  { value: 12, label: 'Ancho completo' },
] as const;
