/**
 * Modal para generar e imprimir etiquetas de productos
 * Soporta códigos de barras (EAN-13, Code-128), QR y GS1-128 avanzado
 */

import { useState, useEffect, useRef } from 'react';
import {
    X,
    Printer,
    QrCode,
    Barcode,
    Download,
    Plus,
    Minus,
    Settings,
    Layers,
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Button, Modal } from '@/components/ui';
import GenerarEtiquetaGS1Modal from './GenerarEtiquetaGS1Modal';

const FORMATOS_ETIQUETA = {
    PEQUEÑA: { width: 50, height: 25, name: 'Pequeña (50x25mm)' },
    MEDIANA: { width: 60, height: 40, name: 'Mediana (60x40mm)' },
    GRANDE: { width: 100, height: 50, name: 'Grande (100x50mm)' },
};

const TIPOS_CODIGO = {
    EAN13: 'EAN-13',
    CODE128: 'Code-128',
    QR: 'QR',
};

export default function GenerarEtiquetaModal({
    isOpen,
    onClose,
    producto,
}) {
    const [modo, setModo] = useState('simple'); // 'simple' | 'gs1'
    const [tipoCodigo, setTipoCodigo] = useState('EAN13');
    const [formatoEtiqueta, setFormatoEtiqueta] = useState('MEDIANA');
    const [cantidad, setCantidad] = useState(1);
    const [mostrarPrecio, setMostrarPrecio] = useState(true);
    const [mostrarNombre, setMostrarNombre] = useState(true);
    const [mostrarSKU, setMostrarSKU] = useState(false);
    const [codigoGenerado, setCodigoGenerado] = useState(null);
    const [error, setError] = useState(null);

    const canvasRef = useRef(null);
    const qrCanvasRef = useRef(null);

    // Determinar qué código usar
    const codigoProducto = producto?.codigo_barras || producto?.sku || '';

    useEffect(() => {
        if (isOpen && producto) {
            generarCodigo();
        }
    }, [isOpen, producto, tipoCodigo]);

    const generarCodigo = async () => {
        setError(null);

        if (!codigoProducto) {
            setError('El producto no tiene código de barras ni SKU');
            return;
        }

        try {
            if (tipoCodigo === 'QR') {
                // Generar QR con información del producto
                const qrData = JSON.stringify({
                    sku: producto.sku,
                    codigo: producto.codigo_barras,
                    nombre: producto.nombre,
                });

                const qrDataUrl = await QRCode.toDataURL(codigoProducto, {
                    width: 300,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff',
                    },
                });
                setCodigoGenerado(qrDataUrl);
            } else {
                // Generar código de barras
                const canvas = document.createElement('canvas');

                const formato = tipoCodigo === 'EAN13' ? 'EAN13' : 'CODE128';

                // Validar EAN-13 (debe tener 13 dígitos)
                let codigoFinal = codigoProducto;
                if (formato === 'EAN13') {
                    // Limpiar y validar
                    codigoFinal = codigoProducto.replace(/\D/g, '');
                    if (codigoFinal.length !== 13 && codigoFinal.length !== 12) {
                        // Si no es EAN-13 válido, usar Code-128
                        setTipoCodigo('CODE128');
                        return;
                    }
                }

                JsBarcode(canvas, codigoFinal, {
                    format: formato,
                    width: 3,
                    height: 100,
                    displayValue: true,
                    fontSize: 18,
                    margin: 10,
                    background: '#ffffff',
                });

                setCodigoGenerado(canvas.toDataURL('image/png'));
            }
        } catch (err) {
            console.error('Error generando código:', err);
            // Si falla EAN-13, intentar con Code-128
            if (tipoCodigo === 'EAN13') {
                setTipoCodigo('CODE128');
            } else {
                setError(`Error al generar código: ${err.message}`);
            }
        }
    };

    const handleImprimir = () => {
        const formato = FORMATOS_ETIQUETA[formatoEtiqueta];

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor permite las ventanas emergentes para imprimir');
            return;
        }

        // Generar HTML para impresión
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
                    ${mostrarNombre ? `<div style="font-size: 8pt; font-weight: bold; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${producto.nombre}</div>` : ''}
                    <img src="${codigoGenerado}" style="max-width: 90%; max-height: ${formato.height - 15}mm; object-fit: contain;" />
                    ${mostrarSKU ? `<div style="font-size: 7pt; color: #666;">SKU: ${producto.sku || '-'}</div>` : ''}
                    ${mostrarPrecio ? `<div style="font-size: 10pt; font-weight: bold;">$${Number(producto.precio_venta || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>` : ''}
                </div>
            `;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Etiquetas - ${producto.nombre}</title>
                <style>
                    @page {
                        size: auto;
                        margin: 5mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 10px;
                    }
                    .contenedor {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 2mm;
                    }
                    @media print {
                        .etiqueta {
                            border: none !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="contenedor">
                    ${etiquetasHTML}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDescargar = () => {
        if (!codigoGenerado) return;

        const link = document.createElement('a');
        link.download = `etiqueta-${producto.sku || producto.id}.png`;
        link.href = codigoGenerado;
        link.click();
    };

    if (!producto) return null;

    // Si está en modo GS1, mostrar el modal especializado
    if (modo === 'gs1') {
        return (
            <GenerarEtiquetaGS1Modal
                isOpen={isOpen}
                onClose={() => {
                    setModo('simple');
                    onClose();
                }}
                producto={producto}
            />
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generar Etiqueta"
            size="lg"
        >
            <div className="p-4 space-y-6">
                {/* Selector de modo */}
                <div className="flex gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setModo('simple')}
                        className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                            modo === 'simple'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <Barcode className="w-4 h-4" />
                        Etiqueta Simple
                    </button>
                    <button
                        onClick={() => setModo('gs1')}
                        className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                            modo === 'gs1'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        GS1 Avanzado
                    </button>
                </div>

                {/* Información del producto */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {producto.nombre}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>SKU: {producto.sku || '-'}</div>
                        <div>Código: {producto.codigo_barras || '-'}</div>
                        <div>Precio: ${Number(producto.precio_venta || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>

                {/* Opciones de generación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tipo de código */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Código
                        </label>
                        <div className="flex gap-2">
                            {Object.entries(TIPOS_CODIGO).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setTipoCodigo(key)}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                                        tipoCodigo === key
                                            ? 'bg-primary-600 border-primary-600 text-white'
                                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {key === 'QR' ? <QrCode className="w-4 h-4 mx-auto" /> : <Barcode className="w-4 h-4 mx-auto" />}
                                    <span className="block mt-1">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Formato de etiqueta */}
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
                </div>

                {/* Cantidad */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cantidad de Etiquetas
                    </label>
                    <div className="flex items-center gap-3">
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
                            className="w-20 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

                {/* Opciones de contenido */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contenido de la Etiqueta
                    </label>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mostrarNombre}
                                onChange={(e) => setMostrarNombre(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Nombre</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mostrarPrecio}
                                onChange={(e) => setMostrarPrecio(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Precio</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mostrarSKU}
                                onChange={(e) => setMostrarSKU(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">SKU</span>
                        </label>
                    </div>
                </div>

                {/* Preview */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Vista Previa
                    </label>
                    <div className="bg-white border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex items-center justify-center min-h-[250px]">
                        {error ? (
                            <div className="text-red-500 text-center">
                                <p>{error}</p>
                                <p className="text-sm mt-2">Intenta con otro tipo de código</p>
                            </div>
                        ) : codigoGenerado ? (
                            <div className="text-center">
                                {mostrarNombre && (
                                    <p className="font-bold text-gray-900 text-sm mb-1 max-w-[200px] truncate">
                                        {producto.nombre}
                                    </p>
                                )}
                                <img
                                    src={codigoGenerado}
                                    alt="Código generado"
                                    className="max-h-[180px] max-w-full mx-auto"
                                />
                                {mostrarSKU && (
                                    <p className="text-xs text-gray-500 mt-1">SKU: {producto.sku || '-'}</p>
                                )}
                                {mostrarPrecio && (
                                    <p className="font-bold text-gray-900 mt-1">
                                        ${Number(producto.precio_venta || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center">
                                <Barcode className="w-12 h-12 mx-auto mb-2" />
                                <p>Generando código...</p>
                            </div>
                        )}
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
                        disabled={!codigoGenerado}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                    </Button>
                    <Button
                        onClick={handleImprimir}
                        disabled={!codigoGenerado}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir ({cantidad})
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
