import { History, ArrowRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useHistorialConfiguracion } from '@/hooks/useComisiones';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Modal para ver historial de cambios en configuración de comisión
 *
 * @param {boolean} isOpen - Estado del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {number} profesionalId - ID del profesional
 * @param {number|null} servicioId - ID del servicio (null para global)
 */
function HistorialCambiosModal({
  isOpen,
  onClose,
  profesionalId,
  servicioId = null,
}) {
  const { data: historial, isLoading } = useHistorialConfiguracion({
    profesional_id: profesionalId,
    servicio_id: servicioId || undefined,
  });

  // Formatear valor de comisión para display
  const formatearValor = (tipo, valor) => {
    if (!valor) return '-';
    return tipo === 'porcentaje' ? `${parseFloat(valor)}%` : formatCurrency(parseFloat(valor));
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    try {
      return format(new Date(fecha), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
    } catch (error) {
      return fecha;
    }
  };

  // Mapear acción a texto en español
  const obtenerAccionTexto = (accion) => {
    const acciones = {
      'INSERT': 'Creación',
      'UPDATE': 'Actualización',
      'DELETE': 'Eliminación',
    };
    return acciones[accion] || accion;
  };

  // Mapear acción a color
  const obtenerAccionColor = (accion) => {
    const colores = {
      'INSERT': 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      'UPDATE': 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300',
      'DELETE': 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    };
    return colores[accion] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Cambios"
      icon={History}
      size="lg"
    >
      <div className="space-y-4">
        {/* Info del filtro */}
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <p className="text-sm text-primary-800 dark:text-primary-300">
            {servicioId
              ? 'Mostrando historial de configuración para servicio específico'
              : 'Mostrando historial de configuración global (todos los servicios)'}
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando historial...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!historial || historial.length === 0) && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Sin historial
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No se encontraron cambios en esta configuración
            </p>
          </div>
        )}

        {/* Timeline de cambios */}
        {!isLoading && historial && historial.length > 0 && (
          <div className="flow-root">
            <ul className="-mb-8">
              {historial.map((cambio, idx) => (
                <li key={cambio.id}>
                  <div className="relative pb-8">
                    {/* Línea vertical */}
                    {idx !== historial.length - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}

                    <div className="relative flex items-start space-x-3">
                      {/* Icono */}
                      <div>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                          cambio.accion === 'INSERT' ? 'bg-green-500' :
                          cambio.accion === 'UPDATE' ? 'bg-primary-500' :
                          'bg-red-500'
                        }`}>
                          <History className="w-5 h-5 text-white" />
                        </div>
                      </div>

                      {/* Contenido */}
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              obtenerAccionColor(cambio.accion)
                            }`}>
                              {obtenerAccionTexto(cambio.accion)}
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatearFecha(cambio.modificado_en)}
                            </p>
                          </div>

                          {/* Usuario */}
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Por: <span className="font-medium text-gray-900 dark:text-gray-100">
                              {cambio.modificado_por_nombre || 'Sistema'}
                            </span>
                          </p>

                          {/* Cambios */}
                          {cambio.accion !== 'DELETE' && (
                            <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                              <div className="grid grid-cols-1 gap-3">
                                {/* Tipo de comisión */}
                                {cambio.tipo_comision_anterior !== cambio.tipo_comision_nuevo && (
                                  <div className="flex items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 w-24">Tipo:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {cambio.tipo_comision_anterior === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                                        {cambio.tipo_comision_nuevo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Valor de comisión */}
                                {cambio.valor_comision_anterior !== cambio.valor_comision_nuevo && (
                                  <div className="flex items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 w-24">Valor:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {formatearValor(cambio.tipo_comision_anterior, cambio.valor_comision_anterior)}
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                                        {formatearValor(cambio.tipo_comision_nuevo, cambio.valor_comision_nuevo)}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* Estado */}
                                {cambio.activo_anterior !== cambio.activo_nuevo && (
                                  <div className="flex items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400 w-24">Estado:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-700 dark:text-gray-300">
                                        {cambio.activo_anterior ? 'Activa' : 'Inactiva'}
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                                        {cambio.activo_nuevo ? 'Activa' : 'Inactiva'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Razón del cambio */}
                              {cambio.razon && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Razón:</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{cambio.razon}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mensaje de eliminación */}
                          {cambio.accion === 'DELETE' && (
                            <div className="mt-3 bg-red-50 dark:bg-red-900/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                              <p className="text-sm text-red-800 dark:text-red-300">
                                Configuración eliminada
                              </p>
                              {cambio.razon && (
                                <div className="mt-2">
                                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Razón:</p>
                                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{cambio.razon}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Total de registros */}
        {!isLoading && historial && historial.length > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Total de cambios: <span className="font-medium text-gray-900 dark:text-gray-100">{historial.length}</span>
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default HistorialCambiosModal;
