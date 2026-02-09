/**
 * DocumentoUploadDrawer - Wrapper para documentos de PROFESIONAL/EMPLEADO
 * Thin wrapper sobre el componente compartido.
 */
import { DocumentoUploadDrawer } from '@/components/shared/DocumentoUploadDrawer';
import {
  useSubirDocumento,
  TIPOS_DOCUMENTO_EMPLEADO,
  prepararFormDataDocumento,
} from '@/hooks/personas';
import { validateFile } from '@/schemas/profesionales.schemas';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export default function ProfesionalDocumentoUploadDrawer({ isOpen, onClose, profesionalId, onSuccess }) {
  const subirDocumentoMutation = useSubirDocumento();

  const handleSubmit = async (data, file) => {
    const formData = prepararFormDataDocumento(data, file);
    try {
      await subirDocumentoMutation.mutateAsync({ profesionalId, formData });
      onSuccess?.();
      onClose();
    } catch {
      // Error manejado por el hook con toast
    }
  };

  return (
    <DocumentoUploadDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={subirDocumentoMutation.isPending}
      tiposDocumento={TIPOS_DOCUMENTO_EMPLEADO}
      title="Subir Documento"
      subtitle="Documentos del empleado (INE, contratos, certificados)"
      showNumeroDocumento
      autoCompleteName
      acceptedFileTypes={ACCEPTED_FILE_TYPES}
      validateFile={validateFile}
    />
  );
}
