/**
 * Manager: Batch Picking (Wave Picking)
 * Hook combinado para gestión de batch picking
 */

import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import {
  useBatchPickings,
  useBatchesPendientes,
  useOperacionesDisponiblesParaBatch,
} from './queries';
import {
  useCrearBatch,
  useActualizarBatch,
  useEliminarBatch,
  useAgregarOperacionBatch,
  useQuitarOperacionBatch,
  useIniciarBatch,
  useProcesarItemBatch,
  useCompletarBatch,
  useCancelarBatch,
} from './mutations';

/**
 * Hook combinado para gestión de batch picking
 * @param {Object} options - { sucursalId }
 */
export function useBatchPickingManager({ sucursalId } = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  // Queries
  const {
    data: batches = [],
    isLoading: loadingBatches,
    error: errorBatches,
    refetch: refetchBatches,
  } = useBatchPickings({ sucursal_id: efectiveSucursalId });

  const {
    data: pendientes = [],
    isLoading: loadingPendientes,
  } = useBatchesPendientes(efectiveSucursalId);

  const {
    data: operacionesDisponibles = [],
    isLoading: loadingOperacionesDisponibles,
    refetch: refetchOperacionesDisponibles,
  } = useOperacionesDisponiblesParaBatch(efectiveSucursalId);

  // Mutations
  const crearMutation = useCrearBatch();
  const actualizarMutation = useActualizarBatch();
  const eliminarMutation = useEliminarBatch();
  const agregarOperacionMutation = useAgregarOperacionBatch();
  const quitarOperacionMutation = useQuitarOperacionBatch();
  const iniciarMutation = useIniciarBatch();
  const procesarItemMutation = useProcesarItemBatch();
  const completarMutation = useCompletarBatch();
  const cancelarMutation = useCancelarBatch();

  return {
    // Data
    batches,
    pendientes,
    operacionesDisponibles,
    sucursalId: efectiveSucursalId,

    // Loading
    loadingBatches,
    loadingPendientes,
    loadingOperacionesDisponibles,
    isLoading: loadingBatches || loadingPendientes,

    // Errors
    errorBatches,
    hasError: !!errorBatches,

    // Actions
    refetch: refetchBatches,
    refetchOperacionesDisponibles,
    crear: crearMutation.mutateAsync,
    actualizar: actualizarMutation.mutateAsync,
    eliminar: eliminarMutation.mutateAsync,
    agregarOperacion: agregarOperacionMutation.mutateAsync,
    quitarOperacion: quitarOperacionMutation.mutateAsync,
    iniciar: iniciarMutation.mutateAsync,
    procesarItem: procesarItemMutation.mutateAsync,
    completar: completarMutation.mutateAsync,
    cancelar: cancelarMutation.mutateAsync,

    // Mutation states
    isCreating: crearMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isDeleting: eliminarMutation.isPending,
    isAddingOperation: agregarOperacionMutation.isPending,
    isRemovingOperation: quitarOperacionMutation.isPending,
    isStarting: iniciarMutation.isPending,
    isProcessingItem: procesarItemMutation.isPending,
    isCompleting: completarMutation.isPending,
    isCanceling: cancelarMutation.isPending,
  };
}
