import { useCallback } from 'react';
import { useToast } from '@/hooks/utils';
import { exportarTablaCSV, exportarDatosCSV } from '@/utils/exportToExcel';

interface CSVColumn {
  key: string;
  header: string;
}

interface ExportSimpleOptions {
  headerMap?: Record<string, string>;
  excludeKeys?: string[];
}

/**
 * Hook para exportar datos a CSV con feedback de toast
 */
export function useExportCSV() {
  const toast = useToast();

  const exportCSV = useCallback((data: Record<string, unknown>[], columns: CSVColumn[], filename: string): boolean => {
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

  const exportSimple = useCallback((data: Record<string, unknown>[], filename: string, options: ExportSimpleOptions = {}): boolean => {
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
