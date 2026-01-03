/**
 * EducacionFormalSection - Componente para gestionar educación formal
 * Fase 4 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import {
  GraduationCap, Plus, Trash2, Edit2, ChevronDown, Loader2, AlertCircle, BookOpen
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EducacionModal from './EducacionModal';
import { useToast } from '@/hooks/useToast';
import {
  useEducacionFormal,
  useEliminarEducacion,
  getNivelEducacionLabel,
  getEstadoEstudio,
  formatearRangoAnios
} from '@/hooks/useEducacionFormal';

/**
 * Sección de Educación Formal del empleado
 * @param {number} profesionalId - ID del profesional
 * @param {boolean} isEditing - Si está en modo edición
 */
function EducacionFormalSection({ profesionalId, isEditing = false }) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [educacionEditar, setEducacionEditar] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Queries y mutations
  const { data: educacionData, isLoading, error } = useEducacionFormal(profesionalId);
  const eliminarMutation = useEliminarEducacion();

  const educaciones = educacionData?.educaciones || [];
  const conteo = educacionData?.conteo || { total: 0 };

  // Editar educación
  const handleEdit = (edu) => {
    setEducacionEditar(edu);
    setShowModal(true);
  };

  // Abrir modal para crear
  const handleAgregar = () => {
    setEducacionEditar(null);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEducacionEditar(null);
  };

  // Eliminar educación
  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await eliminarMutation.mutateAsync({
        profesionalId,
        educacionId: confirmDelete.id
      });
      toast.success('Educación eliminada');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar educación');
    }
  };

  const getEstadoBadge = (edu) => {
    const estado = getEstadoEstudio(edu.en_curso, edu.fecha_fin);
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400',
      gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[estado.color]}`}>
        {estado.label}
      </span>
    );
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 mb-4"
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Educación Formal
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
              <span className="text-sm">Cargando educación...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Error al cargar educación formal</span>
            </div>
          )}

          {/* Lista de educaciones */}
          {!isLoading && !error && (
            <>
              {educaciones.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No hay educación formal registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {educaciones.map((edu) => (
                    <div
                      key={edu.id}
                      className={`p-3 rounded-lg border ${
                        edu.en_curso
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <BookOpen className={`h-5 w-5 mt-0.5 ${
                            edu.en_curso ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {edu.titulo}
                              </span>
                              {getEstadoBadge(edu)}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {edu.institucion}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                                {getNivelEducacionLabel(edu.nivel)}
                              </span>
                              <span>{formatearRangoAnios(edu.fecha_inicio, edu.fecha_fin, edu.en_curso)}</span>
                            </div>
                            {edu.campo_estudio && (
                              <p className="text-xs text-gray-500 mt-1">
                                Campo: {edu.campo_estudio}
                              </p>
                            )}
                            {edu.promedio && (
                              <p className="text-xs text-gray-500 mt-1">
                                Promedio: {edu.promedio}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(edu)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(edu)}
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
                Agregar Educación
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
        title="Eliminar Educación"
        message={`¿Estás seguro de eliminar "${confirmDelete?.titulo}" de ${confirmDelete?.institucion}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />

      {/* Modal de crear/editar educación */}
      <EducacionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        profesionalId={profesionalId}
        educacion={educacionEditar}
        onSuccess={handleCloseModal}
      />
    </div>
  );
}

export default EducacionFormalSection;
