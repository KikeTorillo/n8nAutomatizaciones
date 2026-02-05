/**
 * ====================================================================
 * PROPERTIES CONTAINER - INVITACIONES
 * ====================================================================
 * Panel de propiedades para editar el bloque seleccionado.
 * Responsive: solo visible en desktop, en móvil/tablet se usa drawer.
 *
 * @version 1.4.0 - Agregado Upload de imágenes
 * @since 2026-02-03
 * @updated 2026-02-05
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  PropertiesPanel,
  useEditorLayoutContext,
  ElementPropertiesPanel,
  SectionPropertiesPanel,
} from '@/components/editor-framework';
import { BLOCK_CONFIGS, BLOCK_NAMES } from '../config';
import { EDITORES_BLOQUE } from '../components/blocks';
import { useInvitacionEditor } from '../context';
import { UnsplashModal } from '@/components/shared/media/UnsplashPicker';
import { useUploadArchivo } from '@/hooks/utils';
import { useToast } from '@/hooks/utils';

/**
 * PropertiesContainer - Panel de propiedades (solo desktop)
 */
function PropertiesContainer() {
  const {
    evento,
    bloqueSeleccionadoCompleto,
    modoPreview,
    modoEditor,
    tema,
    handleActualizarBloque,
    getFreePositionStore,
  } = useInvitacionEditor();

  const {
    mostrarPropiedades,
    setMostrarPropiedades,
    propertiesAsDrawer,
  } = useEditorLayoutContext();

  // ========== UPLOAD STATE ==========
  const uploadArchivo = useUploadArchivo();
  const toast = useToast();

  // ========== UNSPLASH STATE ==========
  const [unsplashState, setUnsplashState] = useState({
    isOpen: false,
    fieldKey: null,
  });

  const openUnsplash = useCallback((fieldKey) => {
    setUnsplashState({ isOpen: true, fieldKey });
  }, []);

  const closeUnsplash = useCallback(() => {
    setUnsplashState({ isOpen: false, fieldKey: null });
  }, []);

  const handleUnsplashSelect = useCallback(
    (url) => {
      if (bloqueSeleccionadoCompleto && unsplashState.fieldKey) {
        // Si es para galería, agregar al array
        if (unsplashState.fieldKey === 'galeria_nueva') {
          const currentImages = bloqueSeleccionadoCompleto?.contenido?.imagenes || [];
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            imagenes: [...currentImages, { url, alt: '' }],
          });
        } else {
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            [unsplashState.fieldKey]: url,
          });
        }
      }
      closeUnsplash();
    },
    [bloqueSeleccionadoCompleto, unsplashState.fieldKey, handleActualizarBloque, closeUnsplash]
  );

  // ========== UPLOAD HANDLER ==========
  const handleUploadImage = useCallback(
    async (file, fieldKey) => {
      if (!bloqueSeleccionadoCompleto) return;

      try {
        const resultado = await uploadArchivo.mutateAsync({
          file,
          folder: 'eventos-digitales/imagenes',
          isPublic: true,
          entidadTipo: 'evento_digital',
          entidadId: evento?.id,
        });

        // Si es para galería, agregar al array
        if (fieldKey === 'galeria_nueva') {
          const currentImages = bloqueSeleccionadoCompleto?.contenido?.imagenes || [];
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            imagenes: [...currentImages, { url: resultado.url, alt: '' }],
          });
        } else {
          // Para Hero u otros campos individuales
          handleActualizarBloque(bloqueSeleccionadoCompleto.id, {
            [fieldKey]: resultado.url,
          });
        }

        toast.success('Imagen subida correctamente');
      } catch {
        // El error ya se maneja en el hook
      }
    },
    [bloqueSeleccionadoCompleto, evento?.id, handleActualizarBloque, uploadArchivo, toast]
  );

  // Datos adicionales para editores específicos
  const editorProps = useMemo(
    () => ({
      tema,
      evento,
      ubicaciones: evento?.ubicaciones || [],
      galeria: evento?.galeria || [],
      mesaRegalos: evento?.mesa_regalos || null,
      onOpenUnsplash: openUnsplash,
      onUploadImage: handleUploadImage,
    }),
    [tema, evento, openUnsplash, handleUploadImage]
  );

  // Obtener editor específico si existe
  const EditorComponent = bloqueSeleccionadoCompleto
    ? EDITORES_BLOQUE[bloqueSeleccionadoCompleto.tipo]
    : null;

  // Handler para cambios (guardado automático)
  const handleChange = (cambios) => {
    if (bloqueSeleccionadoCompleto) {
      handleActualizarBloque(bloqueSeleccionadoCompleto.id, cambios);
    }
  };

  // ========== HOOKS MODO LIBRE (siempre se llaman para cumplir reglas de hooks) ==========
  const freeStore = getFreePositionStore();
  const elementoSeleccionadoId = freeStore((s) => s.elementoSeleccionado);
  const seccionSeleccionadaId = freeStore((s) => s.seccionSeleccionada);
  const secciones = freeStore((s) => s.secciones);

  // Buscar el elemento seleccionado (memoizado)
  const elementoSeleccionado = useMemo(() => {
    if (!elementoSeleccionadoId) return null;
    for (const s of secciones) {
      const elem = s.elementos?.find((e) => e.id === elementoSeleccionadoId);
      if (elem) return elem;
    }
    return null;
  }, [elementoSeleccionadoId, secciones]);

  // Buscar la sección seleccionada (memoizada)
  const seccionSeleccionada = useMemo(() => {
    if (!seccionSeleccionadaId) return null;
    return secciones.find((s) => s.id === seccionSeleccionadaId) || null;
  }, [seccionSeleccionadaId, secciones]);

  // Callbacks del store libre (memoizados)
  const freeStoreActions = useMemo(() => ({
    actualizarElemento: (id, cambios) => freeStore.getState().actualizarElemento(id, cambios),
    eliminarElemento: (id) => freeStore.getState().eliminarElemento(id),
    duplicarElemento: (id) => freeStore.getState().duplicarElemento(id),
    toggleVisibilidadElemento: (id) => freeStore.getState().toggleVisibilidadElemento(id),
    moverCapaElemento: (id, dir) => freeStore.getState().moverCapaElemento(id, dir),
    actualizarSeccion: (id, cambios) => freeStore.getState().actualizarSeccion(id, cambios),
    eliminarSeccion: (id) => freeStore.getState().eliminarSeccion(id),
    duplicarSeccion: (id) => freeStore.getState().duplicarSeccion(id),
    moverSeccion: (id, dir) => freeStore.getState().moverSeccion(id, dir),
  }), [freeStore]);

  // ========== MODO LIBRE ==========
  if (modoEditor === 'libre' && !propertiesAsDrawer && mostrarPropiedades && !modoPreview) {
    // Si hay elemento seleccionado, mostrar ElementPropertiesPanel
    if (elementoSeleccionado) {
      return (
        <>
          <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
            <ElementPropertiesPanel
              elemento={elementoSeleccionado}
              onChange={freeStoreActions.actualizarElemento}
              onDelete={freeStoreActions.eliminarElemento}
              onDuplicate={freeStoreActions.duplicarElemento}
              onToggleVisibility={freeStoreActions.toggleVisibilidadElemento}
              onMoveLayer={freeStoreActions.moverCapaElemento}
              onClose={() => setMostrarPropiedades(false)}
            />
          </aside>
          <UnsplashModal
            isOpen={unsplashState.isOpen}
            onClose={closeUnsplash}
            onSelect={handleUnsplashSelect}
            industria="eventos"
          />
        </>
      );
    }

    // Si hay sección seleccionada (y no elemento), mostrar SectionPropertiesPanel
    if (seccionSeleccionada && !elementoSeleccionado) {
      return (
        <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
          <SectionPropertiesPanel
            seccion={seccionSeleccionada}
            onChange={freeStoreActions.actualizarSeccion}
            onDelete={freeStoreActions.eliminarSeccion}
            onDuplicate={freeStoreActions.duplicarSeccion}
            onMoveSection={freeStoreActions.moverSeccion}
            onClose={() => setMostrarPropiedades(false)}
          />
        </aside>
      );
    }

    // No hay selección - no mostrar panel
    return null;
  }

  // Ocultar si:
  // - Modo preview
  // - Panel cerrado
  // - No hay bloque seleccionado
  // - En móvil/tablet (se usa drawer en su lugar)
  if (modoPreview || !mostrarPropiedades || !bloqueSeleccionadoCompleto || propertiesAsDrawer) {
    return null;
  }

  return (
    <>
      <aside className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {BLOCK_NAMES[bloqueSeleccionadoCompleto.tipo] || 'Propiedades'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Edita las propiedades del bloque
            </p>
          </div>
          <button
            onClick={() => setMostrarPropiedades(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {EditorComponent ? (
            <EditorComponent
              contenido={{
                ...bloqueSeleccionadoCompleto.contenido,
                _bloqueId: bloqueSeleccionadoCompleto.id,
              }}
              estilos={bloqueSeleccionadoCompleto.estilos || {}}
              onChange={handleChange}
              {...editorProps}
            />
          ) : (
            <PropertiesPanel
              bloque={bloqueSeleccionadoCompleto}
              onSave={handleChange}
              blockConfigs={BLOCK_CONFIGS}
            />
          )}
        </div>
      </aside>

      {/* Unsplash Modal */}
      <UnsplashModal
        isOpen={unsplashState.isOpen}
        onClose={closeUnsplash}
        onSelect={handleUnsplashSelect}
        industria="eventos"
      />
    </>
  );
}

export default memo(PropertiesContainer);
