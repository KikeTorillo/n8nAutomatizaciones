/**
 * useCuentasBancarias - Hook de React Query para cuentas bancarias
 * Fase 1 del Plan de Empleados Competitivo - Enero 2026
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profesionalesApi } from '@/services/api/endpoints';

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

// Query Keys
const QUERY_KEYS = {
  cuentasBancarias: (profesionalId) => ['cuentas-bancarias', profesionalId],
  cuentaBancaria: (profesionalId, cuentaId) => ['cuenta-bancaria', profesionalId, cuentaId],
};

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
    staleTime: 30 * 1000, // 30 segundos
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

/**
 * Crea una nueva cuenta bancaria
 */
export function useCrearCuentaBancaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, data }) => {
      const response = await profesionalesApi.crearCuentaBancaria(profesionalId, data);
      return response.data.data;
    },
    onSuccess: (data, { profesionalId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cuentasBancarias(profesionalId) });
    },
  });
}

/**
 * Actualiza una cuenta bancaria existente
 */
export function useActualizarCuentaBancaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, cuentaId, data }) => {
      const response = await profesionalesApi.actualizarCuentaBancaria(profesionalId, cuentaId, data);
      return response.data.data;
    },
    onSuccess: (data, { profesionalId, cuentaId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cuentasBancarias(profesionalId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cuentaBancaria(profesionalId, cuentaId) });
    },
  });
}

/**
 * Elimina una cuenta bancaria
 */
export function useEliminarCuentaBancaria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, cuentaId }) => {
      const response = await profesionalesApi.eliminarCuentaBancaria(profesionalId, cuentaId);
      return response.data.data;
    },
    onSuccess: (data, { profesionalId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cuentasBancarias(profesionalId) });
    },
  });
}

/**
 * Establece una cuenta como principal
 */
export function useEstablecerCuentaPrincipal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profesionalId, cuentaId }) => {
      const response = await profesionalesApi.establecerCuentaPrincipal(profesionalId, cuentaId);
      return response.data.data;
    },
    onSuccess: (data, { profesionalId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cuentasBancarias(profesionalId) });
    },
  });
}

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
