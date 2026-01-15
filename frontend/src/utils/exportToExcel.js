/**
 * Utilidad para exportar datos a Excel (formato CSV compatible)
 * Sin dependencias externas - genera CSV que Excel abre nativamente
 *
 * Ene 2026 - Mejoras UX POS
 */

/**
 * Escapa un valor para CSV (maneja comas, comillas, saltos de línea)
 * @param {*} value - Valor a escapar
 * @returns {string} Valor escapado
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Si contiene coma, comilla o salto de línea, envolver en comillas
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convierte un array de objetos a CSV
 * @param {Array} data - Array de objetos
 * @param {Array} columns - Definición de columnas [{key, header}]
 * @returns {string} Contenido CSV
 */
function arrayToCSV(data, columns) {
  // Header
  const header = columns.map(col => escapeCSV(col.header)).join(',');

  // Rows
  const rows = data.map(row =>
    columns.map(col => escapeCSV(row[col.key])).join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Descarga un string como archivo
 * @param {string} content - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} mimeType - Tipo MIME
 */
function downloadFile(content, filename, mimeType) {
  // BOM para que Excel reconozca UTF-8 correctamente
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta reporte de ventas diarias a Excel (CSV)
 * @param {Object} data - Datos del reporte
 * @param {Object} data.resumen - Resumen del día
 * @param {Array} data.ventasPorHora - Ventas por hora
 * @param {Array} data.topProductos - Top productos
 * @param {Array} data.detalle - Detalle de ventas
 * @param {string} fecha - Fecha del reporte
 */
export function exportarReporteVentasDiarias(data, fecha) {
  const { resumen, ventasPorHora, topProductos, detalle } = data;

  let csvContent = '';

  // ========================================
  // RESUMEN DEL DÍA
  // ========================================
  csvContent += 'REPORTE DE VENTAS DIARIAS\n';
  csvContent += `Fecha:,${fecha}\n`;
  csvContent += `Generado:,${new Date().toLocaleString('es-MX')}\n\n`;

  csvContent += 'RESUMEN\n';
  csvContent += `Total Ventas,${resumen.total_ventas || 0}\n`;
  csvContent += `Ingresos,$${parseFloat(resumen.total_ingresos || 0).toFixed(2)}\n`;
  csvContent += `Ticket Promedio,$${parseFloat(resumen.ticket_promedio || 0).toFixed(2)}\n`;
  csvContent += `Items Vendidos,${resumen.total_items_vendidos || 0}\n\n`;

  // ========================================
  // VENTAS POR HORA
  // ========================================
  if (ventasPorHora && ventasPorHora.length > 0) {
    csvContent += 'VENTAS POR HORA\n';
    csvContent += arrayToCSV(
      ventasPorHora.map(h => ({
        hora: `${h.hora}:00`,
        cantidad: h.cantidad_ventas,
        total: `$${parseFloat(h.total || 0).toFixed(2)}`,
        promedio: h.cantidad_ventas > 0
          ? `$${(parseFloat(h.total || 0) / h.cantidad_ventas).toFixed(2)}`
          : '$0.00'
      })),
      [
        { key: 'hora', header: 'Hora' },
        { key: 'cantidad', header: 'Cant. Ventas' },
        { key: 'total', header: 'Total' },
        { key: 'promedio', header: 'Promedio' }
      ]
    );
    csvContent += '\n\n';
  }

  // ========================================
  // TOP PRODUCTOS
  // ========================================
  if (topProductos && topProductos.length > 0) {
    csvContent += 'PRODUCTOS MÁS VENDIDOS\n';
    csvContent += arrayToCSV(
      topProductos.map((p, i) => ({
        posicion: i + 1,
        producto: p.producto_nombre,
        sku: p.producto_sku || '',
        cantidad: p.cantidad_vendida,
        total: `$${parseFloat(p.total || 0).toFixed(2)}`
      })),
      [
        { key: 'posicion', header: '#' },
        { key: 'producto', header: 'Producto' },
        { key: 'sku', header: 'SKU' },
        { key: 'cantidad', header: 'Cantidad' },
        { key: 'total', header: 'Total' }
      ]
    );
    csvContent += '\n\n';
  }

  // ========================================
  // DETALLE DE VENTAS
  // ========================================
  if (detalle && detalle.length > 0) {
    csvContent += 'DETALLE DE VENTAS\n';
    csvContent += arrayToCSV(
      detalle.map(v => ({
        folio: v.folio,
        hora: new Date(v.fecha_venta).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        cliente: v.cliente_nombre || 'Venta directa',
        metodo_pago: v.metodo_pago,
        total: `$${parseFloat(v.total || 0).toFixed(2)}`
      })),
      [
        { key: 'folio', header: 'Folio' },
        { key: 'hora', header: 'Hora' },
        { key: 'cliente', header: 'Cliente' },
        { key: 'metodo_pago', header: 'Método Pago' },
        { key: 'total', header: 'Total' }
      ]
    );
  }

  // Generar nombre de archivo
  const filename = `Ventas_${fecha}.csv`;

  // Descargar
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
}

/**
 * Exporta cualquier tabla a Excel (CSV)
 * @param {Array} data - Array de objetos
 * @param {Array} columns - Columnas [{key, header}]
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export function exportarTablaCSV(data, columns, filename) {
  const csvContent = arrayToCSV(data, columns);
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Exporta datos simples a CSV (sin definición de columnas)
 * Infiere los headers de las keys del primer objeto
 * @param {Array} data - Array de objetos
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {Object} options - Opciones
 * @param {Object} options.headerMap - Mapeo de keys a headers legibles {key: 'Header'}
 * @param {Array} options.excludeKeys - Keys a excluir
 * @param {Array} options.includeKeys - Keys a incluir (si se especifica, solo estas)
 */
export function exportarDatosCSV(data, filename, options = {}) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const { headerMap = {}, excludeKeys = [], includeKeys } = options;

  // Determinar keys a usar
  let keys = Object.keys(data[0]);
  if (includeKeys) {
    keys = includeKeys.filter(k => keys.includes(k));
  }
  keys = keys.filter(k => !excludeKeys.includes(k));

  // Crear columnas
  const columns = keys.map(key => ({
    key,
    header: headerMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  exportarTablaCSV(data, columns, filename);
}

export default {
  exportarReporteVentasDiarias,
  exportarTablaCSV,
  exportarDatosCSV,
  escapeCSV,
  arrayToCSV,
  downloadFile,
};
