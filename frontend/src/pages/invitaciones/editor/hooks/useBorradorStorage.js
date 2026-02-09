/**
 * useBorradorStorage — Persistencia de borrador de invitación en localStorage
 *
 * Schema:
 * {
 *   version: 1,
 *   tipoEvento: 'boda',
 *   plantilla: { id, nombre, tema, ... },
 *   bloques: [{ id, tipo, orden, visible, contenido, estilos, version }],
 *   tema: { color_primario, ... },
 *   updatedAt: '2026-02-08T...'
 * }
 */
import { useCallback } from 'react';

const STORAGE_KEY = 'nexo-borrador-invitacion';

export function useBorradorStorage() {
  const cargar = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== 1) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  const guardar = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      version: 1,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const limpiar = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const existe = useCallback(() => {
    return !!localStorage.getItem(STORAGE_KEY);
  }, []);

  return { cargar, guardar, limpiar, existe };
}
