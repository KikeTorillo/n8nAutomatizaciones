/**
 * VacacionesDashboard - Panel principal de vacaciones del usuario
 * Fase 3 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import { Plus, Calendar, Filter, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  useDashboardVacaciones,
  usePoliticaVacaciones,
  ESTADOS_SOLICITUD
} from '@/hooks/useVacaciones';
import SaldoVacacionesCard from './SaldoVacacionesCard';
import SolicitudVacacionesModal from './SolicitudVacacionesModal';
import SolicitudesVacacionesList from './SolicitudesVacacionesList';

/**
 * Tab de filtro por estado
 */
function FiltroEstadoTab({ label, value, count, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`
          ml-2 px-2 py-0.5 text-xs rounded-full
          ${isActive
            ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Dashboard de vacaciones del usuario
 * Muestra saldo, solicitudes y permite crear nuevas
 */
function VacacionesDashboard() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState(null);
  const anioActual = new Date().getFullYear();

  // Queries
  const { data: dashboard, isLoading: loadingDashboard, refetch } = useDashboardVacaciones(anioActual);
  const { data: politica } = usePoliticaVacaciones();

  const saldo = dashboard?.saldo;
  const nivel = dashboard?.nivel;
  const conteos = dashboard?.conteos || {};

  // Días mínimos de anticipación de la política
  const diasAnticipacion = politica?.dias_anticipacion_minimos || 7;

  // Días disponibles
  const diasDisponibles = saldo ? parseFloat(saldo.dias_pendientes) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary-500" />
            Mis Vacaciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tus días de descanso
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setModalAbierto(true)}
            disabled={diasDisponibles <= 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Tarjeta de saldo */}
      <SaldoVacacionesCard
        saldo={saldo}
        nivel={nivel}
        isLoading={loadingDashboard}
      />

      {/* Sección de solicitudes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Tabs de filtro */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />

          <FiltroEstadoTab
            label="Todas"
            value={null}
            isActive={filtroEstado === null}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Pendientes"
            value="pendiente"
            count={conteos.pendientes}
            isActive={filtroEstado === 'pendiente'}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Aprobadas"
            value="aprobada"
            count={conteos.aprobadas}
            isActive={filtroEstado === 'aprobada'}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Rechazadas"
            value="rechazada"
            isActive={filtroEstado === 'rechazada'}
            onClick={setFiltroEstado}
          />

          <FiltroEstadoTab
            label="Canceladas"
            value="cancelada"
            isActive={filtroEstado === 'cancelada'}
            onClick={setFiltroEstado}
          />
        </div>

        {/* Lista de solicitudes */}
        <div className="p-4">
          <SolicitudesVacacionesList
            filtroEstado={filtroEstado}
            anio={anioActual}
          />
        </div>
      </div>

      {/* Modal de nueva solicitud */}
      <SolicitudVacacionesModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        diasDisponibles={diasDisponibles}
        diasAnticipacionMinimos={diasAnticipacion}
      />
    </div>
  );
}

export default VacacionesDashboard;
