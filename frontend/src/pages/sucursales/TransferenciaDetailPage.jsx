import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Building2,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  User,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  Button,
  Input,
  LoadingSpinner,
  Modal
} from '@/components/ui';
import { SucursalesPageLayout } from '@/components/sucursales';
import {
  useTransferencia,
  useEnviarTransferencia,
  useRecibirTransferencia,
  useCancelarTransferencia,
} from '@/hooks/sistema';
import { useToast } from '@/hooks/utils';
import { useModalManager } from '@/hooks/utils';

// Configuracion de estados
const estadoConfig = {
  borrador: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    borderColor: 'border-gray-300 dark:border-gray-600',
    icon: Clock,
    label: 'Borrador',
    description: 'La transferencia esta en preparacion',
  },
  enviado: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    borderColor: 'border-yellow-300 dark:border-yellow-600',
    icon: Send,
    label: 'Enviado',
    description: 'El stock fue restado del origen, pendiente de recepcion',
  },
  recibido: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    borderColor: 'border-green-300 dark:border-green-600',
    icon: CheckCircle,
    label: 'Recibido',
    description: 'Transferencia completada exitosamente',
  },
  cancelado: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    borderColor: 'border-red-300 dark:border-red-600',
    icon: XCircle,
    label: 'Cancelado',
    description: 'La transferencia fue cancelada',
  },
};

/**
 * Pagina de detalle de transferencia de stock
 * Permite ver, enviar, recibir y cancelar transferencias
 */
function TransferenciaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Modales centralizados
  const { openModal, closeModal, isOpen } = useModalManager({
    recibir: { isOpen: false },
    cancelar: { isOpen: false },
  });

  // Estado para items de recepcion (datos del formulario)
  const [itemsRecepcion, setItemsRecepcion] = useState([]);

  // Fetch data
  const { data: transferencia, isLoading } = useTransferencia(id);

  // Mutations
  const enviarMutation = useEnviarTransferencia();
  const recibirMutation = useRecibirTransferencia();
  const cancelarMutation = useCancelarTransferencia();

  // Loading state
  if (isLoading) {
    return (
      <SucursalesPageLayout
        icon={ArrowRightLeft}
        title="Cargando..."
        hideSectionHeader
      >
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      </SucursalesPageLayout>
    );
  }

  // Not found
  if (!transferencia) {
    return (
      <SucursalesPageLayout
        icon={ArrowRightLeft}
        title="Transferencia no encontrada"
        hideSectionHeader
      >
        <div className="flex flex-col items-center justify-center py-16">
          <ArrowRightLeft className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Transferencia no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            La transferencia que buscas no existe o fue eliminada
          </p>
          <Button onClick={() => navigate('/sucursales/transferencias')}>
            Volver a Transferencias
          </Button>
        </div>
      </SucursalesPageLayout>
    );
  }

  const config = estadoConfig[transferencia.estado] || estadoConfig.borrador;
  const IconEstado = config.icon;

  // Formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handler: Enviar transferencia
  const handleEnviar = async () => {
    try {
      await enviarMutation.mutateAsync(transferencia.id);
      toast.success('Transferencia enviada correctamente');
    } catch (error) {
      toast.error(error.message || 'Error al enviar transferencia');
    }
  };

  // Handler: Abrir modal de recepcion
  const handleAbrirRecepcion = () => {
    // Inicializar items con cantidad_recibida = cantidad_enviada
    setItemsRecepcion(
      transferencia.items?.map((item) => ({
        id: item.id,
        producto_id: item.producto_id,
        nombre: item.producto_nombre,
        sku: item.producto_sku,
        cantidad_enviada: item.cantidad_enviada,
        cantidad_recibida: item.cantidad_recibida || item.cantidad_enviada,
      })) || []
    );
    openModal('recibir');
  };

  // Handler: Actualizar cantidad recibida
  const handleCantidadChange = (index, cantidad) => {
    const newItems = [...itemsRecepcion];
    newItems[index].cantidad_recibida = Math.max(0, parseInt(cantidad) || 0);
    setItemsRecepcion(newItems);
  };

  // Handler: Confirmar recepcion
  const handleConfirmarRecepcion = async () => {
    try {
      await recibirMutation.mutateAsync({
        id: transferencia.id,
        data: {
          items: itemsRecepcion.map((item) => ({
            id: item.id,
            cantidad_recibida: item.cantidad_recibida,
          })),
        },
      });
      toast.success('Transferencia recibida correctamente');
      closeModal('recibir');
    } catch (err) {
      toast.error(err.message || 'Error al recibir transferencia');
    }
  };

  // Handler: Cancelar transferencia
  const handleCancelar = async () => {
    try {
      await cancelarMutation.mutateAsync(transferencia.id);
      toast.success('Transferencia cancelada');
      closeModal('cancelar');
    } catch (err) {
      toast.error(err.message || 'Error al cancelar transferencia');
    }
  };

  // Calcular totales
  const totalItems = transferencia.items?.length || 0;
  const totalUnidades = transferencia.items?.reduce((sum, i) => sum + (i.cantidad_enviada || 0), 0) || 0;
  const totalRecibidas = transferencia.items?.reduce((sum, i) => sum + (i.cantidad_recibida || 0), 0) || 0;

  return (
    <SucursalesPageLayout
      icon={ArrowRightLeft}
      title={transferencia.codigo}
      subtitle={config.description}
      actions={
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
            <IconEstado className="w-4 h-4" />
            {config.label}
          </span>

          {/* Acciones segun estado */}
          {transferencia.estado === 'borrador' && (
            <>
              <Button
                variant="primary"
                onClick={handleEnviar}
                disabled={enviarMutation.isPending || totalItems === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                {enviarMutation.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
              <Button
                variant="danger"
                onClick={() => openModal('cancelar')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}

          {transferencia.estado === 'enviado' && (
            <>
              <Button
                variant="primary"
                onClick={handleAbrirRecepcion}
                disabled={recibirMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Recibir Transferencia
              </Button>
              <Button
                variant="danger"
                onClick={() => openModal('cancelar')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal - Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lista de productos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                Productos ({totalItems})
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalUnidades} unidades
              </span>
            </div>

            {totalItems === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No hay productos en esta transferencia
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {transferencia.items?.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.producto_nombre}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {item.producto_sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.cantidad_enviada} uds
                      </p>
                      {transferencia.estado === 'recibido' && item.cantidad_recibida !== item.cantidad_enviada && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Recibidas: {item.cantidad_recibida}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resumen */}
            {totalItems > 0 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total productos:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Total unidades enviadas:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{totalUnidades}</span>
                </div>
                {transferencia.estado === 'recibido' && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Total unidades recibidas:</span>
                    <span className={`font-medium ${totalRecibidas === totalUnidades ? 'text-green-600' : 'text-yellow-600'}`}>
                      {totalRecibidas}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notas */}
          {transferencia.notas && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Notas
              </h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {transferencia.notas}
              </p>
            </div>
          )}
        </div>

        {/* Columna lateral - Info */}
        <div className="space-y-6">
          {/* Sucursales */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Movimiento
            </h3>

            <div className="space-y-4">
              {/* Origen */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Origen
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transferencia.sucursal_origen_nombre}
                  </p>
                </div>
              </div>

              {/* Flecha */}
              <div className="flex justify-center">
                <ArrowRightLeft className="w-5 h-5 text-gray-400 rotate-90" />
              </div>

              {/* Destino */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Destino
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transferencia.sucursal_destino_nombre}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Historial
            </h3>

            <div className="space-y-4">
              {/* Creacion */}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Creada
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFecha(transferencia.creado_en)}
                  </p>
                  {transferencia.usuario_crea_nombre && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />
                      {transferencia.usuario_crea_nombre}
                    </p>
                  )}
                </div>
              </div>

              {/* Envio */}
              {transferencia.fecha_envio && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Enviada
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFecha(transferencia.fecha_envio)}
                    </p>
                    {transferencia.usuario_envia_nombre && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        {transferencia.usuario_envia_nombre}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recepcion */}
              {transferencia.fecha_recepcion && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Recibida
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFecha(transferencia.fecha_recepcion)}
                    </p>
                    {transferencia.usuario_recibe_nombre && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        {transferencia.usuario_recibe_nombre}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cancelacion */}
              {transferencia.estado === 'cancelado' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Cancelada
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFecha(transferencia.actualizado_en)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Recibir Transferencia */}
      <Modal
        isOpen={isOpen('recibir')}
        onClose={() => closeModal('recibir')}
        title="Recibir Transferencia"
        size="lg"
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Confirma las cantidades recibidas de cada producto. Si hay diferencias,
            ajusta la cantidad.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {itemsRecepcion.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {item.nombre}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {item.sku} | Enviadas: {item.cantidad_enviada}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    Recibidas:
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={item.cantidad_enviada}
                    value={item.cantidad_recibida}
                    onChange={(e) => handleCantidadChange(index, e.target.value)}
                    className="w-20 text-center"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Advertencia si hay diferencias */}
          {itemsRecepcion.some((i) => i.cantidad_recibida !== i.cantidad_enviada) && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Hay diferencias en las cantidades</p>
                <p>Las cantidades recibidas no coinciden con las enviadas. Esto quedara registrado.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => closeModal('recibir')}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmarRecepcion}
              disabled={recibirMutation.isPending}
            >
              {recibirMutation.isPending ? 'Procesando...' : 'Confirmar Recepcion'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Cancelar Transferencia */}
      <Modal
        isOpen={isOpen('cancelar')}
        onClose={() => closeModal('cancelar')}
        title="Cancelar Transferencia"
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Estas seguro de cancelar la transferencia <strong>{transferencia.codigo}</strong>?
          </p>

          {transferencia.estado === 'enviado' && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">El stock sera devuelto</p>
                <p>Al cancelar, el stock sera devuelto a la sucursal de origen.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => closeModal('cancelar')}
            >
              No, mantener
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelar}
              disabled={cancelarMutation.isPending}
            >
              {cancelarMutation.isPending ? 'Cancelando...' : 'Si, cancelar'}
            </Button>
          </div>
        </div>
      </Modal>
    </SucursalesPageLayout>
  );
}

export default TransferenciaDetailPage;
