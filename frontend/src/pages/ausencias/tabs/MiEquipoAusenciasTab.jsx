/**
 * MiEquipoAusenciasTab - Solicitudes del equipo para supervisores
 * Permite aprobar/rechazar vacaciones y ver incapacidades del equipo
 * Enero 2026
 */
import { useState } from 'react';
import { RefreshCw, HeartPulse, Calendar, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { SolicitudesEquipoSection } from '@/components/vacaciones';
import { useIncapacidades } from '@/hooks/useIncapacidades';
import Badge from '@/components/ui/Badge';
import { formatRangoFechas, calcularDiasRestantes } from '@/hooks/useAusencias';

/**
 * Card de incapacidad del equipo
 */
function IncapacidadEquipoCard({ incapacidad }) {
  const diasRestantes = calcularDiasRestantes(incapacidad.fecha_fin);

  const tipoConfig = {
    enfermedad_general: {
      label: 'Enfermedad General',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-300',
    },
    maternidad: {
      label: 'Maternidad',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      textColor: 'text-pink-700 dark:text-pink-300',
    },
    riesgo_trabajo: {
      label: 'Riesgo de Trabajo',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-300',
    },
  }[incapacidad.tipo_incapacidad] || {
    label: 'Incapacidad',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {incapacidad.profesional_nombre}
            </span>
            <span
              className={`
                px-2 py-0.5 text-xs font-medium rounded-full
                ${tipoConfig.bgColor} ${tipoConfig.textColor}
              `}
            >
              {tipoConfig.label}
            </span>
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
 * Tab de Mi Equipo
 */
function MiEquipoAusenciasTab() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('vacaciones');

  // Incapacidades activas del equipo (solo admin/supervisor ve esto)
  const { data: incapacidadesData, isLoading: isLoadingIncapacidades } = useIncapacidades({
    estado: 'activa',
    limite: 50,
  });

  const incapacidadesActivas = incapacidadesData?.data || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones'] });
    queryClient.invalidateQueries({ queryKey: ['incapacidades'] });
  };

  return (
    <div className="space-y-6">
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

      {/* Tabs de sección */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveSection('vacaciones')}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
            ${activeSection === 'vacaciones'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <Calendar className="w-4 h-4" />
          Solicitudes de Vacaciones
        </button>
        <button
          onClick={() => setActiveSection('incapacidades')}
          className={`
            px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2
            ${activeSection === 'incapacidades'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          <HeartPulse className="w-4 h-4" />
          Incapacidades Activas
          {incapacidadesActivas.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {incapacidadesActivas.length}
            </span>
          )}
        </button>
      </div>

      {/* Contenido */}
      {activeSection === 'vacaciones' && <SolicitudesEquipoSection />}

      {activeSection === 'incapacidades' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Profesionales actualmente con incapacidad médica
          </p>

          {isLoadingIncapacidades ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 dark:bg-gray-800 rounded-lg h-20 animate-pulse"
                />
              ))}
            </div>
          ) : incapacidadesActivas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <HeartPulse className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay incapacidades activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incapacidadesActivas.map((inc) => (
                <IncapacidadEquipoCard key={inc.id} incapacidad={inc} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MiEquipoAusenciasTab;
