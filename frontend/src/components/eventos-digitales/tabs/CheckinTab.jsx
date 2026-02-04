import { useState, useRef, useEffect, memo } from 'react';
import { Camera, ScanLine, X, UserCheck, AlertCircle } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import { eventosDigitalesApi } from '@/services/api/modules';

/**
 * Tab de check-in con scanner QR
 * @param {Object} props
 * @param {string} props.eventoId - ID del evento
 * @param {number} props.totalInvitados - Total de invitados
 * @param {Object} props.initialStats - Stats iniciales de check-in (opcional)
 * @param {Function} props.onStatsUpdate - Callback cuando cambian los stats (opcional)
 */
function CheckinTab({
  eventoId,
  totalInvitados = 0,
  initialStats = null,
  onStatsUpdate,
}) {
  const toast = useToast();
  const [scannerActive, setScannerActive] = useState(false);
  const [checkinStats, setCheckinStats] = useState(initialStats);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [lastCheckin, setLastCheckin] = useState(null);
  const html5QrCodeRef = useRef(null);
  const scannerRef = useRef(null);

  const fetchCheckinStats = async () => {
    try {
      const response = await eventosDigitalesApi.obtenerCheckinStats(eventoId);
      if (response.data?.success) {
        setCheckinStats(response.data.data);
        onStatsUpdate?.(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching checkin stats:', error);
    }
  };

  const fetchRecentCheckins = async () => {
    try {
      const response = await eventosDigitalesApi.listarCheckinsRecientes(eventoId);
      if (response.data?.success) {
        setRecentCheckins(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent checkins:', error);
    }
  };

  const handleCheckin = async (token) => {
    setLoadingCheckin(true);
    try {
      const response = await eventosDigitalesApi.registrarCheckin(eventoId, { token });
      if (response.data?.success) {
        setLastCheckin({ ...response.data.data, success: true });
        toast.success(`Check-in exitoso: ${response.data.data.nombre}`);
        fetchCheckinStats();
        fetchRecentCheckins();
      } else {
        setLastCheckin({ success: false, mensaje: response.data?.message });
        toast.error(response.data?.message || 'Error en check-in');
      }
    } catch (error) {
      setLastCheckin({ success: false, mensaje: 'Error de conexión' });
      toast.error('Error de conexión');
    } finally {
      setLoadingCheckin(false);
    }
  };

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-scanner');
      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const urlParts = decodedText.split('/');
          const token = urlParts[urlParts.length - 1];
          if (token && token.length > 10) {
            handleCheckin(token);
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.pause(true);
              setTimeout(() => {
                if (html5QrCodeRef.current) {
                  html5QrCodeRef.current.resume();
                }
              }, 2000);
            }
          }
        },
        () => {}
      );
      setScannerActive(true);
    } catch (error) {
      toast.error('No se pudo acceder a la camara');
      console.error('Scanner error:', error);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setScannerActive(false);
  };

  useEffect(() => {
    fetchCheckinStats();
    fetchRecentCheckins();
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header y Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel del Escaner */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Escaner de QR
            </h2>
            {scannerActive ? (
              <Button variant="outline" onClick={stopScanner} className="text-red-600 dark:text-red-400">
                <X className="w-4 h-4 mr-2" />
                Detener
              </Button>
            ) : (
              <Button onClick={startScanner}>
                <ScanLine className="w-4 h-4 mr-2" />
                Iniciar Escaner
              </Button>
            )}
          </div>

          {/* Area del escaner */}
          <div className="relative">
            {!scannerActive && (
              <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Presiona "Iniciar Escaner" para activar la camara</p>
                  <p className="text-sm mt-2">Apunta al codigo QR del invitado</p>
                </div>
              </div>
            )}
            <div
              id="qr-scanner"
              ref={scannerRef}
              className={`w-full min-h-[300px] bg-gray-900 rounded-lg ${!scannerActive ? 'hidden' : ''}`}
              style={{ position: 'relative' }}
            />
            <style>{`
              #qr-scanner video {
                width: 100% !important;
                height: auto !important;
                border-radius: 0.5rem;
              }
              #qr-scanner #qr-shaded-region {
                border-width: 50px !important;
              }
            `}</style>
          </div>

          {/* Ultimo check-in */}
          {lastCheckin && (
            <div className={`mt-4 p-4 rounded-lg ${lastCheckin.success ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
              {lastCheckin.success ? (
                <div className="flex items-center gap-3">
                  <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">{lastCheckin.nombre}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Check-in registrado correctamente</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">Error en check-in</p>
                    <p className="text-sm text-red-600 dark:text-red-400">{lastCheckin.mensaje}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {loadingCheckin && (
            <div className="mt-4 flex items-center justify-center p-4">
              <LoadingSpinner />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Procesando check-in...</span>
            </div>
          )}
        </div>

        {/* Panel de Estadisticas */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Estadisticas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total invitados</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalInvitados}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Confirmados</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{checkinStats?.total_confirmados || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Check-ins</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{checkinStats?.total_checkin || 0}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {checkinStats?.total_confirmados ?
                      Math.round((checkinStats.total_checkin / checkinStats.total_confirmados) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${checkinStats?.total_confirmados ?
                        Math.min(100, (checkinStats.total_checkin / checkinStats.total_confirmados) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => { fetchCheckinStats(); fetchRecentCheckins(); }}
          >
            Actualizar datos
          </Button>
        </div>
      </div>

      {/* Ultimos Check-ins */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ultimos Check-ins</h3>
        {recentCheckins.length > 0 ? (
          <div className="space-y-3">
            {recentCheckins.map((checkin, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{checkin.nombre}</p>
                    {checkin.grupo_familiar && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{checkin.grupo_familiar}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(checkin.checkin_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No hay check-ins registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoizar para evitar re-renders cuando el padre cambia pero estas props no
export default memo(CheckinTab, (prevProps, nextProps) => {
  return prevProps.eventoId === nextProps.eventoId &&
         prevProps.totalInvitados === nextProps.totalInvitados;
});
