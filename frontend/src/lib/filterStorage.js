/**
 * Utilidades para persistencia de filtros y búsquedas guardadas en localStorage
 * Estructura preparada para migración futura a BD
 */

const SAVED_SEARCHES_KEY = 'nexo_saved_searches';
const LAST_FILTERS_KEY = 'nexo_last_filters';

/**
 * Genera un UUID v4
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para navegadores antiguos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtiene todas las búsquedas guardadas para un módulo
 * @param {string} moduloId - ID del módulo (ej: 'inventario.productos')
 * @returns {Array} Lista de búsquedas guardadas
 */
export function getSavedSearches(moduloId) {
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    if (!stored) return [];
    const all = JSON.parse(stored);
    return all[moduloId] || [];
  } catch (error) {
    console.error('Error loading saved searches:', error);
    return [];
  }
}

/**
 * Agrega una nueva búsqueda guardada
 * @param {string} moduloId - ID del módulo
 * @param {Object} busqueda - Objeto con { nombre, filtros, es_default }
 * @returns {Array} Lista actualizada de búsquedas
 */
export function addSavedSearch(moduloId, busqueda) {
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    const all = stored ? JSON.parse(stored) : {};

    const nuevaBusqueda = {
      id: generateId(),
      nombre: busqueda.nombre,
      modulo: moduloId,
      filtros: busqueda.filtros,
      creado_en: new Date().toISOString(),
      es_default: busqueda.es_default || false,
    };

    // Si es default, quitar default de las demás
    if (nuevaBusqueda.es_default && all[moduloId]) {
      all[moduloId] = all[moduloId].map((b) => ({ ...b, es_default: false }));
    }

    all[moduloId] = [...(all[moduloId] || []), nuevaBusqueda];
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(all));

    return all[moduloId];
  } catch (error) {
    console.error('Error saving search:', error);
    return getSavedSearches(moduloId);
  }
}

/**
 * Elimina una búsqueda guardada
 * @param {string} moduloId - ID del módulo
 * @param {string} searchId - ID de la búsqueda a eliminar
 * @returns {Array} Lista actualizada de búsquedas
 */
export function removeSavedSearch(moduloId, searchId) {
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    if (!stored) return [];

    const all = JSON.parse(stored);
    if (!all[moduloId]) return [];

    all[moduloId] = all[moduloId].filter((b) => b.id !== searchId);
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(all));

    return all[moduloId];
  } catch (error) {
    console.error('Error removing search:', error);
    return getSavedSearches(moduloId);
  }
}

/**
 * Marca una búsqueda como default
 * @param {string} moduloId - ID del módulo
 * @param {string} searchId - ID de la búsqueda a marcar como default
 * @returns {Array} Lista actualizada de búsquedas
 */
export function setSearchAsDefault(moduloId, searchId) {
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY);
    if (!stored) return [];

    const all = JSON.parse(stored);
    if (!all[moduloId]) return [];

    all[moduloId] = all[moduloId].map((b) => ({
      ...b,
      es_default: b.id === searchId,
    }));

    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(all));
    return all[moduloId];
  } catch (error) {
    console.error('Error setting default search:', error);
    return getSavedSearches(moduloId);
  }
}

/**
 * Obtiene los últimos filtros usados para un módulo
 * @param {string} moduloId - ID del módulo
 * @returns {Object|null} Filtros guardados o null
 */
export function getLastFilters(moduloId) {
  try {
    const stored = localStorage.getItem(LAST_FILTERS_KEY);
    if (!stored) return null;
    const all = JSON.parse(stored);
    return all[moduloId] || null;
  } catch (error) {
    console.error('Error loading last filters:', error);
    return null;
  }
}

/**
 * Guarda los últimos filtros usados para un módulo
 * @param {string} moduloId - ID del módulo
 * @param {Object} filtros - Estado de filtros a guardar
 */
export function saveLastFilters(moduloId, filtros) {
  try {
    const stored = localStorage.getItem(LAST_FILTERS_KEY);
    const all = stored ? JSON.parse(stored) : {};
    all[moduloId] = filtros;
    localStorage.setItem(LAST_FILTERS_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Error saving last filters:', error);
  }
}

/**
 * Limpia los últimos filtros de un módulo
 * @param {string} moduloId - ID del módulo
 */
export function clearLastFilters(moduloId) {
  try {
    const stored = localStorage.getItem(LAST_FILTERS_KEY);
    if (!stored) return;
    const all = JSON.parse(stored);
    delete all[moduloId];
    localStorage.setItem(LAST_FILTERS_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Error clearing last filters:', error);
  }
}

export default {
  getSavedSearches,
  addSavedSearch,
  removeSavedSearch,
  setSearchAsDefault,
  getLastFilters,
  saveLastFilters,
  clearLastFilters,
};
