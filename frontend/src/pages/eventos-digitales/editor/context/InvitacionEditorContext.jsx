/**
 * ====================================================================
 * INVITACION EDITOR CONTEXT
 * ====================================================================
 * Contexto principal para el editor de invitaciones digitales.
 * Maneja estado, bloques, autosave y acciones del editor.
 *
 * @version 1.5.0 - Autosave para modo libre (secciones → bloques)
 * @since 2026-02-03
 * @updated 2026-02-04
 */

import { createContext, useContext, useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useInvitacionEditorStore } from '@/store';
import { eventosDigitalesApi } from '@/services/api/modules';
import {
  useEditorLayoutContext,
  useAutosave,
  hashBloques,
  useDndHandlers,
  // Free Position Canvas imports
  ensureSectionsFormat,
  createFreePositionStore,
  // Autosave para modo libre
  seccionesToBloques,
  seccionesToBloquesTrad,
  bloquesToSecciones,
  detectarModoLibre,
  hashSecciones,
} from '@/components/editor-framework';
import { registerInvitacionElementTypes } from '../elements';
import { registerInvitacionMigrators } from '../elements';
import { crearBloqueNuevo } from '../utils';
import { BLOQUES_INVITACION } from '../config';

// ========== CONTEXT ==========

const InvitacionEditorContext = createContext(null);

// ========== PROVIDER ==========

