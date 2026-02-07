import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { customFieldsApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== DEFINICIONES ====================

/**
 * Hook para listar definiciones de campos personalizados
 * @param {Object} params - { entidad_tipo?, activo?, seccion?, visible_en_formulario?, visible_en_listado? }
 */
export function useCustomFieldsDefiniciones(params = {}) {
  return useQuery({
    queryKey: queryKeys.sistema.customFields.definiciones(params),
    queryFn: async () => {
      // Sanitizar params
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await customFieldsApi.listarDefiniciones(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener definición por ID
 */
export function useCustomFieldDefinicion(id) {
  return useQuery({
    queryKey: ['custom-field-definicion', id],
    queryFn: async () => {
      const response = await customFieldsApi.obtenerDefinicion(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para crear definición de campo
 */
export function useCrearCustomFieldDefinicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await customFieldsApi.crearDefinicion(sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definiciones'], refetchType: 'active' });
      if (variables.entidad_tipo) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sistema.customFields.definiciones({ entidad_tipo: variables.entidad_tipo }), refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('create', 'Campo personalizado'),
  });
}

/**
 * Hook para actualizar definición de campo
 */
export function useActualizarCustomFieldDefinicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // Sanitizar campos opcionales
      const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value === '' ? null : value;
        }
        return acc;
      }, {});

      const response = await customFieldsApi.actualizarDefinicion(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definicion', data.id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definiciones'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Campo personalizado'),
  });
}

/**
 * Hook para eliminar definición de campo
 */
export function useEliminarCustomFieldDefinicion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
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
    mutationFn: async ({ entidadTipo, orden }) => {
      const response = await customFieldsApi.reordenarDefiniciones({
        entidad_tipo: entidadTipo,
        orden,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.customFields.definiciones({ entidad_tipo: variables.entidadTipo }), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Campos'),
  });
}

// ==================== VALORES ====================

/**
 * Hook para obtener valores de campos personalizados de una entidad
 * @param {string} entidadTipo - cliente, profesional, servicio, etc.
 * @param {number} entidadId - ID de la entidad
 */
export function useCustomFieldsValores(entidadTipo, entidadId) {
  return useQuery({
    queryKey: queryKeys.sistema.customFields.valores(entidadTipo, entidadId),
    queryFn: async () => {
      const response = await customFieldsApi.obtenerValores(entidadTipo, entidadId);
      return response.data.data || [];
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
    mutationFn: async ({ entidadTipo, entidadId, valores }) => {
      const response = await customFieldsApi.guardarValores(entidadTipo, entidadId, valores);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sistema.customFields.valores(variables.entidadTipo, variables.entidadId), refetchType: 'active' });
    },
    onError: (error) => {
      // Si hay errores de validación, retornarlos
      const errores = error.response?.data?.data?.errores;
      if (errores && errores.length > 0) {
        const errorMessages = errores.map(e => `${e.campo}: ${e.error}`).join(', ');
        throw new Error(errorMessages);
      }

      // Usar el handler estándar para otros errores
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
    mutationFn: async ({ entidadTipo, valores }) => {
      const response = await customFieldsApi.validarValores(entidadTipo, valores);
      return response.data.data;
    },
  });
}

// ==================== UTILIDADES ====================

/**
 * Hook para obtener secciones disponibles
 */
export function useCustomFieldsSecciones(entidadTipo) {
  return useQuery({
    queryKey: ['custom-fields-secciones', entidadTipo],
    queryFn: async () => {
      const response = await customFieldsApi.obtenerSecciones(entidadTipo);
      return response.data.data || [];
    },
    enabled: !!entidadTipo,
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos
  });
}

// ==================== CONSTANTES ====================

/**
 * Tipos de datos soportados para campos personalizados
 */
export const CUSTOM_FIELD_TIPOS_DATO = [
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
];

/**
 * Tipos de entidad que soportan campos personalizados
 */
export const CUSTOM_FIELD_ENTIDAD_TIPOS = [
  { value: 'cliente', label: 'Clientes', icon: 'Users' },
  { value: 'profesional', label: 'Profesionales', icon: 'UserCheck' },
  { value: 'servicio', label: 'Servicios', icon: 'Scissors' },
  { value: 'producto', label: 'Productos', icon: 'Package' },
  { value: 'cita', label: 'Citas', icon: 'CalendarCheck' },
  { value: 'evento_digital', label: 'Eventos digitales', icon: 'PartyPopper' },
  { value: 'invitado_evento', label: 'Invitados a eventos', icon: 'UserPlus' },
];

/**
 * Anchos de columna disponibles (grid de 12)
 */
export const CUSTOM_FIELD_ANCHOS = [
  { value: 3, label: '1/4 ancho' },
  { value: 4, label: '1/3 ancho' },
  { value: 6, label: '1/2 ancho' },
  { value: 8, label: '2/3 ancho' },
  { value: 12, label: 'Ancho completo' },
];
