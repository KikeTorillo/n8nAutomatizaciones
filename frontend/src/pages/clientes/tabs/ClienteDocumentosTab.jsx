/**
 * ====================================================================
 * CLIENTE DOCUMENTOS TAB - GESTIÓN DE DOCUMENTOS
 * ====================================================================
 *
 * Fase 4C - Vista con Tabs (Ene 2026)
 * Tab de documentos del cliente
 *
 * ====================================================================
 */

import { useState } from 'react';
import { useModalManager } from '@/hooks/utils';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Plus,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button, ConfirmDialog, EmptyState } from '@/components/ui';
import {
  useDocumentosCliente,
  useCrearDocumento,
  useEliminarDocumento,
  useVerificarDocumento,
  useObtenerPresigned,
  TIPOS_DOCUMENTO,
  getTipoDocumento,
  getEstadoVencimiento,
  // formatFileSize moved to @/lib/utils
} from '@/hooks/personas';
import { formatFileSize } from '@/lib/utils';
import { useToast } from '@/hooks/utils';
import DocumentoUploadDrawer from '@/components/clientes/DocumentoUploadDrawer';

/**
 * Card de documento individual
 */
function DocumentoCard({
  documento,
  onVerificar,
  onEliminar,
  onDescargar,
  isLoading,
}) {
  const tipoInfo = getTipoDocumento(documento.tipo_documento);
  const estadoInfo = getEstadoVencimiento(documento.estado_vencimiento);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {documento.nombre}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tipoInfo.label}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Estado de verificación */}
              {documento.verificado ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                  <Clock className="w-3 h-3" />
                  Pendiente
                </span>
              )}

              {/* Estado de vencimiento */}
              {documento.estado_vencimiento && documento.estado_vencimiento !== 'sin_vencimiento' && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${estadoInfo.bgColor} ${estadoInfo.color}`}>
                  {documento.estado_vencimiento === 'vencido' && <XCircle className="w-3 h-3" />}
                  {documento.estado_vencimiento === 'por_vencer' && <AlertTriangle className="w-3 h-3" />}
                  {estadoInfo.label}
                  {documento.dias_para_vencer !== null && documento.dias_para_vencer >= 0 && (
                    <span>({documento.dias_para_vencer} días)</span>
                  )}
                </span>
              )}
            </div>

            {/* Fechas */}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              {documento.fecha_emision && (
                <span>Emisión: {new Date(documento.fecha_emision).toLocaleDateString('es-MX')}</span>
              )}
              {documento.fecha_vencimiento && (
                <span>Vence: {new Date(documento.fecha_vencimiento).toLocaleDateString('es-MX')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          {documento.archivo_storage_id && (
            <button
              onClick={() => onDescargar(documento)}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              title="Descargar"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onVerificar(documento, !documento.verificado)}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              documento.verificado
                ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600'
                : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600'
            }`}
            title={documento.verificado ? 'Desverificar' : 'Verificar'}
          >
            {documento.verificado ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onEliminar(documento)}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClienteDocumentosTab({ clienteId }) {
  const { toast } = useToast();

  // Estado local
  const [filtroTipo, setFiltroTipo] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    delete: { isOpen: false, data: null },
  });

  // Queries y mutations
  const { data: documentos, isLoading, isError, refetch } = useDocumentosCliente(clienteId, {
    tipo: filtroTipo || undefined,
  });

  const crearDocumento = useCrearDocumento();
  const eliminarDocumento = useEliminarDocumento();
  const verificarDocumento = useVerificarDocumento();
  const obtenerPresigned = useObtenerPresigned();

  // Handlers
  const handleCrear = async (data, archivo) => {
    try {
      await crearDocumento.mutateAsync({
        clienteId,
        data,
        archivo,
      });
      toast('Documento subido correctamente', { type: 'success' });
      setDrawerOpen(false);
    } catch (error) {
      toast(error.message || 'No se pudo subir el documento', { type: 'error' });
    }
  };

  const handleVerificar = async (documento, verificado) => {
    try {
      await verificarDocumento.mutateAsync({
        clienteId,
        documentoId: documento.id,
        verificado,
      });
      toast(verificado ? 'Documento verificado' : 'Verificación removida', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo cambiar el estado', { type: 'error' });
    }
  };

  const handleEliminar = (documento) => {
    openModal('delete', documento);
  };

  const confirmEliminar = async () => {
    const documento = getModalData('delete');
    if (!documento) return;

    try {
      await eliminarDocumento.mutateAsync({
        clienteId,
        documentoId: documento.id,
      });
      toast('Documento eliminado', { type: 'success' });
      closeModal('delete');
    } catch (err) {
      toast(err.message || 'No se pudo eliminar', { type: 'error' });
    }
  };

  const handleDescargar = async (documento) => {
    try {
      const result = await obtenerPresigned.mutateAsync({
        clienteId,
        documentoId: documento.id,
      });

      // Abrir URL en nueva pestaña
      window.open(result.url, '_blank');
    } catch (error) {
      toast(error.message || 'No se pudo obtener el archivo', { type: 'error' });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error al cargar documentos</p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Documentos
          </h3>
          {documentos?.length > 0 && (
            <span className="text-sm text-gray-500">
              ({documentos.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro por tipo */}
          <div className="relative">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="
                appearance-none pl-8 pr-8 py-2 rounded-lg text-sm
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                text-gray-700 dark:text-gray-300
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            >
              <option value="">Todos los tipos</option>
              {TIPOS_DOCUMENTO.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Subir documento
          </Button>
        </div>
      </div>

      {/* Lista de documentos */}
      {documentos?.length > 0 ? (
        <div className="grid gap-4">
          {documentos.map((documento) => (
            <DocumentoCard
              key={documento.id}
              documento={documento}
              onVerificar={handleVerificar}
              onEliminar={handleEliminar}
              onDescargar={handleDescargar}
              isLoading={
                verificarDocumento.isPending ||
                eliminarDocumento.isPending ||
                obtenerPresigned.isPending
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Sin documentos"
          description="Sube identificaciones, contratos y otros documentos importantes"
          action={
            <Button onClick={() => setDrawerOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Subir primer documento
            </Button>
          }
        />
      )}

      {/* Drawer para subir documento */}
      <DocumentoUploadDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCrear}
        isLoading={crearDocumento.isPending}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={confirmEliminar}
        title="Eliminar documento"
        description={`¿Estás seguro de eliminar "${getModalData('delete')?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarDocumento.isPending}
      />
    </div>
  );
}
