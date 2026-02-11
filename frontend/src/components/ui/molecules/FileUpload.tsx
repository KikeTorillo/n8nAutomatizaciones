/**
 * FileUpload - Molecule genérica de carga de archivos con Drag & Drop
 *
 * Componente UI puro basado en react-dropzone. NO depende de lógica
 * de storage, APIs ni hooks de negocio. El consumidor controla qué
 * hacer con los archivos mediante el callback `onUpload`.
 *
 * Feb 2026 - Extraído como genérico a partir de components/storage/FileUploader
 */

import { memo, forwardRef, useCallback, type ReactNode } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';
import { cn } from '../lib/cn';
import { formatFileSize } from '../lib/formatters';
import { FOCUS_STATES, DRAG_STATES } from '../constants';

// ====================================================================
// TYPES
// ====================================================================

/** Archivo seleccionado con metadata de preview */
export interface SelectedFile {
  file: File;
  id: string;
  preview?: string;
}

export interface FileUploadProps {
  /**
   * Tipos MIME aceptados en formato react-dropzone.
   * @example { 'image/*': ['.png', '.jpg'], 'application/pdf': ['.pdf'] }
   */
  accept?: Accept;
  /** Tamaño máximo por archivo en bytes (default: 10MB) */
  maxSize?: number;
  /**
   * Callback al aceptar archivos. Recibe el array de Files nativos.
   * El consumidor decide qué hacer (upload, preview, etc.)
   */
  onUpload?: (files: File[]) => void;
  /** Permitir selección múltiple (default: false) */
  multiple?: boolean;
  /** Deshabilitar el componente */
  disabled?: boolean;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Mensaje de error externo */
  error?: string;
  /** Texto de ayuda debajo de la dropzone */
  helper?: string;
  /** Etiqueta opcional (se renderiza arriba de la dropzone) */
  label?: string;
  /** Si el campo es obligatorio (muestra asterisco en label) */
  required?: boolean;
  /** Texto para la zona de drop (estado idle) */
  dropzoneText?: string;
  /** Texto para la zona de drop (estado dragging) */
  dropzoneActiveText?: string;
  /** Nodo personalizado para el ícono de la dropzone */
  icon?: ReactNode;
  /** Número máximo de archivos (solo aplica si multiple=true) */
  maxFiles?: number;
  /**
   * Validador personalizado por archivo.
   * Retorna null si es válido, o un string con el mensaje de error.
   */
  validator?: (file: File) => string | null;
}

// ====================================================================
// HELPERS
// ====================================================================

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/** Genera las extensiones legibles a partir del objeto Accept */
function getAcceptedExtensions(accept?: Accept): string {
  if (!accept) return 'Todos los archivos';
  return Object.values(accept)
    .flat()
    .map((ext) => ext.replace('.', '').toUpperCase())
    .join(', ');
}

// ====================================================================
// COMPONENTE
// ====================================================================

/**
 * FileUpload - Zona de carga de archivos con drag & drop
 *
 * @example
 * // Upload simple de imágenes
 * <FileUpload
 *   accept={{ 'image/*': ['.png', '.jpg', '.webp'] }}
 *   maxSize={5 * 1024 * 1024}
 *   onUpload={(files) => handleFiles(files)}
 *   label="Imagen del producto"
 * />
 *
 * @example
 * // Upload múltiple de documentos
 * <FileUpload
 *   accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg'] }}
 *   multiple
 *   maxFiles={5}
 *   onUpload={(files) => uploadMutation.mutate(files)}
 *   error={errors.archivo?.message}
 * />
 */
const FileUpload = memo(
  forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
    {
      accept,
      maxSize = DEFAULT_MAX_SIZE,
      onUpload,
      multiple = false,
      disabled = false,
      className,
      error,
      helper,
      label,
      required = false,
      dropzoneText,
      dropzoneActiveText,
      icon,
      maxFiles,
      validator,
    },
    ref
  ) {
    // ------------------------------------------------------------------
    // Dropzone
    // ------------------------------------------------------------------

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
          onUpload?.(acceptedFiles);
        }
      },
      [onUpload]
    );

    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragReject,
      fileRejections,
    } = useDropzone({
      onDrop,
      accept,
      maxSize,
      multiple,
      disabled,
      maxFiles: maxFiles ?? (multiple ? undefined : 1),
      validator: validator
        ? (file) => {
            const msg = validator(file);
            return msg ? { code: 'custom-validation', message: msg } : null;
          }
        : undefined,
    });

    // ------------------------------------------------------------------
    // Error derivado de rechazos de dropzone
    // ------------------------------------------------------------------

    const rejectionError =
      fileRejections.length > 0
        ? fileRejections[0].errors.map((e) => {
            if (e.code === 'file-too-large')
              return `El archivo excede el limite de ${formatFileSize(maxSize)}`;
            if (e.code === 'file-invalid-type')
              return 'Tipo de archivo no permitido';
            if (e.code === 'too-many-files')
              return `Maximo ${maxFiles ?? 1} archivo${(maxFiles ?? 1) > 1 ? 's' : ''}`;
            return e.message;
          })[0]
        : null;

    const displayError = error || rejectionError;

    // ------------------------------------------------------------------
    // Textos
    // ------------------------------------------------------------------

    const idleText =
      dropzoneText ?? 'Arrastra archivos o haz clic para seleccionar';
    const activeText = dropzoneActiveText ?? 'Suelta los archivos aqui...';
    const extensionsText = getAcceptedExtensions(accept);

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer',
            'transition-colors duration-200',
            FOCUS_STATES.ring,
            isDragActive && !isDragReject && DRAG_STATES.dropTarget,
            isDragReject && 'border-red-400 bg-red-50 dark:bg-red-900/20',
            !isDragActive &&
              !isDragReject &&
              'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500',
            disabled && 'opacity-50 cursor-not-allowed',
            displayError && 'border-red-500 dark:border-red-400'
          )}
        >
          <input {...getInputProps()} />

          {/* Icono */}
          {icon ?? (
            <Upload
              className={cn(
                'mx-auto h-10 w-10 mb-3',
                isDragActive
                  ? 'text-primary-500'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            />
          )}

          {/* Texto principal */}
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {isDragActive ? activeText : idleText}
          </p>

          {/* Info de formatos y tamaño */}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {extensionsText} (max. {formatFileSize(maxSize)})
          </p>
        </div>

        {/* Helper text */}
        {helper && !displayError && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {helper}
          </p>
        )}

        {/* Error */}
        {displayError && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {displayError}
          </p>
        )}
      </div>
    );
  })
);

FileUpload.displayName = 'FileUpload';

export { FileUpload };
