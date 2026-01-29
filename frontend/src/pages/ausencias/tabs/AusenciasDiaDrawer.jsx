/**
 * AusenciasDiaDrawer - Drawer móvil para ver ausencias de un día
 * Muestra vacaciones + incapacidades unificadas
 * Basado en CitasDiaDrawer.jsx
 * Ene 2026: Unificación de vista móvil
 */
import { memo } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, CalendarDays } from 'lucide-react';
import { Drawer, Badge } from '@/components/ui';

// Configuración de estados para badges
const ESTADO_VARIANT = {
  aprobada: 'success',
  pendiente: 'warning',
  rechazada: 'error',
  cancelada: 'default',
  activa: 'success',
  finalizada: 'default',
};

/**
 * Drawer para mostrar las ausencias de un día (vista móvil)
 */
const AusenciasDiaDrawer = memo(function AusenciasDiaDrawer({
  isOpen,
  onClose,
  fecha,
  eventos = [],
  onVerEvento,
}) {
  if (!fecha) return null;

  const fechaFormateada = format(new Date(fecha), "EEEE d 'de' MMMM", { locale: es });
  const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  // Ordenar: incapacidades primero
  const eventosOrdenados = [...eventos].sort((a, b) => {
    if (a.tipo === 'incapacidad' && b.tipo !== 'incapacidad') return -1;
    if (a.tipo !== 'incapacidad' && b.tipo === 'incapacidad') return 1;
    return 0;
  });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={fechaCapitalizada}
      subtitle={`${eventos.length} ausencia${eventos.length !== 1 ? 's' : ''}`}
      size="lg"
    >
      {eventos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Sin ausencias
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay ausencias programadas para este día.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventosOrdenados.map((evento) => {
            const esIncapacidad = evento.tipo === 'incapacidad';
            const esPendiente = evento.estado === 'pendiente';
            const fechaInicio = format(new Date(evento.fechaInicio), 'dd MMM', { locale: es });
            const fechaFin = format(new Date(evento.fechaFin), 'dd MMM', { locale: es });

            return (
              <button
                key={evento.id}
                onClick={() => {
                  onClose();
                  onVerEvento && onVerEvento(evento);
                }}
                className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
              >
                {/* Header con emoji/tipo y estado */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Emoji/Badge de tipo */}
                    <span
                      className={`
                        px-2 py-1 text-sm font-medium rounded
                        ${esIncapacidad
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }
                      `}
                    >
                      {esIncapacidad ? '🏥' : esPendiente ? '⏳' : '✅'}
                      {' '}
                      {esIncapacidad ? evento.subTipoConfig?.label || 'Incapacidad' : 'Vacaciones'}
                    </span>
                  </div>
                  <Badge variant={ESTADO_VARIANT[evento.estado] || 'default'}>
                    {evento.estadoConfig?.label || evento.estado}
                  </Badge>
                </div>

                {/* Nombre del profesional */}
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {evento.profesionalNombre}
                </p>

                {/* Departamento si existe */}
                {evento.departamentoNombre && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {evento.departamentoNombre}
                  </p>
                )}

                {/* Rango de fechas */}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {fechaInicio} - {fechaFin}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({evento.dias} día{evento.dias !== 1 ? 's' : ''})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Drawer>
  );
});

AusenciasDiaDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fecha: PropTypes.string,
  eventos: PropTypes.array,
  onVerEvento: PropTypes.func,
};

export default AusenciasDiaDrawer;
