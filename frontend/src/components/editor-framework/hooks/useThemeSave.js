/**
 * ====================================================================
 * USE THEME SAVE
 * ====================================================================
 * Hook reutilizable para extracción de colores/fuentes y guardado de tema.
 * Centraliza lógica duplicada entre Sidebar y Drawers de ambos módulos.
 *
 * @since 2026-02-06
 */

import { useMemo, useCallback } from 'react';

/**
 * @param {Object} options
 * @param {*} options.source - Fuente de datos (config para website, evento?.plantilla para invitaciones)
 * @param {Function} options.extractColors - (source) => { primario, secundario, ... }
 * @param {Function} options.extractFonts - (source) => { fuente_titulos, fuente_cuerpo }
 * @param {Function} options.buildPayload - ({ colores, fuentes }) => payload para la mutation
 * @param {Function} options.saveMutation - Función async para guardar
 */
export function useThemeSave({ source, extractColors, extractFonts, buildPayload, saveMutation }) {
  const currentColors = useMemo(
    () => extractColors(source),
    [source, extractColors]
  );

  const currentFonts = useMemo(
    () => extractFonts(source),
    [source, extractFonts]
  );

  const handleSaveTema = useCallback(
    async ({ colores, fuentes }) => {
      await saveMutation(buildPayload({ colores, fuentes }));
    },
    [buildPayload, saveMutation]
  );

  return { currentColors, currentFonts, handleSaveTema };
}
