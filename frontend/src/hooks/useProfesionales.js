import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profesionalesApi } from '@/services/api/endpoints';

/**
 * Hook para listar profesionales con filtros
 * @param {Object} params - { activo, busqueda, estado, departamento_id, rol_usuario, etc. }
 */
export function useProfesionales(params = {}) {
  return useQuery({
    queryKey: ['profesionales', params],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        // Excluir: "", null, undefined
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await profesionalesApi.listar(sanitizedParams);

      // Backend retorna: { success, data: { profesionales: [...], total, filtros_aplicados } }
      return response.data.data.profesionales || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener profesional por ID
 */
export function useProfesional(id) {
  return useQuery({
    queryKey: ['profesional', id],
    queryFn: async () => {
      const response = await profesionalesApi.obtener(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para crear profesional
 */
export function useCrearProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
      };
      const response = await profesionalesApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar múltiples queries
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['profesionales-dashboard']);
      queryClient.invalidateQueries(['estadisticas']);
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;

      // Si el backend envió un mensaje específico (ej: límite de plan), usarlo
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      // Fallback a mensajes genéricos por código de error
      const errorMessages = {
        409: 'Ya existe un profesional con ese email o teléfono',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear profesionales',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error inesperado';

      // Re-throw con mensaje amigable
      throw new Error(message);
    },
  });
}

/**
 * Hook para actualizar profesional
 */
export function useActualizarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        email: data.email?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        descripcion: data.descripcion?.trim() || undefined,
      };
      const response = await profesionalesApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profesional', data.id]);
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['profesionales-dashboard']);
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Profesional no encontrado',
        400: 'Datos inválidos',
        409: 'Ya existe un profesional con ese email o teléfono',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error al actualizar';

      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar profesional (soft delete)
 */
export function useEliminarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await profesionalesApi.eliminar(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['profesionales-dashboard']);
      queryClient.invalidateQueries(['estadisticas']);
    },
    onError: (error) => {
      // Priorizar mensaje del backend si existe
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Profesional no encontrado',
        400: 'No se puede eliminar el profesional (puede tener citas asociadas)',
        500: 'Error del servidor',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar profesional';

      throw new Error(message);
    },
  });
}

/**
 * Hook para buscar profesionales (búsqueda rápida)
 */
export function useBuscarProfesionales(termino, options = {}) {
  return useQuery({
    queryKey: ['buscar-profesionales', termino, options],
    queryFn: async () => {
      const params = {
        busqueda: termino,
        ...options,
      };
      const response = await profesionalesApi.listar(params);
      return response.data.data.profesionales || [];
    },
    enabled: termino.length >= 2, // Solo buscar si hay al menos 2 caracteres
    staleTime: 1000 * 30, // 30 segundos
  });
}

// ====================================================================
// HOOKS PARA MODELO UNIFICADO PROFESIONAL-USUARIO (Nov 2025)
// ====================================================================

/**
 * Hook para listar profesionales por módulo habilitado
 * @param {string} modulo - 'agendamiento' | 'pos' | 'inventario'
 * @param {Object} options - { activos: boolean }
 */
export function useProfesionalesPorModulo(modulo, options = {}) {
  return useQuery({
    queryKey: ['profesionales-modulo', modulo, options],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorModulo(modulo, options);
      return response.data.data?.profesionales || [];
    },
    enabled: !!modulo,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para vincular/desvincular usuario a profesional
 */
export function useVincularUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, usuarioId }) => {
      const response = await profesionalesApi.vincularUsuario(profesionalId, usuarioId);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profesional', data.id]);
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['usuarios-disponibles']);
      queryClient.invalidateQueries(['profesional-usuario']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw new Error(error.response?.status === 409
        ? 'El usuario ya está vinculado a otro profesional'
        : 'Error al vincular usuario');
    },
  });
}

/**
 * Hook para actualizar módulos habilitados de un profesional
 */
export function useActualizarModulos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, modulosAcceso }) => {
      const response = await profesionalesApi.actualizarModulos(profesionalId, modulosAcceso);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profesional', data.id]);
      queryClient.invalidateQueries(['profesionales']);
      queryClient.invalidateQueries(['profesionales-modulo']);
      queryClient.invalidateQueries(['profesional-usuario']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al actualizar módulos');
    },
  });
}

// ====================================================================
// HOOKS PARA GESTIÓN DE EMPLEADOS - FILTROS (Dic 2025)
// ====================================================================

/**
 * Hook para listar profesionales por estado laboral
 * @param {string} estado - 'activo' | 'vacaciones' | 'incapacidad' | 'suspendido' | 'baja'
 * @param {Object} options - Filtros adicionales
 */
