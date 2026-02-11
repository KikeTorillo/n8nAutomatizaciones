/**
 * useCuentasBancarias - Hook de React Query para cuentas bancarias
 * Fase 1 del Plan de Empleados Competitivo - Enero 2026
 * Feb 2026 - Mutations extraídas a helper interno createCuentaBancariaMutation
 * Feb 2026 - Migrado a TypeScript
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { profesionalesApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// ==================== INTERFACES ====================

interface CuentaOption {
  value: string;
  label: string;
}

interface CuentaBancariaData {
  banco?: string;
  clabe?: string;
  numero_cuenta?: string;
  tipo_cuenta?: string;
  uso?: string;
  moneda?: string;
  es_principal?: boolean;
  [key: string]: unknown;
}

interface CuentaBancariaMutationVariables {
  profesionalId: number;
  cuentaId?: number;
  data?: CuentaBancariaData;
}

interface MutationFactoryOptions {
  errorOp?: 'create' | 'update' | 'delete';
  invalidateDetail?: boolean;
}

type CRUDOperation = 'create' | 'update' | 'delete' | 'fetch';

// === Constantes ===
export const TIPOS_CUENTA_BANCARIA: Record<string, CuentaOption> = {
  debito: { value: 'debito', label: 'Débito' },
  ahorro: { value: 'ahorro', label: 'Ahorro' },
  nomina: { value: 'nomina', label: 'Nómina' },
  credito: { value: 'credito', label: 'Crédito' },
} as const;

export const USOS_CUENTA_BANCARIA: Record<string, CuentaOption> = {
  nomina: { value: 'nomina', label: 'Nómina' },
  reembolsos: { value: 'reembolsos', label: 'Reembolsos' },
  comisiones: { value: 'comisiones', label: 'Comisiones' },
  todos: { value: 'todos', label: 'Todos los usos' },
} as const;

export const MONEDAS_CUENTA: Record<string, CuentaOption> = {
  MXN: { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  USD: { value: 'USD', label: 'Dólar USD' },
  COP: { value: 'COP', label: 'Peso Colombiano (COP)' },
  EUR: { value: 'EUR', label: 'Euro (EUR)' },
} as const;

// Query Keys - using centralized queryKeys for base key, local for detail
const QUERY_KEYS = {
  cuentasBancarias: (profesionalId: number) =>
    queryKeys.personas.cuentasBancarias(profesionalId),
  cuentaBancaria: (profesionalId: number, cuentaId: number) =>
    ['cuenta-bancaria', profesionalId, cuentaId] as const,
};

// ==================== QUERIES ====================

/**
 * Lista cuentas bancarias de un profesional
 */
export function useCuentasBancarias(
  profesionalId: number | null | undefined,
  options: Record<string, unknown> = {}
) {
  return useQuery({
    queryKey: QUERY_KEYS.cuentasBancarias(profesionalId!),
    queryFn: async () => {
      const response = await profesionalesApi.listarCuentasBancarias(
        profesionalId!,
        options
      );
      return (response as any).data.data;
    },
    enabled: !!profesionalId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Obtiene una cuenta bancaria específica
 */
export function useCuentaBancaria(
  profesionalId: number | null | undefined,
  cuentaId: number | null | undefined
) {
  return useQuery({
    queryKey: QUERY_KEYS.cuentaBancaria(profesionalId!, cuentaId!),
    queryFn: async () => {
      const response = await profesionalesApi.obtenerCuentaBancaria(
        profesionalId!,
        cuentaId!
      );
      return (response as any).data.data;
    },
    enabled: !!profesionalId && !!cuentaId,
  });
}

// ==================== MUTATION HELPER ====================

/**
 * Factory interna para mutations de cuentas bancarias.
 * Reduce boilerplate de useQueryClient + useMutation + onError.
 */
function createCuentaBancariaMutation(
  mutationFn: (variables: CuentaBancariaMutationVariables) => Promise<unknown>,
  { errorOp = 'update', invalidateDetail = false }: MutationFactoryOptions = {}
) {
  return function useCuentaBancariaMutation() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn,
      onSuccess: (_: unknown, variables: CuentaBancariaMutationVariables) => {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.cuentasBancarias(variables.profesionalId),
          refetchType: 'active',
        });
        if (invalidateDetail && variables.cuentaId) {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.cuentaBancaria(
              variables.profesionalId,
              variables.cuentaId
            ),
            refetchType: 'active',
          });
        }
      },
      onError: createCRUDErrorHandler(
        errorOp as CRUDOperation,
        'cuenta bancaria'
      ),
    });
  };
}

// ==================== MUTATIONS (via factory helper) ====================

/** Crea una nueva cuenta bancaria */
export const useCrearCuentaBancaria = createCuentaBancariaMutation(
  async ({ profesionalId, data }: CuentaBancariaMutationVariables) => {
    const response = await profesionalesApi.crearCuentaBancaria(
      profesionalId,
      data!
    );
    return (response as any).data.data;
  },
  { errorOp: 'create' }
);

/** Actualiza una cuenta bancaria existente */
export const useActualizarCuentaBancaria = createCuentaBancariaMutation(
  async ({
    profesionalId,
    cuentaId,
    data,
  }: CuentaBancariaMutationVariables) => {
    const response = await profesionalesApi.actualizarCuentaBancaria(
      profesionalId,
      cuentaId!,
      data!
    );
    return (response as any).data.data;
  },
  { invalidateDetail: true }
);

/** Elimina una cuenta bancaria */
export const useEliminarCuentaBancaria = createCuentaBancariaMutation(
  async ({ profesionalId, cuentaId }: CuentaBancariaMutationVariables) => {
    const response = await profesionalesApi.eliminarCuentaBancaria(
      profesionalId,
      cuentaId!
    );
    return (response as any).data.data;
  },
  { errorOp: 'delete' }
);

/** Establece una cuenta como principal */
export const useEstablecerCuentaPrincipal = createCuentaBancariaMutation(
  async ({ profesionalId, cuentaId }: CuentaBancariaMutationVariables) => {
    const response = await profesionalesApi.establecerCuentaPrincipal(
      profesionalId,
      cuentaId!
    );
    return (response as any).data.data;
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
