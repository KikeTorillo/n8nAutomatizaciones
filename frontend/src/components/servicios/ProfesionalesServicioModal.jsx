import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, AlertCircle, GripVertical, ChevronDown, ChevronUp, RefreshCw, Info } from 'lucide-react';
import Drawer from '@/components/ui/Drawer';
import Button from '@/components/ui/Button';
import { profesionalesApi, serviciosApi } from '@/services/api/endpoints';
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
  const queryClient = useQueryClient();
  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrdering, setShowOrdering] = useState(false);
  const [orderedProfessionals, setOrderedProfessionals] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
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

  // Query para profesionales con orden de rotación
  const {
    data: profesionalesConOrden = [],
    isLoading: loadingOrden,
    refetch: refetchOrden,
  } = useQuery({
    queryKey: ['servicios', servicioId, 'profesionales-orden'],
    queryFn: async () => {
      const response = await serviciosApi.obtenerProfesionalesConOrden(servicioId);
      return response.data?.data || response.data || [];
    },
    enabled: isOpen && !!servicioId && showOrdering,
    staleTime: 10000,
  });

  // Mutation para actualizar orden
  const actualizarOrdenMutation = useMutation({
    mutationFn: ({ servicioId, orden }) =>
      serviciosApi.actualizarOrdenProfesionales(servicioId, orden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicios', servicioId, 'profesionales-orden'] });
      toast.success('Orden de profesionales actualizado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar orden');
    },
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
      setShowOrdering(false);
      setOrderedProfessionals([]);
      hasInitialized.current = false; // Resetear flag de inicialización
    }
  }, [isOpen]);

  // Inicializar lista de profesionales ordenados cuando se abre la sección
  useEffect(() => {
    if (showOrdering && profesionalesConOrden.length > 0) {
      setOrderedProfessionals([...profesionalesConOrden]);
    }
  }, [showOrdering, profesionalesConOrden]);

  // Drag & Drop handlers
  const handleDragStart = useCallback((index) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setOrderedProfessionals((prev) => {
      const newList = [...prev];
      const draggedItem = newList[draggedIndex];
      newList.splice(draggedIndex, 1);
      newList.splice(index, 0, draggedItem);
      setDraggedIndex(index);
      return newList;
    });
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Guardar nuevo orden
  const handleGuardarOrden = async () => {
    const orden = orderedProfessionals.map((prof, idx) => ({
      profesional_id: prof.id,
      orden: idx + 1,
    }));

    await actualizarOrdenMutation.mutateAsync({ servicioId, orden });
  };

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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Profesionales"
      subtitle={servicio ? servicio.nombre : 'Selecciona los profesionales del servicio'}
    >
      <div className="space-y-6">

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cargando profesionales...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Lista de profesionales */}
            {todosProfesionales && todosProfesionales.length > 0 ? (
              <div className="space-y-3">
                {/* Contador */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {selectedProfessionals.length} de {todosProfesionales.length}{' '}
                    profesionales seleccionados
                  </p>
                  {selectedProfessionals.length === 0 && (
                    <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Servicio sin profesionales asignados</span>
                    </div>
                  )}
                </div>

                {/* Grid de profesionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {todosProfesionales.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => toggleProfessional(prof.id)}
                      className={`
                        flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${
                          selectedProfessionals.includes(prof.id)
                            ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfessionals.includes(prof.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-green-600 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: prof.color_calendario || '#10B981',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {prof.nombre_completo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sección de Ordenamiento (Round-Robin) */}
                {selectedProfessionals.length >= 2 && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrdering(!showOrdering);
                        if (!showOrdering) refetchOrden();
                      }}
                      className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Orden de Atención (Round-Robin)
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Arrastra para definir la prioridad de asignación
                          </p>
                        </div>
                      </div>
                      {showOrdering ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {showOrdering && (
                      <div className="mt-3 space-y-3">
                        {loadingOrden ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                          </div>
                        ) : orderedProfessionals.length > 0 ? (
                          <>
                            {/* Lista ordenable */}
                            <div className="space-y-2">
                              {orderedProfessionals.map((prof, index) => (
                                <div
                                  key={prof.id}
                                  draggable
                                  onDragStart={() => handleDragStart(index)}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragEnd={handleDragEnd}
                                  className={`
                                    flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border rounded-lg cursor-grab active:cursor-grabbing transition-all
                                    ${draggedIndex === index ? 'opacity-50 border-primary-500' : 'border-gray-200 dark:border-gray-600'}
                                  `}
                                >
                                  <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  <span className="w-6 h-6 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-full">
                                    {index + 1}
                                  </span>
                                  <div
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                    style={{
                                      backgroundColor: '#10B981',
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {prof.nombre_completo}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Nota informativa */}
                            <div className="flex items-start gap-2 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 p-2.5 rounded-lg">
                              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>
                                Este orden se usa cuando el cliente no selecciona profesional y Round-Robin está activo.
                              </span>
                            </div>

                            {/* Botón guardar orden */}
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleGuardarOrden}
                              isLoading={actualizarOrdenMutation.isPending}
                              disabled={actualizarOrdenMutation.isPending}
                              className="w-full"
                            >
                              Guardar Orden
                            </Button>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                            Guarda primero los profesionales asignados para poder ordenarlos.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay profesionales disponibles. Debes agregar profesionales
                  primero.
                </p>
              </div>
            )}
          </>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
    </Drawer>
  );
}

export default ProfesionalesServicioModal;
