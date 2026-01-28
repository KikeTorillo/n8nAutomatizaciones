import { useState } from 'react';
import {
  History,
  Eye,
} from 'lucide-react';
import { useModalManager } from '@/hooks/utils';
import {
  DataTable,
  DataTableActions,
  DataTableActionButton,
  Modal,
} from '@/components/ui';
import {
  useHistorialAprobaciones,
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

// Columnas para historial
const HISTORIAL_COLUMNS = [
  {
    key: 'solicitud',
    header: 'Solicitud',
    render: (row) => (
      <span className="font-medium text-gray-900 dark:text-white">
        {row.entidad_resumen?.folio || `#${row.entidad_id}`}
      </span>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {getTipoEntidadLabel(row.entidad_tipo)}
      </span>
    ),
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (row) => (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ESTADO_ESTILOS[row.estado] || ESTADO_ESTILOS.cancelado}`}>
        {ESTADO_TEXTOS[row.estado] || row.estado}
      </span>
    ),
  },
  {
    key: 'procesado_por',
    header: 'Procesado por',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {row.aprobador_nombre || '-'}
      </span>
    ),
  },
  {
    key: 'fecha',
    header: 'Fecha',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {formatDate(row.completado_en)}
      </span>
    ),
  },
];

/**
 * Página de Historial de Aprobaciones
 * Muestra el historial de solicitudes procesadas
 */
export default function AprobacionesHistorialPage() {
  // Estado de filtros para historial
  const [filtrosHistorial, setFiltrosHistorial] = useState({
    entidad_tipo: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    limit: 50,
    offset: 0,
  });

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    detalle: { isOpen: false, data: null },
  });

  // Queries
  const { data: historialData, isLoading: loadingHistorial } = useHistorialAprobaciones(filtrosHistorial);
  const historial = historialData?.instancias || [];

  const { data: instanciaDetalle } = useInstanciaWorkflow(getModalData('detalle'));

  // Handlers
  const handleVerDetalle = (instanciaId) => {
    openModal('detalle', instanciaId);
  };

  // getEstadoBadge helper for modal
  const getEstadoBadge = (estado) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${ESTADO_ESTILOS[estado] || ESTADO_ESTILOS.cancelado}`}>
      {ESTADO_TEXTOS[estado] || estado}
    </span>
  );

  return (
    <AprobacionesPageLayout
      icon={History}
      title="Historial"
      subtitle="Solicitudes procesadas"
    >
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
          <option value="orden_compra">Ordenes de Compra</option>
        </select>
      </div>

      <DataTable
        columns={[
          ...HISTORIAL_COLUMNS,
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (row) => (
              <DataTableActions>
                <DataTableActionButton
                  icon={Eye}
                  label="Ver detalle"
                  onClick={() => handleVerDetalle(row.id)}
                  variant="primary"
                />
              </DataTableActions>
            ),
          },
        ]}
        data={historial}
        isLoading={loadingHistorial}
        emptyState={{
          icon: History,
          title: 'Sin historial',
          description: 'No hay solicitudes procesadas que coincidan con los filtros',
        }}
        skeletonRows={5}
      />

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
                          {evento.accion === 'avanzar' && 'Paso a aprobacion'}
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
    </AprobacionesPageLayout>
  );
}
