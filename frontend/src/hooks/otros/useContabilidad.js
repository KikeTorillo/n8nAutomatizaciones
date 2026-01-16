import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contabilidadApi } from '@/services/api/endpoints';
import { useToast } from '../utils/useToast';

/**
 * ====================================================================
 * HOOKS - CONTABILIDAD
 * ====================================================================
 * Hooks React Query para el módulo de contabilidad.
 * - Dashboard
 * - Cuentas contables (catálogo SAT)
 * - Asientos contables (libro diario)
 * - Períodos contables
 * - Reportes financieros
 */

// ====================================================================
// DASHBOARD
// ====================================================================

/**
 * Hook para obtener dashboard contable
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useDashboardContabilidad() {
  return useQuery({
    queryKey: ['contabilidad', 'dashboard'],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerDashboard();
      return response.data?.data || {};
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
}

// ====================================================================
// CUENTAS CONTABLES
// ====================================================================

/**
 * Hook para listar cuentas contables
 * @param {Object} params - { tipo?, naturaleza?, nivel?, cuenta_padre_id?, activo?, afectable?, busqueda?, pagina?, limite? }
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useCuentasContables(params = {}) {
  return useQuery({
    queryKey: ['contabilidad', 'cuentas', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await contabilidadApi.listarCuentas(sanitizedParams);
      return {
        cuentas: response.data?.data?.cuentas || [],
        paginacion: response.data?.data?.paginacion || {},
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener árbol jerárquico de cuentas
 * @param {Object} params - { solo_activas? }
 * @returns {Object} { data, isLoading, error }
 */
export function useArbolCuentas(params = {}) {
  return useQuery({
    queryKey: ['contabilidad', 'cuentas', 'arbol', params],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerArbolCuentas(params);
      // La API devuelve el array directamente en data
      return response.data?.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutos (el árbol cambia poco)
  });
}

/**
 * Hook para obtener cuentas afectables (para selects)
 * @param {Object} params - { tipo? }
 * @returns {Object} { data, isLoading, error }
 */
