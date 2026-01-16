import { useState } from 'react';
import { X, Receipt, User, Calendar, DollarSign, CreditCard, Package, FileText, Printer, Download } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { useVenta } from '@/hooks/useVentas';
import { posApi } from '@/services/api/endpoints';

/**
 * Modal para mostrar detalle completo de una venta
 * Incluye información de la venta, items, totales y pagos
 */
export default function VentaDetalleModal({ isOpen, onClose, ventaId }) {
  const { data: ventaData, isLoading } = useVenta(ventaId);
  const venta = ventaData?.venta || null;
  const items = ventaData?.items || [];

  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
  const [ticketError, setTicketError] = useState(null);

  /**
   * Descargar ticket PDF
   * @param {string} paperSize - '58mm' o '80mm'
   */
  const handleDownloadTicket = async (paperSize = '80mm') => {
    if (!ventaId) return;

    setIsGeneratingTicket(true);
    setTicketError(null);

    try {
      const response = await posApi.generarTicket(ventaId, {
        paper_size: paperSize,
        download: true
      });

      // Crear blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${venta?.folio || ventaId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando ticket:', error);
      setTicketError('Error al generar el ticket. Intenta de nuevo.');
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  /**
   * Imprimir ticket (abre en nueva pestaña para imprimir)
   * @param {string} paperSize - '58mm' o '80mm'
   */
  const handlePrintTicket = async (paperSize = '80mm') => {
    if (!ventaId) return;

    setIsGeneratingTicket(true);
    setTicketError(null);

    try {
      const response = await posApi.generarTicket(ventaId, {
        paper_size: paperSize,
        download: false
      });

      // Crear blob URL y abrir para imprimir
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error generando ticket para imprimir:', error);
      setTicketError('Error al preparar impresión. Intenta de nuevo.');
    } finally {
      setIsGeneratingTicket(false);
    }
  };

  if (!isOpen) return null;

  const getBadgeEstado = (estado) => {
    const badges = {
      cotizacion: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      apartado: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      completada: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      cancelada: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
      devolucion_parcial: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      devolucion_total: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    };
    return badges[estado] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  const getBadgeEstadoPago = (estadoPago) => {
    const badges = {
      pendiente: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      pagado: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      parcial: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      cancelado: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    };
    return badges[estadoPago] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
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
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 dark:bg-primary-900/40 p-3 rounded-lg">
              <Receipt className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detalle de Venta</h2>
              {venta && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Folio: <span className="font-semibold text-gray-900 dark:text-gray-100">{venta.folio}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando detalle de venta...</p>
          </div>
        ) : !venta ? (
          <div className="py-8 text-center text-red-600 dark:text-red-400">
            <p>No se pudo cargar la información de la venta</p>
          </div>
        ) : (
          <>
            {/* Información general */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fecha de Venta</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
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
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {venta.cliente_nombre || 'Venta directa (sin cliente)'}
                  </p>
                </div>
              </div>

              {/* Método de pago */}
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Método de Pago</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatearMetodoPago(venta.metodo_pago)}
                  </p>
                </div>
              </div>

              {/* Usuario que registró */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registrado por</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {venta.usuario_nombre || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Estados */}
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</p>
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
                <DollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Estado de Pago</p>
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
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                Items de la Venta
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Precio Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Descuento
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            <p className="font-medium">{item.producto_nombre}</p>
                            {item.producto_sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.producto_sku}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                          {item.cantidad}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                          ${parseFloat(item.precio_unitario || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100">
                          {item.descuento_monto > 0
                            ? `-$${parseFloat(item.descuento_monto || 0).toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                          ${parseFloat(item.subtotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${parseFloat(venta.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                {venta.descuento_monto > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Descuento {venta.descuento_porcentaje > 0 ? `(${venta.descuento_porcentaje}%)` : ''}:
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -${parseFloat(venta.descuento_monto || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {venta.impuestos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Impuestos:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      ${parseFloat(venta.impuestos || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${parseFloat(venta.total || 0).toFixed(2)}
                  </span>
                </div>
                {venta.monto_pagado > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Monto Pagado:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        ${parseFloat(venta.monto_pagado || 0).toFixed(2)}
                      </span>
                    </div>
                    {venta.monto_pendiente > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Monto Pendiente:</span>
                        <span className="font-medium text-orange-600 dark:text-orange-400">
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
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notas</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
                      {venta.notas}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error de ticket */}
        {ticketError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-600 dark:text-red-400">
            {ticketError}
          </div>
        )}

        {/* Footer con acciones */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Botones de ticket */}
          <div className="flex flex-wrap gap-2">
            {venta && venta.estado !== 'cancelada' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintTicket('80mm')}
                  disabled={isGeneratingTicket}
                  isLoading={isGeneratingTicket}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTicket('80mm')}
                  disabled={isGeneratingTicket}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar PDF
                </Button>
                <select
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleDownloadTicket(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={isGeneratingTicket}
                  defaultValue=""
                >
                  <option value="" disabled>Tamaño papel</option>
                  <option value="58mm">58mm (mini)</option>
                  <option value="80mm">80mm (estándar)</option>
                </select>
              </>
            )}
          </div>

          {/* Botón cerrar */}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
