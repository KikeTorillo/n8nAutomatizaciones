/**
 * ====================================================================
 * FACTORY PARA HOOKS CRUD
 * ====================================================================
 *
 * Genera hooks CRUD estandarizados para reducir duplicación de código.
 *
 * Ene 2026 - Refactorización Frontend
 *
 * @example
 * const {
 *   useList,
 *   useDetail,
 *   useCreate,
 *   useUpdate,
 *   useDelete,
 *   useListActive,
 * } = createCRUDHooks({
 *   name: 'proveedor',
 *   namePlural: 'proveedores',
 *   api: inventarioApi,
 *   baseKey: 'proveedores',
 *   apiMethods: {
 *     list: 'listarProveedores',
 *     get: 'obtenerProveedor',
 *     create: 'crearProveedor',
 *     update: 'actualizarProveedor',
 *     delete: 'eliminarProveedor',
 *   },
 *   sanitize: (data) => ({
 *     ...data,
 *     razon_social: data.razon_social?.trim() || undefined,
 *   }),
 *   invalidateOnCreate: ['proveedores'],
 *   invalidateOnUpdate: ['proveedores'],
 *   invalidateOnDelete: ['proveedores'],
 *   errorMessages: {
 *     create: { 409: 'Ya existe un proveedor con ese RFC' },
 *   },
 *   staleTime: STALE_TIMES.SEMI_STATIC,
 *   responseKey: 'proveedores', // Key en response.data.data.proveedores
 * });
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { sanitizeParams } from '@/lib/params';
import { sanitizeFields } from '@/lib/sanitize';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Factory para crear hooks CRUD estandarizados
 *
 * @param {Object} config - Configuración del CRUD
 * @param {string} config.name - Nombre singular de la entidad (ej: 'proveedor')
 * @param {string} config.namePlural - Nombre plural (ej: 'proveedores')
 * @param {Object} config.api - Objeto API con los métodos
 * @param {string} config.baseKey - Key base para React Query (ej: 'proveedores')
 * @param {Object} config.apiMethods - Mapeo de métodos API
 * @param {string} config.apiMethods.list - Método para listar
 * @param {string} config.apiMethods.get - Método para obtener detalle
 * @param {string} config.apiMethods.create - Método para crear
 * @param {string} config.apiMethods.update - Método para actualizar
 * @param {string} config.apiMethods.delete - Método para eliminar
 * @param {Function} [config.sanitize] - Función para sanitizar datos antes de enviar
 * @param {string[]} [config.invalidateOnCreate] - Query keys a invalidar al crear
 * @param {string[]} [config.invalidateOnUpdate] - Query keys a invalidar al actualizar
 * @param {string[]} [config.invalidateOnDelete] - Query keys a invalidar al eliminar
 * @param {Object} [config.errorMessages] - Mensajes de error personalizados por operación
 * @param {number} [config.staleTime] - Tiempo de cache (default: SEMI_STATIC)
 * @param {string} [config.responseKey] - Key en la respuesta para extraer datos
 * @param {boolean} [config.usePreviousData] - Mantener datos previos durante paginación (placeholderData)
 * @param {Function} [config.transformList] - Transformar respuesta del list
 * @param {Function} [config.transformDetail] - Transformar respuesta del detail
 *
 * @returns {Object} Hooks CRUD generados
 */
