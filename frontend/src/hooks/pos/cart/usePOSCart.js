import { useToast } from '@/hooks/utils';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { useAuthStore, selectUser } from '@/features/auth';

import { usePOSCartState } from './usePOSCartState';
import { usePOSCartCalculations } from './usePOSCartCalculations';
import { usePOSCartHandlers } from './usePOSCartHandlers';

/**
 * Hook centralizado para el estado del carrito del POS
 *
 * Ene 2026: Refactorizado en 4 módulos:
 * - usePOSCartState: Estado puro del carrito
 * - usePOSCartCalculations: Cálculos derivados (useMemos)
 * - usePOSCartHandlers: Handlers de manipulación
 *
 * API pública sin cambios - VentaPOSPage.jsx funciona igual.
 *
 * @param {Object} options
 * @param {boolean} options.hayPromocionExclusiva - Si hay promoción exclusiva activa
 * @param {number} options.descuentoPromociones - Descuento total de promociones
 */
export function usePOSCart({ hayPromocionExclusiva = false, descuentoPromociones = 0 } = {}) {
  const toast = useToast();
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const user = useAuthStore(selectUser);
  const sucursalId = getSucursalId() || user?.sucursal_id;

  // Estado base
  const state = usePOSCartState();

  // Cálculos derivados
  const calculations = usePOSCartCalculations({
    items: state.items,
    descuentoGlobal: state.descuentoGlobal,
    cuponActivo: state.cuponActivo,
    descuentoPuntos: state.descuentoPuntos,
    clienteSeleccionado: state.clienteSeleccionado,
    hayPromocionExclusiva,
    descuentoPromociones,
  });

  // Handlers
  const handlers = usePOSCartHandlers({
    // Estado
    items: state.items,
    setItems: state.setItems,
    clienteSeleccionado: state.clienteSeleccionado,
    setClienteSeleccionado: state.setClienteSeleccionado,
    cuponActivo: state.cuponActivo,
    setCuponActivo: state.setCuponActivo,
    setDescuentoGlobal: state.setDescuentoGlobal,
    setDescuentoPuntos: state.setDescuentoPuntos,
    setPuntosCanjeados: state.setPuntosCanjeados,
    setRecalculandoPrecios: state.setRecalculandoPrecios,
    // Cache
    preciosCache: state.preciosCache,
    CACHE_TTL: state.CACHE_TTL,
    clienteIdRef: state.clienteIdRef,
    // Contexto
    sucursalId,
    toast,
  });

  return {
    // Estado
    items: state.items,
    clienteSeleccionado: state.clienteSeleccionado,
    cuponActivo: state.cuponActivo,
    descuentoGlobal: state.descuentoGlobal,
    descuentoPuntos: state.descuentoPuntos,
    puntosCanjeados: state.puntosCanjeados,
    recalculandoPrecios: state.recalculandoPrecios,

    // Cálculos derivados
    ...calculations,

    // Setters directos
    setClienteSeleccionado: state.setClienteSeleccionado,
    setDescuentoGlobal: state.setDescuentoGlobal,

    // Handlers
    ...handlers,
  };
}

export default usePOSCart;
