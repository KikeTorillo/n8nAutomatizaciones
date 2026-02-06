import { memo, useEffect, useId, forwardRef } from 'react';
import { X, Camera, CameraOff, RotateCcw } from 'lucide-react';
import { useBarcodeScanner, FORMAT_PRESETS } from '@/hooks/pos';

/** Cámara disponible */
interface CameraDevice {
  id: string;
  label: string;
}

/** Datos del último escaneo */
interface LastScanData {
  code: string;
  format: string;
  raw?: string;
  gs1?: unknown;
  timestamp?: string;
}

/**
 * Preset de formato de código de barras
 */
export type BarcodeFormatPreset = keyof typeof FORMAT_PRESETS;

/**
 * Props del componente BarcodeScanner
 */
export interface BarcodeScannerProps {
  /** Callback al escanear código (code, data) => void */
  onScan: (code: string, data: unknown) => void;
  /** Callback al cerrar el scanner */
  onClose?: () => void;
  /** Callback en caso de error */
  onError?: (error: Error) => void;
  /** Título del scanner */
  title?: string;
  /** Subtítulo descriptivo */
  subtitle?: string;
  /** Preset o array de formatos */
  formats?: BarcodeFormatPreset | string[];
  /** Mostrar último código escaneado */
  showLastScan?: boolean;
  /** Mostrar selector de cámara */
  showCameraSwitch?: boolean;
  /** Iniciar automáticamente */
  autoStart?: boolean;
  /** Clases adicionales */
  className?: string;
  /** Modo pantalla completa */
  fullScreen?: boolean;
}

/**
 * BarcodeScanner - Componente para escaneo de códigos de barras y QR
 *
 * @example
 * <BarcodeScanner
 *   onScan={(code) => buscarProducto(code)}
 *   onClose={() => setShowScanner(false)}
 *   title="Escanear Producto"
 *   formats="PRODUCTOS"
 * />
 */
const BarcodeScanner = memo(
  forwardRef<HTMLDivElement, BarcodeScannerProps>(function BarcodeScanner({
  onScan,
  onClose,
  onError,
  title = 'Escanear Código',
  subtitle = 'Apunta la cámara al código de barras o QR',
  formats = 'INVENTARIO',
  showLastScan = true,
  showCameraSwitch = true,
  autoStart = true,
  className = '',
  fullScreen = false,
}, ref) {
  const scannerId = useId().replace(/:/g, '-');
  const elementId = `scanner-${scannerId}`;

  const formatPreset =
    typeof formats === 'string'
      ? FORMAT_PRESETS[formats as BarcodeFormatPreset] || FORMAT_PRESETS.INVENTARIO
      : formats;

  const {
    isActive,
    lastScan,
    error,
    cameras,
    selectedCamera,
    startScanner,
    stopScanner,
    getCameras,
    switchCamera,
  } = useBarcodeScanner({
    onScan: (code: string, data: unknown) => {
      onScan?.(code, data);
    },
    onError,
    formats: formatPreset as number[],
  } as any) as {
    isActive: boolean;
    lastScan: LastScanData | null;
    error: string | null;
    cameras: CameraDevice[];
    selectedCamera: string | null;
    startScanner: (elementId: string) => Promise<void>;
    stopScanner: () => Promise<void>;
    getCameras: () => Promise<CameraDevice[]>;
    switchCamera: (cameraId: string) => Promise<void>;
  };

  // Auto-iniciar al montar
  useEffect(() => {
    if (autoStart) {
      getCameras().then(() => {
        setTimeout(() => startScanner(elementId), 100);
      });
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    stopScanner();
    onClose?.();
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 bg-black'
    : 'relative bg-gray-900 rounded-xl overflow-hidden';

  return (
    <div ref={ref} className={`${containerClass} ${className}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <p className="text-white/70 text-sm">{subtitle}</p>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Scanner Container */}
      <div className={`${fullScreen ? 'h-screen' : 'aspect-[4/3]'} relative`}>
        <div id={elementId} className="w-full h-full" style={{ minHeight: '300px' }} />

        {/* Overlay con guía de escaneo */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative">
              {/* Marco de escaneo */}
              <div className="w-72 h-40 border-2 border-white/50 rounded-lg relative">
                {/* Esquinas resaltadas */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />

                {/* Línea de escaneo animada */}
                <div className="absolute inset-x-2 h-0.5 bg-primary-500 animate-scan-line" />
              </div>
            </div>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center p-6">
              <CameraOff className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium mb-2">{error}</p>
              <button
                onClick={() => startScanner(elementId)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Cargando */}
        {!isActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <Camera className="w-12 h-12 text-white/50 mx-auto mb-3 animate-pulse" />
              <p className="text-white/70">Iniciando cámara...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer con controles y último escaneo */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Último escaneo */}
        {showLastScan && lastScan && (
          <div className="mb-3 bg-green-500/20 border border-green-500/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Último escaneo:</span>
            </div>
            <p className="text-white font-mono text-lg mt-1">{lastScan.code}</p>
            <p className="text-white/50 text-xs">{lastScan.format}</p>
          </div>
        )}

        {/* Controles */}
        <div className="flex items-center justify-between gap-3">
          {/* Toggle scanner */}
          <button
            onClick={() => (isActive ? stopScanner() : startScanner(elementId))}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {isActive ? (
              <>
                <CameraOff className="w-5 h-5" />
                Detener
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Iniciar
              </>
            )}
          </button>

          {/* Cambiar cámara */}
          {showCameraSwitch && cameras.length > 1 && (
            <select
              value={selectedCamera || ''}
              onChange={(e) => switchCamera(e.target.value)}
              className="py-3 px-3 bg-white/20 text-white rounded-lg border-none text-sm"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id} className="text-black">
                  {cam.label || `Cámara ${cam.id.slice(-4)}`}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
  })
);

BarcodeScanner.displayName = 'BarcodeScanner';

export { BarcodeScanner };
