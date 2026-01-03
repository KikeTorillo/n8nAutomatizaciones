/**
 * HabilidadesSection - Componente para gestionar habilidades de empleado
 * Fase 4 del Plan de Empleados Competitivo - Enero 2026
 */
import { useState } from 'react';
import {
  Wrench, Plus, Trash2, Edit2, ChevronDown, Loader2, AlertCircle, CheckCircle, Shield
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import HabilidadModal from './HabilidadModal';
import { useToast } from '@/hooks/useToast';
import {
  useHabilidadesEmpleado,
  useEliminarHabilidadEmpleado,
  useVerificarHabilidadEmpleado,
  getCategoriaConfig,
  getNivelConfig,
  formatearAniosExperiencia
} from '@/hooks/useHabilidades';

/**
 * Sección de Habilidades del empleado
 * @param {number} profesionalId - ID del profesional
 * @param {boolean} isEditing - Si está en modo edición
 * @param {boolean} canVerify - Si puede verificar habilidades (admin)
 */
function HabilidadesSection({ profesionalId, isEditing = false, canVerify = false }) {
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [habilidadEditar, setHabilidadEditar] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Queries y mutations
  const { data: habilidadesData, isLoading, error } = useHabilidadesEmpleado(profesionalId);
  const eliminarMutation = useEliminarHabilidadEmpleado();
  const verificarMutation = useVerificarHabilidadEmpleado();

  const habilidades = habilidadesData?.habilidades || [];
  const conteo = habilidadesData?.conteo || { total: 0 };

  // Editar habilidad
  const handleEdit = (hab) => {
    setHabilidadEditar(hab);
    setShowModal(true);
  };

  // Abrir modal para crear
  const handleAgregar = () => {
    setHabilidadEditar(null);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setHabilidadEditar(null);
  };

  // Eliminar habilidad
  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await eliminarMutation.mutateAsync({
        profesionalId,
        habilidadEmpleadoId: confirmDelete.id
      });
      toast.success('Habilidad eliminada');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.message || 'Error al eliminar habilidad');
    }
  };

  // Verificar/desverificar habilidad
  const handleVerificar = async (hab) => {
    try {
      await verificarMutation.mutateAsync({
        profesionalId,
        habilidadEmpleadoId: hab.id,
        verificado: !hab.verificado
      });
    } catch (err) {
      toast.error(err.message || 'Error al verificar habilidad');
    }
  };

  // Colores para niveles
  const nivelColors = {
    basico: 'bg-gray-200 dark:bg-gray-600',
    intermedio: 'bg-blue-200 dark:bg-blue-800',
    avanzado: 'bg-green-200 dark:bg-green-800',
    experto: 'bg-purple-200 dark:bg-purple-800'
  };

  // Colores para categorías
  const categoriaColors = {
    tecnica: 'text-blue-600 dark:text-blue-400',
    blanda: 'text-purple-600 dark:text-purple-400',
    idioma: 'text-green-600 dark:text-green-400',
    software: 'text-orange-600 dark:text-orange-400',
    certificacion: 'text-red-600 dark:text-red-400',
    otro: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 mb-4"
      >
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Habilidades
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
              <span className="text-sm">Cargando habilidades...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Error al cargar habilidades</span>
            </div>
          )}

          {/* Lista de habilidades */}
          {!isLoading && !error && (
            <>
              {habilidades.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                  No hay habilidades registradas
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {habilidades.map((hab) => {
                    const categoria = getCategoriaConfig(hab.categoria || hab.habilidad?.categoria);
                    const nivel = getNivelConfig(hab.nivel);

                    return (
                      <div
                        key={hab.id}
                        className={`group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                          hab.verificado
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        {/* Nombre de habilidad */}
                        <span className={`font-medium text-sm ${categoriaColors[categoria.value] || categoriaColors.otro}`}>
                          {hab.habilidad?.nombre || hab.nombre}
                        </span>

                        {/* Nivel */}
                        <span className={`text-xs px-2 py-0.5 rounded ${nivelColors[hab.nivel]}`}>
                          {nivel.label}
                        </span>

                        {/* Verificado badge */}
                        {hab.verificado && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}

                        {/* Botones de acción (hover) */}
                        <div className="hidden group-hover:flex items-center gap-1 ml-1">
                          {canVerify && (
                            <button
                              type="button"
                              onClick={() => handleVerificar(hab)}
                              disabled={verificarMutation.isPending}
                              className={`p-1 rounded transition-colors ${
                                hab.verificado
                                  ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                              }`}
                              title={hab.verificado ? 'Quitar verificación' : 'Verificar'}
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(hab)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(hab)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info adicional si hay habilidades */}
              {habilidades.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Pasa el cursor sobre una habilidad para ver las opciones
                </p>
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
                Agregar Habilidad
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
        title="Eliminar Habilidad"
        message={`¿Estás seguro de eliminar la habilidad "${confirmDelete?.habilidad?.nombre || confirmDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMutation.isPending}
      />

      {/* Modal de crear/editar habilidad */}
      <HabilidadModal
        isOpen={showModal}
        onClose={handleCloseModal}
        profesionalId={profesionalId}
        habilidadEmpleado={habilidadEditar}
        onSuccess={handleCloseModal}
      />
    </div>
  );
}

export default HabilidadesSection;
