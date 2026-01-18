/**
 * ====================================================================
 * MANAGER: Operaciones de Almacén
 * ====================================================================
 * Hook combinado para gestión de operaciones
 * Ene 2026 - Fragmentación de hooks
 */

import { useSucursalContext } from '@/hooks/factories';
import {
  useOperacionesAlmacen,
  useOperacionesKanban,
  useEstadisticasOperaciones,
} from './queries';
import {
  useCrearOperacion,
  useActualizarOperacion,
  useAsignarOperacion,
  useIniciarOperacion,
  useCompletarOperacion,
  useCancelarOperacion,
  useProcesarItem,
  useCancelarItem,
} from './mutations';

/**
 * Hook combinado para gestión de operaciones de almacén
 * @param {Object} options - { sucursalId, tipoOperacion }
 */
export function useOperacionesAlmacenManager({ sucursalId, tipoOperacion } = {}) {
  const efectiveSucursalId = useSucursalContext(sucursalId);

  // Filtros base
  const filtros = {
    sucursal_id: efectiveSucursalId,
    ...(tipoOperacion && { tipo_operacion: tipoOperacion }),
  };

  // Queries
  const {
    data: operaciones = [],
    isLoading: loadingOperaciones,
    error: errorOperaciones,
    refetch: refetchOperaciones,
  } = useOperacionesAlmacen(filtros);

  const {
    data: kanban = {},
    isLoading: loadingKanban,
  } = useOperacionesKanban(efectiveSucursalId);

  const {
    data: estadisticas = {},
    isLoading: loadingEstadisticas,
  } = useEstadisticasOperaciones(efectiveSucursalId);

  // Mutations
  const crearMutation = useCrearOperacion();
  const actualizarMutation = useActualizarOperacion();
  const asignarMutation = useAsignarOperacion();
  const iniciarMutation = useIniciarOperacion();
  const completarMutation = useCompletarOperacion();
  const cancelarMutation = useCancelarOperacion();
  const procesarItemMutation = useProcesarItem();
  const cancelarItemMutation = useCancelarItem();

  return {
    // Data
    operaciones,
    kanban,
    estadisticas,
    sucursalId: efectiveSucursalId,

    // Loading
    loadingOperaciones,
    loadingKanban,
    loadingEstadisticas,
    isLoading: loadingOperaciones || loadingKanban,

    // Errors
    errorOperaciones,
    hasError: !!errorOperaciones,

    // Actions
    refetch: refetchOperaciones,
    crear: crearMutation.mutateAsync,
    actualizar: actualizarMutation.mutateAsync,
    asignar: asignarMutation.mutateAsync,
    iniciar: iniciarMutation.mutateAsync,
    completar: completarMutation.mutateAsync,
    cancelar: cancelarMutation.mutateAsync,
    procesarItem: procesarItemMutation.mutateAsync,
    cancelarItem: cancelarItemMutation.mutateAsync,

    // Mutation states
    isCreating: crearMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isAssigning: asignarMutation.isPending,
    isStarting: iniciarMutation.isPending,
    isCompleting: completarMutation.isPending,
    isCanceling: cancelarMutation.isPending,
    isProcessingItem: procesarItemMutation.isPending,
  };
}
