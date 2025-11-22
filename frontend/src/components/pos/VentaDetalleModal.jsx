import { X, Receipt, User, Calendar, DollarSign, CreditCard, Package, FileText } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useVenta } from '@/hooks/useVentas';

/**
 * Modal para mostrar detalle completo de una venta
 * Incluye información de la venta, items, totales y pagos
 */
export default function VentaDetalleModal({ isOpen, onClose, ventaId }) {
  const { data: ventaData, isLoading } = useVenta(ventaId);
  const venta = ventaData?.venta || null;
  const items = ventaData?.items || [];

  if (!isOpen) return null;

  const getBadgeEstado = (estado) => {
    const badges = {
      cotizacion: 'bg-gray-100 text-gray-800',
      apartado: 'bg-yellow-100 text-yellow-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
      devolucion_parcial: 'bg-orange-100 text-orange-800',
      devolucion_total: 'bg-red-100 text-red-800',
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getBadgeEstadoPago = (estadoPago) => {
    const badges = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      pagado: 'bg-green-100 text-green-800',
      parcial: 'bg-orange-100 text-orange-800',
      cancelado: 'bg-red-100 text-red-800',
    };
    return badges[estadoPago] || 'bg-gray-100 text-gray-800';
  };

  const formatearMetodoPago = (metodo) => {
    const metodos = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      qr: 'QR Mercado Pago',
      mixto: 'Mixto',
    };
    return metodos[metodo] || metodo;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header personalizado */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Detalle de Venta</h2>
              {venta && (
                <p className="text-sm text-gray-500 mt-1">
                  Folio: <span className="font-semibold text-gray-900">{venta.folio}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando detalle de venta...</p>
          </div>
        ) : !venta ? (
          <div className="py-8 text-center text-red-600">
            <p>No se pudo cargar la información de la venta</p>
          </div>
        ) : (
          <>
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Venta</p>
                  <p className="text-sm text-gray-900">
                    {new Date(venta.fecha_venta).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Cliente</p>
                  <p className="text-sm text-gray-900">
                    {venta.cliente_nombre || 'Venta directa (sin cliente)'}
                  </p>
                </div>
              </div>

              {/* Método de pago */}
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                  <p className="text-sm text-gray-900">
                    {formatearMetodoPago(venta.metodo_pago)}
                  </p>
                </div>
              </div>

              {/* Usuario que registró */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Registrado por</p>
                  <p className="text-sm text-gray-900">
                    {venta.usuario_nombre || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Estados */}
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Estado</p>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeEstado(
                      venta.estado
                    )}`}
                  >
                    {venta.estado}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Estado de Pago</p>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeEstadoPago(
                      venta.estado_pago
                    )}`}
                  >
                    {venta.estado_pago}
                  </span>
                </div>
              </div>
            </div>

            {/* Items de la venta */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Items de la Venta
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Descuento
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{item.producto_nombre}</p>
                            {item.producto_sku && (
                              <p className="text-xs text-gray-500">SKU: {item.producto_sku}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ${parseFloat(item.precio_unitario || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {item.descuento_monto > 0
                            ? `-$${parseFloat(item.descuento_monto || 0).toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          ${parseFloat(item.subtotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    ${parseFloat(venta.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                {venta.descuento_monto > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Descuento {venta.descuento_porcentaje > 0 ? `(${venta.descuento_porcentaje}%)` : ''}:
                    </span>
                    <span className="font-medium text-red-600">
                      -${parseFloat(venta.descuento_monto || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {venta.impuestos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Impuestos:</span>
                    <span className="font-medium text-gray-900">
                      ${parseFloat(venta.impuestos || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${parseFloat(venta.total || 0).toFixed(2)}
                  </span>
                </div>
                {venta.monto_pagado > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monto Pagado:</span>
                      <span className="font-medium text-green-600">
                        ${parseFloat(venta.monto_pagado || 0).toFixed(2)}
                      </span>
                    </div>
                    {venta.monto_pendiente > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Monto Pendiente:</span>
                        <span className="font-medium text-orange-600">
                          ${parseFloat(venta.monto_pendiente || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Notas */}
            {venta.notas && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Notas</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                      {venta.notas}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
