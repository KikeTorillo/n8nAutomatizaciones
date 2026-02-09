/**
 * ====================================================================
 * DOCUMENTO UPLOAD DRAWER - Componente compartido
 * ====================================================================
 * Drawer genérico para subir documentos con dropzone.
 * Usado por clientes y profesionales con configuración diferente.
 *
 * Feb 2026 - Unificado de 2 implementaciones duplicadas
 * ====================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Drawer } from '@/components/ui';
import { formatFileSize } from '@/lib/utils';

// ====================================================================
// DEFAULTS
// ====================================================================

const DEFAULT_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const DEFAULT_MAX_SIZE = 25 * 1024 * 1024; // 25MB

const BASE_SCHEMA = {
  tipo_documento: z.string().min(1, 'Selecciona un tipo de documento'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  fecha_emision: z.string().optional().nullable(),
  fecha_vencimiento: z.string().optional().nullable(),
};

// ====================================================================
// COMPONENTE
// ====================================================================

/**
 * DocumentoUploadDrawer - Drawer genérico para subir documentos
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el drawer está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onSubmit - Callback al enviar (data, file)
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Array} props.tiposDocumento - Array de { value, label } para el select
 * @param {string} props.title - Título del drawer
 * @param {string} props.subtitle - Subtítulo del drawer
 * @param {boolean} props.showNumeroDocumento - Mostrar campo numero_documento
 * @param {boolean} props.autoCompleteName - Auto-completar nombre con nombre del archivo
 * @param {Object} props.acceptedFileTypes - MIME types para dropzone
 * @param {number} props.maxFileSize - Tamaño máximo en bytes
 * @param {Object} props.extraSchema - Campos Zod adicionales para el schema
 * @param {Object} props.extraDefaults - Valores default adicionales para el form
 * @param {Function} props.validateFile - Función de validación extra del archivo
 * @param {Function} props.renderExtraFields - Render prop para campos adicionales
 */
