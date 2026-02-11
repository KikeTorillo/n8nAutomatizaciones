/**
 * Formatear tamaño de archivo en formato legible
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
