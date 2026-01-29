/**
 * BloqueosDiaDrawer - Drawer móvil para ver bloqueos de un día
 * Basado en CitasDiaDrawer.jsx
 * Ene 2026: Unificación de vista móvil
 */
import { memo } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Building, User, Clock, Plus } from 'lucide-react';
import { Drawer, Button } from '@/components/ui';
import { obtenerColorTipoBloqueo, esBloqueoDiaCompleto, LABELS_TIPO_BLOQUEO } from '@/utils/bloqueoHelpers';

/**
 * Drawer para mostrar los bloqueos de un día (vista móvil)
 */
const BloqueosDiaDrawer = memo(function BloqueosDiaDrawer({
  isOpen,
  onClose,
  fecha,
  bloqueos = [],
  onVerBloqueo,
  onCrearBloqueo,
}) {
  if (!fecha) return null;

  const fechaFormateada = format(new Date(fecha), "EEEE d 'de' MMMM", { locale: es });
  const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={fechaCapitalizada}
      subtitle={`${bloqueos.length} bloqueo${bloqueos.length !== 1 ? 's' : ''}`}
      size="lg"
      footer={
        onCrearBloqueo && (
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              onCrearBloqueo(fecha);
            }}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear bloqueo
          </Button>
        )
      }
    >
      {bloqueos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Sin bloqueos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay bloqueos programados para este día.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bloqueos.map((bloqueo) => {
            const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
            const esDiaCompleto = esBloqueoDiaCompleto(bloqueo);
            const esOrganizacional = !bloqueo.profesional_id;
            const tipoLabel = LABELS_TIPO_BLOQUEO[bloqueo.tipo_bloqueo_codigo] || bloqueo.tipo_bloqueo_codigo;

            return (
              <button
                key={bloqueo.id}
                onClick={() => {
                  onClose();
                  onVerBloqueo && onVerBloqueo(bloqueo);
                }}
                className="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
              >
                {/* Header con título y tipo */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Icono de tipo */}
                    <div className={`w-8 h-8 rounded-full ${colores.bg} flex items-center justify-center`}>
                      {esOrganizacional ? (
                        <Building className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
                      {bloqueo.titulo}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${colores.bg} text-white`}
                  >
                    {tipoLabel}
                  </span>
                </div>

                {/* Horario si es parcial */}
                {!esDiaCompleto && bloqueo.hora_inicio && (
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {bloqueo.hora_inicio.slice(0, 5)}
                      {bloqueo.hora_fin && ` - ${bloqueo.hora_fin.slice(0, 5)}`}
                    </span>
                  </div>
                )}

                {/* Info adicional */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {esOrganizacional ? 'Afecta a todos' : bloqueo.profesional_nombre || 'Individual'}
                  </span>
                  {!esDiaCompleto && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Parcial
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Drawer>
  );
});

BloqueosDiaDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fecha: PropTypes.string,
  bloqueos: PropTypes.array,
  onVerBloqueo: PropTypes.func,
  onCrearBloqueo: PropTypes.func,
};

export default BloqueosDiaDrawer;
