/**
 * DocumentosEmpleadoSection - Sección de documentos en formulario de profesional
 * Fase 2 del Plan de Empleados Competitivo
 * Enero 2026
 */
import { useState } from 'react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  useDocumentosEmpleado,
  useEliminarDocumento,
  useVerificarDocumento,
  useObtenerUrlDocumento,
  getTipoDocumentoLabel,
  getEstadoVencimiento,
  formatFileSize,
} from '@/hooks/useDocumentosEmpleado';
import DocumentoUploadModal from './DocumentoUploadModal';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

export default function DocumentosEmpleadoSection({ profesionalId, isEditing = false }) {
  const [isOpen, setIsOpen] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const { data, isLoading, error, refetch } = useDocumentosEmpleado(profesionalId, {
    enabled: !!profesionalId && isEditing
  });

  const eliminarMutation = useEliminarDocumento();
  const verificarMutation = useVerificarDocumento();
  const obtenerUrlMutation = useObtenerUrlDocumento();

  const documentos = data?.documentos || [];
  const conteo = data?.conteo || {};

  // Si no hay profesionalId o no está en modo edición, no mostrar
  if (!profesionalId || !isEditing) {
    return null;
  }

  const handleDescargar = async (documento) => {
    try {
      const result = await obtenerUrlMutation.mutateAsync({
        profesionalId,
        documentoId: documento.id
      });
      window.open(result.url, '_blank');
    } catch (error) {
      // Error manejado en el hook
    }
    setMenuAbierto(null);
  };

  const handleVerificar = async (documento, verificado) => {
    try {
      await verificarMutation.mutateAsync({
        profesionalId,
        documentoId: documento.id,
        verificado
      });
    } catch (error) {
      // Error manejado en el hook
    }
    setMenuAbierto(null);
  };

  const handleEliminar = async () => {
    if (!documentoAEliminar) return;

    try {
      await eliminarMutation.mutateAsync({
        profesionalId,
        documentoId: documentoAEliminar.id
      });
      setDocumentoAEliminar(null);
    } catch (error) {
      // Error manejado en el hook
    }
  };

  const renderEstadoBadge = (documento) => {
    const estado = getEstadoVencimiento(documento.estado_vencimiento);

    const colorClasses = {
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[estado.color]}`}>
        {estado.icon} {estado.label}
        {documento.dias_para_vencer !== null && documento.dias_para_vencer >= 0 && (
          <span className="ml-1">({documento.dias_para_vencer}d)</span>
        )}
      </span>
    );
  };

  const renderVerificadoBadge = (documento) => {
    if (documento.verificado) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verificado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Pendiente
      </span>
    );
  };

  return (
    <>
      <div className="border rounded-lg dark:border-gray-700">
        {/* Header colapsable */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary-600" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Documentos del Empleado</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {conteo.total || 0} documentos
                {conteo.por_vencer > 0 && (
                  <span className="text-yellow-600 ml-2">
                    ({conteo.por_vencer} por vencer)
                  </span>
                )}
                {conteo.vencidos > 0 && (
                  <span className="text-red-600 ml-2">
                    ({conteo.vencidos} vencidos)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setShowUploadModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Contenido */}
        {isOpen && (
          <div className="border-t dark:border-gray-700 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                <span className="ml-2 text-gray-500">Cargando documentos...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error al cargar documentos
              </div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-500">No hay documentos registrados</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Subir primer documento
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {documentos.map((documento) => (
                  <div
                    key={documento.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-gray-900 dark:text-gray-100">{documento.nombre}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{getTipoDocumentoLabel(documento.tipo_documento)}</span>
                          {documento.archivo_tamano && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(documento.archivo_tamano)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {renderEstadoBadge(documento)}
                      {renderVerificadoBadge(documento)}

                      {/* Menú de acciones */}
                      <div className="relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setMenuAbierto(menuAbierto === documento.id ? null : documento.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        {menuAbierto === documento.id && (
                          <>
                            {/* Overlay para cerrar */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuAbierto(null)}
                            />
                            {/* Menú */}
                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-20">
                              {documento.archivo_storage_id && (
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleDescargar(documento)}
                                  disabled={obtenerUrlMutation.isPending}
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver / Descargar
                                </button>
                              )}

                              {documento.verificado ? (
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleVerificar(documento, false)}
                                  disabled={verificarMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Quitar verificación
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  onClick={() => handleVerificar(documento, true)}
                                  disabled={verificarMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Marcar verificado
                                </button>
                              )}

                              <button
                                type="button"
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  setDocumentoAEliminar(documento);
                                  setMenuAbierto(null);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de upload */}
      <DocumentoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        profesionalId={profesionalId}
        onSuccess={() => refetch()}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!documentoAEliminar}
        onClose={() => setDocumentoAEliminar(null)}
        onConfirm={handleEliminar}
        title="Eliminar documento"
        message={`¿Está seguro de eliminar el documento "${documentoAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </>
  );
}
