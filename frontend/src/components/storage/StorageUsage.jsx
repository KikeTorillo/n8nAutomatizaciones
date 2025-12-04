import { HardDrive, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { useStorageUsage } from '@/hooks/useStorage';

/**
 * Formatea el tamaño en bytes a una unidad legible
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Componente StorageUsage - Widget de uso de almacenamiento
 *
 * @param {Object} props
 * @param {number} props.limiteMb - Límite de almacenamiento en MB (del plan)
 * @param {string} props.variant - Variante de diseño: 'compact' | 'full'
 * @param {boolean} props.showWarning - Mostrar advertencia cuando está cerca del límite
 */
function StorageUsage({
  limiteMb = 1024, // 1GB por defecto
  variant = 'full',
  showWarning = true,
  className = '',
}) {
  const { data: usage, isLoading, error } = useStorageUsage();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-4 ${className}`}>
        <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Cargando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-4 text-red-600 text-sm ${className}`}>
        Error al cargar uso de almacenamiento
      </div>
    );
  }

  const usedMb = usage?.totalMb || 0;
  const usedBytes = usage?.totalBytes || 0;
  const totalArchivos = usage?.totalArchivos || 0;
  const percentage = limiteMb > 0 ? Math.min((usedMb / limiteMb) * 100, 100) : 0;

  // Colores según el porcentaje de uso
  const getBarColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-indigo-500';
  };

  const getTextColor = () => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-indigo-600';
  };

  // Variante compacta (para sidebar o headers)
  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between text-sm mb-1">
          <div className="flex items-center space-x-1">
            <HardDrive className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Almacenamiento</span>
          </div>
          <span className={`font-medium ${getTextColor()}`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatBytes(usedBytes)} de {limiteMb >= 1024 ? `${(limiteMb / 1024).toFixed(0)} GB` : `${limiteMb} MB`}
        </p>
      </div>
    );
  }

  // Variante completa (para páginas de configuración)
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <HardDrive className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Uso de Almacenamiento</h3>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Espacio utilizado</span>
          <span className={`font-semibold ${getTextColor()}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase">Usado</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatBytes(usedBytes)}
          </p>
          <p className="text-xs text-gray-500">
            de {limiteMb >= 1024 ? `${(limiteMb / 1024).toFixed(0)} GB` : `${limiteMb} MB`}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase">Archivos</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {totalArchivos}
          </p>
          <p className="text-xs text-gray-500">archivos almacenados</p>
        </div>
      </div>

      {/* Advertencia si está cerca del límite */}
      {showWarning && percentage >= 75 && (
        <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
          percentage >= 90 ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'
        }`}>
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              {percentage >= 90 ? 'Almacenamiento casi lleno' : 'Almacenamiento limitado'}
            </p>
            <p className="text-xs mt-1">
              {percentage >= 90
                ? 'Has utilizado más del 90% de tu espacio. Considera eliminar archivos o actualizar tu plan.'
                : 'Te queda menos del 25% de espacio disponible.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StorageUsage;
