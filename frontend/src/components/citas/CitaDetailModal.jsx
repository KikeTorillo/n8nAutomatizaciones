import {
  X,
  Calendar,
  Clock,
  User,
  Briefcase,
  Package,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatearFecha, formatearHora, formatearFechaHora } from '@/utils/dateHelpers';
import {
  obtenerColorEstado,
  obtenerLabelEstado,
  obtenerAccionesDisponibles,
} from '@/utils/citaValidators';

/**
 * Modal de detalles de una cita (readonly)
 */
function CitaDetailModal({ isOpen, onClose, cita, onCambiarEstado, onEditar, onCancelar }) {
  if (!cita) return null;

  // Calcular precio total
  const precioTotal = (cita.precio_total || cita.precio_servicio || 0) - (cita.descuento || 0);

  // Obtener acciones disponibles según el estado
  const accionesDisponibles = obtenerAccionesDisponibles(cita.estado);

  const handleAccion = (accion) => {
    switch (accion) {
      case 'confirmar':
        onCambiarEstado(cita, 'confirmar');
        onClose();
        break;
      case 'iniciar':
        onCambiarEstado(cita, 'iniciar');
        onClose();
        break;
      case 'completar':
        onCambiarEstado(cita, 'completar');
        break;
      case 'no_show':
        onCambiarEstado(cita, 'no_show');
        break;
      case 'cancelar':
        onCancelar(cita);
        onClose();
        break;
      case 'editar':
        onEditar(cita);
        onClose();
        break;
      default:
        break;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles de la Cita" size="large">
      <div className="space-y-6">
        {/* Header con código y estado */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{cita.codigo_cita}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatearFechaHora(cita.fecha_cita, cita.hora_inicio, 'EEEE, dd MMMM yyyy')}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${obtenerColorEstado(cita.estado)}`}
          >
            {obtenerLabelEstado(cita.estado)}
          </span>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fecha y Hora */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fecha y Hora</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatearFecha(cita.fecha_cita, 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Hora inicio:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatearHora(cita.hora_inicio)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Hora fin:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatearHora(cita.hora_fin)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Duración:</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {cita.duracion_minutos} minutos
                </span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cliente</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {cita.cliente_nombre || 'Sin nombre'}
                </span>
              </div>
              {cita.cliente_telefono && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Teléfono:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{cita.cliente_telefono}</span>
                </div>
              )}
              {cita.cliente_email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{cita.cliente_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Profesional */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profesional</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: cita.profesional_color || '#6366f1' }}
                  >
                    {cita.profesional_nombre?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {cita.profesional_nombre || 'Sin asignar'}
                  </span>
                </div>
              </div>
              {cita.profesional_especialidad && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Especialidad:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {cita.profesional_especialidad}
                  </span>
                </div>
              )}
              {cita.profesional_tipo && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{cita.profesional_tipo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Servicios (soporte para múltiples) */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Package className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {cita.servicios && cita.servicios.length > 1 ? 'Servicios' : 'Servicio'}
                {cita.servicios && cita.servicios.length > 1 && (
                  <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                    {cita.servicios.length} servicios
                  </span>
                )}
              </h4>
            </div>
            <div className="space-y-3">
              {/* Si tiene array de servicios (nuevo formato) */}
              {cita.servicios && Array.isArray(cita.servicios) && cita.servicios.length > 0 ? (
                cita.servicios.map((servicio, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {servicio.servicio_nombre}
                      </span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                        #{servicio.orden_ejecucion || idx + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Precio:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                          ${parseFloat(servicio.precio_aplicado || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Duración:</span>
                        <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                          {servicio.duracion_minutos || 0} min
                        </span>
                      </div>
                    </div>
                    {servicio.descuento > 0 && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        Descuento: -${parseFloat(servicio.descuento).toLocaleString('es-CO')}
                      </div>
                    )}
                    {servicio.notas && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                        {servicio.notas}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                /* Backward compatibility: servicio único */
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Nombre:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cita.servicio_nombre || 'Sin servicio'}
                    </span>
                  </div>
                  {cita.servicio_categoria && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Categoría:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{cita.servicio_categoria}</span>
                    </div>
                  )}
                  {cita.servicio_descripcion && (
                    <div className="text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-gray-600 dark:text-gray-400">{cita.servicio_descripcion}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información de Pago */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center mb-3">
            <DollarSign className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Información de Pago</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Precio servicios:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                ${(cita.precio_total || cita.precio_servicio || 0).toLocaleString('es-CO')}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Duración total:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {cita.duracion_total_minutos || cita.duracion_minutos || 0} min
              </span>
            </div>
            {cita.descuento > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  -${cita.descuento?.toLocaleString('es-CO')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base pt-2 border-t border-primary-300 dark:border-primary-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Total a Pagar:</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                ${precioTotal.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {(cita.notas_cliente || cita.notas_profesional || cita.notas_internas) && (
          <div className="space-y-3">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notas</h4>
            </div>

            {cita.notas_cliente && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-primary-500">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notas del Cliente</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{cita.notas_cliente}</p>
              </div>
            )}

            {cita.notas_profesional && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-green-500">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notas del Profesional
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{cita.notas_profesional}</p>
              </div>
            )}

            {cita.notas_internas && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border-l-4 border-orange-500">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notas Internas</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{cita.notas_internas}</p>
              </div>
            )}
          </div>
        )}

        {/* Información de cancelación */}
        {cita.estado === 'cancelada' && cita.motivo_cancelacion && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center mb-2">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-300">Motivo de Cancelación</h4>
            </div>
            <p className="text-sm text-red-800 dark:text-red-300">{cita.motivo_cancelacion}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Creada:</span>
            <span>{formatearFechaHora(cita.created_at, '00:00:00', 'dd/MM/yyyy HH:mm')}</span>
          </div>
          {cita.updated_at && (
            <div className="flex justify-between">
              <span>Última actualización:</span>
              <span>
                {formatearFechaHora(cita.updated_at, '00:00:00', 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
          )}
        </div>

        {/* Acciones disponibles */}
        {accionesDisponibles.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            {accionesDisponibles.map((acc) => {
              const iconMap = {
                CheckCircle: CheckCircle,
                PlayCircle: PlayCircle,
                CheckCircle2: CheckCircle,
                XCircle: XCircle,
                AlertCircle: AlertCircle,
              };

              const Icon = iconMap[acc.icono] || CheckCircle;

              const colorMap = {
                green: 'bg-green-600 hover:bg-green-700 text-white',
                blue: 'bg-primary-600 hover:bg-primary-700 text-white',
                red: 'bg-red-600 hover:bg-red-700 text-white',
                orange: 'bg-orange-600 hover:bg-orange-700 text-white',
                gray: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
              };

              return (
                <button
                  key={acc.accion}
                  onClick={() => handleAccion(acc.accion)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${colorMap[acc.color] || colorMap.gray}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {acc.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Botón Cerrar */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CitaDetailModal;
