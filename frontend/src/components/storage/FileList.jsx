import { useState } from 'react';
import { FileImage, FileText, File, Download, Trash2, Eye, ExternalLink, Loader2, MoreVertical } from 'lucide-react';
import { useArchivos, useEliminarArchivo } from '@/hooks/useStorage';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea el tamaño del archivo
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtiene el icono según el tipo MIME
 */
function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return FileImage;
  if (mimeType?.includes('pdf') || mimeType?.includes('text') || mimeType?.includes('document') || mimeType?.includes('sheet')) return FileText;
  return File;
}

/**
 * Verifica si es una imagen
 */
function isImage(mimeType) {
  return mimeType?.startsWith('image/');
}

/**
 * Componente FileList - Lista de archivos con acciones
 *
 * @param {Object} props
 * @param {string} props.entidadTipo - Filtrar por tipo de entidad
 * @param {number} props.entidadId - Filtrar por ID de entidad
 * @param {number} props.limit - Límite de archivos a mostrar
 * @param {string} props.viewMode - Modo de vista: 'grid' | 'list'
 * @param {boolean} props.showActions - Mostrar acciones (eliminar, descargar)
 * @param {Function} props.onFileClick - Callback al hacer clic en un archivo
 */
function FileList({
  entidadTipo,
  entidadId,
  limit = 50,
  viewMode = 'grid',
  showActions = true,
  onFileClick,
  className = '',
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const { data: archivos, isLoading, error } = useArchivos({ entidadTipo, entidadId, limit });
  const { mutateAsync: eliminarArchivo, isPending: isDeleting } = useEliminarArchivo();
  const toast = useToast();

  // Manejar eliminación
  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await eliminarArchivo(deleteTarget.id);
      toast.success('Archivo eliminado exitosamente');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Abrir archivo en nueva pestaña
  const handleView = (archivo) => {
    if (archivo.url_publica) {
      window.open(archivo.url_publica, '_blank');
    }
  };

  // Descargar archivo
  const handleDownload = (archivo) => {
    const link = document.createElement('a');
    link.href = archivo.url_publica;
    link.download = archivo.nombre_original;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview de imagen
  const handlePreview = (archivo) => {
    if (isImage(archivo.mime_type)) {
      setPreviewImage(archivo);
    } else {
      handleView(archivo);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <span className="ml-2 text-gray-600">Cargando archivos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-red-600">Error al cargar archivos: {error.message}</p>
      </div>
    );
  }

  if (!archivos || archivos.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <File className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-600">No hay archivos</p>
      </div>
    );
  }

  // Vista de Grid
  if (viewMode === 'grid') {
    return (
      <>
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
          {archivos.map((archivo) => {
            const FileIcon = getFileIcon(archivo.mime_type);
            const isImg = isImage(archivo.mime_type);

            return (
              <div
                key={archivo.id}
                className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Thumbnail o Icono */}
                <div
                  onClick={() => onFileClick ? onFileClick(archivo) : handlePreview(archivo)}
                  className="aspect-square flex items-center justify-center bg-gray-50 cursor-pointer"
                >
                  {isImg && archivo.url_publica ? (
                    <img
                      src={archivo.thumbnail_url || archivo.url_publica}
                      alt={archivo.nombre_original}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <FileIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate" title={archivo.nombre_original}>
                    {archivo.nombre_original}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(archivo.tamano_bytes)}</p>
                </div>

                {/* Acciones (hover) */}
                {showActions && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1 bg-white rounded-lg shadow p-1">
                      <button
                        onClick={() => handleView(archivo)}
                        className="p-1 text-gray-600 hover:text-indigo-600"
                        title="Ver"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(archivo)}
                        className="p-1 text-gray-600 hover:text-indigo-600"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(archivo)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
            onClick={() => setPreviewImage(null)}
          >
            <div className="max-w-4xl max-h-[90vh] p-4">
              <img
                src={previewImage.url_publica}
                alt={previewImage.nombre_original}
                className="max-w-full max-h-full object-contain"
              />
              <p className="text-center text-white mt-2">{previewImage.nombre_original}</p>
            </div>
          </div>
        )}

        {/* Confirm Delete */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Eliminar archivo"
          message={`¿Estás seguro de eliminar "${deleteTarget?.nombre_original}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          confirmVariant="danger"
          isLoading={isDeleting}
        />
      </>
    );
  }

  // Vista de Lista
  return (
    <>
      <div className={`divide-y divide-gray-200 border rounded-lg ${className}`}>
        {archivos.map((archivo) => {
          const FileIcon = getFileIcon(archivo.mime_type);

          return (
            <div
              key={archivo.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div
                onClick={() => onFileClick ? onFileClick(archivo) : handlePreview(archivo)}
                className="flex items-center space-x-4 flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex-shrink-0">
                  {isImage(archivo.mime_type) && archivo.url_publica ? (
                    <img
                      src={archivo.thumbnail_url || archivo.url_publica}
                      alt={archivo.nombre_original}
                      className="h-10 w-10 rounded object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <FileIcon className="h-10 w-10 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {archivo.nombre_original}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(archivo.tamano_bytes)}</span>
                    <span>-</span>
                    <span>
                      {formatDistanceToNow(new Date(archivo.creado_en), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
              </div>

              {showActions && (
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleView(archivo)}
                    className="p-2 text-gray-400 hover:text-indigo-600"
                    title="Ver"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDownload(archivo)}
                    className="p-2 text-gray-400 hover:text-indigo-600"
                    title="Descargar"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(archivo)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img
              src={previewImage.url_publica}
              alt={previewImage.nombre_original}
              className="max-w-full max-h-full object-contain"
            />
            <p className="text-center text-white mt-2">{previewImage.nombre_original}</p>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar archivo"
        message={`¿Estás seguro de eliminar "${deleteTarget?.nombre_original}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

export default FileList;
