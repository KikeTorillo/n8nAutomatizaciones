/**
 * Utilidad para exportar datos a CSV
 * Sin dependencias externas
 */

interface CSVColumn {
  key: string;
  header: string;
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(
  data: Record<string, unknown>[],
  columns: CSVColumn[]
): string {
  const header = columns.map((col) => escapeCSV(col.header)).join(',');
  const rows = data.map((row) =>
    columns.map((col) => escapeCSV(row[col.key])).join(',')
  );
  return [header, ...rows].join('\n');
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
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

export function exportarTablaCSV(
  data: Record<string, unknown>[],
  columns: CSVColumn[],
  filename: string
): void {
  const csvContent = arrayToCSV(data, columns);
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8');
}

interface ExportSimpleOptions {
  headerMap?: Record<string, string>;
  excludeKeys?: string[];
  includeKeys?: string[];
}

export function exportarDatosCSV(
  data: Record<string, unknown>[],
  filename: string,
  options: ExportSimpleOptions = {}
): void {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const { headerMap = {}, excludeKeys = [], includeKeys } = options;

  let keys = Object.keys(data[0]);
  if (includeKeys) {
    keys = includeKeys.filter((k) => keys.includes(k));
  }
  keys = keys.filter((k) => !excludeKeys.includes(k));

  const columns = keys.map((key) => ({
    key,
    header:
      headerMap[key] ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  exportarTablaCSV(data, columns, filename);
}