export function useProfesionalesPorEstado(estado, options = {}) {
  return useQuery({
    queryKey: ['profesionales', { estado, ...options }],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorEstado(estado, options);
      return response.data.data?.profesionales || [];
    },
    enabled: !!estado,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para listar profesionales por departamento
 * @param {number} departamentoId
 * @param {Object} options - Filtros adicionales
 */
export function useProfesionalesPorDepartamento(departamentoId, options = {}) {
  return useQuery({
    queryKey: ['profesionales', { departamento_id: departamentoId, ...options }],
    queryFn: async () => {
      const response = await profesionalesApi.listarPorDepartamento(departamentoId, options);
      return response.data.data?.profesionales || [];
    },
    enabled: !!departamentoId,
    staleTime: 1000 * 60 * 5,
  });
}

// ====================================================================
// HOOKS PARA JERARQUÍA ORGANIZACIONAL (Dic 2025)
// ====================================================================

/**
 * Hook para obtener subordinados de un profesional
 * @param {number} profesionalId
 * @param {Object} options - { directos_solo?: boolean }
 */
export function useSubordinados(profesionalId, options = {}) {
  return useQuery({
    queryKey: ['profesional-subordinados', profesionalId, options],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerSubordinados(profesionalId, options);
      return response.data.data?.subordinados || [];
    },
    enabled: !!profesionalId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener cadena de supervisores de un profesional
 * @param {number} profesionalId
 */
export function useCadenaSupervisores(profesionalId) {
  return useQuery({
    queryKey: ['profesional-supervisores', profesionalId],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerCadenaSupervisores(profesionalId);
      return response.data.data?.supervisores || [];
    },
    enabled: !!profesionalId,
    staleTime: 1000 * 60 * 5,
  });
}

// ====================================================================
// HOOKS PARA CATEGORÍAS DE PROFESIONAL (M:N) (Dic 2025)
// ====================================================================

/**
 * Hook para obtener categorías de un profesional
 * @param {number} profesionalId
 */
export function useCategoriasDeProfesional(profesionalId) {
  return useQuery({
    queryKey: ['profesional-categorias', profesionalId],
    queryFn: async () => {
      const response = await profesionalesApi.obtenerCategorias(profesionalId);
      return response.data.data?.categorias || [];
    },
    enabled: !!profesionalId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para asignar categoría a un profesional
 */
export function useAsignarCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, categoriaId }) => {
      const response = await profesionalesApi.asignarCategoria(profesionalId, categoriaId);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['profesional-categorias', variables.profesionalId]);
      queryClient.invalidateQueries(['profesional', variables.profesionalId]);
      queryClient.invalidateQueries(['categoria-profesionales']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);
      throw new Error(error.response?.status === 409
        ? 'El profesional ya tiene asignada esta categoría'
        : 'Error al asignar categoría');
    },
  });
}

/**
 * Hook para eliminar categoría de un profesional
 */
export function useEliminarCategoriaDeProf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, categoriaId }) => {
      await profesionalesApi.eliminarCategoria(profesionalId, categoriaId);
      return { profesionalId, categoriaId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['profesional-categorias', variables.profesionalId]);
      queryClient.invalidateQueries(['profesional', variables.profesionalId]);
      queryClient.invalidateQueries(['categoria-profesionales']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al eliminar categoría');
    },
  });
}

/**
 * Hook para sincronizar categorías de un profesional (reemplaza todas)
 */
export function useSincronizarCategorias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, categoriaIds }) => {
      const response = await profesionalesApi.sincronizarCategorias(profesionalId, categoriaIds);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['profesional-categorias', variables.profesionalId]);
      queryClient.invalidateQueries(['profesional', variables.profesionalId]);
      queryClient.invalidateQueries(['categoria-profesionales']);
      queryClient.invalidateQueries(['categorias-profesional']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      throw new Error(backendMessage || 'Error al sincronizar categorías');
    },
  });
}

// ====================================================================
// CONSTANTES PARA GESTIÓN DE EMPLEADOS
// ====================================================================
// NOTA (Dic 2025): TIPOS_EMPLEADO eliminado.
// La capacidad de supervisar se determina por el ROL del usuario
// (admin/propietario pueden supervisar, empleado no).
// ====================================================================

export const ESTADOS_LABORALES = {
  activo: { label: 'Activo', color: 'green' },
  vacaciones: { label: 'Vacaciones', color: 'blue' },
  incapacidad: { label: 'Incapacidad', color: 'yellow' },
  suspendido: { label: 'Suspendido', color: 'red' },
  baja: { label: 'Baja', color: 'gray' },
};

export const TIPOS_CONTRATACION = {
  tiempo_completo: { label: 'Tiempo completo', color: 'green' },
  medio_tiempo: { label: 'Medio tiempo', color: 'blue' },
  temporal: { label: 'Temporal', color: 'yellow' },
  contrato: { label: 'Por contrato', color: 'purple' },
  freelance: { label: 'Freelance', color: 'gray' },
};

export const GENEROS = {
  masculino: { label: 'Masculino' },
  femenino: { label: 'Femenino' },
  otro: { label: 'Otro' },
  no_especificado: { label: 'No especificado' },
};

export const ESTADOS_CIVILES = {
  soltero: { label: 'Soltero/a' },
  casado: { label: 'Casado/a' },
  divorciado: { label: 'Divorciado/a' },
  viudo: { label: 'Viudo/a' },
  union_libre: { label: 'Unión libre' },
};

// ====================================================================
// CONSTANTES PARA COMPENSACIÓN (Ene 2026)
// ====================================================================

export const FORMAS_PAGO = {
  comision: { label: 'Solo comisión', color: 'purple' },
  salario: { label: 'Solo salario', color: 'blue' },
  mixto: { label: 'Salario + Comisión', color: 'green' },
};

// ====================================================================
// CONSTANTES PARA IDIOMAS (Ene 2026)
// ====================================================================

export const IDIOMAS_DISPONIBLES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'fr', label: 'Francés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'de', label: 'Alemán' },
  { value: 'it', label: 'Italiano' },
  { value: 'zh', label: 'Chino Mandarín' },
  { value: 'ja', label: 'Japonés' },
  { value: 'ko', label: 'Coreano' },
  { value: 'ar', label: 'Árabe' },
  { value: 'ru', label: 'Ruso' },
  { value: 'nah', label: 'Náhuatl' },
  { value: 'maya', label: 'Maya' },
];
