import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Filter,
  Calendar,
  Building2,
  AlertTriangle,
  History,
  Users,
  ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/hooks/useToast';
import {
  useAprobacionesPendientes,
  useHistorialAprobaciones,
  useAprobarSolicitud,
  useRechazarSolicitud,
  useInstanciaWorkflow,
} from '@/hooks/useWorkflows';

/**
 * Página de Aprobaciones
 * Bandeja de aprobaciones pendientes y historial
 */
export default function AprobacionesPage() {
  const { success: showSuccess, error: showError } = useToast();

  // Estado de pestañas
  const [tabActiva, setTabActiva] = useState('pendientes');

  // Estado de filtros para historial
  const [filtrosHistorial, setFiltrosHistorial] = useState({
    entidad_tipo: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    limit: 50,
    offset: 0,
  });

  // Modales
  const [modalDetalle, setModalDetalle] = useState({ isOpen: false, instanciaId: null });
  const [modalAprobar, setModalAprobar] = useState({ isOpen: false, instancia: null });
  const [modalRechazar, setModalRechazar] = useState({ isOpen: false, instancia: null });
  const [comentarioAprobacion, setComentarioAprobacion] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Queries
  const { data: pendientesData, isLoading: loadingPendientes } = useAprobacionesPendientes();
  const pendientes = pendientesData?.instancias || [];

  const { data: historialData, isLoading: loadingHistorial } = useHistorialAprobaciones(filtrosHistorial);
  const historial = historialData?.instancias || [];

  const { data: instanciaDetalle } = useInstanciaWorkflow(modalDetalle.instanciaId);

  // Mutations
  const aprobarMutation = useAprobarSolicitud();
  const rechazarMutation = useRechazarSolicitud();

  // Handlers
  const handleVerDetalle = (instanciaId) => {
    setModalDetalle({ isOpen: true, instanciaId });
  };

  const handleAbrirModalAprobar = (instancia) => {
    setComentarioAprobacion('');
    setModalAprobar({ isOpen: true, instancia });
  };

  const handleAprobar = () => {
    aprobarMutation.mutate(
      { id: modalAprobar.instancia.id, comentario: comentarioAprobacion },
      {
        onSuccess: () => {
          showSuccess('Solicitud aprobada correctamente');
          setModalAprobar({ isOpen: false, instancia: null });
          setComentarioAprobacion('');
        },
        onError: (error) => {
          showError(error.response?.data?.mensaje || 'Error al aprobar la solicitud');
        },
      }
    );
  };

  const handleAbrirModalRechazar = (instancia) => {
    setMotivoRechazo('');
    setModalRechazar({ isOpen: true, instancia });
  };

  const handleRechazar = () => {
    if (!motivoRechazo.trim() || motivoRechazo.length < 10) {
      showError('El motivo de rechazo debe tener al menos 10 caracteres');
      return;
    }

    rechazarMutation.mutate(
      { id: modalRechazar.instancia.id, motivo: motivoRechazo },
      {
        onSuccess: () => {
          showSuccess('Solicitud rechazada');
          setModalRechazar({ isOpen: false, instancia: null });
          setMotivoRechazo('');
        },
        onError: (error) => {
          showError(error.response?.data?.mensaje || 'Error al rechazar la solicitud');
        },
      }
    );
  };

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

  const getEstadoBadge = (estado) => {
    const estilos = {
      en_progreso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      aprobado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rechazado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      expirado: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };

    const textos = {
      en_progreso: 'Pendiente',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado',
      cancelado: 'Cancelado',
      expirado: 'Expirado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${estilos[estado] || estilos.cancelado}`}>
        {textos[estado] || estado}
      </span>
    );
  };

  const getTipoEntidadLabel = (tipo) => {
    const labels = {
      orden_compra: 'Orden de Compra',
      venta_pos: 'Venta POS',
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <BackButton fallbackPath="/dashboard" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aprobaciones</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Bandeja de solicitudes pendientes de aprobación
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTabActiva('pendientes')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tabActiva === 'pendientes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            Pendientes
            {pendientes.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {pendientes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTabActiva('historial')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tabActiva === 'historial'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <History className="h-4 w-4" />
            Historial
          </button>
        </div>
      </div>

      {/* Contenido según tab activa */}
      {tabActiva === 'pendientes' && (
        <div>
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
        </div>
      )}

      {tabActiva === 'historial' && (
        <div>
          {/* Filtros de historial */}
          <div className="mb-4 flex flex-wrap gap-4">
            <select
              value={filtrosHistorial.estado}
              onChange={(e) =>
                setFiltrosHistorial((prev) => ({ ...prev, estado: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
              <option value="cancelado">Cancelados</option>
              <option value="expirado">Expirados</option>
            </select>

            <select
              value={filtrosHistorial.entidad_tipo}
              onChange={(e) =>
                setFiltrosHistorial((prev) => ({ ...prev, entidad_tipo: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="orden_compra">Órdenes de Compra</option>
            </select>
          </div>

          {loadingHistorial ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Sin historial
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                No hay solicitudes procesadas que coincidan con los filtros
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Solicitud
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Procesado por
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {historial.map((instancia) => (
                    <tr key={instancia.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {instancia.entidad_resumen?.folio || `#${instancia.entidad_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getTipoEntidadLabel(instancia.entidad_tipo)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getEstadoBadge(instancia.estado)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {instancia.aprobador_nombre || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(instancia.completado_en)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerDetalle(instancia.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Detalle */}
      <Modal
        isOpen={modalDetalle.isOpen}
        onClose={() => setModalDetalle({ isOpen: false, instanciaId: null })}
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
        isOpen={modalAprobar.isOpen}
        onClose={() => setModalAprobar({ isOpen: false, instancia: null })}
        title="Aprobar Solicitud"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Confirmas la aprobación de{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {modalAprobar.instancia?.entidad_resumen?.folio || `#${modalAprobar.instancia?.entidad_id}`}
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
              onClick={() => setModalAprobar({ isOpen: false, instancia: null })}
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
        isOpen={modalRechazar.isOpen}
        onClose={() => setModalRechazar({ isOpen: false, instancia: null })}
        title="Rechazar Solicitud"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            ¿Confirmas el rechazo de{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {modalRechazar.instancia?.entidad_resumen?.folio || `#${modalRechazar.instancia?.entidad_id}`}
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
              onClick={() => setModalRechazar({ isOpen: false, instancia: null })}
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
    </div>
  );
}
