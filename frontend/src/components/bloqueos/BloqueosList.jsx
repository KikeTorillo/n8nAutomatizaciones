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
} from 'lucide-react';
import {
  obtenerColorTipoBloqueo,
  obtenerLabelTipoBloqueo,
  formatearRangoBloqueo,
  calcularDiasBloqueo,
  esBloqueoDiaCompleto,
  esBloqueoOrganizacional,
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

  const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo);
  const IconoComponente = obtenerIconoComponente(bloqueo.tipo_bloqueo);
  const dias = calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
  const rangoFormateado = formatearRangoBloqueo(
    bloqueo.fecha_inicio,
    bloqueo.fecha_fin,
    bloqueo.hora_inicio,
    bloqueo.hora_fin
  );
  const esOrganizacional = esBloqueoOrganizacional(bloqueo);
  const esDiaCompleto = esBloqueoDiaCompleto(bloqueo);

  return (
    <div
      className={`bg-white rounded-lg border-l-4 ${colores.border} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Ícono */}
            <div className={`w-12 h-12 ${colores.badge} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <IconoComponente className="h-6 w-6 text-white" />
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{bloqueo.titulo}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-medium rounded ${colores.bg} ${colores.text}`}>
                  {obtenerLabelTipoBloqueo(bloqueo.tipo_bloqueo)}
                </span>
                {!bloqueo.activo && (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-gray-200 text-gray-700">
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Opciones"
            >
              <MoreVertical className="h-5 w-5 text-gray-600" />
            </button>

            {menuAbierto && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuAbierto(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onVer(bloqueo);
                      setMenuAbierto(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalles
                  </button>
                  <button
                    onClick={() => {
                      onEditar(bloqueo);
                      setMenuAbierto(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onEliminar(bloqueo);
                      setMenuAbierto(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
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
          <p className="text-sm text-gray-600 line-clamp-2">{bloqueo.descripcion}</p>
        )}

        {/* Información del rango */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-900 font-medium">{rangoFormateado}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {dias === 1 ? '1 día' : `${dias} días`}
              {!esDiaCompleto && ' • Horario parcial'}
            </p>
          </div>
        </div>

        {/* Profesional o Organizacional */}
        <div className="flex items-center gap-2 text-sm">
          {esOrganizacional ? (
            <>
              <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Bloqueo organizacional</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">
                {bloqueo.profesional?.nombre_completo || `Profesional #${bloqueo.profesional_id}`}
              </span>
            </>
          )}
        </div>

        {/* Impacto (si existe) */}
        {(bloqueo.citas_afectadas > 0 || bloqueo.ingresos_perdidos > 0) && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Impacto estimado:</span>
              <div className="flex items-center gap-3">
                {bloqueo.citas_afectadas > 0 && (
                  <span className="text-gray-700">
                    {bloqueo.citas_afectadas} citas
                  </span>
                )}
                {bloqueo.ingresos_perdidos > 0 && (
                  <span className="text-red-600 font-medium">
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
function BloqueosList({ bloqueos, isLoading, onVer, onEditar, onEliminar }) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!bloqueos || bloqueos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay bloqueos registrados</h3>
        <p className="text-gray-500 mb-6">Comienza creando un bloqueo de horario</p>
      </div>
    );
  }

  // Lista de cards
  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
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

BloqueosList.defaultProps = {
  bloqueos: [],
  isLoading: false,
};

export default BloqueosList;
