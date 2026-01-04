/**
 * OnboardingProgresoSection - Componente para mostrar progreso de onboarding
 * Fase 5 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import {
  ClipboardList, Plus, ChevronDown, Loader2, AlertCircle,
  CheckCircle2, Clock, AlertTriangle, ExternalLink, Trash2,
  User, UserCheck, Users
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OnboardingAplicarDrawer from './drawers/OnboardingAplicarDrawer';
import {
  useProgresoOnboarding,
  useMarcarTareaOnboarding,
  useEliminarProgresoOnboarding,
  getColorEstadoTarea,
  getResponsableInfo,
  getColorProgreso,
  formatearFechaOnboarding,
  calcularDiasRestantes
} from '@/hooks/useOnboardingEmpleados';

/**
 * Sección de Progreso de Onboarding del empleado
 * @param {number} profesionalId - ID del profesional
 * @param {boolean} isEditing - Si está en modo edición
 */
function OnboardingProgresoSection({ profesionalId, isEditing = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAplicarModal, setShowAplicarModal] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);

  // Queries y mutations
  const { data: progresoData, isLoading, error } = useProgresoOnboarding(profesionalId);
  const marcarTareaMutation = useMarcarTareaOnboarding();
  const eliminarProgresoMutation = useEliminarProgresoOnboarding();

  const tieneOnboarding = progresoData?.tiene_onboarding || false;
  const resumen = progresoData?.resumen || null;
  const tareas = progresoData?.tareas || [];

  // Marcar tarea como completada/pendiente
  const handleToggleTarea = async (tarea) => {
    try {
      await marcarTareaMutation.mutateAsync({
        profesionalId,
        tareaId: tarea.tarea_id,
        completado: !tarea.completado
      });
    } catch (err) {
      // Error manejado por el hook
    }
  };

  // Eliminar todo el progreso
  const handleEliminarProgreso = async () => {
    try {
      await eliminarProgresoMutation.mutateAsync(profesionalId);
      setConfirmEliminar(false);
    } catch (err) {
      // Error manejado por el hook
    }
  };

  // Obtener icono de responsable
  const getResponsableIcon = (tipo) => {
    switch (tipo) {
      case 'supervisor':
        return <UserCheck className="h-3.5 w-3.5" />;
      case 'rrhh':
        return <Users className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 mb-4"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary-500" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Plan de Integracion
          </h4>
          {tieneOnboarding && resumen && (
            <span className="text-xs bg-primary-100 dark:bg-primary-900 px-2 py-0.5 rounded-full text-primary-700 dark:text-primary-300">
              {resumen.porcentaje_completado || 0}%
            </span>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="pl-7 space-y-4">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Cargando progreso...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Error al cargar progreso de onboarding</span>
            </div>
          )}

          {/* Sin onboarding */}
          {!isLoading && !error && !tieneOnboarding && (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <ClipboardList className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                No tiene plan de integracion asignado
              </p>
              {isEditing && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAplicarModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  Aplicar Plantilla
                </Button>
              )}
            </div>
          )}

          {/* Con onboarding */}
          {!isLoading && !error && tieneOnboarding && resumen && (
            <>
              {/* Header con resumen */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      {resumen.plantilla_nombre}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ingreso: {formatearFechaOnboarding(resumen.fecha_ingreso)}
                    </p>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAplicarModal(true)}
                      >
                        Cambiar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => setConfirmEliminar(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Barra de progreso */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">
                      {resumen.tareas_completadas} de {resumen.total_tareas} tareas
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {resumen.porcentaje_completado || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getColorProgreso(resumen.porcentaje_completado)} transition-all duration-300`}
                      style={{ width: `${resumen.porcentaje_completado || 0}%` }}
                    />
                  </div>
                </div>

                {/* Estadisticas */}
                <div className="flex gap-4 text-xs">
                  {resumen.tareas_vencidas > 0 && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {resumen.tareas_vencidas} vencida{resumen.tareas_vencidas > 1 ? 's' : ''}
                    </span>
                  )}
                  {resumen.proxima_fecha_limite && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      Proxima: {formatearFechaOnboarding(resumen.proxima_fecha_limite)}
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de tareas */}
              <div className="space-y-2">
                {tareas.map((tarea) => {
                  const diasInfo = calcularDiasRestantes(tarea.fecha_limite);
                  const responsableInfo = getResponsableInfo(tarea.responsable_tipo);

                  return (
                    <div
                      key={tarea.progreso_id}
                      className={`p-3 rounded-lg border transition-all ${
                        tarea.completado
                          ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/20'
                          : tarea.estado_tarea === 'vencida'
                          ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTarea(tarea)}
                          disabled={marcarTareaMutation.isPending}
                          className={`mt-0.5 flex-shrink-0 rounded-full p-0.5 transition-colors ${
                            tarea.completado
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                        >
                          {marcarTareaMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <CheckCircle2 className={`h-5 w-5 ${tarea.completado ? 'fill-current' : ''}`} />
                          )}
                        </button>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${
                              tarea.completado
                                ? 'text-gray-500 dark:text-gray-400 line-through'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {tarea.titulo}
                            </span>
                            {tarea.es_obligatoria && !tarea.completado && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                                Obligatoria
                              </span>
                            )}
                          </div>

                          {tarea.descripcion && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {tarea.descripcion}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            {/* Responsable */}
                            <span className={`flex items-center gap-1 ${responsableInfo.color}`}>
                              {getResponsableIcon(tarea.responsable_tipo)}
                              {responsableInfo.label}
                            </span>

                            {/* Fecha limite */}
                            {tarea.fecha_limite && !tarea.completado && (
                              <span className={`flex items-center gap-1 ${
                                diasInfo.vencido
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <Clock className="h-3.5 w-3.5" />
                                {diasInfo.texto}
                              </span>
                            )}

                            {/* Link recurso */}
                            {tarea.url_recurso && (
                              <a
                                href={tarea.url_recurso}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Recurso
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Drawer aplicar plantilla */}
      <OnboardingAplicarDrawer
        isOpen={showAplicarModal}
        onClose={() => setShowAplicarModal(false)}
        profesionalId={profesionalId}
      />

      {/* Confirm eliminar */}
      <ConfirmDialog
        isOpen={confirmEliminar}
        onClose={() => setConfirmEliminar(false)}
        onConfirm={handleEliminarProgreso}
        title="Eliminar Plan de Integracion"
        message="Se eliminara todo el progreso de onboarding de este empleado. Esta accion no se puede deshacer."
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarProgresoMutation.isPending}
      />
    </div>
  );
}

export default OnboardingProgresoSection;
