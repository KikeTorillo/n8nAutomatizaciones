import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scissors, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { serviciosApi } from '@/services/api/endpoints';
import { useAsignarProfesional, useDesasignarProfesional } from '@/hooks/useServicios';
import { useToast } from '@/hooks/useToast';
import { getArrayDiff } from '@/utils/arrayDiff';

/**
 * Modal para gestionar servicios asignados a un profesional
 * Permite agregar y quitar servicios con manejo robusto de errores
 */
function ServiciosProfesionalModal({ isOpen, onClose, profesional }) {
  const toast = useToast();
  const [selectedServicios, setSelectedServicios] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasInitialized = useRef(false);

  const profesionalId = profesional?.id;

  // Fetch servicios asignados actualmente al profesional
  const { data: serviciosAsignados = [], isLoading: loadingAsignados } = useQuery({
    queryKey: ['profesional-servicios', profesionalId],
    queryFn: async () => {
      const response = await serviciosApi.obtenerServiciosPorProfesional(profesionalId, {
        solo_activos: true,
      });
      return response.data.data || [];
    },
    enabled: isOpen && !!profesionalId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  // Fetch todos los servicios disponibles
  const { data: todosServicios, isLoading: loadingTodos } = useQuery({
    queryKey: ['servicios-all'],
    queryFn: async () => {
      const response = await serviciosApi.listar({ limite: 100 });
      return response.data.data.servicios || [];
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Hooks de mutación
  const asignarMutation = useAsignarProfesional();
  const desasignarMutation = useDesasignarProfesional();

  // Pre-cargar servicios asignados cuando se obtienen los datos
  // Usar ref para evitar loop infinito al cambiar la referencia del array
  useEffect(() => {
    if (isOpen && !loadingAsignados && !hasInitialized.current) {
      if (serviciosAsignados && serviciosAsignados.length > 0) {
        const ids = serviciosAsignados.map((serv) => serv.id);
        setSelectedServicios(ids);
      } else {
        setSelectedServicios([]);
      }
      hasInitialized.current = true;
    }
  }, [isOpen, loadingAsignados, serviciosAsignados]);

  // Reset cuando cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedServicios([]);
      setIsSubmitting(false);
      hasInitialized.current = false; // Resetear flag de inicialización
    }
  }, [isOpen]);

  // Handler para toggle de servicios
  const toggleServicio = (servicioId) => {
    setSelectedServicios((prev) =>
      prev.includes(servicioId)
        ? prev.filter((id) => id !== servicioId)
        : [...prev, servicioId]
    );
  };

  // Handler para guardar cambios
  const handleGuardar = async () => {
    try {
      setIsSubmitting(true);

      // Obtener IDs actuales
      const currentIds = serviciosAsignados.map((serv) => serv.id);

      // Calcular diferencias
      const { toAdd, toRemove, hasChanges } = getArrayDiff(currentIds, selectedServicios);

      // Si no hay cambios, cerrar
      if (!hasChanges) {
        toast.info('No hay cambios para guardar');
        onClose();
        return;
      }

      // Crear promises para agregar y quitar
      // IMPORTANTE: Los endpoints son bidireccionales (asignarProfesional funciona para ambos lados)
      const addPromises = toAdd.map((servicioId) =>
        asignarMutation.mutateAsync({
          servicioId,
          profesionalId,
        })
      );

      const removePromises = toRemove.map((servicioId) =>
        desasignarMutation.mutateAsync({
          servicioId,
          profesionalId,
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
          `Servicios actualizados correctamente (${successful} operaciones)`
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
      toast.error(error.message || 'Error al actualizar servicios');
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
      title="Gestionar Servicios"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header con icono */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: profesional?.color_calendario || '#3b82f6' }}
          >
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {profesional?.nombre} {profesional?.apellidos}
            </h3>
            <p className="text-sm text-gray-600">
              Selecciona los servicios que puede realizar este profesional
            </p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">Cargando servicios...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Lista de servicios */}
            {todosServicios && todosServicios.length > 0 ? (
              <div className="space-y-3">
                {/* Contador */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedServicios.length} de {todosServicios.length} servicios
                    seleccionados
                  </p>
                  {selectedServicios.length === 0 && (
                    <div className="flex items-center gap-1 text-amber-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>Selecciona al menos 1 servicio</span>
                    </div>
                  )}
                </div>

                {/* Grid de servicios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                  {todosServicios.map((servicio) => (
                    <div
                      key={servicio.id}
                      onClick={() => toggleServicio(servicio.id)}
                      className={`
                        flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${
                          selectedServicios.includes(servicio.id)
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServicios.includes(servicio.id)}
                        onChange={() => {}}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {servicio.nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {servicio.categoria && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {servicio.categoria}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            ${servicio.precio?.toLocaleString()} • {servicio.duracion_minutos}
                            min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">
                  No hay servicios disponibles. Debes agregar servicios primero.
                </p>
              </div>
            )}
          </>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGuardar}
            isLoading={isSubmitting}
            disabled={isSubmitting || selectedServicios.length === 0 || isLoading}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ServiciosProfesionalModal;
