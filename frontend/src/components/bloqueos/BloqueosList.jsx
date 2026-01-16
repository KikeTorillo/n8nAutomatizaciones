import PropTypes from 'prop-types';
import {
  Calendar,
  Clock,
  User,
  Building,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Palmtree,
  Wrench,
  Star,
  AlertTriangle,
  Lock,
  Info,
} from 'lucide-react';
import { EmptyState } from '@/components/ui';
import {
  obtenerColorTipoBloqueo,
  obtenerLabelTipoBloqueo,
  formatearRangoBloqueo,
  calcularDiasBloqueo,
  esBloqueoDiaCompleto,
  esBloqueoOrganizacional,
  esBloqueoAutoGenerado,
  obtenerLabelOrigenBloqueo,
  obtenerColorOrigenBloqueo,
  obtenerMensajeBloqueoProtegido,
} from '@/utils/bloqueoHelpers';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

/**
 * Obtener componente de ícono según el tipo de bloqueo
 */
const obtenerIconoComponente = (tipo) => {
  const iconos = {
    vacaciones: Palmtree,
    feriado: Calendar,
    mantenimiento: Wrench,
    evento_especial: Star,
    emergencia: AlertTriangle,
    personal: User,
    organizacional: Building,
  };
  return iconos[tipo] || Calendar;
};

/**
 * BloqueoCard - Card individual de bloqueo
 */
function BloqueoCard({ bloqueo, onVer, onEditar, onEliminar }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
  const IconoComponente = obtenerIconoComponente(bloqueo.tipo_bloqueo_codigo);
  const dias = calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
  const rangoFormateado = formatearRangoBloqueo(
    bloqueo.fecha_inicio,
    bloqueo.fecha_fin,
    bloqueo.hora_inicio,
    bloqueo.hora_fin
  );
  const esOrganizacional = esBloqueoOrganizacional(bloqueo);
  const esDiaCompleto = esBloqueoDiaCompleto(bloqueo);
  const esAutoGenerado = esBloqueoAutoGenerado(bloqueo);
  const mensajeProtegido = obtenerMensajeBloqueoProtegido(bloqueo);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border-l-4 ${colores.border} shadow-sm hover:shadow-md transition-shadow duration-200 ${esAutoGenerado ? 'ring-1 ring-amber-200 dark:ring-amber-800' : ''}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Ícono */}
            <div className={`relative w-12 h-12 ${colores.badge} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <IconoComponente className="h-6 w-6 text-white" />
              {esAutoGenerado && (
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{bloqueo.titulo}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded ${colores.bg} ${colores.text}`}>
                  {obtenerLabelTipoBloqueo(bloqueo.tipo_bloqueo_codigo)}
                </span>
                {esAutoGenerado && (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${obtenerColorOrigenBloqueo(bloqueo.origen_bloqueo)}`}>
                    {obtenerLabelOrigenBloqueo(bloqueo.origen_bloqueo)}
                  </span>
                )}
                {!bloqueo.activo && (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menú de acciones */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Opciones"
            >
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  <button
                    onClick={() => {
                      onVer(bloqueo);
                      setMenuAbierto(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalles
                  </button>
                  {esAutoGenerado ? (
                    <>
                      <div className="w-full px-4 py-2 text-left text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Editar (protegido)
                      </div>
                      <div className="w-full px-4 py-2 text-left text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Eliminar (protegido)
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{mensajeProtegido}</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          onEditar(bloqueo);
                          setMenuAbierto(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          onEliminar(bloqueo);
                          setMenuAbierto(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Descripción */}
        {bloqueo.descripcion && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{bloqueo.descripcion}</p>
        )}

        {/* Información del rango */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{rangoFormateado}</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              {dias === 1 ? '1 día' : `${dias} días`}
              {!esDiaCompleto && ' • Horario parcial'}
            </p>
          </div>
        </div>

        {/* Profesional o Organizacional */}
        <div className="flex items-center gap-2 text-sm">
          {esOrganizacional ? (
            <>
              <Building className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-400">Bloqueo organizacional</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-400">
                {bloqueo.profesional?.nombre_completo || `Profesional #${bloqueo.profesional_id}`}
              </span>
            </>
          )}
        </div>

        {/* Impacto (si existe) */}
        {(bloqueo.citas_afectadas > 0 || bloqueo.ingresos_perdidos > 0) && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Impacto estimado:</span>
              <div className="flex items-center gap-3">
                {bloqueo.citas_afectadas > 0 && (
                  <span className="text-gray-700 dark:text-gray-300">
                    {bloqueo.citas_afectadas} citas
                  </span>
                )}
                {bloqueo.ingresos_perdidos > 0 && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(bloqueo.ingresos_perdidos)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

BloqueoCard.propTypes = {
  bloqueo: PropTypes.object.isRequired,
  onVer: PropTypes.func.isRequired,
  onEditar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
};

/**
 * BloqueosList - Lista de bloqueos con cards
 */
function BloqueosList({ bloqueos = [], isLoading = false, onVer, onEditar, onEliminar }) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!bloqueos || bloqueos.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No hay bloqueos registrados"
        description="Comienza creando un bloqueo de horario"
      />
    );
  }

  // Lista de cards
  return (
    <div>
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Mostrando {bloqueos.length} {bloqueos.length === 1 ? 'bloqueo' : 'bloqueos'}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bloqueos.map((bloqueo) => (
          <BloqueoCard
            key={bloqueo.id}
            bloqueo={bloqueo}
            onVer={onVer}
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
        ))}
      </div>
    </div>
  );
}

BloqueosList.propTypes = {
  bloqueos: PropTypes.array,
  isLoading: PropTypes.bool,
  onVer: PropTypes.func.isRequired,
  onEditar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired,
};

export default BloqueosList;
