/**
 * ====================================================================
 * useFreePositionManager
 * ====================================================================
 * Gestiona el store de posición libre (Wix-style) y las transiciones
 * entre modo libre y modos tradicionales (canvas/bloques).
 *
 * Extraído de InvitacionEditorContext para reducir complejidad.
 *
 * @since 2026-02-07
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

import {
  ensureSectionsFormat,
  createFreePositionStore,
  seccionesToBloquesTrad,
  bloquesToSecciones,
  detectarModoLibre,
} from '@/components/editor-framework';

/**
 * @param {Object} options
 * @param {string} options.eventoId
 * @param {Array} options.bloques - Bloques actuales del store
 * @param {Object|null} options.bloquesData - Datos crudos de la API
 * @param {Function} options.setBloques - Setter del store de bloques
 * @param {Function} options.setModoEditor - Setter del modo editor
 * @param {Object} options.guardarBloquesMutation - Mutation de guardado
 * @param {Object} options.queryClient - TanStack Query client
 * @param {Array} options.bloquesQueryKey - Query key para invalidar
 */
export function useFreePositionManager({
  eventoId,
  bloques,
  bloquesData,
  setBloques,
  setModoEditor,
  guardarBloquesMutation,
  queryClient,
  bloquesQueryKey,
}) {
  const freePositionStoreRef = useRef(null);

  const getFreePositionStore = useCallback(() => {
    if (!freePositionStoreRef.current) {
      freePositionStoreRef.current = createFreePositionStore({
        name: `invitacion-${eventoId}`,
        persist: true,
      });
    }
    return freePositionStoreRef.current;
  }, [eventoId]);

  // Snapshots para autosave del modo libre
  const [seccionesSnapshot, setSeccionesSnapshot] = useState([]);
  const [estadoGuardadoLibreSnapshot, setEstadoGuardadoLibreSnapshot] = useState('saved');

  // Suscribirse a cambios del store libre
  const subscribirAStoreLibre = useCallback((modoEditor) => {
    if (modoEditor !== 'libre') return;

    const store = getFreePositionStore();
    const unsubscribe = store.subscribe(
      (state) => ({
        secciones: state.secciones,
        estadoGuardado: state.estadoGuardado,
      }),
      (selected) => {
        setSeccionesSnapshot(selected.secciones);
        setEstadoGuardadoLibreSnapshot(selected.estadoGuardado);
      },
      { fireImmediately: true }
    );

    return unsubscribe;
  }, [getFreePositionStore]);

  const cambiarAModoLibre = useCallback(() => {
    const store = getFreePositionStore();
    const storeState = store.getState();

    if (storeState.secciones && storeState.secciones.length > 0) {
      setModoEditor('libre');
      toast.info('Modo libre activado');
      return;
    }

    const bloquesOriginales = bloquesData?.bloques || [];
    if (detectarModoLibre(bloquesOriginales)) {
      const secciones = bloquesToSecciones(bloquesOriginales);
      storeState.cargarDatos({ secciones }, eventoId);
      setModoEditor('libre');
      toast.info('Modo libre activado');
      return;
    }

    const { secciones } = ensureSectionsFormat({ bloques });
    storeState.cargarDatos({ secciones }, eventoId);
    setModoEditor('libre');

    toast.info('Modo libre activado', {
      description: 'Los bloques han sido convertidos a secciones editables.',
    });
  }, [bloques, bloquesData, eventoId, getFreePositionStore, setModoEditor]);

  const salirDeModoLibre = useCallback(async (modoDestino) => {
    try {
      const store = getFreePositionStore();
      const secciones = store.getState().secciones;
      const bloquesTrad = seccionesToBloquesTrad(secciones);

      await guardarBloquesMutation.mutateAsync(bloquesTrad);
      setBloques(bloquesTrad, eventoId);
      store.getState().cargarDatos({ secciones: [] }, eventoId);
      setModoEditor(modoDestino);
      queryClient.invalidateQueries({ queryKey: bloquesQueryKey });

      toast.success('Modo cambiado', {
        description: 'Los elementos se han convertido a bloques tradicionales.',
      });
    } catch (error) {
      console.error('[InvitacionEditor] Error al salir del modo libre:', error);
      toast.error('Error al cambiar de modo', {
        description: 'No se pudieron convertir los elementos.',
      });
    }
  }, [getFreePositionStore, guardarBloquesMutation, setBloques, eventoId, queryClient, bloquesQueryKey, setModoEditor]);

  return {
    getFreePositionStore,
    cambiarAModoLibre,
    salirDeModoLibre,
    seccionesSnapshot,
    estadoGuardadoLibreSnapshot,
    subscribirAStoreLibre,
  };
}
