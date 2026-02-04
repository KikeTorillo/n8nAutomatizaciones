/**
 * ====================================================================
 * USE PROPERTIES STATE HOOK
 * ====================================================================
 * Hook para gestionar el estado de PropertiesPanel.
 * Centraliza el estado de modales y editores.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * usePropertiesState - Hook para gestionar estado de PropertiesPanel
 *
 * @param {Object} bloque - Bloque seleccionado
 * @param {Function} onUpdate - Callback para actualizar contenido
 * @returns {Object} Estado y handlers
 */
export function usePropertiesState(bloque, onUpdate) {
  const [activeTab, setActiveTab] = useState('contenido');
  const [localContent, setLocalContent] = useState({});

  // Estado para AI Writer
  const [aiWriterState, setAIWriterState] = useState({
    isOpen: false,
    campo: null,
    position: { top: 0, left: 0 },
  });

  // Estado para Unsplash Modal
  const [unsplashState, setUnsplashState] = useState({
    isOpen: false,
    targetField: null,
  });

  // Estado para Items Editor (Timeline, Servicios, etc.)
  const [itemsEditorState, setItemsEditorState] = useState({
    isOpen: false,
    itemType: null,
    fieldKey: null,
  });

  // Sync local content with bloque
  useEffect(() => {
    if (bloque) {
      setLocalContent(bloque.contenido || {});
    }
  }, [bloque?.id]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (key, value) => {
      const newContent = { ...localContent, [key]: value };
      setLocalContent(newContent);
      onUpdate?.(newContent);
    },
    [localContent, onUpdate]
  );

  // ========== AI WRITER ==========

  const openAIWriter = useCallback((campo, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setAIWriterState({
      isOpen: true,
      campo,
      position: {
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 300),
      },
    });
  }, []);

  const closeAIWriter = useCallback(() => {
    setAIWriterState({
      isOpen: false,
      campo: null,
      position: { top: 0, left: 0 },
    });
  }, []);

  const handleAIGenerate = useCallback((text) => {
    if (aiWriterState.campo) {
      handleChange(aiWriterState.campo, text);
    }
    closeAIWriter();
  }, [aiWriterState.campo, handleChange, closeAIWriter]);

  // ========== UNSPLASH ==========

  const openUnsplash = useCallback((targetField) => {
    setUnsplashState({
      isOpen: true,
      targetField,
    });
  }, []);

  const closeUnsplash = useCallback(() => {
    setUnsplashState({
      isOpen: false,
      targetField: null,
    });
  }, []);

  const handleUnsplashSelect = useCallback((url) => {
    if (unsplashState.targetField) {
      handleChange(unsplashState.targetField, url);
    }
    closeUnsplash();
  }, [unsplashState.targetField, handleChange, closeUnsplash]);

  // ========== ITEMS EDITOR ==========

  const openItemsEditor = useCallback((fieldKey, itemType) => {
    setItemsEditorState({
      isOpen: true,
      itemType,
      fieldKey,
    });
  }, []);

  const closeItemsEditor = useCallback(() => {
    setItemsEditorState({
      isOpen: false,
      itemType: null,
      fieldKey: null,
    });
  }, []);

  const handleItemsChange = useCallback((items) => {
    if (itemsEditorState.fieldKey) {
      handleChange(itemsEditorState.fieldKey, items);
    }
  }, [itemsEditorState.fieldKey, handleChange]);

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Content state
    localContent,
    handleChange,

    // AI Writer
    aiWriterState,
    openAIWriter,
    closeAIWriter,
    handleAIGenerate,

    // Unsplash
    unsplashState,
    openUnsplash,
    closeUnsplash,
    handleUnsplashSelect,

    // Items Editor
    itemsEditorState,
    openItemsEditor,
    closeItemsEditor,
    handleItemsChange,
  };
}

export default usePropertiesState;
