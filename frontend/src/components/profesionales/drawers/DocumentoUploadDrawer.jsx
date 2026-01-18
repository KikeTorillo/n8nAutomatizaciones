/**
 * ====================================================================
 * DocumentoUploadDrawer - Drawer para subir documentos de empleado
 * ====================================================================
 *
 * Migrado a React Hook Form + Zod - Enero 2026
 * Patron hibrido: Zod para metadata, useState para File (no serializable)
 */
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import {
  Button,
  Drawer,
  FormGroup,
  Input,
  Select,
  Textarea
} from '@/components/ui';
import {
  useSubirDocumento,
  TIPOS_DOCUMENTO_EMPLEADO,
  // formatFileSize moved to @/lib/utils
  prepararFormDataDocumento,
} from '@/hooks/personas';
import { formatFileSize } from '@/lib/utils';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import {
  documentoMetadataSchema,
  validateFile,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/schemas/profesionales.schemas';

// ====================================================================
// CONSTANTES
// ====================================================================

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const DEFAULT_VALUES = {
  tipo_documento: '',
  nombre: '',
  descripcion: '',
  numero_documento: '',
  fecha_emision: '',
  fecha_vencimiento: '',
};

// ====================================================================
// COMPONENTE
// ====================================================================

export default function DocumentoUploadDrawer({
  isOpen,
  onClose,
  profesionalId,
  onSuccess,
}) {
  // File state (no serializable, separado de RHF)
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  // Mutation
  const subirDocumentoMutation = useSubirDocumento();

  // React Hook Form para metadata
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(documentoMetadataSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Reset form cuando se abre/cierra
  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      setFile(null);
      setFileError(null);
    }
  }, [isOpen, reset]);

  // Dropzone handler
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        if (error.code === 'file-too-large') {
          setFileError('El archivo excede el tamano maximo (25MB)');
        } else if (error.code === 'file-invalid-type') {
          setFileError('Tipo de archivo no permitido. Use PDF o imagenes.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];

        // Validar con nuestra funcion
        const validationErrors = validateFile(selectedFile);
        if (validationErrors.length > 0) {
          setFileError(validationErrors[0]);
          return;
        }

        setFile(selectedFile);
        setFileError(null);

        // Auto-completar nombre si esta vacio
        const currentName = watch('nombre');
        if (!currentName) {
          const nombreArchivo = selectedFile.name.replace(/\.[^/.]+$/, '');
          setValue('nombre', nombreArchivo, { shouldValidate: false });
        }
      }
    },
    [watch, setValue]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  // Submit handler
  const onSubmit = async (data) => {
    const formData = prepararFormDataDocumento(data, file);

    try {
      await subirDocumentoMutation.mutateAsync({
        profesionalId,
        formData,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      // El error ya se maneja en el hook con toast
    }
  };

  const handleClose = () => {
    reset(DEFAULT_VALUES);
    setFile(null);
    setFileError(null);
    onClose();
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
  };

  // Opciones para select
  const tipoOptions = TIPOS_DOCUMENTO_EMPLEADO.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Subir Documento"
      subtitle="Documentos del empleado (INE, contratos, certificados)"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Dropzone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Archivo
          </label>
          {!file ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors
                ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                }
                ${fileError ? 'border-red-500' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isDragActive
                  ? 'Suelte el archivo aqui'
                  : 'Arrastre un archivo o haga clic para seleccionar'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, JPG, PNG o WebP (max. 25MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary-600" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {fileError && (
            <p className="mt-1 text-sm text-red-600">{fileError}</p>
          )}
        </div>

        {/* Tipo de documento */}
        <FormGroup label="Tipo de documento" required error={errors.tipo_documento?.message}>
          <Select
            placeholder="Seleccione tipo..."
            options={tipoOptions}
            hasError={!!errors.tipo_documento}
            {...register('tipo_documento')}
          />
        </FormGroup>

        {/* Nombre */}
        <FormGroup label="Nombre del documento" required error={errors.nombre?.message}>
          <Input
            placeholder="Ej: INE Juan Perez 2025"
            hasError={!!errors.nombre}
            {...register('nombre')}
          />
        </FormGroup>

        {/* Numero de documento */}
        <FormGroup label="Numero/Folio (opcional)" error={errors.numero_documento?.message}>
          <Input
            placeholder="Ej: ABC123456789"
            hasError={!!errors.numero_documento}
            {...register('numero_documento')}
          />
        </FormGroup>

        {/* Fechas en grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Fecha de emision" error={errors.fecha_emision?.message}>
            <Input
              type="date"
              hasError={!!errors.fecha_emision}
              {...register('fecha_emision')}
            />
          </FormGroup>
          <FormGroup label="Fecha de vencimiento" error={errors.fecha_vencimiento?.message}>
            <Input
              type="date"
              hasError={!!errors.fecha_vencimiento}
              {...register('fecha_vencimiento')}
            />
          </FormGroup>
        </div>

        {/* Descripcion */}
        <FormGroup label="Descripcion (opcional)" error={errors.descripcion?.message}>
          <Textarea
            placeholder="Notas adicionales sobre el documento..."
            rows={2}
            hasError={!!errors.descripcion}
            {...register('descripcion')}
          />
        </FormGroup>

        {/* Footer con botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={subirDocumentoMutation.isPending}>
            {subirDocumentoMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir documento
              </>
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
