/**
 * ====================================================================
 * USE BLOCK EDITOR HOOK
 * ====================================================================
 * Hook reutilizable para editores de bloques.
 * Reduce duplicación del patrón: useState + setCambios + useEffect JSON.stringify
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { deepEqual } from './compareUtils';

/**
 * Hook para manejar el estado de un editor de bloque
 * @param {Object} contenido - Contenido actual del bloque desde el servidor
 * @param {Object} defaultValues - Valores por defecto para inicializar el formulario
 * @returns {Object} - { form, setForm, cambios, handleSubmit, handleFieldChange, resetForm }
 */
export function useBlockEditor(contenido, defaultValues) {
  // Inicializar formulario mezclando contenido con defaults
  const initialForm = useMemo(() => {
    const merged = {};
    for (const key of Object.keys(defaultValues)) {
      // Si el contenido tiene el campo, usarlo; si no, usar default
      const contenidoValue = contenido[key];
      const defaultValue = defaultValues[key];

      // Manejar casos especiales
      if (contenidoValue !== undefined && contenidoValue !== null) {
        merged[key] = contenidoValue;
      } else {
        merged[key] = defaultValue;
      }
    }
    return merged;
  }, [contenido, defaultValues]);

  const [form, setForm] = useState(initialForm);
  const [cambios, setCambios] = useState(false);

  // Detectar cambios comparando con el estado inicial
  // Usa deepEqual en lugar de JSON.stringify para mejor rendimiento
  useEffect(() => {
    const hasChanges = !deepEqual(form, initialForm);
    setCambios(hasChanges);
  }, [form, initialForm]);

  // Resetear formulario cuando cambia el contenido del servidor
  // Usa functional update para evitar loops infinitos cuando contenido
  // crea nuevas referencias pero con mismo contenido
  useEffect(() => {
    setForm((prev) => {
      // Solo actualizar si realmente cambió el contenido
      if (!deepEqual(prev, initialForm)) {
        return initialForm;
      }
      return prev;
    });
  }, [initialForm]);

  /**
   * Handler genérico para cambios de campo
   * @param {string} field - Nombre del campo
   * @param {any} value - Nuevo valor
   */
  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Handler para submit del formulario
   * @param {Function} onGuardar - Función para guardar
   * @returns {Function} - Handler de evento
   */
  const handleSubmit = useCallback(
    (onGuardar) => (e) => {
      e.preventDefault();
      onGuardar(form);
      setCambios(false);
    },
    [form]
  );

  /**
   * Resetear formulario a valores iniciales
   */
  const resetForm = useCallback(() => {
    setForm(initialForm);
    setCambios(false);
  }, [initialForm]);

  return {
    form,
    setForm,
    cambios,
    handleSubmit,
    handleFieldChange,
    resetForm,
  };
}

export default useBlockEditor;
