import { useState } from 'react';
import { BackButton, Button, Modal } from '@/components/ui';
import ReportesComisionesFiltros from '@/components/comisiones/ReportesComisionesFiltros';
import ReporteComisionesTable from '@/components/comisiones/ReporteComisionesTable';
import ExportButtons from '@/components/comisiones/ExportButtons';
import { useComisionesPorPeriodo } from '@/hooks/otros';
import { useModalManager } from '@/hooks/utils';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * Página de reportes y exportación de comisiones
 * Permite filtrar, visualizar y exportar comisiones
 */
function ReportesComisionesPage() {
  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    detalle: { isOpen: false, data: null },
  });

  // Filtros iniciales (mes actual)
  const hoy = new Date();
  const [filtros, setFiltros] = useState({
    fecha_desde: format(startOfMonth(hoy), 'yyyy-MM-dd'),
    fecha_hasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
    profesional_id: '',
    estado_pago: '',
    origen: '',
  });

  // Estado de búsqueda aplicada
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  // Fetch data con filtros aplicados
  const { data, isLoading } = useComisionesPorPeriodo({
    fecha_desde: filtrosAplicados.fecha_desde,
    fecha_hasta: filtrosAplicados.fecha_hasta,
    profesional_id: filtrosAplicados.profesional_id || undefined,
    estado_pago: filtrosAplicados.estado_pago || undefined,
    origen: filtrosAplicados.origen || undefined,
  });

  const comisiones = data?.comisiones || [];
  const resumen = data?.resumen || {};

  // Handlers
  const handleBuscar = () => {
    if (!filtros.fecha_desde || !filtros.fecha_hasta) {
      return;
    }
    setFiltrosAplicados(filtros);
  };

  const handleLimpiar = () => {
    const filtrosDefault = {
      fecha_desde: format(startOfMonth(hoy), 'yyyy-MM-dd'),
      fecha_hasta: format(endOfMonth(hoy), 'yyyy-MM-dd'),
      profesional_id: '',
      estado_pago: '',
      origen: '',
    };
    setFiltros(filtrosDefault);
    setFiltrosAplicados(filtrosDefault);
  };

  const handleVerDetalle = (comision) => {
    openModal('detalle', comision);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/comisiones" label="Volver a Comisiones" className="mb-2" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Reportes de Comisiones
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
                Consulta, filtra y exporta comisiones por período
              </p>
            </div>

            {/* Botones de Exportación */}
            {comisiones.length > 0 && (
              <ExportButtons
                comisiones={comisiones}
                filtros={filtrosAplicados}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <ReportesComisionesFiltros
            filtros={filtros}
            onChange={setFiltros}
            onLimpiar={handleLimpiar}
            onBuscar={handleBuscar}
          />
        </div>

        {/* Tabla de Resultados */}
        <ReporteComisionesTable
          comisiones={comisiones}
          isLoading={isLoading}
          resumen={resumen}
          onVerDetalle={handleVerDetalle}
        />

        {/* Información adicional */}
        {comisiones.length > 0 && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-2">
              Formatos de Exportación
            </h4>
            <ul className="text-sm text-green-800 dark:text-green-300 space-y-1 list-disc list-inside">
              <li>
                <strong>CSV:</strong> Compatible con Excel, Numbers y Google Sheets
              </li>
              <li>
                <strong>JSON:</strong> Formato estructurado para integración con otros sistemas (PDF próximamente)
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      <Modal
        isOpen={isOpen('detalle')}
        onClose={() => closeModal('detalle')}
        title="Detalle de Comisión"
        size="lg"
      >
        {getModalData('detalle') && (
          <div className="space-y-4">
            {/* Info General */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Profesional</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {getModalData('detalle').profesional_nombre} {getModalData('detalle').profesional_apellidos}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Código Cita</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 font-mono">{getModalData('detalle').codigo_cita}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Cita</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(getModalData('detalle').fecha_cita), 'dd/MM/yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Estado Pago</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{getModalData('detalle').estado_pago}</p>
              </div>
            </div>

            {/* Detalle de Servicios (JSONB) */}
            {getModalData('detalle').detalle_servicios && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Detalle de Servicios</h4>
                <div className="space-y-2">
                  {getModalData('detalle').detalle_servicios.map((servicio, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{servicio.nombre}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {servicio.tipo_comision === 'porcentaje'
                              ? `${parseFloat(servicio.valor_comision)}%`
                              : 'Monto Fijo'}{' '}
                            - Base: {formatCurrency(parseFloat(servicio.precio))}
                          </p>
                        </div>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(parseFloat(servicio.comision_calculada))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totales */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-600 dark:text-gray-400">Monto Base:</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(parseFloat(getModalData('detalle').monto_base))}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Comisión Total:</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(parseFloat(getModalData('detalle').monto_comision))}
                </p>
              </div>
            </div>

            {/* Datos de Pago */}
            {getModalData('detalle').estado_pago === 'pagada' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">Información de Pago</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {getModalData('detalle').fecha_pago && (
                    <div>
                      <p className="text-green-700 dark:text-green-400">Fecha Pago:</p>
                      <p className="font-medium text-green-900 dark:text-green-300">
                        {format(new Date(getModalData('detalle').fecha_pago), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                  {getModalData('detalle').metodo_pago && (
                    <div>
                      <p className="text-green-700 dark:text-green-400">Método:</p>
                      <p className="font-medium text-green-900 dark:text-green-300">{getModalData('detalle').metodo_pago}</p>
                    </div>
                  )}
                  {getModalData('detalle').referencia_pago && (
                    <div className="col-span-2">
                      <p className="text-green-700 dark:text-green-400">Referencia:</p>
                      <p className="font-medium text-green-900 dark:text-green-300 font-mono">
                        {getModalData('detalle').referencia_pago}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ReportesComisionesPage;
