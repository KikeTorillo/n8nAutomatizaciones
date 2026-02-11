import { useState, useRef, useCallback, useEffect } from 'react';
import { parseGS1, extractProductCode } from '../lib/gs1Parser';

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
  UPC_EAN_EXTENSION: 16,
} as const;

export const FORMAT_PRESETS = {
  PRODUCTOS: [
    BARCODE_FORMATS.EAN_13,
    BARCODE_FORMATS.EAN_8,
    BARCODE_FORMATS.UPC_A,
    BARCODE_FORMATS.CODE_128,
  ],
  QR_ONLY: [BARCODE_FORMATS.QR_CODE],
  ALL: Object.values(BARCODE_FORMATS),
  INVENTARIO: [
    BARCODE_FORMATS.EAN_13,
    BARCODE_FORMATS.EAN_8,
    BARCODE_FORMATS.UPC_A,
    BARCODE_FORMATS.CODE_128,
    BARCODE_FORMATS.CODE_39,
    BARCODE_FORMATS.QR_CODE,
  ],
} as const;

interface CameraDevice {
  id: string;
  label: string;
}

interface ScanData {
  code: string;
  raw: string;
  gs1: unknown;
  format: string;
  timestamp: string;
}

interface UseBarcodeeScannerOptions {
  onScan?: (code: string, data: ScanData) => void;
  onError?: (error: unknown) => void;
  formats?: number[];
  fps?: number;
  qrbox?: { width: number; height: number };
  pauseAfterScan?: number;
  beepOnScan?: boolean;
  parseGS1Enabled?: boolean;
}

export function useBarcodeScanner(options: UseBarcodeeScannerOptions = {}) {
  const {
    onScan,
    onError,
    formats = FORMAT_PRESETS.INVENTARIO as unknown as number[],
    fps = 10,
    qrbox = { width: 250, height: 120 },
    pauseAfterScan = 1500,
    beepOnScan = true,
    parseGS1Enabled = true,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [lastScan, setLastScan] = useState<ScanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  const html5QrCodeRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    if (!beepOnScan) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
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
    } catch {
      // Ignorar errores de audio
    }
  }, [beepOnScan]);

  const getCameras = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      const backCamera = devices.find(
        (d: CameraDevice) =>
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

  const startScanner = useCallback(
    async (elementId = 'barcode-scanner') => {
      try {
        setError(null);
        const { Html5Qrcode } = await import('html5-qrcode');

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {
            // Ignorar
          }
        }

        html5QrCodeRef.current = new Html5Qrcode(elementId);

        const config = {
          fps,
          qrbox,
          formatsToSupport: formats,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          aspectRatio: 1.7777778,
        };

        const cameraConfig = selectedCamera
          ? { deviceId: selectedCamera }
          : { facingMode: 'environment' as const };

        await html5QrCodeRef.current.start(
          cameraConfig,
          config,
          (decodedText: string, decodedResult: any) => {
            const gs1Data = parseGS1Enabled ? parseGS1(decodedText) : null;
            const scanData: ScanData = {
              code: extractProductCode(decodedText),
              raw: decodedText,
              gs1: gs1Data?.isGS1 ? gs1Data : null,
              format: decodedResult?.result?.format?.formatName || 'UNKNOWN',
              timestamp: new Date().toISOString(),
            };
            setLastScan(scanData);
            playBeep();
            onScan?.(scanData.code, scanData);

            if (html5QrCodeRef.current && pauseAfterScan > 0) {
              html5QrCodeRef.current.pause(true);
              setTimeout(() => {
                if (html5QrCodeRef.current) {
                  try {
                    html5QrCodeRef.current.resume();
                  } catch {
                    // Scanner ya detenido
                  }
                }
              }, pauseAfterScan);
            }
          },
          () => {
            // Ignorar frames sin código
          }
        );

        setIsActive(true);
      } catch (err: any) {
        const errorMsg = err.message?.includes('Permission')
          ? 'Permiso de cámara denegado'
          : 'No se pudo iniciar el scanner';
        setError(errorMsg);
        onError?.(err);
      }
    },
    [
      formats,
      fps,
      qrbox,
      selectedCamera,
      pauseAfterScan,
      playBeep,
      onScan,
      onError,
      parseGS1Enabled,
    ]
  );

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState?.();
        if (state === 2 || state === 3) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current = null;
      } catch {
        html5QrCodeRef.current = null;
      }
    }
    setIsActive(false);
  }, []);

  const switchCamera = useCallback(
    async (cameraId: string) => {
      setSelectedCamera(cameraId);
      if (isActive) {
        await stopScanner();
        setTimeout(() => startScanner(), 100);
      }
    },
    [isActive, stopScanner, startScanner]
  );

  const toggleScanner = useCallback(
    async (elementId?: string) => {
      if (isActive) {
        await stopScanner();
      } else {
        await startScanner(elementId);
      }
    },
    [isActive, startScanner, stopScanner]
  );

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          const state = html5QrCodeRef.current.getState?.();
          if (state === 2 || state === 3) {
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
    isActive,
    lastScan,
    error,
    cameras,
    selectedCamera,
    startScanner,
    stopScanner,
    toggleScanner,
    getCameras,
    switchCamera,
  };
}
