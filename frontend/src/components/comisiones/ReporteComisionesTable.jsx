import { useState } from 'react';
import { DollarSign, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MarcarComoPagadaModal from './MarcarComoPagadaModal';

/**
 * Tabla de comisiones para reportes
 *
 * @param {Array} comisiones - Lista de comisiones
 * @param {boolean} isLoading - Estado de carga
 * @param {Object} resumen - Resumen de totales
 * @param {function} onVerDetalle - Callback para ver detalle de comisión
 */
function ReporteComisionesTable({
  comisiones,
  isLoading,
  resumen,
  onVerDetalle,
}) {
  const [pagarModalOpen, setPagarModalOpen] = useState(false);
  const [selectedComision, setSelectedComision] = useState(null);

  const handleMarcarPagada = (comision) => {
    setSelectedComision(comision);
    setPagarModalOpen(true);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    try {
      return format(new Date(fecha), "d 'de' MMMM", { locale: es });
    } catch (error) {
      return fecha;
    }
  };

  // Mapear estado a badge
  const getEstadoBadge = (estado) => {
    const estados = {
      'pendiente': {
        label: 'Pendiente',
        icon: Clock,
        className: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      },
      'pagada': {
        label: 'Pagada',
        icon: CheckCircle,
        className: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      },
      'cancelada': {
        label: 'Cancelada',
        icon: XCircle,
        className: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
      },
    };

    const config = estados[estado] || estados['pendiente'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando comisiones...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!comisiones || comisiones.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No se encontraron comisiones
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Intenta ajustar los filtros o el rango de fechas
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Resumen */}
        {resumen && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(parseFloat(resumen.total || 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {formatCurrency(parseFloat(resumen.total_pendientes || 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pagadas</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(parseFloat(resumen.total_pagadas || 0))}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha Cita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profesional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código Cita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Monto Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {comisiones.map((comision) => {
                const montoComision = parseFloat(comision.monto_comision);
                const montoBase = parseFloat(comision.monto_base);

                return (
                  <tr
                    key={comision.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {/* Fecha */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatearFecha(comision.fecha_cita)}
                      </div>
                    </td>

                    {/* Profesional */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {comision.profesional_nombre} {comision.profesional_apellidos}
                      </div>
                    </td>

                    {/* Código Cita */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {comision.codigo_cita}
                      </div>
                    </td>

                    {/* Monto Base */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(montoBase)}
                      </div>
                    </td>

                    {/* Comisión */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(montoComision)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {comision.tipo_comision === 'porcentaje'
                          ? `${parseFloat(comision.valor_comision)}%`
                          : 'Monto fijo'}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(comision.estado_pago)}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVerDetalle?.(comision)}
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {comision.estado_pago === 'pendiente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarcarPagada(comision)}
                          title="Marcar como pagada"
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total de registros */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Total de comisiones: <span className="font-medium text-gray-900 dark:text-gray-100">{comisiones.length}</span>
          </p>
        </div>
      </div>

      {/* Modal Marcar como Pagada */}
      {selectedComision && (
        <MarcarComoPagadaModal
          isOpen={pagarModalOpen}
          onClose={() => {
            setPagarModalOpen(false);
            setSelectedComision(null);
          }}
          comision={selectedComision}
        />
      )}
    </>
  );
}

export default ReporteComisionesTable;
