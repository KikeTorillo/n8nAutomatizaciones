/**
 * OnboardingAdminPage - Pagina de administracion de onboarding
 * Fase 5 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import {
  ClipboardList, Plus, Users, AlertTriangle, CheckCircle2,
  Loader2, Edit2, Trash2, ChevronRight, Building2, Briefcase,
  Calendar, Clock
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  usePlantillasOnboarding,
  useDashboardOnboarding,
  useTareasVencidasOnboarding,
  useEliminarPlantilla,
  getColorProgreso,
  formatearFechaOnboarding
} from '@/hooks/useOnboardingEmpleados';
import PlantillaFormModal from './PlantillaFormModal';

function OnboardingAdminPage() {
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  const [plantillaEditar, setPlantillaEditar] = useState(null);
  const [confirmEliminar, setConfirmEliminar] = useState(null);
  const [tabActiva, setTabActiva] = useState('dashboard'); // 'dashboard' | 'plantillas' | 'vencidas'

  // Queries
  const { data: dashboardData, isLoading: loadingDashboard } = useDashboardOnboarding();
  const { data: plantillasData, isLoading: loadingPlantillas } = usePlantillasOnboarding();
  const { data: vencidasData, isLoading: loadingVencidas } = useTareasVencidasOnboarding();

  const eliminarMutation = useEliminarPlantilla();

  const estadisticas = dashboardData?.estadisticas || {};
  const empleados = dashboardData?.empleados || [];
  const conteosPorEstado = dashboardData?.conteos_por_estado || {};
  const plantillas = plantillasData?.plantillas || [];
  const tareasVencidas = vencidasData?.tareas || [];

  // Editar plantilla
  const handleEditarPlantilla = (plantilla) => {
    setPlantillaEditar(plantilla);
    setShowPlantillaModal(true);
  };

  // Cerrar modal
  const handleClosePlantillaModal = () => {
    setShowPlantillaModal(false);
    setPlantillaEditar(null);
  };

  // Eliminar plantilla
  const handleEliminar = async () => {
    if (!confirmEliminar) return;
    try {
      await eliminarMutation.mutateAsync(confirmEliminar.id);
      setConfirmEliminar(null);
    } catch (err) {
      // Error manejado por el hook
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <BackButton to="/home" label="Volver al Inicio" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <ClipboardList className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Onboarding de Empleados
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestiona plantillas y supervisa el progreso de integracion
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setPlantillaEditar(null);
                setShowPlantillaModal(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Users },
              { id: 'plantillas', label: 'Plantillas', icon: ClipboardList },
              { id: 'vencidas', label: 'Tareas Vencidas', icon: AlertTriangle, count: tareasVencidas.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tabActiva === tab.id
                    ? 'text-primary-600 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                    : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab: Dashboard */}
        {tabActiva === 'dashboard' && (
          <div className="space-y-6">
            {/* Estadisticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {estadisticas.total_empleados_onboarding || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">En onboarding</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {estadisticas.completados || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Completados</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {estadisticas.con_tareas_vencidas || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Con vencidas</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {estadisticas.promedio_avance || 0}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avance prom.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de empleados en onboarding */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Empleados en Onboarding</h3>
              </div>

              {loadingDashboard ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : empleados.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No hay empleados en proceso de onboarding
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {empleados.map((emp) => (
                    <div key={emp.profesional_id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {emp.nombre_completo}
                            </span>
                            {emp.tareas_vencidas > 0 && (
                              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                {emp.tareas_vencidas}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {emp.plantilla_nombre} | Ingreso: {formatearFechaOnboarding(emp.fecha_ingreso)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {emp.tareas_completadas}/{emp.total_tareas}
                            </p>
                            <p className="text-xs text-gray-500">{emp.porcentaje_completado}%</p>
                          </div>
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getColorProgreso(emp.porcentaje_completado)}`}
                              style={{ width: `${emp.porcentaje_completado || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Plantillas */}
        {tabActiva === 'plantillas' && (
          <div className="space-y-4">
            {loadingPlantillas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : plantillas.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No hay plantillas
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Crea tu primera plantilla de onboarding
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowPlantillaModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nueva Plantilla
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plantillas.map((plantilla) => (
                  <div
                    key={plantilla.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {plantilla.nombre}
                          </h3>
                          {!plantilla.activo && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                              Inactiva
                            </span>
                          )}
                        </div>
                        {plantilla.descripcion && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {plantilla.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditarPlantilla(plantilla)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmEliminar(plantilla)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {plantilla.total_tareas || 0} tareas
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {plantilla.duracion_dias || 30} dias
                      </span>
                    </div>

                    {(plantilla.departamento_nombre || plantilla.puesto_nombre) && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
                        {plantilla.departamento_nombre && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {plantilla.departamento_nombre}
                          </span>
                        )}
                        {plantilla.puesto_nombre && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {plantilla.puesto_nombre}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Tareas Vencidas */}
        {tabActiva === 'vencidas' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Tareas Vencidas
              </h3>
            </div>

            {loadingVencidas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : tareasVencidas.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-4" />
                <p>No hay tareas vencidas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tareasVencidas.map((tarea) => (
                  <div key={tarea.progreso_id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {tarea.tarea_titulo}
                          </span>
                          {tarea.es_obligatoria && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                              Obligatoria
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tarea.profesional_nombre} | {tarea.plantilla_nombre}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          {tarea.dias_vencido} {tarea.dias_vencido === 1 ? 'dia' : 'dias'} vencida
                        </p>
                        <p className="text-xs text-gray-500">
                          Limite: {formatearFechaOnboarding(tarea.fecha_limite)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Plantilla */}
      <PlantillaFormModal
        isOpen={showPlantillaModal}
        onClose={handleClosePlantillaModal}
        plantilla={plantillaEditar}
      />

      {/* Confirm Eliminar */}
      <ConfirmDialog
        isOpen={!!confirmEliminar}
        onClose={() => setConfirmEliminar(null)}
        onConfirm={handleEliminar}
        title="Eliminar Plantilla"
        message={`¿Estas seguro de eliminar la plantilla "${confirmEliminar?.nombre}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarMutation.isPending}
      />
    </div>
  );
}

export default OnboardingAdminPage;