export function useCuentasAfectables(params = {}) {
  return useQuery({
    queryKey: ['contabilidad', 'cuentas', 'afectables', params],
    queryFn: async () => {
      const response = await contabilidadApi.listarCuentasAfectables(params);
      // El controlador devuelve el array directamente en data
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener cuenta por ID
 * @param {number} id
 * @returns {Object} { data, isLoading, error }
 */
export function useCuenta(id) {
  return useQuery({
    queryKey: ['contabilidad', 'cuentas', id],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerCuenta(id);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear cuenta contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useCrearCuenta() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const sanitizedData = {
        ...data,
        codigo_sat: data.codigo_sat?.trim() || undefined,
        cuenta_padre_id: data.cuenta_padre_id || undefined,
      };

      const response = await contabilidadApi.crearCuenta(sanitizedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Cuenta creada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al crear la cuenta';
      showError(mensaje);
    },
  });
}

/**
 * Hook para actualizar cuenta contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useActualizarCuenta() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const sanitizedData = {
        ...data,
        codigo_sat: data.codigo_sat?.trim() || undefined,
      };

      const response = await contabilidadApi.actualizarCuenta(id, sanitizedData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'cuentas', variables.id] });
      success('Cuenta actualizada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al actualizar la cuenta';
      showError(mensaje);
    },
  });
}

/**
 * Hook para eliminar cuenta contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useEliminarCuenta() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await contabilidadApi.eliminarCuenta(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Cuenta eliminada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al eliminar la cuenta';
      showError(mensaje);
    },
  });
}

/**
 * Hook para inicializar catálogo SAT
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useInicializarCatalogoSAT() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async () => {
      const response = await contabilidadApi.inicializarCatalogoSAT();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'cuentas'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success(`Catálogo SAT inicializado: ${data?.data?.cuentas_creadas || 0} cuentas creadas`);
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al inicializar catálogo SAT';
      showError(mensaje);
    },
  });
}

// ====================================================================
// ASIENTOS CONTABLES
// ====================================================================

/**
 * Hook para listar asientos contables
 * @param {Object} params - { estado?, tipo?, periodo_id?, fecha_desde?, fecha_hasta?, busqueda?, pagina?, limite? }
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useAsientosContables(params = {}) {
  return useQuery({
    queryKey: ['contabilidad', 'asientos', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await contabilidadApi.listarAsientos(sanitizedParams);
      return {
        asientos: response.data?.data?.asientos || [],
        paginacion: response.data?.data?.paginacion || {},
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener asiento por ID
 * @param {number} id
 * @param {string} fecha - YYYY-MM-DD (requerido para tabla particionada)
 * @returns {Object} { data, isLoading, error }
 */
export function useAsiento(id, fecha) {
  return useQuery({
    queryKey: ['contabilidad', 'asientos', id, fecha],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerAsiento(id, fecha);
      return response.data?.data;
    },
    enabled: !!id && !!fecha,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para crear asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useCrearAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const sanitizedData = {
        ...data,
        notas: data.notas?.trim() || undefined,
        referencia_tipo: data.referencia_tipo?.trim() || undefined,
        referencia_id: data.referencia_id || undefined,
        periodo_id: data.periodo_id || undefined,
        movimientos: data.movimientos.map((m) => ({
          ...m,
          concepto: m.concepto?.trim() || undefined,
          tercero_tipo: m.tercero_tipo || undefined,
          tercero_id: m.tercero_id || undefined,
        })),
      };

      const response = await contabilidadApi.crearAsiento(sanitizedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'asientos'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Asiento creado exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al crear el asiento';
      showError(mensaje);
    },
  });
}

/**
 * Hook para actualizar asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useActualizarAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha, ...data }) => {
      const sanitizedData = {
        ...data,
        notas: data.notas?.trim() || undefined,
        movimientos: data.movimientos?.map((m) => ({
          ...m,
          concepto: m.concepto?.trim() || undefined,
          tercero_tipo: m.tercero_tipo || undefined,
          tercero_id: m.tercero_id || undefined,
        })),
      };

      const response = await contabilidadApi.actualizarAsiento(id, fecha, sanitizedData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'asientos'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'asientos', variables.id] });
      success('Asiento actualizado exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al actualizar el asiento';
      showError(mensaje);
    },
  });
}

/**
 * Hook para publicar asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function usePublicarAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha }) => {
      const response = await contabilidadApi.publicarAsiento(id, fecha);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'asientos'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Asiento publicado exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al publicar el asiento';
      showError(mensaje);
    },
  });
}

/**
 * Hook para anular asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useAnularAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha, motivo }) => {
      const response = await contabilidadApi.anularAsiento(id, fecha, { motivo });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'asientos'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Asiento anulado exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al anular el asiento';
      showError(mensaje);
    },
  });
}

/**
 * Hook para eliminar asiento contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useEliminarAsiento() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, fecha }) => {
      const response = await contabilidadApi.eliminarAsiento(id, fecha);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'asientos'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Asiento eliminado exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al eliminar el asiento';
      showError(mensaje);
    },
  });
}

// ====================================================================
// PERÍODOS CONTABLES
// ====================================================================

/**
 * Hook para listar períodos contables
 * @param {Object} params - { anio? }
 * @returns {Object} { data, isLoading, error }
 */
export function usePeriodosContables(params = {}) {
  return useQuery({
    queryKey: ['contabilidad', 'periodos', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await contabilidadApi.listarPeriodos(sanitizedParams);
      // El controlador devuelve el array directamente en data
      return response.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para cerrar período contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useCerrarPeriodo() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await contabilidadApi.cerrarPeriodo(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'periodos'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Período cerrado exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al cerrar el período';
      showError(mensaje);
    },
  });
}

// ====================================================================
// REPORTES FINANCIEROS
// ====================================================================

/**
 * Hook para obtener Balanza de Comprobación
 * @param {number} periodoId
 * @returns {Object} { data, isLoading, error }
 */
export function useBalanzaComprobacion(periodoId) {
  return useQuery({
    queryKey: ['contabilidad', 'reportes', 'balanza', periodoId],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerBalanza(periodoId);
      return response.data?.data;
    },
    enabled: !!periodoId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener Libro Mayor de una cuenta
 * @param {number} cuentaId
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 * @returns {Object} { data, isLoading, error }
 */
export function useLibroMayor(cuentaId, fechaInicio, fechaFin) {
  return useQuery({
    queryKey: ['contabilidad', 'reportes', 'libro-mayor', cuentaId, fechaInicio, fechaFin],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerLibroMayor(cuentaId, fechaInicio, fechaFin);
      return response.data?.data;
    },
    enabled: !!cuentaId && !!fechaInicio && !!fechaFin,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener Estado de Resultados
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 * @returns {Object} { data, isLoading, error }
 */
export function useEstadoResultados(fechaInicio, fechaFin) {
  return useQuery({
    queryKey: ['contabilidad', 'reportes', 'estado-resultados', fechaInicio, fechaFin],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerEstadoResultados(fechaInicio, fechaFin);
      return response.data?.data;
    },
    enabled: !!fechaInicio && !!fechaFin,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener Balance General
 * @param {string} fecha - YYYY-MM-DD
 * @returns {Object} { data, isLoading, error }
 */
export function useBalanceGeneral(fecha) {
  return useQuery({
    queryKey: ['contabilidad', 'reportes', 'balance-general', fecha],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerBalanceGeneral(fecha);
      return response.data?.data;
    },
    enabled: !!fecha,
    staleTime: 5 * 60 * 1000,
  });
}

// ====================================================================
// CONFIGURACIÓN
// ====================================================================

/**
 * Hook para obtener configuración contable
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useConfiguracionContable() {
  return useQuery({
    queryKey: ['contabilidad', 'configuracion'],
    queryFn: async () => {
      const response = await contabilidadApi.obtenerConfiguracion();
      return response.data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para actualizar configuración contable
 * @returns {Object} { mutate, mutateAsync, isPending, error }
 */
export function useActualizarConfiguracion() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await contabilidadApi.actualizarConfiguracion(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'configuracion'] });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'dashboard'] });
      success('Configuración actualizada exitosamente');
    },
    onError: (error) => {
      const mensaje = error.response?.data?.message || error.response?.data?.error || 'Error al actualizar la configuración';
      showError(mensaje);
    },
  });
}

// ====================================================================
// EXPORT DEFAULT
// ====================================================================

export default {
  // Dashboard
  useDashboardContabilidad,

  // Cuentas
  useCuentasContables,
  useArbolCuentas,
  useCuentasAfectables,
  useCuenta,
  useCrearCuenta,
  useActualizarCuenta,
  useEliminarCuenta,
  useInicializarCatalogoSAT,

  // Asientos
  useAsientosContables,
  useAsiento,
  useCrearAsiento,
  useActualizarAsiento,
  usePublicarAsiento,
  useAnularAsiento,
  useEliminarAsiento,

  // Períodos
  usePeriodosContables,
  useCerrarPeriodo,

  // Reportes
  useBalanzaComprobacion,
  useLibroMayor,
  useEstadoResultados,
  useBalanceGeneral,

  // Configuración
  useConfiguracionContable,
  useActualizarConfiguracion,
};
