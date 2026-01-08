/**
 * MisAusenciasTab - Dashboard personal de ausencias
 * Muestra saldo de vacaciones + incapacidades propias
 * Enero 2026
 */
import { useState } from 'react';
import { RefreshCw, Plus, Calendar, HeartPulse, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import {
  useDashboardAusencias,
  useMisAusencias,
  formatRangoFechas,
  calcularDiasRestantes,
  TIPOS_AUSENCIA_CONFIG,
  getTipoIncapacidadConfig,
} from '@/hooks/useAusencias';
import {
  SaldoVacacionesCard,
  SolicitudVacacionesModal,
} from '@/components/vacaciones';
import { formatDias, ESTADOS_SOLICITUD } from '@/hooks/useVacaciones';
import Badge from '@/components/ui/Badge';

/**
 * Card de incapacidad activa
 */
function IncapacidadActivaCard({ incapacidad }) {
  const diasRestantes = calcularDiasRestantes(incapacidad.fecha_fin);
  const tipoConfig = incapacidad.subTipoConfig;

  return (
    <div
      className={`
        p-4 rounded-lg border-l-4
        ${tipoConfig?.bgColor || 'bg-red-50 dark:bg-red-900/20'}
        ${tipoConfig?.color === 'red' ? 'border-red-500' : ''}
        ${tipoConfig?.color === 'pink' ? 'border-pink-500' : ''}
        ${tipoConfig?.color === 'orange' ? 'border-orange-500' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-4 h-4 text-red-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {tipoConfig?.label || 'Incapacidad'}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatRangoFechas(incapacidad.fecha_inicio, incapacidad.fecha_fin)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Folio IMSS: {incapacidad.folio_imss}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`
              text-lg font-bold
              ${diasRestantes <= 3 ? 'text-red-600 dark:text-red-400' : ''}
              ${diasRestantes > 3 && diasRestantes <= 7 ? 'text-amber-600 dark:text-amber-400' : ''}
              ${diasRestantes > 7 ? 'text-green-600 dark:text-green-400' : ''}
            `}
          >
            {diasRestantes} días
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">restantes</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Card de ausencia en lista
 */
function AusenciaCard({ ausencia, onVerDetalle }) {
  const esVacaciones = ausencia.tipo === 'vacaciones';
  const tipoConfig = ausencia.tipoConfig;
  const estadoConfig = ausencia.estadoConfig;

  const colorMap = {
    yellow: 'warning',
    green: 'success',
    red: 'error',
    gray: 'default',
  };

  return (
    <div
      onClick={() => onVerDetalle?.(ausencia)}
      className="
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        p-4 hover:shadow-md transition-shadow cursor-pointer
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Tipo y código */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${tipoConfig?.bgColor || 'bg-gray-100'}
                ${tipoConfig?.textColor || 'text-gray-700'}
              `}
            >
              {esVacaciones ? 'Vacaciones' : ausencia.subTipoConfig?.label || 'Incapacidad'}
            </span>
            <span className="text-xs text-gray-400">{ausencia.codigo}</span>
          </div>

          {/* Fechas */}
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatRangoFechas(ausencia.fechaInicio, ausencia.fechaFin)}
          </p>

          {/* Días */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDias(ausencia.dias)}
          </p>

          {/* Motivo (si existe) */}
          {ausencia.motivo && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
              {ausencia.motivo}
            </p>
          )}
        </div>

        {/* Estado */}
        <Badge variant={colorMap[estadoConfig?.color] || 'default'}>
          {estadoConfig?.label || ausencia.estado}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Tab principal de Mis Ausencias
 */
function MisAusenciasTab() {
  const queryClient = useQueryClient();
  const anioActual = new Date().getFullYear();

  const [modalVacaciones, setModalVacaciones] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState(null); // null = todos

  // Dashboard consolidado
  const { data: dashboard, isLoading, error, vacaciones } = useDashboardAusencias(anioActual);

  // Mis ausencias (lista)
  const { data: ausencias, isLoading: isLoadingAusencias } = useMisAusencias({
    anio: anioActual,
    tipo: filtroTipo,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones'] });
    queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
    queryClient.invalidateQueries({ queryKey: ['ausencias'] });
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span>Error al cargar datos: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mis Ausencias
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalVacaciones(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Solicitar Vacaciones
          </Button>
        </div>
      </div>

      {/* Saldo de vacaciones */}
      {dashboard && (
        <SaldoVacacionesCard
          saldo={dashboard.saldoVacaciones}
          nivel={dashboard.nivelVacaciones}
          isLoading={isLoading}
        />
      )}

      {/* Incapacidades activas */}
      {dashboard?.incapacidadesActivas?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-red-500" />
            Incapacidad Activa
          </h3>
          {dashboard.incapacidadesActivas.map((inc) => (
            <IncapacidadActivaCard
              key={inc.id}
              incapacidad={{
                ...inc,
                subTipoConfig: getTipoIncapacidadConfig(inc.tipo_incapacidad),
              }}
            />
          ))}
        </div>
      )}

      {/* Resumen del año */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {dashboard?.diasVacacionesDisponibles || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Días disponibles
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {dashboard?.diasVacacionesUsados || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Días usados
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {dashboard?.diasVacacionesEnTramite || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">En trámite</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {dashboard?.diasIncapacidadAnio || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Días incapacidad
          </p>
        </div>
      </div>

      {/* Filtros para historial */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setFiltroTipo(null)}
          className={`
            px-3 py-1.5 text-sm rounded-lg transition-colors
            ${!filtroTipo
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltroTipo('vacaciones')}
          className={`
            px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5
            ${filtroTipo === 'vacaciones'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <Calendar className="w-3.5 h-3.5" />
          Vacaciones
        </button>
        <button
          onClick={() => setFiltroTipo('incapacidad')}
          className={`
            px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5
            ${filtroTipo === 'incapacidad'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          Incapacidades
        </button>
      </div>

      {/* Lista de ausencias */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Historial {anioActual}
        </h3>

        {isLoadingAusencias ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg h-24 animate-pulse"
              />
            ))}
          </div>
        ) : ausencias?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay ausencias registradas este año</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ausencias?.map((ausencia) => (
              <AusenciaCard key={`${ausencia.tipo}-${ausencia.id}`} ausencia={ausencia} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de solicitud de vacaciones */}
      <SolicitudVacacionesModal
        isOpen={modalVacaciones}
        onClose={() => setModalVacaciones(false)}
      />
    </div>
  );
}

export default MisAusenciasTab;
