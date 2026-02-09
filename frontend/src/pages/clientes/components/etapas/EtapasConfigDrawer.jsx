/**
 * ====================================================================
 * ETAPAS CONFIG DRAWER - Drawer de Configuración de Etapas
 * ====================================================================
 *
 * Drawer para configurar las etapas del pipeline con:
 * - Lista sortable usando dnd-kit
 * - Crear nueva etapa
 * - Editar etapas existentes
 * - Eliminar etapas
 * - Reordenar con drag & drop
 *
 * Enero 2026
 * ====================================================================
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Loader2, Info, AlertTriangle } from 'lucide-react';
import { Drawer, Button, EmptyState, ConfirmDialog, LoadingSpinner } from '@/components/ui';
import { useToast } from '@/hooks/utils';
import {
  useEtapasPipeline,
  useCrearEtapa,
  useActualizarEtapa,
  useEliminarEtapa,
  useReordenarEtapas,
} from '@/hooks/personas';
import EtapaSortableItem from './EtapaSortableItem';
import EtapaFormModal from './EtapaFormModal';

/**
 * Drawer para configurar etapas del pipeline
 */
export default function EtapasConfigDrawer({ isOpen, onClose }) {
  const { toast } = useToast();

  // Estados locales
  const [etapaEditar, setEtapaEditar] = useState(null);
  const [etapaEliminar, setEtapaEliminar] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // Queries y mutations
  const { data: etapas = [], isLoading } = useEtapasPipeline(true); // Incluir inactivas
  const crearEtapa = useCrearEtapa();
  const actualizarEtapa = useActualizarEtapa();
  const eliminarEtapa = useEliminarEtapa();
  const reordenarEtapas = useReordenarEtapas();

  // Ordenar etapas por orden
  const etapasOrdenadas = useMemo(() => {
    return [...etapas].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [etapas]);

  // Etapa activa para el overlay del drag
  const etapaActiva = useMemo(() => {
    if (!activeId) return null;
    return etapasOrdenadas.find((e) => e.id === activeId);
  }, [activeId, etapasOrdenadas]);

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handlers de drag
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Calcular nuevo orden
    const oldIndex = etapasOrdenadas.findIndex((e) => e.id === active.id);
    const newIndex = etapasOrdenadas.findIndex((e) => e.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Crear nuevo array con el orden correcto
    const newOrder = [...etapasOrdenadas];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);

    // Enviar nuevo orden al servidor
    const ordenIds = newOrder.map((e) => e.id);
    reordenarEtapas.mutate(ordenIds, {
      onSuccess: () => {
        toast.success('Orden actualizado');
      },
      onError: (error) => {
        toast.error(error.message || 'Error al reordenar');
      },
    });
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Handlers de CRUD
  const handleCrearNueva = () => {
    setEtapaEditar(null);
    setShowFormModal(true);
  };

  const handleEditar = (etapa) => {
    setEtapaEditar(etapa);
    setShowFormModal(true);
  };

  const handleEliminar = (etapa) => {
    setEtapaEliminar(etapa);
  };

  const handleSubmitForm = async (data) => {
    try {
      if (etapaEditar) {
        await actualizarEtapa.mutateAsync({
          etapaId: etapaEditar.id,
          data,
        });
        toast.success('Etapa actualizada');
      } else {
        await crearEtapa.mutateAsync(data);
        toast.success('Etapa creada');
      }
      setShowFormModal(false);
      setEtapaEditar(null);
    } catch (error) {
      toast.error(error.message || 'Error al guardar etapa');
    }
  };

  const handleConfirmEliminar = async () => {
    if (!etapaEliminar) return;

    try {
      await eliminarEtapa.mutateAsync(etapaEliminar.id);
      toast.success('Etapa eliminada');
      setEtapaEliminar(null);
    } catch (error) {
      toast.error(error.message || 'Error al eliminar etapa');
    }
  };

  const isSubmitting =
    crearEtapa.isPending ||
    actualizarEtapa.isPending ||
    eliminarEtapa.isPending ||
    reordenarEtapas.isPending;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Configurar Etapas del Pipeline"
        subtitle="Arrastra para reordenar las etapas"
        size="lg"
        showCloseButton
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={handleCrearNueva} disabled={isSubmitting}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Etapa
            </Button>
          </div>
        }
      >
        {/* Instrucciones */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Cómo usar:</p>
            <ul className="mt-1 list-disc list-inside text-blue-700 dark:text-blue-300">
              <li>Arrastra las etapas para cambiar su orden</li>
              <li>Marca una etapa como "Ganada" para cerrar oportunidades exitosas</li>
              <li>Marca una etapa como "Perdida" para descartar oportunidades</li>
            </ul>
          </div>
        </div>

        {/* Lista de etapas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : etapasOrdenadas.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Sin etapas configuradas"
            description="Crea tu primera etapa para comenzar a usar el pipeline de oportunidades."
            action={
              <Button onClick={handleCrearNueva}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Etapa
              </Button>
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={etapasOrdenadas.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {etapasOrdenadas.map((etapa) => (
                  <EtapaSortableItem
                    key={etapa.id}
                    etapa={etapa}
                    onEdit={handleEditar}
                    onDelete={handleEliminar}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Overlay durante el drag */}
            <DragOverlay>
              {etapaActiva && (
                <EtapaSortableItem
                  etapa={etapaActiva}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isDragging
                />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Indicador de guardando */}
        {reordenarEtapas.isPending && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando orden...
          </div>
        )}
      </Drawer>

      {/* Modal de crear/editar etapa */}
      <EtapaFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEtapaEditar(null);
        }}
        onSubmit={handleSubmitForm}
        etapa={etapaEditar}
        isLoading={crearEtapa.isPending || actualizarEtapa.isPending}
      />

      {/* Modal de confirmación para eliminar */}
      <ConfirmDialog
        isOpen={!!etapaEliminar}
        onClose={() => setEtapaEliminar(null)}
        onConfirm={handleConfirmEliminar}
        title="Eliminar Etapa"
        message={
          <div>
            <p>
              ¿Estás seguro de eliminar la etapa <strong>"{etapaEliminar?.nombre}"</strong>?
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Las oportunidades en esta etapa se moverán a la primera etapa disponible.
            </p>
          </div>
        }
        confirmLabel={eliminarEtapa.isPending ? 'Eliminando...' : 'Eliminar'}
        confirmVariant="danger"
        isLoading={eliminarEtapa.isPending}
      />
    </>
  );
}

EtapasConfigDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
