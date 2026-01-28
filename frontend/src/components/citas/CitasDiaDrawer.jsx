import { memo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Plus, Clock, User } from 'lucide-react';
import { Drawer, Button } from '@/components/ui';
import { formatearHora } from '@/utils/dateHelpers';

/**
 * Colores de estado para las citas
 */
const ESTADO_COLORS = {
  pendiente: 'bg-yellow-500',
  confirmada: 'bg-primary-500',
  en_curso: 'bg-secondary-500',
  completada: 'bg-green-500',
  cancelada: 'bg-red-500',
  no_show: 'bg-orange-500',
};

const ESTADO_LABELS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_show: 'No asistió',
};

/**
 * Drawer para mostrar las citas de un día específico (vista móvil)
 */
const CitasDiaDrawer = memo(function CitasDiaDrawer({
  isOpen,
  onClose,
  fecha,
  citas = [],
  onVerCita,
  onCrearCita,
}) {
  if (!fecha) return null;

  const fechaFormateada = format(new Date(fecha), "EEEE d 'de' MMMM", { locale: es });
  const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={fechaCapitalizada}
      subtitle={`${citas.length} cita${citas.length !== 1 ? 's' : ''} programada${citas.length !== 1 ? 's' : ''}`}
      size="lg"
      footer={
        <Button
          variant="primary"
          onClick={() => {
            onClose();
            onCrearCita && onCrearCita(fecha);
          }}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar cita
        </Button>
      }
    >
      {citas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Sin citas programadas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay citas para este día. Puedes agregar una nueva.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <button
              key={cita.id}
              onClick={() => {
                onClose();
                onVerCita && onVerCita(cita);
              }}
              className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
            >
              {/* Header con hora y estado */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatearHora(cita.hora_inicio)}
                    {cita.hora_fin && ` - ${formatearHora(cita.hora_fin)}`}
                  </span>
                </div>
                <span
                  className={`
                    px-2 py-1 rounded-full text-xs font-medium text-white
                    ${ESTADO_COLORS[cita.estado] || 'bg-gray-500'}
                  `}
                >
                  {ESTADO_LABELS[cita.estado] || cita.estado}
                </span>
              </div>

              {/* Cliente */}
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">
                  {cita.cliente_nombre || 'Sin cliente asignado'}
                </span>
              </div>

              {/* Servicios */}
              {cita.servicios && cita.servicios.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {cita.servicios.slice(0, 3).map((servicio, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      {servicio.nombre}
                    </span>
                  ))}
                  {cita.servicios.length > 3 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                      +{cita.servicios.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Profesional */}
              {cita.profesional_nombre && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Con: {cita.profesional_nombre}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </Drawer>
  );
});

export default CitasDiaDrawer;
