/**
 * ====================================================================
 * VERSION HISTORY
 * ====================================================================
 * Panel de historial de versiones con capacidad de rollback.
 * Permite ver, crear y restaurar versiones del sitio web.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Check,
  Loader2,
  FileText,
  Layers,
  Eye,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui';
import { queryKeys } from '@/hooks/config';
import websiteApi from '@/services/api/modules/website.api';

// Tipos de version
const TIPOS_VERSION = {
  manual: { label: 'Manual', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' },
  auto_publicar: { label: 'Auto (Publicar)', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  auto_backup: { label: 'Auto (Backup)', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
};

/**
 * VersionHistory - Panel de historial
 */
function VersionHistory({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [versionARestaurar, setVersionARestaurar] = useState(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [formCrear, setFormCrear] = useState({ nombre: '', descripcion: '' });

  // Query para listar versiones
  const { data: versionesData, isLoading, error } = useQuery({
    queryKey: queryKeys.website.versiones,
    queryFn: () => websiteApi.listarVersiones({ limite: 50 }),
    enabled: isOpen,
  });

  const versiones = versionesData?.items || [];

  // Mutation para crear version
  const crearVersion = useMutation({
    mutationFn: (datos) => websiteApi.crearVersion(datos),
    onSuccess: () => {
      toast.success('Version creada exitosamente');
      queryClient.invalidateQueries(queryKeys.website.versiones);
      setMostrarCrear(false);
      setFormCrear({ nombre: '', descripcion: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear version');
    },
  });

  // Mutation para restaurar
  const restaurarVersion = useMutation({
    mutationFn: ({ id, crearBackup }) => websiteApi.restaurarVersion(id, crearBackup),
    onSuccess: (data) => {
      toast.success(`Sitio restaurado a version ${data.version_restaurada}`);
      queryClient.invalidateQueries(['website']);
      setVersionARestaurar(null);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al restaurar');
    },
  });

  // Mutation para eliminar
  const eliminarVersion = useMutation({
    mutationFn: (id) => websiteApi.eliminarVersion(id),
    onSuccess: () => {
      toast.success('Version eliminada');
      queryClient.invalidateQueries(queryKeys.website.versiones);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  // Handler crear version
  const handleCrear = useCallback(() => {
    crearVersion.mutate(formCrear);
  }, [formCrear, crearVersion]);

  // Formatear tamaño
  const formatearTamano = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
      showCloseButton={false}
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Historial de versiones
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {versiones.length} versiones guardadas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarCrear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva version
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Error al cargar versiones</p>
            </div>
          ) : versiones.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Sin versiones guardadas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Crea tu primera version para poder restaurar cambios.
              </p>
              <button
                onClick={() => setMostrarCrear(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Crear version
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {versiones.map((version, index) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  esActual={index === 0}
                  onRestaurar={() => setVersionARestaurar(version)}
                  onEliminar={() => eliminarVersion.mutate(version.id)}
                  formatearTamano={formatearTamano}
                  isEliminando={eliminarVersion.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Version */}
      <AnimatePresence>
        {mostrarCrear && (
          <Modal
            isOpen={mostrarCrear}
            onClose={() => setMostrarCrear(false)}
            title="Crear nueva version"
            size="sm"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={formCrear.nombre}
                  onChange={(e) => setFormCrear({ ...formCrear, nombre: e.target.value })}
                  placeholder="Ej: Antes de rediseno"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripcion (opcional)
                </label>
                <textarea
                  value={formCrear.descripcion}
                  onChange={(e) => setFormCrear({ ...formCrear, descripcion: e.target.value })}
                  placeholder="Describe los cambios recientes..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setMostrarCrear(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrear}
                  disabled={crearVersion.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {crearVersion.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Crear
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal Confirmar Restaurar */}
      <AnimatePresence>
        {versionARestaurar && (
          <Modal
            isOpen={!!versionARestaurar}
            onClose={() => setVersionARestaurar(null)}
            title="Restaurar version"
            size="sm"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Esta accion reemplazara tu sitio actual
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Se creara un backup automatico antes de restaurar.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Restaurar a:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {versionARestaurar.nombre || `Version ${versionARestaurar.numero_version}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {format(new Date(versionARestaurar.creado_en), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setVersionARestaurar(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => restaurarVersion.mutate({ id: versionARestaurar.id, crearBackup: true })}
                  disabled={restaurarVersion.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {restaurarVersion.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Restaurar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </Modal>
  );
}

/**
 * Card de version individual
 */
function VersionCard({ version, esActual, onRestaurar, onEliminar, formatearTamano, isEliminando }) {
  const tipoConfig = TIPOS_VERSION[version.tipo] || TIPOS_VERSION.manual;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 bg-white dark:bg-gray-800 rounded-xl border transition-colors',
        esActual
          ? 'border-primary-200 dark:border-primary-700 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {version.nombre || `Version ${version.numero_version}`}
            </h4>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', tipoConfig.color)}>
              {tipoConfig.label}
            </span>
            {esActual && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Actual
              </span>
            )}
          </div>

          {version.descripcion && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {version.descripcion}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(version.creado_en), { addSuffix: true, locale: es })}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {version.total_paginas || '?'} paginas
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {version.total_bloques || '?'} bloques
            </span>
            <span>{formatearTamano(version.tamano_bytes)}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 ml-4">
          {!esActual && (
            <button
              onClick={onRestaurar}
              className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              title="Restaurar esta version"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEliminar}
            disabled={isEliminando || esActual}
            className={cn(
              'p-2 rounded-lg transition-colors',
              esActual
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            )}
            title={esActual ? 'No se puede eliminar la version actual' : 'Eliminar version'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default VersionHistory;
