/**
 * MiEquipoAusenciasTab - Solicitudes del equipo para supervisores
 * Muestra solicitudes de vacaciones + incapacidades activas juntos
 * Enero 2026
 */
import { RefreshCw, HeartPulse, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button, EmptyState } from '@/components/ui';
import { SolicitudesEquipoSection } from '@/components/vacaciones';
import { useIncapacidades } from '@/hooks/personas';
import { formatRangoFechas, calcularDiasRestantes } from '@/hooks/personas';

/**
 * Card de incapacidad del equipo
 */
function IncapacidadEquipoCard({ incapacidad }) {
  const diasRestantes = calcularDiasRestantes(incapacidad.fecha_fin);

  const tipoConfig = {
    enfermedad_general: { label: 'Enfermedad General', variant: 'error' },
    maternidad: { label: 'Maternidad', variant: 'info' },
    riesgo_trabajo: { label: 'Riesgo de Trabajo', variant: 'warning' },
  }[incapacidad.tipo_incapacidad] || { label: 'Incapacidad', variant: 'default' };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {incapacidad.profesional_nombre}
            </span>
            <Badge variant={tipoConfig.variant} size="sm">
              {tipoConfig.label}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatRangoFechas(incapacidad.fecha_inicio, incapacidad.fecha_fin)}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Folio: {incapacidad.folio_imss}
          </p>
        </div>

        <div className="text-right">
          <Badge
            variant={diasRestantes <= 3 ? 'error' : diasRestantes <= 7 ? 'warning' : 'success'}
          >
            {diasRestantes} días restantes
          </Badge>
        </div>
      </div>
    </div>
  );
}

/**
 * Sección de incapacidades activas del equipo
 */
function IncapacidadesEquipoSection() {
  const { data: incapacidadesData, isLoading } = useIncapacidades({
    estado: 'activa',
    limite: 50,
  });

  const incapacidadesActivas = incapacidadesData?.data || [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Profesionales actualmente con incapacidad médica
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg h-20 animate-pulse"
            />
          ))}
        </div>
      ) : incapacidadesActivas.length === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title="Sin incapacidades activas"
          description="No hay profesionales con incapacidad activa en este momento"
          size="sm"
        />
      ) : (
        <div className="space-y-3">
          {incapacidadesActivas.map((inc) => (
            <IncapacidadEquipoCard key={inc.id} incapacidad={inc} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Tab de Mi Equipo
 * Muestra solicitudes de vacaciones + incapacidades activas en una sola vista
 */
function MiEquipoAusenciasTab() {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones'], refetchType: 'active' });
    queryClient.invalidateQueries({ queryKey: ['incapacidades'], refetchType: 'active' });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mi Equipo
          </h2>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Sección: Solicitudes de Vacaciones Pendientes */}
      <section className="space-y-4">
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
          Solicitudes Pendientes
        </h3>
        <SolicitudesEquipoSection />
      </section>

      {/* Sección: Incapacidades Activas */}
      <section className="space-y-4">
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-red-500" />
          Incapacidades Activas
        </h3>
        <IncapacidadesEquipoSection />
      </section>
    </div>
  );
}

export default MiEquipoAusenciasTab;
