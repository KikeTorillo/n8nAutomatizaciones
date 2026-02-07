/**
 * Preview Registry - Registro extensible de previews de bloques
 *
 * Permite a los módulos registrar previews custom sin hardcodear
 * en el PreviewRenderer del framework.
 */

const previewRegistry = new Map();

export function registerBlockPreview(tipo, renderer) {
  previewRegistry.set(tipo, renderer);
}

export function registerBlockPreviews(previews) {
  Object.entries(previews).forEach(([tipo, renderer]) => {
    previewRegistry.set(tipo, renderer);
  });
}

export function getBlockPreview(tipo) {
  return previewRegistry.get(tipo) || null;
}
