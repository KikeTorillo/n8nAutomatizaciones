import DocumentosEmpleadoSection from '@/components/profesionales/DocumentosEmpleadoSection';

/**
 * Tab Documentos del profesional
 * Integra la sección de documentos existente
 */
function DocumentosTab({ profesional }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <DocumentosEmpleadoSection profesionalId={profesional.id} isEditing={true} />
    </div>
  );
}

export default DocumentosTab;
