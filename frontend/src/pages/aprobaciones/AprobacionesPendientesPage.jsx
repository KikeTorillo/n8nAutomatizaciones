import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useModalManager } from '@/hooks/utils';
import {
  Button,
  Modal,
  Textarea
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
import {
  useAprobacionesPendientes,
  useAprobarSolicitud,
  useRechazarSolicitud,
  useInstanciaWorkflow,
} from '@/hooks/sistema';
import { AprobacionesPageLayout } from '@/components/aprobaciones';

// Formatters
const formatMoney = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTipoEntidadLabel = (tipo) => {
  const labels = {
    orden_compra: 'Orden de Compra',
    venta_pos: 'Venta POS',
  };
  return labels[tipo] || tipo;
};

// Estados badge config
const ESTADO_ESTILOS = {
  en_progreso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  aprobado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
  expirado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const ESTADO_TEXTOS = {
  en_progreso: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
};

/**
 * Página de Aprobaciones Pendientes
 * Bandeja de solicitudes pendientes de aprobación
 */
export default function AprobacionesPendientesPage() {
  const { success: showSuccess, error: showError } = useToast();

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    detalle: { isOpen: false, data: null },
    aprobar: { isOpen: false, data: null },
    rechazar: { isOpen: false, data: null },
  });

  // Estados de formularios
  const [comentarioAprobacion, setComentarioAprobacion] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Queries
  const { data: pendientesData, isLoading: loadingPendientes } = useAprobacionesPendientes();
  const pendientes = pendientesData?.instancias || [];

  const { data: instanciaDetalle } = useInstanciaWorkflow(getModalData('detalle'));

  // Mutations
  const aprobarMutation = useAprobarSolicitud();
  const rechazarMutation = useRechazarSolicitud();

  // Handlers
  const handleVerDetalle = (instanciaId) => {
    openModal('detalle', instanciaId);
  };

  const handleAbrirModalAprobar = (instancia) => {
    setComentarioAprobacion('');
    openModal('aprobar', instancia);
  };

  const handleAprobar = () => {
    const instancia = getModalData('aprobar');
    aprobarMutation.mutate(
      { id: instancia.id, comentario: comentarioAprobacion },
      {
        onSuccess: () => {
          showSuccess('Solicitud aprobada correctamente');
          closeModal('aprobar');
          setComentarioAprobacion('');
        },
        onError: (err) => {
          showError(err.response?.data?.mensaje || 'Error al aprobar la solicitud');
        },
      }
    );
  };

  const handleAbrirModalRechazar = (instancia) => {
    setMotivoRechazo('');
    openModal('rechazar', instancia);
  };

  const handleRechazar = () => {
    if (!motivoRechazo.trim() || motivoRechazo.length < 10) {
      showError('El motivo de rechazo debe tener al menos 10 caracteres');
      return;
    }

    const instancia = getModalData('rechazar');
    rechazarMutation.mutate(
      { id: instancia.id, motivo: motivoRechazo },
      {
        onSuccess: () => {
          showSuccess('Solicitud rechazada');
          closeModal('rechazar');
          setMotivoRechazo('');
        },
        onError: (err) => {
          showError(err.response?.data?.mensaje || 'Error al rechazar la solicitud');
        },
      }
    );
  };

  // getEstadoBadge helper for modal
  const getEstadoBadge = (estado) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${ESTADO_ESTILOS[estado] || ESTADO_ESTILOS.cancelado}`}>
      {ESTADO_TEXTOS[estado] || estado}
    </span>
  );

  return (
    <AprobacionesPageLayout
      icon={Clock}
      title="Pendientes"
      subtitle={pendientes.length > 0 ? `${pendientes.length} solicitudes` : undefined}
    >
      {loadingPendientes ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : pendientes.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No hay solicitudes pendientes
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Todas las solicitudes han sido procesadas
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendientes.map((instancia) => (
            <div
              key={instancia.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {instancia.entidad_resumen?.folio || `#${instancia.entidad_id}`}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getTipoEntidadLabel(instancia.entidad_tipo)}
                      </p>
                    </div>
                    {instancia.prioridad > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Urgente
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Monto:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatMoney(instancia.entidad_resumen?.total)}
                      </p>
                    </div>
                    {instancia.entidad_resumen?.proveedor_nombre && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Proveedor:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {instancia.entidad_resumen.proveedor_nombre}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Solicitante:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {instancia.solicitante_nombre || instancia.solicitante_email}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(instancia.iniciado_en)}
                      </p>
                    </div>
                  </div>

                  {instancia.horas_pendiente > 24 && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        Pendiente hace {Math.floor(instancia.horas_pendiente)} horas
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerDetalle(instancia.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAbrirModalAprobar(instancia)}
                    disabled={aprobarMutation.isLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => handleAbrirModalRechazar(instancia)}
                    disabled={rechazarMutation.isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detalle */}
      <Modal
        isOpen={isOpen('detalle')}
        onClose={() => closeModal('detalle')}
        title="Detalle de Solicitud"
        size="lg"
      >
        {instanciaDetalle ? (
          <div className="space-y-6">
            {/* Info general */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {getTipoEntidadLabel(instanciaDetalle.entidad_tipo)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                {getEstadoBadge(instanciaDetalle.estado)}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Solicitante</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {instanciaDetalle.solicitante_nombre || instanciaDetalle.solicitante_email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha solicitud</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(instanciaDetalle.iniciado_en)}
                </p>
              </div>
            </div>

            {/* Datos de la entidad */}
            {instanciaDetalle.entidad && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Datos de la Orden de Compra
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Folio</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {instanciaDetalle.entidad.folio}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Proveedor</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {instanciaDetalle.entidad.proveedor_nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatMoney(instanciaDetalle.entidad.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Items</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {instanciaDetalle.entidad.items?.length || 0} productos
                    </p>
                  </div>
                </div>

                {/* Lista de items */}
                {instanciaDetalle.entidad.items && instanciaDetalle.entidad.items.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Productos:</p>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
                      {instanciaDetalle.entidad.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 text-sm">
                          <span className="text-gray-900 dark:text-white">{item.nombre_producto}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {item.cantidad_ordenada} x {formatMoney(item.precio_unitario)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Historial */}
            {instanciaDetalle.historial && instanciaDetalle.historial.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Historial</h4>
                <div className="space-y-3">
                  {instanciaDetalle.historial.map((evento, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          {evento.accion === 'iniciar' && 'Solicitud iniciada'}
                          {evento.accion === 'avanzar' && 'Pasó a aprobación'}
                          {evento.accion === 'aprobar' && `Aprobado por ${evento.usuario_nombre}`}
                          {evento.accion === 'rechazar' && `Rechazado por ${evento.usuario_nombre}`}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {formatDate(evento.ejecutado_en)}
                        </p>
                        {evento.comentario && (
                          <p className="text-gray-600 dark:text-gray-300 mt-1 italic">
                            "{evento.comentario}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
      </Modal>

      {/* Modal Aprobar */}
      <Modal
        isOpen={isOpen('aprobar')}
        onClose={() => closeModal('aprobar')}
        title="Aprobar Solicitud"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Confirmas la aprobación de{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {getModalData('aprobar')?.entidad_resumen?.folio || `#${getModalData('aprobar')?.entidad_id}`}
            </span>
            ?
          </p>

          <Textarea
            label="Comentario (opcional)"
            value={comentarioAprobacion}
            onChange={(e) => setComentarioAprobacion(e.target.value)}
            placeholder="Agregar un comentario..."
            rows={3}
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => closeModal('aprobar')}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleAprobar}
              disabled={aprobarMutation.isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {aprobarMutation.isLoading ? 'Aprobando...' : 'Aprobar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal
        isOpen={isOpen('rechazar')}
        onClose={() => closeModal('rechazar')}
        title="Rechazar Solicitud"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Confirmas el rechazo de{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {getModalData('rechazar')?.entidad_resumen?.folio || `#${getModalData('rechazar')?.entidad_id}`}
            </span>
            ?
          </p>

          <Textarea
            label="Motivo del rechazo"
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Indica el motivo del rechazo (mínimo 10 caracteres)..."
            rows={3}
            required
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => closeModal('rechazar')}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleRechazar}
              disabled={rechazarMutation.isLoading || motivoRechazo.length < 10}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {rechazarMutation.isLoading ? 'Rechazando...' : 'Rechazar'}
            </Button>
          </div>
        </div>
      </Modal>
    </AprobacionesPageLayout>
  );
}
