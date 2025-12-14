import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente de botones de exportación para reportes de comisiones
 *
 * NOTA: Actualmente exporta como CSV (compatible con Excel)
 * TODO: Integrar exceljs y pdfkit para exportación avanzada en Fase 5
 *
 * @param {Array} comisiones - Lista de comisiones a exportar
 * @param {Object} filtros - Filtros aplicados
 * @param {boolean} disabled - Deshabilitar botones
 */
function ExportButtons({ comisiones, filtros, disabled = false }) {
  const toast = useToast();

  /**
   * Exportar como CSV (compatible con Excel)
   */
  const exportarCSV = () => {
    if (!comisiones || comisiones.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      // Encabezados
      const headers = [
        'Fecha Cita',
        'Profesional',
        'Código Cita',
        'Monto Base',
        'Tipo Comisión',
        'Valor Comisión',
        'Monto Comisión',
        'Estado Pago',
        'Fecha Pago',
        'Método Pago',
        'Referencia Pago',
      ];

      // Filas de datos
      const rows = comisiones.map(c => [
        format(new Date(c.fecha_cita), 'dd/MM/yyyy'),
        `${c.profesional_nombre} ${c.profesional_apellidos}`,
        c.codigo_cita,
        parseFloat(c.monto_base).toFixed(2),
        c.tipo_comision === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo',
        parseFloat(c.valor_comision).toFixed(2),
        parseFloat(c.monto_comision).toFixed(2),
        c.estado_pago,
        c.fecha_pago ? format(new Date(c.fecha_pago), 'dd/MM/yyyy') : '',
        c.metodo_pago || '',
        c.referencia_pago || '',
      ]);

      // Crear CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Agregar BOM para UTF-8 (compatibilidad con Excel)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Descargar
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fechaExport = format(new Date(), 'yyyy-MM-dd');
      link.setAttribute('href', url);
      link.setAttribute('download', `comisiones_${fechaExport}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Reporte CSV generado exitosamente');
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      toast.error('Error al generar el reporte CSV');
    }
  };

  /**
   * Exportar como JSON
   * TODO: Reemplazar con PDF usando pdfkit
   */
  const exportarJSON = () => {
    if (!comisiones || comisiones.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      // Preparar datos para JSON
      const dataExport = {
        generado_en: new Date().toISOString(),
        filtros: {
          fecha_desde: filtros.fecha_desde,
          fecha_hasta: filtros.fecha_hasta,
          profesional_id: filtros.profesional_id || 'Todos',
          estado_pago: filtros.estado_pago || 'Todos',
        },
        resumen: {
          total_comisiones: comisiones.length,
          total_monto: comisiones.reduce((sum, c) => sum + parseFloat(c.monto_comision), 0),
          total_pendientes: comisiones.filter(c => c.estado_pago === 'pendiente').length,
          total_pagadas: comisiones.filter(c => c.estado_pago === 'pagada').length,
        },
        comisiones: comisiones.map(c => ({
          fecha_cita: c.fecha_cita,
          profesional: `${c.profesional_nombre} ${c.profesional_apellidos}`,
          codigo_cita: c.codigo_cita,
          monto_base: parseFloat(c.monto_base),
          tipo_comision: c.tipo_comision,
          valor_comision: parseFloat(c.valor_comision),
          monto_comision: parseFloat(c.monto_comision),
          estado_pago: c.estado_pago,
          fecha_pago: c.fecha_pago || null,
          metodo_pago: c.metodo_pago || null,
        })),
      };

      // Crear blob y descargar
      const blob = new Blob([JSON.stringify(dataExport, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fechaExport = format(new Date(), 'yyyy-MM-dd');
      link.setAttribute('href', url);
      link.setAttribute('download', `comisiones_${fechaExport}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Reporte JSON generado exitosamente');
    } catch (error) {
      console.error('Error al exportar JSON:', error);
      toast.error('Error al generar el reporte JSON');
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-sm text-gray-600 dark:text-gray-400">Exportar:</span>

      {/* Botón Excel/CSV */}
      <Button
        variant="secondary"
        size="sm"
        onClick={exportarCSV}
        disabled={disabled || !comisiones || comisiones.length === 0}
        title="Exportar a CSV (compatible con Excel)"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Excel
      </Button>

      {/* Botón JSON (futura PDF) */}
      <Button
        variant="secondary"
        size="sm"
        onClick={exportarJSON}
        disabled={disabled || !comisiones || comisiones.length === 0}
        title="Exportar a JSON (PDF próximamente)"
      >
        <FileText className="w-4 h-4 mr-2" />
        JSON
      </Button>
    </div>
  );
}

export default ExportButtons;