export default function DocumentoUploadDrawer({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  tiposDocumento = [],
  title = 'Subir documento',
  subtitle = 'Sube documentos importantes',
  showNumeroDocumento = false,
  autoCompleteName = false,
  acceptedFileTypes = DEFAULT_MIME_TYPES,
  maxFileSize = DEFAULT_MAX_SIZE,
  extraSchema = {},
  extraDefaults = {},
  validateFile: validateFileFn,
  renderExtraFields,
}) {
  const [archivo, setArchivo] = useState(null);
  const [archivoError, setArchivoError] = useState('');

  // Schema dinámico
  const schema = z.object({
    ...BASE_SCHEMA,
    ...(showNumeroDocumento
      ? { numero_documento: z.string().max(100, 'Máximo 100 caracteres').optional().nullable() }
      : {}),
    ...extraSchema,
  });

  const defaultValues = {
    tipo_documento: '',
    nombre: '',
    descripcion: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    ...(showNumeroDocumento ? { numero_documento: '' } : {}),
    ...extraDefaults,
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const tipoDocumento = watch('tipo_documento');

  // Resetear form cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
      setArchivo(null);
      setArchivoError('');
    }
  }, [isOpen, reset]);

  // Dropzone config
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setArchivoError(`El archivo excede el límite de ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      } else if (error.code === 'file-invalid-type') {
        setArchivoError('Tipo de archivo no permitido');
      } else {
        setArchivoError(error.message);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];

      // Validación extra opcional
      if (validateFileFn) {
        const validationErrors = validateFileFn(selectedFile);
        if (validationErrors && validationErrors.length > 0) {
          setArchivoError(validationErrors[0]);
          return;
        }
      }

      setArchivo(selectedFile);
      setArchivoError('');

      // Auto-completar nombre si está vacío
      if (autoCompleteName) {
        const currentName = watch('nombre');
        if (!currentName) {
          const nombreArchivo = selectedFile.name.replace(/\.[^/.]+$/, '');
          setValue('nombre', nombreArchivo, { shouldValidate: false });
        }
      }
    }
  }, [maxFileSize, validateFileFn, autoCompleteName, watch, setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    multiple: false,
  });

  const removeArchivo = () => {
    setArchivo(null);
    setArchivoError('');
  };

  const handleFormSubmit = async (data) => {
    await onSubmit(data, archivo);
  };

  const handleClose = () => {
    reset(defaultValues);
    setArchivo(null);
    setArchivoError('');
    onClose();
  };

  // Obtener label del tipo seleccionado
  const tipoLabel = tiposDocumento.find(t => t.value === tipoDocumento)?.label || '';

  // Formato de archivos aceptados para mostrar
  const acceptedExtensions = Object.values(acceptedFileTypes).flat().map(ext => ext.replace('.', '').toUpperCase()).join(', ');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Dropzone para archivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Archivo
          </label>

          {archivo ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {archivo.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(archivo.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeArchivo}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`
                p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors
                ${isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isDragActive ? (
                  'Suelta el archivo aquí...'
                ) : (
                  <>
                    Arrastra un archivo o <span className="text-primary-600 dark:text-primary-400">haz clic para seleccionar</span>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {acceptedExtensions} (máx. {Math.round(maxFileSize / 1024 / 1024)}MB)
              </p>
            </div>
          )}

          {archivoError && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {archivoError}
            </p>
          )}
        </div>

        {/* Tipo de documento */}
        <div>
          <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de documento <span className="text-red-500">*</span>
          </label>
          <select
            id="tipo_documento"
            {...register('tipo_documento')}
            className={`
              w-full px-4 py-2.5 rounded-lg
              bg-gray-50 dark:bg-gray-900
              border ${errors.tipo_documento ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
            `}
          >
            <option value="">Seleccionar tipo...</option>
            {tiposDocumento.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.tipo_documento && (
            <p className="mt-1 text-sm text-red-500">{errors.tipo_documento.message}</p>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del documento <span className="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            type="text"
            {...register('nombre')}
            className={`
              w-full px-4 py-2.5 rounded-lg
              bg-gray-50 dark:bg-gray-900
              border ${errors.nombre ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
            `}
            placeholder={tipoLabel || 'Ej: INE Juan Pérez'}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-500">{errors.nombre.message}</p>
          )}
        </div>

        {/* Número de documento (opcional, solo profesionales) */}
        {showNumeroDocumento && (
          <div>
            <label htmlFor="numero_documento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número/Folio (opcional)
            </label>
            <input
              id="numero_documento"
              type="text"
              {...register('numero_documento')}
              className={`
                w-full px-4 py-2.5 rounded-lg
                bg-gray-50 dark:bg-gray-900
                border ${errors.numero_documento ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              `}
              placeholder="Ej: ABC123456789"
            />
            {errors.numero_documento && (
              <p className="mt-1 text-sm text-red-500">{errors.numero_documento.message}</p>
            )}
          </div>
        )}

        {/* Campos extra via render prop */}
        {renderExtraFields?.({ register, errors, watch, setValue })}

        {/* Descripción */}
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            id="descripcion"
            rows={2}
            {...register('descripcion')}
            className="
              w-full px-4 py-2.5 rounded-lg
              bg-gray-50 dark:bg-gray-900
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              resize-none
            "
            placeholder="Notas adicionales sobre el documento..."
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fecha_emision" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de emisión
            </label>
            <input
              id="fecha_emision"
              type="date"
              {...register('fecha_emision')}
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-gray-50 dark:bg-gray-900
                border border-gray-200 dark:border-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            />
          </div>

          <div>
            <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de vencimiento
            </label>
            <input
              id="fecha_vencimiento"
              type="date"
              {...register('fecha_vencimiento')}
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-gray-50 dark:bg-gray-900
                border border-gray-200 dark:border-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="
              flex-1 px-4 py-3 rounded-lg
              bg-gray-100 dark:bg-gray-700
              text-gray-700 dark:text-gray-300
              font-medium
              hover:bg-gray-200 dark:hover:bg-gray-600
              transition-colors
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="
              flex-1 px-4 py-3 rounded-lg
              bg-primary-500 hover:bg-primary-600
              text-white font-medium
              transition-colors
              disabled:opacity-50
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Subiendo...</span>
              </>
            ) : (
              <span>Subir documento</span>
            )}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