export function createCRUDHooks(config) {
  const {
    name,
    namePlural,
    api,
    baseKey,
    apiMethods,
    sanitize = (data) => data,
    invalidateOnCreate = [baseKey],
    invalidateOnUpdate = [baseKey],
    invalidateOnDelete = [baseKey],
    errorMessages = {},
    staleTime = STALE_TIMES.SEMI_STATIC,
    responseKey,
    usePreviousData = true,
    transformList,
    transformDetail,
  } = config;

  // Capitalizar para mensajes de error
  const entityName = name.charAt(0).toUpperCase() + name.slice(1);

  /**
   * Hook para listar entidades con filtros
   */
  function useList(params = {}) {
    return useQuery({
      queryKey: [baseKey, params],
      queryFn: async () => {
        const response = await api[apiMethods.list](sanitizeParams(params));
        const data = response.data.data;
        // Soportar múltiples ubicaciones de paginación:
        // - response.data.pagination (legacy)
        // - response.data.meta (BaseCrudController)
        // - data.paginacion (modelos que retornan { items: [], paginacion: {} })
        const pagination = response.data.pagination || response.data.meta || data?.paginacion || data?.pagination;

        // Si hay transformList, usarlo (pasar data y pagination)
        if (transformList) {
          return transformList(data, pagination);
        }

        // Si responseKey está definido, extraer de ahí
        if (responseKey) {
          return {
            [responseKey]: data[responseKey] || data,
            total: data.total || pagination?.total || (data[responseKey]?.length ?? 0),
            paginacion: pagination,
          };
        }

        // Por defecto retornar data directamente (backwards compatible)
        return data;
      },
      staleTime,
      placeholderData: usePreviousData ? keepPreviousData : undefined,
    });
  }

  /**
   * Hook para obtener entidad por ID
   */
  function useDetail(id) {
    return useQuery({
      queryKey: [name, id],
      queryFn: async () => {
        const response = await api[apiMethods.get](id);
        const data = response.data.data;
        return transformDetail ? transformDetail(data) : data;
      },
      enabled: !!id,
      staleTime,
    });
  }

  /**
   * Hook para crear entidad
   */
  function useCreate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data) => {
        const sanitized = sanitize(data);
        const response = await api[apiMethods.create](sanitized);
        return response.data.data;
      },
      onSuccess: () => {
        invalidateOnCreate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });
      },
      onError: createCRUDErrorHandler('create', entityName, errorMessages.create || {}),
    });
  }

  /**
   * Hook para actualizar entidad
   */
  function useUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }) => {
        const sanitized = sanitize(data);
        const response = await api[apiMethods.update](id, sanitized);
        return response.data.data;
      },
      onSuccess: (_, variables) => {
        // Invalidar queries configuradas
        invalidateOnUpdate.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });
        // Siempre invalidar el detalle específico
        queryClient.invalidateQueries({ queryKey: [name, variables.id], refetchType: 'active' });
      },
      onError: createCRUDErrorHandler('update', entityName, errorMessages.update || {}),
    });
  }

  /**
   * Hook para eliminar entidad
   */
  function useDelete() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id) => {
        const response = await api[apiMethods.delete](id);
        return response?.data?.data ?? id;
      },
      onSuccess: () => {
        invalidateOnDelete.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
        });
      },
      onError: createCRUDErrorHandler('delete', entityName, errorMessages.delete || {}),
    });
  }

  /**
   * Hook auxiliar para listar solo activos
   */
  function useListActive(extraParams = {}) {
    return useList({ activo: true, ...extraParams });
  }

  return {
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
    useListActive,
    // Aliases con nombres más descriptivos
    [`use${namePlural.charAt(0).toUpperCase() + namePlural.slice(1)}`]: useList,
    [`use${entityName}`]: useDetail,
    [`useCrear${entityName}`]: useCreate,
    [`useActualizar${entityName}`]: useUpdate,
    [`useEliminar${entityName}`]: useDelete,
    [`use${namePlural.charAt(0).toUpperCase() + namePlural.slice(1)}Activos`]: useListActive,
  };
}

/**
 * Helper para crear funciones de sanitización
 * Wrapper sobre sanitizeFields para compatibilidad con API existente
 *
 * @param {Array} fields - Array de campos: string o { name, type }
 * @returns {Function} - Función sanitizadora
 */
export function createSanitizer(fields) {
  const config = {};

  fields.forEach((field) => {
    if (typeof field === 'string') {
      config[field] = 'string';
    } else if (typeof field === 'object') {
      config[field.name] = field.type;
    }
  });

  return (data) => sanitizeFields(data, config);
}

/**
 * Helper para crear invalidaciones con keys adicionales
 */
export function createInvalidator(baseKeys, additionalKeys = []) {
  return [...baseKeys, ...additionalKeys];
}

export default createCRUDHooks;
