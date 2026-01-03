/**
 * ExperienciaLaboralSection - Componente para gestionar experiencia laboral
 * Fase 4 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import {
  Briefcase, Plus, Trash2, Edit2, ChevronDown, Loader2, AlertCircle, Building2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ExperienciaModal from './ExperienciaModal';
import { useToast } from '@/hooks/useToast';
import {
  useExperienciaLaboral,
  useEliminarExperiencia,
  formatearRangoFechas,
  calcularDuracion
} from '@/hooks/useExperienciaLaboral';

/**
 * Sección de Experiencia Laboral del empleado
 * @param {number} profesionalId - ID del profesional
 * @param {boolean} isEditing - Si está en modo edición
 */
function ExperienciaLaboralSection({ profesionalId, isEditing = false }) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [experienciaEditar, setExperienciaEditar] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Queries y mutations
  const { data: experienciaData, isLoading, error } = useExperienciaLaboral(profesionalId);
  const eliminarMutation = useEliminarExperiencia();

  const experiencias = experienciaData?.experiencias || [];
  const conteo = experienciaData?.conteo || { total: 0 };

  // Editar experiencia
  const handleEdit = (exp) => {
    setExperienciaEditar(exp);
    setShowModal(true);
  };

  // Abrir modal para crear
  const handleAgregar = () => {
    setExperienciaEditar(null);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setExperienciaEditar(null);
  };

  // Eliminar experiencia
  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await eliminarMutation.mutateAsync({
        profesionalId,
        experienciaId: confirmDelete.id
      });
      toast.success('Experiencia laboral eliminada');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar experiencia');
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
          <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Experiencia Laboral
          </h4>
          {conteo.total > 0 && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
              {conteo.total}
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
              <span className="text-sm">Cargando experiencia...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Error al cargar experiencia laboral</span>
            </div>
          )}

          {/* Lista de experiencias */}
          {!isLoading && !error && (
            <>
              {experiencias.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No hay experiencia laboral registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {experiencias.map((exp) => (
                    <div
                      key={exp.id}
                      className={`p-3 rounded-lg border ${
                        exp.empleo_actual
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Building2 className={`h-5 w-5 mt-0.5 ${
                            exp.empleo_actual ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {exp.puesto}
                              </span>
                              {exp.empleo_actual && (
                                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                  Empleo actual
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {exp.empresa}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatearRangoFechas(exp.fecha_inicio, exp.fecha_fin)}</span>
                              <span className="text-gray-300 dark:text-gray-600">|</span>
                              <span>{calcularDuracion(exp.fecha_inicio, exp.fecha_fin)}</span>
                            </div>
                            {exp.descripcion && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {exp.descripcion}
                              </p>
                            )}
                            {exp.ubicacion && (
                              <p className="text-xs text-gray-500 mt-1">
                                {exp.ubicacion}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(exp)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(exp)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón agregar */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAgregar}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Experiencia
              </Button>
            </>
          )}
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Experiencia Laboral"
        message={`¿Estás seguro de eliminar la experiencia en ${confirmDelete?.empresa}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />

      {/* Modal de crear/editar experiencia */}
      <ExperienciaModal
        isOpen={showModal}
        onClose={handleCloseModal}
        profesionalId={profesionalId}
        experiencia={experienciaEditar}
        onSuccess={handleCloseModal}
      />
    </div>
  );
}

export default ExperienciaLaboralSection;
