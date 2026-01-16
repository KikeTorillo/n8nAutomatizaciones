/**
 * Modal para generar etiquetas con códigos GS1-128 completos
 * Soporta múltiples Application Identifiers (GTIN, Lote, Fecha, Serial, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Printer,
  Download,
  Plus,
  Minus,
  Pill,
  Smartphone,
  Apple,
  Package,
  Settings,
  AlertCircle,
  CheckCircle,
  Copy,
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { Button, Modal } from '@/components/ui';
import {
  generateGS1Code,
  validateGS1Params,
  normalizeToGTIN14,
  GS1_TEMPLATES,
} from '@/utils/gs1Generator';

const FORMATOS_ETIQUETA = {
  PEQUENA: { width: 50, height: 30, name: 'Pequeña (50x30mm)' },
  MEDIANA: { width: 70, height: 40, name: 'Mediana (70x40mm)' },
  GRANDE: { width: 100, height: 60, name: 'Grande (100x60mm)' },
};

const TEMPLATE_ICONS = {
  Pill: Pill,
  Smartphone: Smartphone,
  Apple: Apple,
  Package: Package,
  Settings: Settings,
};

export default function GenerarEtiquetaGS1Modal({
  isOpen,
  onClose,
  producto,
}) {
  const [template, setTemplate] = useState('PERSONALIZADO');
  const [formatoEtiqueta, setFormatoEtiqueta] = useState('MEDIANA');
  const [cantidad, setCantidad] = useState(1);
  const [mostrarNombre, setMostrarNombre] = useState(true);
  const [mostrarPrecio, setMostrarPrecio] = useState(false);

  // Campos GS1
  const [params, setParams] = useState({
    gtin: '',
    lot: '',
    serial: '',
    expirationDate: '',
    productionDate: '',
    count: '',
  });

  // Estado de generación
  const [generatedCode, setGeneratedCode] = useState(null);
  const [humanReadable, setHumanReadable] = useState('');
  const [barcodeImage, setBarcodeImage] = useState(null);
  const [errors, setErrors] = useState([]);
  const [copied, setCopied] = useState(false);

  // Inicializar GTIN desde producto
  useEffect(() => {
    if (isOpen && producto) {
      const gtin = producto.codigo_barras || producto.sku || '';
      setParams((prev) => ({
        ...prev,
        gtin: gtin,
      }));
    }
  }, [isOpen, producto]);

  // Generar código cuando cambian los parámetros
  const handleGenerate = useCallback(() => {
    const result = generateGS1Code(params);

    if (result.errors.length > 0) {
      setErrors(result.errors);
      setGeneratedCode(null);
      setHumanReadable('');
      setBarcodeImage(null);
      return;
    }

    setErrors([]);
    setGeneratedCode(result.code);
    setHumanReadable(result.humanReadable);

    // Generar imagen del código de barras
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, result.code, {
        format: 'CODE128',
        width: 2,
        height: 80,
        displayValue: false,
        margin: 10,
        background: '#ffffff',
      });
      setBarcodeImage(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Error generando código de barras:', err);
      setErrors(['Error al generar código de barras']);
    }
  }, [params]);

  // Auto-generar al cambiar parámetros (con debounce implícito)
  useEffect(() => {
    if (params.gtin) {
      const timer = setTimeout(() => {
        handleGenerate();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [params, handleGenerate]);

  // Aplicar plantilla
  const handleTemplateChange = (templateKey) => {
    setTemplate(templateKey);
    // Limpiar campos no relevantes para la plantilla
    const templateConfig = GS1_TEMPLATES[templateKey];
    const newParams = { ...params };

    // Mantener GTIN, limpiar otros según plantilla
    Object.keys(newParams).forEach((key) => {
      if (key !== 'gtin' && !templateConfig.fields.includes(key)) {
        newParams[key] = '';
      }
    });

    setParams(newParams);
  };

  // Actualizar campo
  const handleParamChange = (field, value) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  // Copiar código
  const handleCopyCode = () => {
    if (humanReadable) {
      navigator.clipboard.writeText(humanReadable);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Imprimir etiquetas
  const handleImprimir = () => {
    if (!barcodeImage) return;

    const formato = FORMATOS_ETIQUETA[formatoEtiqueta];
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir');
      return;
    }

    let etiquetasHTML = '';
    for (let i = 0; i < cantidad; i++) {
      etiquetasHTML += `
        <div class="etiqueta" style="
          width: ${formato.width}mm;
          height: ${formato.height}mm;
          border: 1px dashed #ccc;
          padding: 2mm;
          margin: 1mm;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          page-break-inside: avoid;
          box-sizing: border-box;
        ">
          ${mostrarNombre ? `<div style="font-size: 8pt; font-weight: bold; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${producto?.nombre || ''}</div>` : ''}
          <img src="${barcodeImage}" style="max-width: 95%; max-height: ${formato.height - 20}mm; object-fit: contain;" />
          <div style="font-size: 7pt; font-family: monospace; text-align: center; word-break: break-all; max-width: 100%;">${humanReadable}</div>
          ${mostrarPrecio && producto?.precio_venta ? `<div style="font-size: 9pt; font-weight: bold;">$${Number(producto.precio_venta).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>` : ''}
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiquetas GS1 - ${producto?.nombre || 'Producto'}</title>
        <style>
          @page { size: auto; margin: 5mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
          .contenedor { display: flex; flex-wrap: wrap; gap: 2mm; }
          @media print { .etiqueta { border: none !important; } }
        </style>
      </head>
      <body>
        <div class="contenedor">${etiquetasHTML}</div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Descargar imagen
  const handleDescargar = () => {
    if (!barcodeImage) return;

    const link = document.createElement('a');
    link.download = `gs1-${producto?.sku || producto?.id || 'etiqueta'}.png`;
    link.href = barcodeImage;
    link.click();
  };

  // Campos a mostrar según plantilla
  const templateConfig = GS1_TEMPLATES[template];
  const visibleFields = templateConfig?.fields || [];

  if (!producto) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generar Etiqueta GS1"
      size="xl"
    >
      <div className="p-4 space-y-6">
        {/* Información del producto */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {producto.nombre}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>SKU: {producto.sku || '-'}</div>
            <div>Código: {producto.codigo_barras || '-'}</div>
          </div>
        </div>

        {/* Selector de plantilla */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Plantilla GS1
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(GS1_TEMPLATES).map(([key, tpl]) => {
              const IconComponent = TEMPLATE_ICONS[tpl.icon] || Settings;
              return (
                <button
                  key={key}
                  onClick={() => handleTemplateChange(key)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    template === key
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs block">{tpl.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {templateConfig?.description}
          </p>
        </div>

        {/* Campos GS1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GTIN - Siempre visible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              GTIN (AI 01) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={params.gtin}
              onChange={(e) => handleParamChange('gtin', e.target.value)}
              placeholder="7501234567890"
              maxLength={14}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">Código del producto (8-14 dígitos)</p>
          </div>

          {/* Lote */}
          {visibleFields.includes('lot') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lote (AI 10) {templateConfig?.required?.includes('lot') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={params.lot}
                onChange={(e) => handleParamChange('lot', e.target.value.toUpperCase())}
                placeholder="LOT-2024-001"
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 20 caracteres</p>
            </div>
          )}

          {/* Número de Serie */}
          {visibleFields.includes('serial') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Serie (AI 21) {templateConfig?.required?.includes('serial') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={params.serial}
                onChange={(e) => handleParamChange('serial', e.target.value)}
                placeholder="SN-12345678"
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Identificador único por unidad</p>
            </div>
          )}

          {/* Fecha Vencimiento */}
          {visibleFields.includes('expirationDate') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Vencimiento (AI 17) {templateConfig?.required?.includes('expirationDate') && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={params.expirationDate}
                onChange={(e) => handleParamChange('expirationDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Fecha Producción */}
          {visibleFields.includes('productionDate') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha Producción (AI 11)
              </label>
              <input
                type="date"
                value={params.productionDate}
                onChange={(e) => handleParamChange('productionDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Cantidad */}
          {visibleFields.includes('count') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad (AI 37)
              </label>
              <input
                type="number"
                value={params.count}
                onChange={(e) => handleParamChange('count', e.target.value)}
                placeholder="1"
                min="1"
                max="99999999"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Errores */}
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Errores de validación</span>
            </div>
            <ul className="text-sm text-red-600 dark:text-red-400 list-disc pl-5">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Vista previa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vista Previa
          </label>
          <div className="bg-white border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 min-h-[180px]">
            {barcodeImage ? (
              <div className="text-center space-y-2">
                {mostrarNombre && (
                  <p className="font-bold text-gray-900 text-sm truncate max-w-[300px] mx-auto">
                    {producto.nombre}
                  </p>
                )}
                <img
                  src={barcodeImage}
                  alt="Código GS1"
                  className="max-h-[80px] mx-auto"
                />
                <div className="flex items-center justify-center gap-2">
                  <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                    {humanReadable}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copiar código"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {mostrarPrecio && producto.precio_venta && (
                  <p className="font-bold text-gray-900">
                    ${Number(producto.precio_venta).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p>Complete los campos obligatorios para generar el código</p>
              </div>
            )}
          </div>
        </div>

        {/* Opciones de etiqueta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tamaño */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tamaño de Etiqueta
            </label>
            <select
              value={formatoEtiqueta}
              onChange={(e) => setFormatoEtiqueta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.entries(FORMATOS_ETIQUETA).map(([key, formato]) => (
                <option key={key} value={key}>
                  {formato.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cantidad de Etiquetas
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="1"
                max="100"
              />
              <button
                onClick={() => setCantidad(Math.min(100, cantidad + 1))}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenido
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarNombre}
                  onChange={(e) => setMostrarNombre(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Nombre</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarPrecio}
                  onChange={(e) => setMostrarPrecio(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Precio</span>
              </label>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleDescargar}
            disabled={!barcodeImage}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
          <Button
            onClick={handleImprimir}
            disabled={!barcodeImage}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir ({cantidad})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
