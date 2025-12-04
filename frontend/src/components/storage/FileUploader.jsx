import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, FileText, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUploadArchivo } from '@/hooks/useStorage';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';

/**
 * Tipos MIME permitidos
 */
const ALLOWED_TYPES = {
  'image/jpeg': { icon: FileImage, label: 'JPEG' },
  'image/png': { icon: FileImage, label: 'PNG' },
  'image/gif': { icon: FileImage, label: 'GIF' },
  'image/webp': { icon: FileImage, label: 'WebP' },
  'application/pdf': { icon: FileText, label: 'PDF' },
  'text/plain': { icon: FileText, label: 'TXT' },
  'text/csv': { icon: FileText, label: 'CSV' },
  'application/json': { icon: FileText, label: 'JSON' },
  'application/msword': { icon: FileText, label: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'DOCX' },
  'application/vnd.ms-excel': { icon: FileText, label: 'XLS' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileText, label: 'XLSX' },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  return ALLOWED_TYPES[mimeType]?.icon || File;
}

/**
 * Componente FileUploader con Drag & Drop
 *
 * @param {Object} props
 * @param {string} props.folder - Carpeta destino (default: 'general')
 * @param {boolean} props.isPublic - Si el archivo es público (default: true)
 * @param {boolean} props.generateThumbnail - Generar thumbnail para imágenes
 * @param {string} props.entidadTipo - Tipo de entidad relacionada
 * @param {number} props.entidadId - ID de la entidad relacionada
 * @param {Function} props.onUploadSuccess - Callback al subir exitosamente
 * @param {Function} props.onUploadError - Callback en caso de error
 * @param {boolean} props.multiple - Permitir múltiples archivos (default: false)
 * @param {string} props.accept - Tipos MIME aceptados (default: todos los permitidos)
 */
function FileUploader({
  folder = 'general',
  isPublic = true,
  generateThumbnail = false,
  entidadTipo,
  entidadId,
  onUploadSuccess,
  onUploadError,
  multiple = false,
  accept,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const { mutateAsync: uploadFile, isPending } = useUploadArchivo();
  const toast = useToast();

  // Validar archivo
  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES[file.type]) {
      return { valid: false, error: 'Tipo de archivo no permitido' };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `El archivo excede el tamaño máximo (${formatFileSize(MAX_FILE_SIZE)})` };
    }
    return { valid: true };
  }, []);

  // Manejar archivos seleccionados
  const handleFiles = useCallback((files) => {
    const fileList = Array.from(files);
    const validFiles = [];

    fileList.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: `${file.name}-${Date.now()}`,
          status: 'pending',
          error: null,
        });
      } else {
        toast.error(`${file.name}: ${validation.error}`);
      }
    });

    if (!multiple && validFiles.length > 1) {
      validFiles.splice(1);
    }

    setSelectedFiles((prev) => (multiple ? [...prev, ...validFiles] : validFiles));
  }, [multiple, validateFile, toast]);

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Click para seleccionar
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset para poder seleccionar el mismo archivo
  };

  // Remover archivo de la lista
  const removeFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // Subir archivos
  const handleUpload = async () => {
    for (const fileItem of selectedFiles) {
      if (fileItem.status === 'success') continue;

      setUploadProgress((prev) => ({ ...prev, [fileItem.id]: 0 }));
      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        const result = await uploadFile({
          file: fileItem.file,
          folder,
          isPublic,
          generateThumbnail,
          entidadTipo,
          entidadId,
        });

        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: 'success', result } : f))
        );

        toast.success(`${fileItem.file.name} subido exitosamente`);
        onUploadSuccess?.(result);
      } catch (error) {
        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
          )
        );
        toast.error(error.message);
        onUploadError?.(error);
      }
    }
  };

  // Limpiar todo
  const clearAll = () => {
    setSelectedFiles([]);
    setUploadProgress({});
  };

  const acceptTypes = accept || Object.keys(ALLOWED_TYPES).join(',');
  const hasFiles = selectedFiles.length > 0;
  const hasPendingFiles = selectedFiles.some((f) => f.status === 'pending');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />

        <p className="mt-4 text-sm font-medium text-gray-900">
          {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para seleccionar'}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Formatos: JPG, PNG, GIF, WebP, PDF, TXT, CSV, JSON, DOC, DOCX, XLS, XLSX
        </p>
        <p className="text-xs text-gray-500">
          Tamaño máximo: {formatFileSize(MAX_FILE_SIZE)}
        </p>
      </div>

      {/* Lista de archivos seleccionados */}
      {hasFiles && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar todo
            </button>
          </div>

          <ul className="divide-y divide-gray-200 border rounded-lg">
            {selectedFiles.map((fileItem) => {
              const FileIcon = getFileIcon(fileItem.file.type);

              return (
                <li key={fileItem.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fileItem.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {fileItem.status === 'pending' && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}

                    {fileItem.status === 'uploading' && (
                      <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                    )}

                    {fileItem.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}

                    {fileItem.status === 'error' && (
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-xs text-red-600">{fileItem.error}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Botón de subir */}
      {hasPendingFiles && (
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={isPending}
            icon={isPending ? Loader2 : Upload}
            className={isPending ? 'animate-pulse' : ''}
          >
            {isPending ? 'Subiendo...' : `Subir archivo${selectedFiles.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
