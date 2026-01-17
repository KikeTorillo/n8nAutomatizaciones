import { useState, useRef } from 'react';
import {
    Upload,
    Download,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    XCircle,
    ArrowLeft,
    ArrowRight,
    File,
} from 'lucide-react';
import { Button, Drawer } from '@/components/ui';
import { useCrearAjusteMasivo, useDescargarPlantillaAjustes, parsearCSVAjustes } from '@/hooks/useAjustesMasivos';
import { useToast } from '@/hooks/useToast';

/**
 * Modal para crear un nuevo ajuste masivo desde CSV
 * Flujo: Upload -> Preview -> Confirmar
 */
export default function AjusteMasivoModal({ isOpen, onClose, onSuccess }) {
    const { error: showError } = useToast();
    const fileInputRef = useRef(null);

    // Estado del flujo
    const [paso, setPaso] = useState(1);

    // Datos del archivo
    const [archivo, setArchivo] = useState(null);
    const [csvContent, setCsvContent] = useState('');
    const [items, setItems] = useState([]);
    const [errores, setErrores] = useState([]);

    // Mutations
    const crearMutation = useCrearAjusteMasivo();
    const descargarPlantillaMutation = useDescargarPlantillaAjustes();

    // Reset al cerrar
    const handleClose = () => {
        setPaso(1);
        setArchivo(null);
        setCsvContent('');
        setItems([]);
        setErrores([]);
        onClose();
    };

    // Descargar plantilla
    const handleDescargarPlantilla = () => {
        descargarPlantillaMutation.mutate();
    };

    // Seleccionar archivo
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            showError('El archivo debe ser CSV');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('El archivo no puede superar 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            setArchivo(file);
            setCsvContent(content);

            // Parsear CSV
            const { items: parsedItems, errores: parsedErrores } = parsearCSVAjustes(content);
            setItems(parsedItems);
            setErrores(parsedErrores);

            // Avanzar al preview
            setPaso(2);
        };
        reader.readAsText(file);
    };

    // Drag and drop
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const fakeEvent = { target: { files: [file] } };
            handleFileSelect(fakeEvent);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Crear ajuste
    const handleCrear = () => {
        if (items.length === 0) {
            showError('No hay items validos para crear');
            return;
        }

        crearMutation.mutate(
            {
                archivo_nombre: archivo?.name || 'ajuste.csv',
                items,
            },
            {
                onSuccess: (ajuste) => {
                    handleClose();
                    onSuccess?.(ajuste);
                },
                onError: (error) => {
                    showError(error.message || 'Error al crear ajuste');
                },
            }
        );
    };

    // Calcular resumen
    const calcularResumen = () => {
        const entradas = items.filter((i) => i.cantidad_ajuste > 0);
        const salidas = items.filter((i) => i.cantidad_ajuste < 0);

        return {
            total: items.length,
            entradas: entradas.length,
            salidas: salidas.length,
            totalEntradas: entradas.reduce((sum, i) => sum + i.cantidad_ajuste, 0),
            totalSalidas: salidas.reduce((sum, i) => sum + Math.abs(i.cantidad_ajuste), 0),
            errores: errores.length,
        };
    };

    const resumen = calcularResumen();

    return (
        <Drawer
            isOpen={isOpen}
            onClose={handleClose}
            title="Nuevo Ajuste Masivo"
            subtitle={`Paso ${paso} de 3`}
        >
            <div className="space-y-6">
                {/* Indicador de pasos */}
                <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    paso === n
                                        ? 'bg-primary-600 text-white'
                                        : paso > n
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {paso > n ? <CheckCircle className="h-5 w-5" /> : n}
                            </div>
                            {n < 3 && (
                                <div
                                    className={`w-12 h-1 mx-1 ${
                                        paso > n ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Paso 1: Upload */}
                {paso === 1 && (
                    <div className="space-y-4">
                        {/* Instrucciones */}
                        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-primary-900 dark:text-primary-300 mb-2 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Formato del CSV
                            </h4>
                            <ul className="text-sm text-primary-800 dark:text-primary-300 space-y-1 list-disc list-inside">
                                <li>Columnas: <code className="bg-primary-100 dark:bg-primary-800 px-1 rounded">sku, codigo_barras, cantidad_ajuste, motivo</code></li>
                                <li>Se requiere <strong>sku</strong> o <strong>codigo_barras</strong> (al menos uno)</li>
                                <li>cantidad_ajuste: positivo = entrada, negativo = salida</li>
                                <li>Maximo 500 filas por archivo</li>
                            </ul>
                        </div>

                        {/* Descargar plantilla */}
                        <div className="flex justify-center">
                            <Button
                                variant="secondary"
                                onClick={handleDescargarPlantilla}
                                isLoading={descargarPlantillaMutation.isPending}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Plantilla
                            </Button>
                        </div>

                        {/* Drop zone */}
                        <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                Arrastra tu archivo CSV aqui
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                o haz clic para seleccionar
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    </div>
                )}

                {/* Paso 2: Preview */}
                {paso === 2 && (
                    <div className="space-y-4">
                        {/* Info del archivo */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <File className="h-8 w-8 text-primary-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {archivo?.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {items.length} items validos
                                    {errores.length > 0 && `, ${errores.length} con errores`}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setPaso(1);
                                    setArchivo(null);
                                    setCsvContent('');
                                    setItems([]);
                                    setErrores([]);
                                }}
                            >
                                Cambiar
                            </Button>
                        </div>

                        {/* Errores de parseo */}
                        {errores.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2 flex items-center">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Errores de formato ({errores.length})
                                </h4>
                                <div className="max-h-32 overflow-y-auto">
                                    {errores.slice(0, 10).map((err, idx) => (
                                        <p key={idx} className="text-xs text-red-700 dark:text-red-400">
                                            Fila {err.fila}: {err.mensaje}
                                        </p>
                                    ))}
                                    {errores.length > 10 && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 italic">
                                            ...y {errores.length - 10} errores mas
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Preview de items */}
                        {items.length > 0 && (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Vista previa ({items.length} items)
                                    </span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    #
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    SKU / Codigo
                                                </th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Cantidad
                                                </th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Motivo
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                            {items.slice(0, 20).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                                        {item.fila_numero}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs">
                                                        {item.sku || item.codigo_barras || '-'}
                                                    </td>
                                                    <td className={`px-3 py-2 text-right font-medium ${
                                                        item.cantidad_ajuste > 0
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {item.cantidad_ajuste > 0 ? '+' : ''}
                                                        {item.cantidad_ajuste}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                                        {item.motivo || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {items.length > 20 && (
                                                <tr>
                                                    <td colSpan={4} className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 italic">
                                                        ...y {items.length - 20} items mas
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {items.length === 0 && (
                            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                                <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                                <p>No hay items validos para procesar</p>
                                <p className="text-sm mt-2">Revisa el formato del archivo</p>
                            </div>
                        )}

                        {/* Botones navegacion */}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setPaso(1)}>
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Atras
                            </Button>
                            <Button
                                onClick={() => setPaso(3)}
                                disabled={items.length === 0}
                            >
                                Continuar
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Paso 3: Confirmar */}
                {paso === 3 && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <FileSpreadsheet className="h-16 w-16 text-primary-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Confirmar Ajuste Masivo
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {archivo?.name}
                            </p>
                        </div>

                        {/* Resumen */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Total items</span>
                                <span className="font-medium text-gray-900 dark:text-white">{resumen.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Entradas (+)</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                    {resumen.entradas} items (+{resumen.totalEntradas} unidades)
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Salidas (-)</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {resumen.salidas} items (-{resumen.totalSalidas} unidades)
                                </span>
                            </div>
                            {resumen.errores > 0 && (
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-gray-600 dark:text-gray-400">Items con error (ignorados)</span>
                                    <span className="font-medium text-yellow-600 dark:text-yellow-400">{resumen.errores}</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                                <div className="text-sm text-primary-700 dark:text-primary-300">
                                    <p>Al crear el ajuste:</p>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                        <li>Se guardaran los items para revision</li>
                                        <li>Deberas <strong>validar</strong> el ajuste para verificar SKUs</li>
                                        <li>Luego podras <strong>aplicar</strong> los movimientos</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setPaso(2)}>
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Atras
                            </Button>
                            <Button
                                onClick={handleCrear}
                                isLoading={crearMutation.isPending}
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Crear Ajuste
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Drawer>
    );
}
