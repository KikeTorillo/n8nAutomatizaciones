/**
 * ====================================================================
 * COMPONENTE - PIPELINE KANBAN (DRAG & DROP)
 * ====================================================================
 *
 * Vista Kanban del Pipeline de Oportunidades
 * Usa @dnd-kit/core para drag & drop entre etapas
 *
 * ====================================================================
 */

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/utils';
import {
  usePipeline,
  useEtapasPipeline,
  useMoverOportunidad,
} from '@/hooks/personas';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

export default function PipelineKanban() {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState(null);

  // Datos
  const { data: pipeline, isLoading: isLoadingPipeline, error: errorPipeline } = usePipeline();
  const { data: etapas = [], isLoading: isLoadingEtapas } = useEtapasPipeline();
  const moverOportunidad = useMoverOportunidad();

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requiere mover 8px antes de iniciar drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Encontrar oportunidad activa para el overlay
  const activeOportunidad = useMemo(() => {
    if (!activeId || !pipeline) return null;

    for (const etapa of Object.values(pipeline)) {
      const oportunidad = etapa.oportunidades?.find((op) => op.id === activeId);
      if (oportunidad) return oportunidad;
    }
    return null;
  }, [activeId, pipeline]);

  // Handlers de drag & drop
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Obtener la etapa destino
    let targetEtapaId = null;

    if (over.data.current?.type === 'etapa') {
      targetEtapaId = over.data.current.etapaId;
    } else if (over.data.current?.type === 'oportunidad') {
      // Si se suelta sobre otra oportunidad, obtener su etapa
      const targetOportunidad = over.data.current.oportunidad;
      targetEtapaId = targetOportunidad?.etapa_id;
    }

    if (!targetEtapaId) return;

    // Obtener la oportunidad que se esta moviendo
    const oportunidadId = active.id;
    const sourceOportunidad = active.data.current?.oportunidad;

    // Si ya esta en la misma etapa, no hacer nada
    if (sourceOportunidad?.etapa_id === targetEtapaId) return;

    // Ejecutar la mutacion
    moverOportunidad.mutate(
      {
        oportunidadId,
        etapaId: targetEtapaId,
      },
      {
        onSuccess: () => {
          const etapaDestino = etapas.find((e) => e.id === targetEtapaId);
          toast.success(`Oportunidad movida a ${etapaDestino?.nombre || 'nueva etapa'}`);
        },
        onError: (error) => {
          toast.error(error.message || 'Error al mover oportunidad');
        },
      }
    );
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Estados de carga y error
  if (isLoadingPipeline || isLoadingEtapas) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Cargando pipeline...</span>
      </div>
    );
  }

  if (errorPipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Error al cargar el pipeline</p>
        <p className="text-sm text-gray-500">{errorPipeline.message}</p>
      </div>
    );
  }

  // Ordenar etapas por orden
  const etapasOrdenadas = [...etapas].sort((a, b) => (a.orden || 0) - (b.orden || 0));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Contenedor horizontal con scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {etapasOrdenadas.map((etapa) => {
          // Obtener oportunidades de esta etapa del pipeline
          const etapaPipeline = pipeline?.[etapa.id] || {};
          const oportunidades = etapaPipeline.oportunidades || [];

          return (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              oportunidades={oportunidades}
            />
          );
        })}

        {/* Columna vacia si no hay etapas */}
        {etapasOrdenadas.length === 0 && (
          <div className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              No hay etapas configuradas.
              <br />
              Configura el pipeline desde el perfil del cliente.
            </p>
          </div>
        )}
      </div>

      {/* Overlay durante el drag */}
      <DragOverlay>
        {activeOportunidad && (
          <KanbanCard oportunidad={activeOportunidad} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
