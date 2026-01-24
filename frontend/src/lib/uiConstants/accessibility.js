/**
 * ====================================================================
 * CONSTANTES DE ACCESIBILIDAD
 * ====================================================================
 *
 * Roles ARIA, estados y helpers para accesibilidad WCAG 2.1 AA.
 *
 * Uso:
 *   import { ARIA_ROLES, ARIA_LIVE, getAriaDescribedBy } from '@/lib/uiConstants';
 *
 * Ene 2026 - Preparación Librería UI
 * ====================================================================
 */

// ==================== ROLES ARIA ====================
export const ARIA_ROLES = {
  status: 'status',
  alert: 'alert',
  progressbar: 'progressbar',
  dialog: 'dialog',
  alertdialog: 'alertdialog',
  menu: 'menu',
  menuitem: 'menuitem',
  menubar: 'menubar',
  checkbox: 'checkbox',
  radio: 'radio',
  radiogroup: 'radiogroup',
  search: 'search',
  searchbox: 'searchbox',
  listbox: 'listbox',
  option: 'option',
  combobox: 'combobox',
  tablist: 'tablist',
  tab: 'tab',
  tabpanel: 'tabpanel',
  tooltip: 'tooltip',
  tree: 'tree',
  treeitem: 'treeitem',
  grid: 'grid',
  gridcell: 'gridcell',
  row: 'row',
  rowgroup: 'rowgroup',
  columnheader: 'columnheader',
  rowheader: 'rowheader',
  table: 'table',
  button: 'button',
  link: 'link',
  img: 'img',
  banner: 'banner',
  navigation: 'navigation',
  main: 'main',
  contentinfo: 'contentinfo',
  complementary: 'complementary',
  region: 'region',
  form: 'form',
  group: 'group',
  separator: 'separator',
  spinbutton: 'spinbutton',
  slider: 'slider',
  switch: 'switch',
};

// ==================== ARIA LIVE REGIONS ====================
export const ARIA_LIVE = {
  polite: 'polite',
  assertive: 'assertive',
  off: 'off',
};

// ==================== ETIQUETAS ARIA COMUNES ====================
export const ARIA_LABELS = {
  // Estados de carga
  loading: 'Cargando...',
  loadingData: 'Cargando datos...',
  loadingPage: 'Cargando página...',
  processing: 'Procesando...',

  // Campos de formulario
  required: 'Campo requerido',
  optional: 'Campo opcional',
  invalid: 'Valor inválido',
  valid: 'Valor válido',

  // Acciones comunes
  close: 'Cerrar',
  open: 'Abrir',
  expand: 'Expandir',
  collapse: 'Colapsar',
  search: 'Buscar',
  clear: 'Limpiar',
  clear_search: 'Limpiar búsqueda',
  submit: 'Enviar',
  cancel: 'Cancelar',
  save: 'Guardar',
  delete: 'Eliminar',
  edit: 'Editar',
  add: 'Agregar',
  remove: 'Quitar',
  refresh: 'Actualizar',

  // Navegación
  next: 'Siguiente',
  previous: 'Anterior',
  first: 'Primera página',
  last: 'Última página',
  goToPage: 'Ir a página',

  // Selección
  selectAll: 'Seleccionar todo',
  deselectAll: 'Deseleccionar todo',
  selected: 'Seleccionado',
  notSelected: 'No seleccionado',

  // Ordenamiento
  sortAscending: 'Ordenar ascendente',
  sortDescending: 'Ordenar descendente',
  sorted: 'Ordenado',

  // Filtros
  filter: 'Filtrar',
  clearFilters: 'Limpiar filtros',
  applyFilters: 'Aplicar filtros',
  activeFilters: 'Filtros activos',
};

// ==================== FUNCIONES HELPER ====================

/**
 * Genera el valor de aria-describedby basado en el estado del campo
 *
 * @param {string} id - ID base del campo
 * @param {Object} options - Opciones de estado
 * @param {boolean} [options.hasError=false] - Si tiene mensaje de error
 * @param {boolean} [options.hasHelper=false] - Si tiene texto de ayuda
 * @param {boolean} [options.hasHint=false] - Si tiene hint adicional
 * @returns {string|undefined} - IDs concatenados o undefined
 *
 * @example
 * getAriaDescribedBy('email', { hasError: true, hasHelper: true })
 * // => 'email-error email-helper'
 */
export function getAriaDescribedBy(id, { hasError = false, hasHelper = false, hasHint = false } = {}) {
  const ids = [];
  if (hasError) ids.push(`${id}-error`);
  if (hasHelper) ids.push(`${id}-helper`);
  if (hasHint) ids.push(`${id}-hint`);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

/**
 * Genera el valor de aria-label para un campo con contador de caracteres
 *
 * @param {string} label - Label del campo
 * @param {number} current - Caracteres actuales
 * @param {number} max - Máximo permitido
 * @returns {string} - Label con información del contador
 *
 * @example
 * getCharCountAriaLabel('Descripción', 45, 200)
 * // => 'Descripción, 45 de 200 caracteres'
 */
export function getCharCountAriaLabel(label, current, max) {
  return `${label}, ${current} de ${max} caracteres`;
}

/**
 * Genera el aria-label para un botón de paginación
 *
 * @param {number} page - Número de página
 * @param {boolean} [isCurrent=false] - Si es la página actual
 * @returns {string} - Label descriptivo
 *
 * @example
 * getPaginationAriaLabel(3, true)
 * // => 'Página 3, página actual'
 */
export function getPaginationAriaLabel(page, isCurrent = false) {
  return isCurrent ? `Página ${page}, página actual` : `Ir a página ${page}`;
}

/**
 * Genera el aria-label para un spinner de carga
 *
 * @param {string} [text] - Texto personalizado opcional
 * @returns {string} - Label descriptivo
 */
export function getLoadingAriaLabel(text) {
  return text || ARIA_LABELS.loading;
}

/**
 * Genera aria-label para estados de validación
 *
 * @param {string} fieldName - Nombre del campo
 * @param {boolean} isValid - Si el campo es válido
 * @param {string} [errorMessage] - Mensaje de error opcional
 * @returns {string} - Label descriptivo
 */
export function getValidationAriaLabel(fieldName, isValid, errorMessage) {
  if (isValid) return `${fieldName}, válido`;
  return errorMessage ? `${fieldName}, error: ${errorMessage}` : `${fieldName}, inválido`;
}
