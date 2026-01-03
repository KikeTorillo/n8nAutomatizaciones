/**
 * DocumentoUploadModal - Modal para subir documentos de empleado
 * Fase 2 del Plan de Empleados Competitivo
 * Enero 2026
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import {
  useSubirDocumento,
  TIPOS_DOCUMENTO_EMPLEADO,
  formatFileSize,
  prepararFormDataDocumento
} from '@/hooks/useDocumentosEmpleado';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export default function DocumentoUploadModal({
  isOpen,
  onClose,
  profesionalId,
  onSuccess
}) {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    tipo_documento: '',
    nombre: '',
    descripcion: '',
    numero_documento: '',
    fecha_emision: '',
    fecha_vencimiento: '',
  });
  const [errors, setErrors] = useState({});

  const subirDocumentoMutation = useSubirDocumento();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setErrors(prev => ({ ...prev, file: 'El archivo excede el tamaño máximo (25MB)' }));
      } else if (error.code === 'file-invalid-type') {
        setErrors(prev => ({ ...prev, file: 'Tipo de archivo no permitido. Use PDF o imágenes.' }));
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setErrors(prev => ({ ...prev, file: null }));

      // Auto-completar nombre si está vacío
      if (!formData.nombre) {
        const nombreArchivo = acceptedFiles[0].name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, nombre: nombreArchivo }));
      }
    }
  }, [formData.nombre]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tipo_documento) {
      newErrors.tipo_documento = 'Seleccione un tipo de documento';
    }
    if (!formData.nombre || formData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }
    if (formData.fecha_emision && formData.fecha_vencimiento) {
      if (new Date(formData.fecha_vencimiento) < new Date(formData.fecha_emision)) {
        newErrors.fecha_vencimiento = 'La fecha de vencimiento debe ser posterior a la emisión';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = prepararFormDataDocumento(formData, file);

    try {
      await subirDocumentoMutation.mutateAsync({
        profesionalId,
        formData: data
      });

      // Reset y cerrar
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      // El error ya se maneja en el hook con toast
    }
  };

  const resetForm = () => {
    setFile(null);
    setFormData({
      tipo_documento: '',
      nombre: '',
      descripcion: '',
      numero_documento: '',
      fecha_emision: '',
      fecha_vencimiento: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const removeFile = () => {
    setFile(null);
  };

  const tipoOptions = TIPOS_DOCUMENTO_EMPLEADO.map(t => ({
    value: t.value,
    label: t.label
  }));

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={handleClose}>
        Cancelar
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={subirDocumentoMutation.isPending}
      >
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Subir Documento"
      size="md"
      footer={footer}
      disableClose={subirDocumentoMutation.isPending}
    >
      <div className="space-y-4">
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
                ${isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                }
                ${errors.file ? 'border-red-500' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {isDragActive
                  ? 'Suelte el archivo aquí'
                  : 'Arrastre un archivo o haga clic para seleccionar'
                }
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, JPG, PNG o WebP (máx. 25MB)
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          {errors.file && (
            <p className="mt-1 text-sm text-red-600">{errors.file}</p>
          )}
        </div>

        {/* Tipo de documento */}
        <Select
          label="Tipo de documento *"
          value={formData.tipo_documento}
          onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
          options={tipoOptions}
          placeholder="Seleccione tipo..."
          error={errors.tipo_documento}
        />

        {/* Nombre */}
        <Input
          label="Nombre del documento *"
          value={formData.nombre}
          onChange={(e) => handleInputChange('nombre', e.target.value)}
          placeholder="Ej: INE Juan Pérez 2025"
          error={errors.nombre}
        />

        {/* Número de documento */}
        <Input
          label="Número/Folio (opcional)"
          value={formData.numero_documento}
          onChange={(e) => handleInputChange('numero_documento', e.target.value)}
          placeholder="Ej: ABC123456789"
        />

        {/* Fechas en grid */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de emisión"
            type="date"
            value={formData.fecha_emision}
            onChange={(e) => handleInputChange('fecha_emision', e.target.value)}
          />
          <Input
            label="Fecha de vencimiento"
            type="date"
            value={formData.fecha_vencimiento}
            onChange={(e) => handleInputChange('fecha_vencimiento', e.target.value)}
            error={errors.fecha_vencimiento}
          />
        </div>

        {/* Descripción */}
        <Textarea
          label="Descripción (opcional)"
          value={formData.descripcion}
          onChange={(e) => handleInputChange('descripcion', e.target.value)}
          placeholder="Notas adicionales sobre el documento..."
          rows={2}
        />
      </div>
    </Modal>
  );
}
