/**
 * useCuentasBancarias - Hook de React Query para cuentas bancarias
 * Fase 1 del Plan de Empleados Competitivo - Enero 2026
 * Feb 2026 - Mutations extraídas a helper interno createCuentaBancariaMutation
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// === Constantes ===
export const TIPOS_CUENTA_BANCARIA = {
  debito: { value: 'debito', label: 'Débito' },
  ahorro: { value: 'ahorro', label: 'Ahorro' },
  nomina: { value: 'nomina', label: 'Nómina' },
  credito: { value: 'credito', label: 'Crédito' },
};

export const USOS_CUENTA_BANCARIA = {
  nomina: { value: 'nomina', label: 'Nómina' },
  reembolsos: { value: 'reembolsos', label: 'Reembolsos' },
  comisiones: { value: 'comisiones', label: 'Comisiones' },
  todos: { value: 'todos', label: 'Todos los usos' },
};

export const MONEDAS_CUENTA = {
  MXN: { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  USD: { value: 'USD', label: 'Dólar USD' },
  COP: { value: 'COP', label: 'Peso Colombiano (COP)' },
  EUR: { value: 'EUR', label: 'Euro (EUR)' },
};

// Query Keys - using centralized queryKeys for base key, local for detail
const QUERY_KEYS = {
  cuentasBancarias: (profesionalId) => queryKeys.personas.cuentasBancarias(profesionalId),
  cuentaBancaria: (profesionalId, cuentaId) => ['cuenta-bancaria', profesionalId, cuentaId],
};

// ==================== QUERIES ====================

/**
 * Lista cuentas bancarias de un profesional
 * @param {number} profesionalId - ID del profesional
 * @param {Object} options - Opciones de query
 */
export function useCuentasBancarias(profesionalId, options = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.cuentasBancarias(profesionalId),
    queryFn: async () => {
      const response = await profesionalesApi.listarCuentasBancarias(profesionalId, options);
      return response.data.data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Obtiene una cuenta bancaria específica
 * @param {number} profesionalId - ID del profesional
 * @param {number} cuentaId - ID de la cuenta
 */
export function useCuentaBancaria(profesionalId, cuentaId) {
  return useQuery({
    queryKey: QUERY_KEYS.cuentaBancaria(profesionalId, cuentaId),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerCuentaBancaria(profesionalId, cuentaId);
      return response.data.data;
    },
    enabled: !!profesionalId && !!cuentaId,
  });
}

// ==================== MUTATION HELPER ====================

/**
 * Factory interna para mutations de cuentas bancarias.
 * Reduce boilerplate de useQueryClient + useMutation + onError.
 */
function createCuentaBancariaMutation(mutationFn, { errorOp = 'update', invalidateDetail = false } = {}) {
  return function useCuentaBancariaMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cuentasBancarias(variables.profesionalId), refetchType: 'active' });
        if (invalidateDetail && variables.cuentaId) {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cuentaBancaria(variables.profesionalId, variables.cuentaId), refetchType: 'active' });
        }
      },
      onError: createCRUDErrorHandler(errorOp, 'cuenta bancaria'),
    });
  };
}

// ==================== MUTATIONS (via factory helper) ====================

/** Crea una nueva cuenta bancaria */
export const useCrearCuentaBancaria = createCuentaBancariaMutation(
  async ({ profesionalId, data }) => {
    const response = await profesionalesApi.crearCuentaBancaria(profesionalId, data);
    return response.data.data;
  },
  { errorOp: 'create' }
);

/** Actualiza una cuenta bancaria existente */
export const useActualizarCuentaBancaria = createCuentaBancariaMutation(
  async ({ profesionalId, cuentaId, data }) => {
    const response = await profesionalesApi.actualizarCuentaBancaria(profesionalId, cuentaId, data);
    return response.data.data;
  },
  { invalidateDetail: true }
);

/** Elimina una cuenta bancaria */
export const useEliminarCuentaBancaria = createCuentaBancariaMutation(
  async ({ profesionalId, cuentaId }) => {
    const response = await profesionalesApi.eliminarCuentaBancaria(profesionalId, cuentaId);
    return response.data.data;
  },
  { errorOp: 'delete' }
);

/** Establece una cuenta como principal */
export const useEstablecerCuentaPrincipal = createCuentaBancariaMutation(
  async ({ profesionalId, cuentaId }) => {
    const response = await profesionalesApi.establecerCuentaPrincipal(profesionalId, cuentaId);
    return response.data.data;
  }
);

export default {
  useCuentasBancarias,
  useCuentaBancaria,
  useCrearCuentaBancaria,
  useActualizarCuentaBancaria,
  useEliminarCuentaBancaria,
  useEstablecerCuentaPrincipal,
  TIPOS_CUENTA_BANCARIA,
  USOS_CUENTA_BANCARIA,
  MONEDAS_CUENTA,
};
