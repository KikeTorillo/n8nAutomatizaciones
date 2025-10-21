import PropTypes from 'prop-types';
import {
  Calendar,
  Clock,
  User,
  Building,
  Info,
  TrendingDown,
  AlertCircle,
  Edit,
  Trash2,
  Lock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatearFecha, formatearFechaHora } from '@/utils/dateHelpers';
import {
  obtenerColorTipoBloqueo,
  obtenerLabelTipoBloqueo,
  calcularDiasBloqueo,
  esBloqueoDiaCompleto,
  esBloqueoOrganizacional,
  formatearRangoBloqueo,
} from '@/utils/bloqueoHelpers';
import { formatCurrency } from '@/lib/utils';

/**
 * Modal de detalles de un bloqueo (readonly)
 * Muestra toda la información del bloqueo con opciones de editar/eliminar
 */
function BloqueoDetailModal({ isOpen, onClose, bloqueo, onEditar, onEliminar }) {
  if (!bloqueo) return null;

  const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
  const diasBloqueo = calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
  const rangoFormateado = formatearRangoBloqueo(
    bloqueo.fecha_inicio,
    bloqueo.fecha_fin,
    bloqueo.hora_inicio,
    bloqueo.hora_fin
  );
  const esOrganizacional = esBloqueoOrganizacional(bloqueo);
  const esDiaCompleto = esBloqueoDiaCompleto(bloqueo);

  const handleEditar = () => {
    onEditar(bloqueo);
    onClose();
  };

  const handleEliminar = () => {
    onEliminar(bloqueo);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles del Bloqueo" size="lg">
      <div className="space-y-6">
        {/* Header con título y tipo */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 ${colores.badge} rounded-lg flex items-center justify-center`}>
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{bloqueo.titulo}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{rangoFormateado}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colores.bg} ${colores.text}`}>
              {obtenerLabelTipoBloqueo(bloqueo.tipo_bloqueo_codigo)}
            </span>
            {bloqueo.activo ? (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                <XCircle className="w-3 h-3 mr-1" />
                Inactivo
              </span>
            )}
          </div>
        </div>

        {/* Descripción */}
        {bloqueo.descripcion && (
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
            <div className="flex items-center mb-2">
              <Info className="w-4 h-4 text-primary-600 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900">Descripción</h4>
            </div>
            <p className="text-sm text-gray-700">{bloqueo.descripcion}</p>
          </div>
        )}

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fechas y Duración */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900">Fechas y Duración</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha inicio:</span>
                <span className="font-medium text-gray-900">
                  {formatearFecha(bloqueo.fecha_inicio, 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha fin:</span>
                <span className="font-medium text-gray-900">
                  {formatearFecha(bloqueo.fecha_fin, 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Duración:</span>
                <span className="font-semibold text-primary-600">
                  {diasBloqueo} {diasBloqueo === 1 ? 'día' : 'días'}
                </span>
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 text-primary-600 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900">Horarios</h4>
            </div>
            {esDiaCompleto ? (
              <div className="flex items-center justify-center h-20 text-gray-500">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm font-medium">Día completo</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hora inicio:</span>
                  <span className="font-medium text-gray-900">
                    {bloqueo.hora_inicio?.substring(0, 5) || '--:--'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hora fin:</span>
                  <span className="font-medium text-gray-900">
                    {bloqueo.hora_fin?.substring(0, 5) || '--:--'}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium text-orange-600">Horario parcial</span>
                </div>
              </div>
            )}
          </div>

          {/* Alcance */}
          <div className={`rounded-lg p-4 ${esOrganizacional ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-center mb-3">
              {esOrganizacional ? (
                <Building className="w-5 h-5 text-red-600 mr-2" />
              ) : (
                <User className="w-5 h-5 text-blue-600 mr-2" />
              )}
              <h4 className="text-sm font-semibold text-gray-900">Alcance</h4>
            </div>
            {esOrganizacional ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <Lock className="w-4 h-4" />
                  Bloqueo Organizacional
                </div>
                <p className="text-xs text-red-700">
                  Este bloqueo afecta a <strong>toda la organización</strong> y todos los profesionales.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profesional:</span>
                  <span className="font-medium text-gray-900">
                    {bloqueo.profesional?.nombre_completo ||
                     `Profesional #${bloqueo.profesional_id}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Impacto */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center mb-3">
              <TrendingDown className="w-5 h-5 text-amber-600 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900">Impacto Estimado</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Citas afectadas:</span>
                <span className="font-semibold text-gray-900">
                  {bloqueo.citas_afectadas || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ingresos perdidos:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(bloqueo.ingresos_perdidos || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-amber-300">
                <span className="text-gray-600">Días laborales:</span>
                <span className="font-semibold text-amber-700">{diasBloqueo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline visual */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200">
          <div className="flex items-center mb-3">
            <Calendar className="w-5 h-5 text-primary-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900">Línea de Tiempo</h4>
          </div>
          <div className="relative">
            {/* Barra de progreso */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">
                {formatearFecha(bloqueo.fecha_inicio, 'dd MMM')}
              </div>
              <div className="text-xs font-medium text-primary-600">
                {diasBloqueo} {diasBloqueo === 1 ? 'día' : 'días'}
              </div>
              <div className="text-xs text-gray-600">
                {formatearFecha(bloqueo.fecha_fin, 'dd MMM yyyy')}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${colores.badge}`}
                style={{ width: '100%' }}
              ></div>
            </div>
            {/* Indicadores de tipo */}
            <div className="flex items-center justify-center mt-3 gap-2 text-xs text-gray-600">
              {esDiaCompleto ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  Día completo
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-600" />
                  Horario parcial
                </span>
              )}
              {esOrganizacional && (
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-red-600" />
                  Organizacional
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Advertencia si hay citas afectadas */}
        {bloqueo.citas_afectadas > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ Atención: Citas afectadas</p>
                <p>
                  Este bloqueo actualmente afecta <strong>{bloqueo.citas_afectadas} citas</strong>.
                  Si modificas o eliminas este bloqueo, puede tener impacto en estas reservas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Creado:</span>
            <span>{formatearFechaHora(bloqueo.created_at, '00:00:00', 'dd/MM/yyyy HH:mm')}</span>
          </div>
          {bloqueo.updated_at && bloqueo.updated_at !== bloqueo.created_at && (
            <div className="flex justify-between">
              <span>Última actualización:</span>
              <span>
                {formatearFechaHora(bloqueo.updated_at, '00:00:00', 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={handleEliminar}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
            <Button
              onClick={handleEditar}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

BloqueoDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bloqueo: PropTypes.object,
  onEditar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
};

export default BloqueoDetailModal;
