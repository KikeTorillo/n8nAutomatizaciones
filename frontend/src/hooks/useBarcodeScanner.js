/**
 * Hook para escaneo de códigos de barras y QR
 * Reutiliza html5-qrcode ya instalado en el proyecto
 *
 * Soporta: QR, EAN-13, EAN-8, UPC-A, Code-128, Code-39
 *
 * @example
 * const { startScanner, stopScanner, isActive, lastScan } = useBarcodeScanner({
 *   onScan: (code) => console.log('Escaneado:', code),
 *   onError: (err) => console.error(err),
 *   formats: ['EAN_13', 'QR_CODE']
 * });
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { parseGS1 } from '@/utils/gs1Parser';

// Formatos soportados por html5-qrcode
export const BARCODE_FORMATS = {
    QR_CODE: 0,
    AZTEC: 1,
    CODABAR: 2,
    CODE_39: 3,
    CODE_93: 4,
    CODE_128: 5,
    DATA_MATRIX: 6,
    MAXICODE: 7,
    ITF: 8,
    EAN_13: 9,
    EAN_8: 10,
    PDF_417: 11,
    RSS_14: 12,
    RSS_EXPANDED: 13,
    UPC_A: 14,
    UPC_E: 15,
    UPC_EAN_EXTENSION: 16
};

// Presets de formatos comunes
export const FORMAT_PRESETS = {
    // Solo productos (barcodes tradicionales)
    PRODUCTOS: [
        BARCODE_FORMATS.EAN_13,
        BARCODE_FORMATS.EAN_8,
        BARCODE_FORMATS.UPC_A,
        BARCODE_FORMATS.CODE_128
    ],
    // Solo QR
    QR_ONLY: [BARCODE_FORMATS.QR_CODE],
    // Todos los formatos
    ALL: Object.values(BARCODE_FORMATS),
    // Inventario (productos + QR para ubicaciones)
    INVENTARIO: [
        BARCODE_FORMATS.EAN_13,
        BARCODE_FORMATS.EAN_8,
        BARCODE_FORMATS.UPC_A,
        BARCODE_FORMATS.CODE_128,
        BARCODE_FORMATS.CODE_39,
        BARCODE_FORMATS.QR_CODE
    ]
};

/**
 * @param {Object} options
 * @param {Function} options.onScan - Callback cuando se escanea un código
 * @param {Function} options.onError - Callback en caso de error
 * @param {Array<number>} options.formats - Formatos a detectar (usar FORMAT_PRESETS)
 * @param {number} options.fps - Frames por segundo (default: 10)
 * @param {Object} options.qrbox - Tamaño del área de escaneo
 * @param {number} options.pauseAfterScan - Ms de pausa después de escanear (default: 1500)
 * @param {boolean} options.beepOnScan - Reproducir sonido al escanear (default: true)
 * @param {boolean} options.parseGS1Enabled - Parsear códigos GS1-128 automáticamente (default: true)
 */
