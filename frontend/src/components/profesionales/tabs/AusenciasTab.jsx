import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Palmtree,
  Clock,
  CalendarDays,
  ExternalLink,
  CheckCircle,
  Info,
  HeartPulse,
  AlertTriangle,
} from 'lucide-react';
import PropTypes from 'prop-types';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useAuthStore from '@/store/authStore';
import { useBloqueos } from '@/hooks/useBloqueos';
import { useSaldosVacaciones } from '@/hooks/useVacaciones';
import {
  useIncapacidadesActivasProfesional,
  getTipoIncapacidadConfig,
  formatDiasIncapacidad,
} from '@/hooks/useIncapacidades';
import {
  obtenerColorTipoBloqueo,
  obtenerLabelTipoBloqueo,
  formatearRangoBloqueo,
  calcularDiasBloqueo,
} from '@/utils/bloqueoHelpers';
import { format, parseISO, differenceInDays, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Tab de Ausencias para vista de detalle de Profesional
 *
 * Muestra:
 * - Widget de saldo de vacaciones
 * - Próximas ausencias/bloqueos
 * - Historial de ausencias
 * - Enlaces rápidos a Vacaciones y Disponibilidad
 */
function AusenciasTab({ profesional }) {
  const profesionalId = profesional?.id;
  const user = useAuthStore((state) => state.user);

  // Verificar si el usuario está viendo su propio perfil
  const esPropioPerfil = user?.profesional_id === profesionalId;

  // Fetch bloqueos del profesional
  const { data: bloqueosData, isLoading: isLoadingBloqueos } = useBloqueos({
    profesional_id: profesionalId,
    limite: 50,
  }, {
    enabled: !!profesionalId,
  });

  // Fetch saldo de vacaciones del profesional
  const { data: saldosData, isLoading: isLoadingSaldo } = useSaldosVacaciones({
    profesional_id: profesionalId,
  }, {
    enabled: !!profesionalId,
  });

  // Fetch incapacidades activas del profesional
  const { data: incapacidadesData, isLoading: isLoadingIncapacidades } = useIncapacidadesActivasProfesional(
    profesionalId,
    { enabled: !!profesionalId }
  );

  const bloqueos = bloqueosData?.bloqueos || [];
  // Obtener el saldo del profesional (primer resultado)
  const saldo = saldosData?.saldos?.[0] || null;
  // Incapacidades activas
  const incapacidadesActivas = incapacidadesData || [];

  // Separar bloqueos próximos vs pasados
  const { proximos, pasados } = useMemo(() => {
    const hoy = new Date();
    const prox = [];
    const past = [];

    bloqueos.forEach(bloqueo => {
      const fechaFin = parseISO(bloqueo.fecha_fin.split('T')[0]);
      if (isFuture(fechaFin) || differenceInDays(fechaFin, hoy) >= 0) {
        prox.push(bloqueo);
      } else {
        past.push(bloqueo);
      }
    });

    // Ordenar próximos por fecha más cercana
    prox.sort((a, b) =>
      new Date(a.fecha_inicio) - new Date(b.fecha_inicio)
    );

    // Ordenar pasados por más reciente
    past.sort((a, b) =>
      new Date(b.fecha_inicio) - new Date(a.fecha_inicio)
    );

    return { proximos: prox, pasados: past.slice(0, 10) };
  }, [bloqueos]);

  const isLoading = isLoadingBloqueos || isLoadingSaldo || isLoadingIncapacidades;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerta de Incapacidad Activa */}
      {incapacidadesActivas.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
              <HeartPulse className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <h3 className="font-semibold text-rose-800 dark:text-rose-200">
                  Incapacidad Activa
                </h3>
              </div>
              {incapacidadesActivas.map((incapacidad) => {
                const tipoConfig = getTipoIncapacidadConfig(incapacidad.tipo_incapacidad);
                const fechaFin = parseISO(incapacidad.fecha_fin.split('T')[0]);
                const diasRestantes = Math.max(0, Math.ceil((fechaFin - new Date()) / (1000 * 60 * 60 * 24)));

                return (
                  <div key={incapacidad.id} className="mb-2 last:mb-0">
                    <p className="text-rose-700 dark:text-rose-300">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${tipoConfig.bgColor} ${tipoConfig.textColor}`}>
                        {tipoConfig.label}
                      </span>
                      <span className="font-medium">{incapacidad.codigo}</span>
                      {' - '}
                      Folio IMSS: {incapacidad.folio_imss}
                    </p>
                    <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                      {formatDiasIncapacidad(incapacidad.dias_autorizados)} autorizados
                      {' • '}
                      {diasRestantes > 0
                        ? `${diasRestantes} días restantes`
                        : 'Vencida - pendiente de cierre'}
                    </p>
                  </div>
                );
              })}
              <Link to="/ausencias?tab=incapacidades" className="inline-block mt-3">
                <Button variant="outline" size="sm" className="border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Incapacidades
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Widgets principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget Saldo de Vacaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Palmtree className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Vacaciones
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Saldo disponible
              </p>
            </div>
          </div>

          {saldo ? (
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {saldo.dias_disponibles}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400 mb-1">
                  días
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Usados</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {saldo.dias_usados} días
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">En trámite</p>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    {saldo.dias_en_tramite} días
                  </p>
                </div>
              </div>

              <Link to="/ausencias">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver vacaciones
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay saldo registrado
              </p>
            </div>
          )}
        </div>

        {/* Widget Próximas Ausencias */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <CalendarDays className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Próximas Ausencias
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bloqueos programados
              </p>
            </div>
          </div>

          {proximos.length > 0 ? (
            <div className="space-y-3">
              {proximos.slice(0, 3).map(bloqueo => {
                const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
                const dias = calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
                const fechaInicio = parseISO(bloqueo.fecha_inicio.split('T')[0]);

                return (
                  <div key={bloqueo.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${colores.badge}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {bloqueo.titulo}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(fechaInicio, "d 'de' MMMM", { locale: es })} • {dias} día{dias !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              {proximos.length > 3 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{proximos.length - 3} más
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sin ausencias programadas
              </p>
            </div>
          )}
        </div>

        {/* Widget Accesos Rápidos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Acciones Rápidas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestionar ausencias
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {esPropioPerfil && (
              <Link to="/ausencias" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Palmtree className="h-4 w-4 mr-2" />
                  Solicitar Vacaciones
                </Button>
              </Link>
            )}
            <Link to={`/bloqueos?profesional_id=${profesionalId}`} className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Ver Bloqueos
              </Button>
            </Link>
            <Link to={`/citas?profesional_id=${profesionalId}`} className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CalendarDays className="h-4 w-4 mr-2" />
                Ver Calendario
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 2: Lista de Bloqueos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Historial de Ausencias
          </h3>
        </div>

        {bloqueos.length === 0 ? (
          <div className="p-8 text-center">
            <Info className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay ausencias registradas para este profesional
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...proximos, ...pasados].slice(0, 15).map(bloqueo => {
              const colores = obtenerColorTipoBloqueo(bloqueo.tipo_bloqueo_codigo);
              const dias = calcularDiasBloqueo(bloqueo.fecha_inicio, bloqueo.fecha_fin);
              const rangoFormateado = formatearRangoBloqueo(
                bloqueo.fecha_inicio,
                bloqueo.fecha_fin,
                bloqueo.hora_inicio,
                bloqueo.hora_fin
              );
              const fechaFin = parseISO(bloqueo.fecha_fin.split('T')[0]);
              const esProximo = isFuture(fechaFin) || differenceInDays(fechaFin, new Date()) >= 0;

              return (
                <div
                  key={bloqueo.id}
                  className={`px-6 py-4 flex items-center justify-between ${!esProximo ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${colores.badge} rounded-lg flex items-center justify-center`}>
                      {bloqueo.tipo_bloqueo_codigo === 'vacaciones' ? (
                        <Palmtree className="h-6 w-6 text-white" />
                      ) : bloqueo.tipo_bloqueo_codigo === 'incapacidad' ? (
                        <HeartPulse className="h-6 w-6 text-white" />
                      ) : (
                        <Calendar className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {bloqueo.titulo}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {rangoFormateado}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${colores.bg} ${colores.text}`}>
                      {obtenerLabelTipoBloqueo(bloqueo.tipo_bloqueo_codigo)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dias} día{dias !== 1 ? 's' : ''}
                    </span>
                    {esProximo ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Próximo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Pasado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {bloqueos.length > 15 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link to="/bloqueos" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              Ver todos los bloqueos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

AusenciasTab.propTypes = {
  profesional: PropTypes.object.isRequired,
};

export default AusenciasTab;
