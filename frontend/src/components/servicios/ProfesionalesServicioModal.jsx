import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { profesionalesApi } from '@/services/api/endpoints';
import {
  useProfesionalesServicio,
  useAsignarProfesional,
  useDesasignarProfesional,
} from '@/hooks/useServicios';
import { useToast } from '@/hooks/useToast';
import { getArrayDiff } from '@/utils/arrayDiff';

/**
 * Modal para gestionar profesionales asignados a un servicio
 * Permite agregar y quitar profesionales con manejo robusto de errores
 */
function ProfesionalesServicioModal({ isOpen, onClose, servicio }) {
  const toast = useToast();
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialized = useRef(false);

  const servicioId = servicio?.id;

  // Fetch profesionales asignados actualmente al servicio
  const {
    data: profesionalesAsignados = [],
    isLoading: loadingAsignados,
  } = useProfesionalesServicio(servicioId, {
    enabled: isOpen && !!servicioId,
  });

  // Fetch todos los profesionales disponibles
  const { data: todosProfesionales, isLoading: loadingTodos } = useQuery({
    queryKey: ['profesionales'],
    queryFn: async () => {
      const response = await profesionalesApi.listar();
      return response.data.data.profesionales || [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Hooks de mutación
  const asignarMutation = useAsignarProfesional();
  const desasignarMutation = useDesasignarProfesional();

  // Pre-cargar profesionales asignados cuando se obtienen los datos
  // Usar ref para evitar loop infinito al cambiar la referencia del array
  useEffect(() => {
    if (isOpen && !loadingAsignados && !hasInitialized.current) {
      if (profesionalesAsignados && profesionalesAsignados.length > 0) {
        const ids = profesionalesAsignados.map((prof) => prof.id);
        setSelectedProfessionals(ids);
      } else {
        setSelectedProfessionals([]);
      }
      hasInitialized.current = true;
    }
  }, [isOpen, loadingAsignados, profesionalesAsignados]);

  // Reset cuando cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedProfessionals([]);
      setIsSubmitting(false);
      hasInitialized.current = false; // Resetear flag de inicialización
    }
  }, [isOpen]);

  // Handler para toggle de profesionales
  const toggleProfessional = (profId) => {
    setSelectedProfessionals((prev) =>
      prev.includes(profId)
        ? prev.filter((id) => id !== profId)
        : [...prev, profId]
    );
  };

  // Handler para guardar cambios
  const handleGuardar = async () => {
    try {
      setIsSubmitting(true);

      // Obtener IDs actuales
      const currentIds = profesionalesAsignados.map((prof) => prof.id);

      // Calcular diferencias
      const { toAdd, toRemove, hasChanges } = getArrayDiff(
        currentIds,
        selectedProfessionals
      );

      // Si no hay cambios, cerrar
      if (!hasChanges) {
        toast.info('No hay cambios para guardar');
        onClose();
        return;
      }

      // Crear promises para agregar y quitar
      const addPromises = toAdd.map((profId) =>
        asignarMutation.mutateAsync({
          servicioId,
          profesionalId: profId,
        })
      );

      const removePromises = toRemove.map((profId) =>
        desasignarMutation.mutateAsync({
          servicioId,
          profesionalId: profId,
        })
      );

      const allPromises = [...addPromises, ...removePromises];

      // Ejecutar todas las operaciones con Promise.allSettled
      const results = await Promise.allSettled(allPromises);

      // Contar resultados
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      // Feedback según resultados
      if (failed === 0) {
        toast.success(
          `Profesionales actualizados correctamente (${successful} operaciones)`
        );
        onClose();
      } else if (successful > 0) {
        toast.warning(
          `${successful} operaciones exitosas, ${failed} fallidas. Revisa los cambios.`
        );
        // No cerrar el modal para que el usuario vea qué falló
      } else {
        toast.error('Todas las operaciones fallaron. Intenta nuevamente.');
      }
    } catch (error) {
      toast.error(error.message || 'Error al actualizar profesionales');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  const isLoading = loadingAsignados || loadingTodos;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Profesionales"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header con icono */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {servicio?.nombre}
            </h3>
            <p className="text-sm text-gray-600">
              Selecciona los profesionales que ofrecen este servicio
            </p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Cargando profesionales...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Lista de profesionales */}
            {todosProfesionales && todosProfesionales.length > 0 ? (
              <div className="space-y-3">
                {/* Contador */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedProfessionals.length} de {todosProfesionales.length}{' '}
                    profesionales seleccionados
                  </p>
                  {selectedProfessionals.length === 0 && (
                    <div className="flex items-center gap-1 text-blue-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Servicio sin profesionales asignados</span>
                    </div>
                  )}
                </div>

                {/* Grid de profesionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {todosProfesionales.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => toggleProfessional(prof.id)}
                      className={`
                        flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${
                          selectedProfessionals.includes(prof.id)
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 hover:border-green-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfessionals.includes(prof.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: prof.color_calendario || '#10B981',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {prof.nombre_completo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                  No hay profesionales disponibles. Debes agregar profesionales
                  primero.
                </p>
              </div>
            )}
          </>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGuardar}
            isLoading={isSubmitting}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ProfesionalesServicioModal;
