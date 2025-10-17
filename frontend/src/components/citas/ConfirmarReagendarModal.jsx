import { Calendar, AlertTriangle, ArrowRight, User, Clock, Package } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatearFecha, formatearHora } from '@/utils/dateHelpers';

/**
 * Modal de confirmación para reagendar una cita mediante drag & drop
 */
function ConfirmarReagendarModal({
  isOpen,
  onClose,
  cita,
  fechaAnterior,
  fechaNueva,
  onConfirmar,
  isLoading,
  advertencias = [],
}) {
  if (!cita) return null;

  const tieneSolapamiento = advertencias.some((adv) => adv.tipo === 'solapamiento');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Reagendar Cita" size="large">
      <div className="space-y-6">
        {/* Header con ícono */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Confirmar Reagendar</h3>
            <p className="text-sm text-gray-600">
              Estás a punto de cambiar la fecha de esta cita
            </p>
          </div>
        </div>

        {/* Información de la cita */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 mb-1">Código de Cita</p>
              <p className="text-sm font-medium text-gray-900">{cita.codigo_cita}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" />
                Cliente
              </p>
              <p className="text-sm font-medium text-gray-900">
                {cita.cliente_nombre || 'Sin nombre'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Servicio
              </p>
              <p className="text-sm font-medium text-gray-900">
                {cita.servicio_nombre || 'Sin servicio'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duración
              </p>
              <p className="text-sm font-medium text-gray-900">{cita.duracion_minutos} minutos</p>
            </div>
          </div>
        </div>

        {/* Comparación de fechas */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-3">Cambio de fecha:</p>
          <div className="flex items-center gap-4">
            {/* Fecha anterior */}
            <div className="flex-1">
              <p className="text-xs text-blue-700 mb-1">Fecha Actual</p>
              <div className="bg-white rounded-md p-3 border border-blue-300">
                <p className="text-sm font-semibold text-gray-900">
                  {formatearFecha(fechaAnterior, 'dd/MM/yyyy')}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
                </p>
              </div>
            </div>

            {/* Flecha */}
            <div className="flex-shrink-0">
              <ArrowRight className="w-6 h-6 text-blue-600" />
            </div>

            {/* Fecha nueva */}
            <div className="flex-1">
              <p className="text-xs text-blue-700 mb-1">Fecha Nueva</p>
              <div className="bg-white rounded-md p-3 border border-blue-300">
                <p className="text-sm font-semibold text-green-600">
                  {formatearFecha(fechaNueva, 'dd/MM/yyyy')}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatearHora(cita.hora_inicio)} - {formatearHora(cita.hora_fin)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advertencias */}
        {advertencias.length > 0 && (
          <div
            className={`rounded-lg p-4 border ${
              tieneSolapamiento
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  tieneSolapamiento ? 'text-red-600' : 'text-yellow-600'
                }`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    tieneSolapamiento ? 'text-red-900' : 'text-yellow-900'
                  } mb-2`}
                >
                  {tieneSolapamiento
                    ? '⚠️ Conflicto de horario detectado'
                    : '⚠️ Advertencias'}
                </p>
                <ul className="space-y-1">
                  {advertencias.map((adv, index) => (
                    <li
                      key={index}
                      className={`text-sm ${
                        tieneSolapamiento ? 'text-red-800' : 'text-yellow-800'
                      }`}
                    >
                      • {adv.mensaje}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje informativo */}
        {!tieneSolapamiento && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              ✓ <strong>Sin conflictos:</strong> La cita se puede reagendar sin problemas
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirmar}
            isLoading={isLoading}
            disabled={isLoading || tieneSolapamiento}
            className={`${
              tieneSolapamiento
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? 'Reagendando...' : 'Confirmar Reagendar'}
          </Button>
        </div>

        {/* Nota sobre solapamiento */}
        {tieneSolapamiento && (
          <p className="text-xs text-red-600 text-center">
            No se puede reagendar la cita porque hay un conflicto de horarios. Por favor, elige
            otra fecha.
          </p>
        )}
      </div>
    </Modal>
  );
}

export default ConfirmarReagendarModal;