/**
 * InvitacionEditorProvider - Proveedor del contexto del editor
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export function InvitacionEditorProvider({ children }) {
  const { id: eventoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ========== STATE ==========

  const [modoPreview, setModoPreview] = useState(false);
  const [modoEditor, setModoEditor] = useState('canvas'); // 'canvas' | 'bloques' | 'libre'

  // ========== FREE POSITION STORE (Modo Libre) ==========

  const freePositionStoreRef = useRef(null);

  /**
   * Obtiene o crea el store de posición libre (lazy initialization)
   */
  const getFreePositionStore = useCallback(() => {
    if (!freePositionStoreRef.current) {
      freePositionStoreRef.current = createFreePositionStore({
        name: `invitacion-${eventoId}`,
        persist: true,
      });
    }
    return freePositionStoreRef.current;
  }, [eventoId]);

  // Registrar tipos de elementos y migradores de invitaciones al montar
  useEffect(() => {
    registerInvitacionElementTypes();
    registerInvitacionMigrators();
  }, []);

  // Obtener estado de propiedades del layout context (única fuente de verdad)
  const {
    mostrarPropiedades,
    setMostrarPropiedades,
    abrirPropiedades,
  } = useEditorLayoutContext();

  // ========== STORE ==========

  const bloques = useInvitacionEditorStore((state) => state.bloques);
  const bloqueSeleccionado = useInvitacionEditorStore((state) => state.bloqueSeleccionado);
  const estadoGuardado = useInvitacionEditorStore((state) => state.estadoGuardado);
  const setBloques = useInvitacionEditorStore((state) => state.setBloques);
  const actualizarBloqueLocal = useInvitacionEditorStore((state) => state.actualizarBloqueLocal);
  const reordenarBloquesLocal = useInvitacionEditorStore((state) => state.reordenarBloquesLocal);
  const agregarBloqueLocal = useInvitacionEditorStore((state) => state.agregarBloqueLocal);
  const eliminarBloqueLocal = useInvitacionEditorStore((state) => state.eliminarBloqueLocal);
  const duplicarBloqueLocal = useInvitacionEditorStore((state) => state.duplicarBloqueLocal);
  const toggleVisibilidadBloque = useInvitacionEditorStore((state) => state.toggleVisibilidadBloque);
  const insertarBloqueEnPosicion = useInvitacionEditorStore((state) => state.insertarBloqueEnPosicion);
  const seleccionarBloque = useInvitacionEditorStore((state) => state.seleccionarBloque);
  const deseleccionarBloque = useInvitacionEditorStore((state) => state.deseleccionarBloque);
  const setGuardando = useInvitacionEditorStore((state) => state.setGuardando);
  const setGuardado = useInvitacionEditorStore((state) => state.setGuardado);
  const setErrorGuardado = useInvitacionEditorStore((state) => state.setErrorGuardado);
  const limpiarBloques = useInvitacionEditorStore((state) => state.limpiarBloques);
  const breakpoint = useInvitacionEditorStore((state) => state.breakpoint);
  const setBreakpoint = useInvitacionEditorStore((state) => state.setBreakpoint);
  const zoom = useInvitacionEditorStore((state) => state.zoom);
  const setZoom = useInvitacionEditorStore((state) => state.setZoom);

  // ========== QUERIES ==========

  // Obtener evento
  const {
    data: evento,
    isLoading: eventoLoading,
    error: eventoError,
  } = useQuery({
    queryKey: ['evento', eventoId],
    queryFn: () => eventosDigitalesApi.getById(eventoId),
    select: (response) => response.data.data,
    enabled: !!eventoId,
  });

  // Obtener bloques de invitación
  const {
    data: bloquesData,
    isLoading: bloquesLoading,
    error: bloquesError,
  } = useQuery({
    queryKey: ['evento', eventoId, 'bloques'],
    queryFn: () => eventosDigitalesApi.getBloques(eventoId),
    select: (response) => response.data.data,
    enabled: !!eventoId,
  });

  // Cargar bloques en store cuando lleguen (detecta modo libre automáticamente)
  // Usar useLayoutEffect para que el cambio de modoEditor se aplique ANTES del paint,
  // evitando flash visual donde el toggle muestra estado incorrecto momentáneamente
  useLayoutEffect(() => {
    if (bloquesData?.bloques) {
      let bloques = bloquesData.bloques;

      // Migración lazy: si hay config apertura legacy sin bloque apertura, crearlo
      const tieneBlqueApertura = bloques.some(b => b.tipo === 'apertura');
      if (!tieneBlqueApertura && evento?.configuracion) {
        const cfg = evento.configuracion;
        const tieneConfigLegacy =
          (cfg.animacion_apertura && cfg.animacion_apertura !== 'none') ||
          (cfg.modo_apertura === 'imagen' && cfg.imagen_apertura);

        if (tieneConfigLegacy) {
          const bloqueApertura = {
            id: crypto.randomUUID(),
            tipo: 'apertura',
            orden: -1,
            visible: true,
            contenido: {
              modo: cfg.modo_apertura || 'animacion',
              animacion: cfg.animacion_apertura || 'sobre',
              imagen_url: cfg.imagen_apertura || '',
              texto: cfg.texto_apertura || 'Desliza para abrir',
            },
            estilos: {},
            version: 1,
          };
          bloques = [bloqueApertura, ...bloques.map((b, i) => ({ ...b, orden: i + 1 }))];
        }
      }

      // Detectar si hay secciones libres guardadas
      if (detectarModoLibre(bloques)) {
        const secciones = bloquesToSecciones(bloques);
        const store = getFreePositionStore();
        store.getState().cargarDatos({ secciones }, eventoId);
        setModoEditor('libre');
      } else {
        setBloques(bloques, eventoId);
      }
    }
  }, [bloquesData, eventoId, evento?.configuracion, setBloques, getFreePositionStore]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      limpiarBloques();
    };
  }, [limpiarBloques]);

  // ========== MUTATIONS ==========

  // Guardar bloques (sin callbacks - manejados por useAutosave)
  const guardarBloquesMutation = useMutation({
    mutationFn: (bloquesAGuardar) =>
      eventosDigitalesApi.saveBloques(eventoId, bloquesAGuardar),
  });

  // Publicar/Despublicar evento
  const publicarMutation = useMutation({
    mutationFn: () => eventosDigitalesApi.publicarEvento(eventoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId] });
      toast.success(evento?.estado === 'publicado' ? 'Invitación despublicada' : 'Invitación publicada');
    },
    onError: (error) => {
      toast.error('Error al cambiar estado de publicación');
      console.error('[InvitacionEditor] Error publicando:', error);
    },
  });

  // Actualizar configuración del evento (animación apertura, etc.)
  const actualizarConfiguracionMutation = useMutation({
    mutationFn: (configuracion) =>
      eventosDigitalesApi.actualizarEvento(eventoId, { configuracion }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId] });
      toast.success('Configuración actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar la configuración');
      console.error('[InvitacionEditor] Error actualizando configuración:', error);
    },
  });

  // Actualizar plantilla del evento (colores del tema)
  const actualizarPlantillaMutation = useMutation({
    mutationFn: (plantilla) =>
      eventosDigitalesApi.actualizarEvento(eventoId, { plantilla }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId] });
      toast.success('Colores actualizados');
    },
    onError: (error) => {
      toast.error('Error al actualizar los colores');
      console.error('[InvitacionEditor] Error actualizando plantilla:', error);
    },
  });

  // ========== AUTOSAVE BLOQUES (modo canvas/bloques) ==========

  const { guardarAhora } = useAutosave({
    onSave: async (bloquesAGuardar) => {
      await guardarBloquesMutation.mutateAsync(bloquesAGuardar);
    },
    enabled: modoEditor !== 'libre',
    debounceMs: 2000,
    items: bloques,
    hasChanges: estadoGuardado === 'unsaved',
    computeHash: hashBloques,
    onSaving: () => setGuardando(),
    onSaved: () => {
      setGuardado();
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId, 'bloques'] });
    },
    onError: (error) => {
      setErrorGuardado();
      toast.error('Error al guardar los cambios');
      console.error('[InvitacionEditor] Error guardando:', error);
    },
    onConflict: ({ mensaje }) => {
      toast.error(mensaje || 'Conflicto de versión detectado', { duration: 6000 });
    },
  });

  // ========== AUTOSAVE MODO LIBRE (secciones con posición libre) ==========

  // Suscribirse a cambios en secciones para re-render (siempre se ejecuta para mantener hooks consistentes)
  const [seccionesSnapshot, setSeccionesSnapshot] = useState([]);
  const [estadoGuardadoLibreSnapshot, setEstadoGuardadoLibreSnapshot] = useState('saved');

  useEffect(() => {
    // Solo suscribirse cuando estamos en modo libre
    if (modoEditor !== 'libre') return;

    const store = getFreePositionStore();

    // Suscribirse a cambios en el store usando subscribeWithSelector
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
  }, [modoEditor, getFreePositionStore]);

  const { guardarAhora: guardarSeccionesAhora } = useAutosave({
    onSave: async () => {
      // Leer directamente del store para evitar snapshots desactualizados
      const store = getFreePositionStore();
      const secciones = store.getState().secciones;
      const bloquesConvertidos = seccionesToBloques(secciones);
      await guardarBloquesMutation.mutateAsync(bloquesConvertidos);
    },
    enabled: modoEditor === 'libre',
    debounceMs: 2000,
    items: seccionesSnapshot,
    hasChanges: estadoGuardadoLibreSnapshot === 'unsaved',
    computeHash: hashSecciones,
    onSaving: () => {
      const store = getFreePositionStore();
      store.getState().setGuardando();
    },
    onSaved: () => {
      const store = getFreePositionStore();
      store.getState().setGuardado();
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId, 'bloques'] });
    },
    onError: (error) => {
      const store = getFreePositionStore();
      store.getState().setErrorGuardado();
      toast.error('Error al guardar los cambios');
      console.error('[InvitacionEditor] Error guardando modo libre:', error);
    },
    onConflict: ({ mensaje }) => {
      toast.error(mensaje || 'Conflicto de versión detectado', { duration: 6000 });
    },
  });

  // ========== HANDLERS ==========

  /**
   * Agregar nuevo bloque
   */
  const handleAgregarBloque = useCallback(
    (tipo) => {
      // Verificar unicidad para bloques marcados como únicos
      const configBloque = BLOQUES_INVITACION.find(b => b.tipo === tipo);
      if (configBloque?.unico && bloques.some(b => b.tipo === tipo)) {
        toast.warning(`Solo puedes tener un bloque de ${configBloque.label}`);
        return;
      }

      const nuevoBloque = crearBloqueNuevo(tipo, bloques.length);

      // Bloques de apertura siempre van en posición 0
      if (tipo === 'apertura') {
        insertarBloqueEnPosicion(nuevoBloque, 0);
      } else {
        agregarBloqueLocal(nuevoBloque);
      }
    },
    [bloques, agregarBloqueLocal, insertarBloqueEnPosicion]
  );

  /**
   * Actualizar bloque
   */
  const handleActualizarBloque = useCallback(
    (id, cambios) => {
      actualizarBloqueLocal(id, cambios);
    },
    [actualizarBloqueLocal]
  );

  /**
   * Eliminar bloque
   */
  const handleEliminarBloque = useCallback(
    (id) => {
      eliminarBloqueLocal(id);
    },
    [eliminarBloqueLocal]
  );

  /**
   * Duplicar bloque
   */
  const handleDuplicarBloque = useCallback(
    (id) => {
      const nuevoId = crypto.randomUUID();
      duplicarBloqueLocal(id, nuevoId);
    },
    [duplicarBloqueLocal]
  );

  /**
   * Toggle visibilidad
   */
  const handleToggleVisibilidad = useCallback(
    (id) => {
      toggleVisibilidadBloque(id);
    },
    [toggleVisibilidadBloque]
  );

  /**
   * Reordenar bloques (desde drag-drop)
   */
  const handleReordenarBloques = useCallback(
    (nuevoOrden) => {
      reordenarBloquesLocal(nuevoOrden);
    },
    [reordenarBloquesLocal]
  );

  /**
   * DnD handlers (usando hook reutilizable del framework)
   */
  const { handleDropFromPalette, handleDndReorder } = useDndHandlers({
    bloques,
    onInsertBlock: insertarBloqueEnPosicion,
    onReorderBlocks: reordenarBloquesLocal,
    createBlock: crearBloqueNuevo,
  });

  /**
   * Volver a lista de eventos
   */
  const handleVolver = useCallback(() => {
    navigate('/eventos-digitales');
  }, [navigate]);

  /**
   * Cambiar a modo libre (migra bloques a secciones si es necesario)
   */
  const cambiarAModoLibre = useCallback(() => {
    const store = getFreePositionStore();
    const storeState = store.getState();

    // 1. Si el store ya tiene secciones cargadas, solo cambiar el modo
    if (storeState.secciones && storeState.secciones.length > 0) {
      setModoEditor('libre');
      toast.info('Modo libre activado');
      return;
    }

    // 2. Verificar si los datos originales de la API tienen secciones libres
    const bloquesOriginales = bloquesData?.bloques || [];
    if (detectarModoLibre(bloquesOriginales)) {
      const secciones = bloquesToSecciones(bloquesOriginales);
      storeState.cargarDatos({ secciones }, eventoId);
      setModoEditor('libre');
      toast.info('Modo libre activado');
      return;
    }

    // 3. Si no hay secciones libres, migrar bloques tradicionales
    const { secciones } = ensureSectionsFormat({ bloques });
    storeState.cargarDatos({ secciones }, eventoId);
    setModoEditor('libre');

    toast.info('Modo libre activado', {
      description: 'Los bloques han sido convertidos a secciones editables.',
    });
  }, [bloques, bloquesData, eventoId, getFreePositionStore]);

  /**
   * Salir del modo libre y volver a modo tradicional (canvas/bloques).
   * Convierte las secciones a bloques tradicionales (perdiendo posicionamiento libre).
   *
   * @param {'canvas' | 'bloques'} modoDestino - Modo al que cambiar
   */
  const salirDeModoLibre = useCallback(async (modoDestino) => {
    try {
      const store = getFreePositionStore();
      const secciones = store.getState().secciones;

      // Convertir secciones a bloques tradicionales
      const bloquesTrad = seccionesToBloquesTrad(secciones);

      // Guardar en la API
      await guardarBloquesMutation.mutateAsync(bloquesTrad);

      // Cargar en el store de bloques
      setBloques(bloquesTrad, eventoId);

      // Limpiar el store de posición libre
      store.getState().cargarDatos({ secciones: [] }, eventoId);

      // Cambiar al modo destino
      setModoEditor(modoDestino);

      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['evento', eventoId, 'bloques'] });

      toast.success('Modo cambiado', {
        description: 'Los elementos se han convertido a bloques tradicionales.',
      });
    } catch (error) {
      console.error('[InvitacionEditor] Error al salir del modo libre:', error);
      toast.error('Error al cambiar de modo', {
        description: 'No se pudieron convertir los elementos.',
      });
    }
  }, [getFreePositionStore, guardarBloquesMutation, setBloques, eventoId, queryClient]);

  /**
   * Actualizar configuración del evento
   */
  const handleActualizarConfiguracion = useCallback(
    (config) => {
      actualizarConfiguracionMutation.mutate({
        ...evento?.configuracion,
        ...config,
      });
    },
    [evento?.configuracion, actualizarConfiguracionMutation]
  );

  /**
   * Publicar/Despublicar invitación
   */
  const handlePublicar = useCallback(() => {
    publicarMutation.mutate();
  }, [publicarMutation]);

  /**
   * Actualizar plantilla (colores del tema)
   */
  const handleActualizarPlantilla = useCallback(
    (plantilla) => {
      actualizarPlantillaMutation.mutate(plantilla);
    },
    [actualizarPlantillaMutation]
  );

  // ========== BLOQUE SELECCIONADO COMPLETO ==========

  const bloqueSeleccionadoCompleto = useMemo(
    () => bloques.find((b) => b.id === bloqueSeleccionado),
    [bloques, bloqueSeleccionado]
  );

  // ========== TEMA MEMOIZADO (centralizado) ==========

  const tema = useMemo(
    () => ({
      color_primario: '#753572',
      color_secundario: '#F59E0B',
      color_fondo: '#FFFFFF',
      color_texto: '#1f2937',
      color_texto_claro: '#6b7280',
      fuente_titulos: 'Playfair Display',
      fuente_titulo: 'Playfair Display',
      fuente_cuerpo: 'Inter',
      patron_fondo: 'none',
      patron_opacidad: 0.1,
      decoracion_esquinas: 'none',
      icono_principal: 'none',
      efecto_titulo: 'none',
      marco_fotos: 'none',
      stickers: [],
      ...(evento?.plantilla || {}),
    }),
    [evento?.plantilla]
  );

  // ========== COMPUTED ==========

  const isLoading = eventoLoading || bloquesLoading;
  const error = eventoError || bloquesError;
  // Estado de guardado unificado (depende del modo actual)
  const estaGuardando = modoEditor === 'libre'
    ? estadoGuardadoLibreSnapshot === 'saving'
    : estadoGuardado === 'saving';
  const estadoGuardadoActual = modoEditor === 'libre'
    ? estadoGuardadoLibreSnapshot
    : estadoGuardado;
  const estaPublicando = publicarMutation.isPending;
  const estaPublicado = evento?.estado === 'publicado';
  // Detectar si los datos guardados en la API son de modo libre (irreversible)
  const esModoLibreGuardado = useMemo(() => {
    return detectarModoLibre(bloquesData?.bloques || []);
  }, [bloquesData]);

  // ========== CONTEXT VALUE ==========

  const value = useMemo(
    () => ({
      // Datos
      evento,
      eventoId,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,

      // Estado
      isLoading,
      error,
      estadoGuardado: estadoGuardadoActual,
      estaGuardando,
      estaPublicando,
      estaPublicado,
      esModoLibreGuardado,
      modoPreview,
      modoEditor,
      mostrarPropiedades,
      breakpoint,
      zoom,

      // Setters
      setModoPreview,
      setModoEditor,
      setMostrarPropiedades,
      abrirPropiedades,
      setBreakpoint,
      setZoom,

      // Modo libre (Free Position Canvas)
      getFreePositionStore,
      cambiarAModoLibre,
      salirDeModoLibre,

      // Handlers de bloques
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,

      // Selección
      seleccionarBloque,
      deseleccionarBloque,

      // Guardado
      guardarAhora: modoEditor === 'libre' ? guardarSeccionesAhora : guardarAhora,
      guardarSeccionesAhora,

      // Publicación
      handlePublicar,

      // Plantilla/Tema
      handleActualizarPlantilla,
      estaActualizandoPlantilla: actualizarPlantillaMutation.isPending,

      // Configuración (animación apertura, etc.)
      handleActualizarConfiguracion,
      estaActualizandoConfiguracion: actualizarConfiguracionMutation.isPending,

      // Navegación
      handleVolver,
    }),
    [
      evento,
      eventoId,
      bloques,
      bloqueSeleccionado,
      bloqueSeleccionadoCompleto,
      tema,
      isLoading,
      error,
      estadoGuardadoActual,
      estaGuardando,
      estaPublicando,
      estaPublicado,
      esModoLibreGuardado,
      modoPreview,
      modoEditor,
      mostrarPropiedades,
      breakpoint,
      zoom,
      abrirPropiedades,
      setBreakpoint,
      setZoom,
      getFreePositionStore,
      cambiarAModoLibre,
      salirDeModoLibre,
      handleAgregarBloque,
      handleActualizarBloque,
      handleEliminarBloque,
      handleDuplicarBloque,
      handleToggleVisibilidad,
      handleReordenarBloques,
      handleDropFromPalette,
      handleDndReorder,
      seleccionarBloque,
      deseleccionarBloque,
      guardarAhora,
      guardarSeccionesAhora,
      handlePublicar,
      handleActualizarPlantilla,
      actualizarPlantillaMutation.isPending,
      handleActualizarConfiguracion,
      actualizarConfiguracionMutation.isPending,
      handleVolver,
    ]
  );

  return (
    <InvitacionEditorContext.Provider value={value}>
      {children}
    </InvitacionEditorContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook para acceder al contexto del editor de invitaciones
 *
 * @returns {Object} Contexto del editor
 * @throws {Error} Si se usa fuera de InvitacionEditorProvider
 */
export function useInvitacionEditor() {
  const context = useContext(InvitacionEditorContext);
  if (!context) {
    throw new Error('useInvitacionEditor debe usarse dentro de InvitacionEditorProvider');
  }
  return context;
}

export default InvitacionEditorContext;