export function useBarcodeScanner(options = {}) {
    const {
        onScan,
        onError,
        formats = FORMAT_PRESETS.INVENTARIO,
        fps = 10,
        qrbox = { width: 280, height: 150 },
        pauseAfterScan = 1500,
        beepOnScan = true,
        parseGS1Enabled = true
    } = options;

    const [isActive, setIsActive] = useState(false);
    const [lastScan, setLastScan] = useState(null);
    const [error, setError] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);

    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const audioContextRef = useRef(null);

    // Sonido de beep al escanear
    const playBeep = useCallback(() => {
        if (!beepOnScan) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = 1800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.1);
        } catch (e) {
            // Ignorar errores de audio
        }
    }, [beepOnScan]);

    // Obtener cámaras disponibles
    const getCameras = useCallback(async () => {
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const devices = await Html5Qrcode.getCameras();
            setCameras(devices);

            // Preferir cámara trasera
            const backCamera = devices.find(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('trasera') ||
                d.label.toLowerCase().includes('rear')
            );
            setSelectedCamera(backCamera?.id || devices[0]?.id);

            return devices;
        } catch (err) {
            setError('No se pudo acceder a las cámaras');
            onError?.(err);
            return [];
        }
    }, [onError]);

    // Iniciar scanner
    const startScanner = useCallback(async (elementId = 'barcode-scanner') => {
        try {
            setError(null);
            const { Html5Qrcode } = await import('html5-qrcode');

            // Detener si ya está activo
            if (html5QrCodeRef.current) {
                try {
                    await html5QrCodeRef.current.stop();
                } catch (e) {
                    // Ignorar
                }
            }

            html5QrCodeRef.current = new Html5Qrcode(elementId);

            const config = {
                fps,
                qrbox,
                formatsToSupport: formats
            };

            const cameraConfig = selectedCamera
                ? { deviceId: selectedCamera }
                : { facingMode: 'environment' };

            await html5QrCodeRef.current.start(
                cameraConfig,
                config,
                (decodedText, decodedResult) => {
                    // Código escaneado exitosamente
                    // Parsear GS1 si está habilitado
                    const gs1Data = parseGS1Enabled ? parseGS1(decodedText) : null;

                    const scanData = {
                        code: gs1Data?.gtin || decodedText,  // Código producto (GTIN extraído o raw)
                        raw: decodedText,                      // Código original completo
                        gs1: gs1Data?.isGS1 ? gs1Data : null,  // Datos GS1 completos si aplica
                        format: decodedResult?.result?.format?.formatName || 'UNKNOWN',
                        timestamp: new Date().toISOString()
                    };

                    setLastScan(scanData);
                    playBeep();
                    onScan?.(scanData.code, scanData);

                    // Pausar para evitar múltiples lecturas
                    if (html5QrCodeRef.current && pauseAfterScan > 0) {
                        html5QrCodeRef.current.pause(true);
                        setTimeout(() => {
                            if (html5QrCodeRef.current) {
                                try {
                                    html5QrCodeRef.current.resume();
                                } catch (e) {
                                    // Scanner ya detenido
                                }
                            }
                        }, pauseAfterScan);
                    }
                },
                () => {
                    // Ignorar errores de escaneo (frames sin código)
                }
            );

            setIsActive(true);
        } catch (err) {
            const errorMsg = err.message?.includes('Permission')
                ? 'Permiso de cámara denegado'
                : 'No se pudo iniciar el scanner';
            setError(errorMsg);
            onError?.(err);
        }
    }, [formats, fps, qrbox, selectedCamera, pauseAfterScan, playBeep, onScan, onError, parseGS1Enabled]);

    // Detener scanner
    const stopScanner = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                // Verificar si el scanner realmente está corriendo antes de detener
                const state = html5QrCodeRef.current.getState?.();
                if (state === 2 || state === 3) { // SCANNING or PAUSED
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current = null;
            } catch (err) {
                // Ignorar errores de stop - el scanner puede no estar corriendo
                html5QrCodeRef.current = null;
            }
        }
        setIsActive(false);
    }, []);

    // Cambiar cámara
    const switchCamera = useCallback(async (cameraId) => {
        setSelectedCamera(cameraId);
        if (isActive) {
            await stopScanner();
            setTimeout(() => startScanner(), 100);
        }
    }, [isActive, stopScanner, startScanner]);

    // Toggle scanner
    const toggleScanner = useCallback(async (elementId) => {
        if (isActive) {
            await stopScanner();
        } else {
            await startScanner(elementId);
        }
    }, [isActive, startScanner, stopScanner]);

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                try {
                    const state = html5QrCodeRef.current.getState?.();
                    if (state === 2 || state === 3) { // SCANNING or PAUSED
                        html5QrCodeRef.current.stop().catch(() => {});
                    }
                } catch {
                    // Ignorar
                }
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
            }
        };
    }, []);

    return {
        // Estado
        isActive,
        lastScan,
        error,
        cameras,
        selectedCamera,

        // Acciones
        startScanner,
        stopScanner,
        toggleScanner,
        getCameras,
        switchCamera,

        // Ref para el contenedor
        scannerRef
    };
}

export default useBarcodeScanner;
