import { useCallback } from 'react';
import { useToast } from '@/hooks/utils';
import { exportarTablaCSV, exportarDatosCSV } from '@/utils/exportToExcel';

/**
 * Hook para exportar datos a CSV con feedback de toast
 *
 * @example
 * // Uso básico con columnas definidas
 * const { exportCSV } = useExportCSV();
 * exportCSV(productos, [
 *   { key: 'nombre', header: 'Nombre' },
 *   { key: 'precio', header: 'Precio' }
 * ], 'productos');
 *
 * @example
 * // Uso simple (infiere columnas de los datos)
 * const { exportSimple } = useExportCSV();
 * exportSimple(clientes, 'clientes', {
 *   headerMap: { nombre_completo: 'Nombre', telefono: 'Teléfono' },
 *   excludeKeys: ['id', 'created_at']
 * });
 */
export function useExportCSV() {
  const toast = useToast();

  /**
   * Exportar con columnas definidas
   * @param {Array} data - Datos a exportar
   * @param {Array} columns - Columnas [{key, header}]
   * @param {string} filename - Nombre del archivo (sin extensión)
   */
  const exportCSV = useCallback((data, columns, filename) => {
    if (!data || data.length === 0) {
      toast.warning('No hay datos para exportar');
      return false;
    }

    try {
      exportarTablaCSV(data, columns, filename);
      toast.success(`${filename}.csv exportado correctamente`);
      return true;
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar archivo');
      return false;
    }
  }, [toast]);

  /**
   * Exportar simple (infiere columnas de los datos)
   * @param {Array} data - Datos a exportar
   * @param {string} filename - Nombre del archivo (sin extensión)
   * @param {Object} options - Opciones de exportación
   */
  const exportSimple = useCallback((data, filename, options = {}) => {
    if (!data || data.length === 0) {
      toast.warning('No hay datos para exportar');
      return false;
    }

    try {
      exportarDatosCSV(data, filename, options);
      toast.success(`${filename}.csv exportado correctamente`);
      return true;
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al exportar archivo');
      return false;
    }
  }, [toast]);

  return {
    exportCSV,
    exportSimple,
  };
}

export default useExportCSV;
