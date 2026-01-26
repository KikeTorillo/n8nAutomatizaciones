/**
 * ====================================================================
 * PREVIEW MODAL
 * ====================================================================
 * Modal para generar y visualizar preview del sitio antes de publicar.
 * Genera un enlace temporal que puede compartirse para revisar el sitio.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  X,
  Link2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui';
import websiteApi from '@/services/api/modules/website.api';

// Dispositivos para preview
const DISPOSITIVOS = [
  { id: 'desktop', icon: Monitor, label: 'Desktop', width: '100%' },
  { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
  { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' },
];

/**
 * PreviewModal - Modal de preview del sitio
 */
function PreviewModal({ isOpen, onClose, websiteId, slug }) {
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  const [previewInfo, setPreviewInfo] = useState(null);
  const [dispositivo, setDispositivo] = useState('desktop');
  const [copiado, setCopiado] = useState(false);
  const [duracion, setDuracion] = useState(1);

  // Cargar info de preview existente al abrir
  useEffect(() => {
    if (isOpen && websiteId) {
      cargarPreviewInfo();
    }
  }, [isOpen, websiteId]);

  // Cargar info de preview
  const cargarPreviewInfo = useCallback(async () => {
    try {
      const info = await websiteApi.obtenerPreviewInfo(websiteId);
      if (info.activo) {
        setPreviewInfo(info);
      }
    } catch (error) {
      // No hay preview activo, es normal
      setPreviewInfo(null);
    }
  }, [websiteId]);

  // Generar nuevo preview
  const generarPreview = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await websiteApi.generarPreview(websiteId, duracion);
      setPreviewInfo({
        ...result,
        activo: true,
      });
      toast.success('Preview generado exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al generar preview');
    } finally {
      setIsLoading(false);
    }
  }, [websiteId, duracion]);

  // Revocar preview
  const revocarPreview = useCallback(async () => {
    try {
      await websiteApi.revocarPreview(websiteId);
      setPreviewInfo(null);
      toast.success('Preview revocado');
    } catch (error) {
      toast.error('Error al revocar preview');
    }
  }, [websiteId]);

  // Copiar URL
  const copiarUrl = useCallback(() => {
    if (previewInfo?.token) {
      const url = `${window.location.origin}/preview/${previewInfo.token}`;
      navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success('URL copiada al portapapeles');
      setTimeout(() => setCopiado(false), 2000);
    }
  }, [previewInfo]);

  // Abrir en nueva ventana
  const abrirEnNuevaVentana = useCallback(() => {
    if (previewInfo?.token) {
      const url = `/preview/${previewInfo.token}`;
      window.open(url, '_blank');
    }
  }, [previewInfo]);

  // Calcular tiempo restante
  const tiempoRestante = useCallback(() => {
    if (!previewInfo?.expira_en) return null;
    const expira = new Date(previewInfo.expira_en);
    const ahora = new Date();
    const diff = expira - ahora;
    if (diff <= 0) return 'Expirado';
    const minutos = Math.floor(diff / 60000);
    if (minutos < 60) return `${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  }, [previewInfo]);

  // URL del preview
  const previewUrl = previewInfo?.token
    ? `${window.location.origin}/preview/${previewInfo.token}`
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      showCloseButton={false}
    >
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preview del sitio
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vista previa temporal antes de publicar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            {/* Dispositivos */}
            <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm">
              {DISPOSITIVOS.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setDispositivo(id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                    dispositivo === id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                  title={label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Acciones */}
            {previewInfo?.activo && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Expira en: {tiempoRestante()}</span>
                </div>

                <button
                  onClick={copiarUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {copiado ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Copiar URL</span>
                </button>

                <button
                  onClick={abrirEnNuevaVentana}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Abrir</span>
                </button>
              </div>
            )}
          </div>

          {/* Preview Frame o Generador */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 overflow-auto">
            {!previewInfo?.activo ? (
              /* Generar preview */
              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md text-center">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Generar enlace de preview
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Crea un enlace temporal para ver el sitio antes de publicarlo.
                    Puedes compartirlo para obtener feedback.
                  </p>

                  {/* Selector de duracion */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Duracion:</span>
                    <select
                      value={duracion}
                      onChange={(e) => setDuracion(Number(e.target.value))}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    >
                      <option value={1}>1 hora</option>
                      <option value={4}>4 horas</option>
                      <option value={24}>24 horas</option>
                      <option value={72}>3 dias</option>
                    </select>
                  </div>

                  <button
                    onClick={generarPreview}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        Generar preview
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Iframe de preview */
              <div className="flex justify-center h-full">
                <motion.div
                  initial={false}
                  animate={{ width: DISPOSITIVOS.find(d => d.id === dispositivo)?.width }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden h-full"
                >
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="Preview del sitio"
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {previewInfo?.activo && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2 text-sm">
              <input
                type="text"
                value={previewUrl || ''}
                readOnly
                className="w-80 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm"
              />
              <button
                onClick={copiarUrl}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copiado ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={revocarPreview}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Revocar enlace
              </button>
              <button
                onClick={generarPreview}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                Renovar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default PreviewModal;
