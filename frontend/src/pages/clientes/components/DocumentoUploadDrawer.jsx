/**
 * DocumentoUploadDrawer - Wrapper para documentos de CLIENTE
 * Thin wrapper sobre el componente compartido.
 */
import { DocumentoUploadDrawer } from '@/components/shared/DocumentoUploadDrawer';
import { TIPOS_DOCUMENTO } from '@/hooks/personas';

export default function ClienteDocumentoUploadDrawer({ isOpen, onClose, onSubmit, isLoading = false }) {
  return (
    <DocumentoUploadDrawer
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      isLoading={isLoading}
      tiposDocumento={TIPOS_DOCUMENTO}
      title="Subir documento"
      subtitle="Sube identificaciones, contratos y otros documentos importantes"
    />
  );
}
