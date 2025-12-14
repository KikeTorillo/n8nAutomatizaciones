import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  rectIntersection,
  useDroppable,
} from '@dnd-kit/core';
import { Plus, Users, Trash2, Edit2, LayoutGrid, X, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Drawer from '@/components/ui/Drawer';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import {
  useMesas,
  useEstadisticasMesas,
  useCrearMesa,
  useActualizarMesa,
  useEliminarMesa,
  useActualizarPosicionesMesas,
  useAsignarInvitadoAMesa,
  useDesasignarInvitadoDeMesa,
  useInvitados,
} from '@/hooks/useEventosDigitales';
import MesaVisual from './MesaVisual';
import InvitadoChip from './InvitadoChip';

/**
 * Editor visual de Seating Chart
 * Canvas 2D con mesas posicionables y asignación de invitados via drag-drop
 */
function SeatingChartEditor({ eventoId }) {
  const toast = useToast();
  const [activeId, setActiveId] = useState(null);
  const [dragType, setDragType] = useState(null); // 'mesa' | 'invitado'
  const [showCreateMesa, setShowCreateMesa] = useState(false);
  const [editingMesa, setEditingMesa] = useState(null);
  const [mesaAEliminar, setMesaAEliminar] = useState(null);
  const [newMesaData, setNewMesaData] = useState({
    nombre: '',
    numero: '',
    tipo: 'redonda',
    capacidad: 8,
  });

  // Queries
  const { data: mesas = [], isLoading: loadingMesas } = useMesas(eventoId);
  const { data: estadisticas } = useEstadisticasMesas(eventoId);
  const { data: invitadosData, isLoading: loadingInvitados } = useInvitados(eventoId, { limite: 200 });

  // Mutations
  const crearMesa = useCrearMesa();
  const actualizarMesa = useActualizarMesa();
  const eliminarMesa = useEliminarMesa();
  const actualizarPosiciones = useActualizarPosicionesMesas();
  const asignarInvitado = useAsignarInvitadoAMesa();
  const desasignarInvitado = useDesasignarInvitadoDeMesa();

  // Sensors para drag-drop (PointerSensor para desktop, TouchSensor para mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Mantener presionado 200ms antes de iniciar drag
        tolerance: 5, // Tolerancia de movimiento durante el delay
      },
    })
  );

  // Canvas droppable para recibir mesas
  const { setNodeRef: setCanvasRef } = useDroppable({
    id: 'canvas',
  });

  // Panel "Sin Mesa" droppable para desasignar invitados
  const { setNodeRef: setSinMesaRef, isOver: isOverSinMesa } = useDroppable({
    id: 'sin-mesa',
  });

  // Filtrar invitados sin mesa asignada
  const invitadosSinMesa = (invitadosData?.invitados || []).filter(
    (inv) => !inv.mesa_id && inv.estado_rsvp === 'confirmado'
  );

  // Manejar inicio de drag
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);

    // Determinar tipo de elemento siendo arrastrado
    if (String(active.id).startsWith('mesa-')) {
      setDragType('mesa');
    } else if (String(active.id).startsWith('invitado-')) {
      setDragType('invitado');
    }
  }, []);

  // Manejar fin de drag
  const handleDragEnd = useCallback(async (event) => {
    const { active, over, delta } = event;

    setActiveId(null);
    setDragType(null);

    const activeIdStr = String(active.id);

    // Si es un invitado siendo arrastrado
    if (activeIdStr.startsWith('invitado-')) {
      const invitadoId = parseInt(activeIdStr.replace('invitado-', ''));

      // Si no hay over o es el canvas, no hacer nada
      if (!over || over.id === 'canvas') {
        return;
      }

      const overIdStr = String(over.id);

      // Caso: Soltar en "Sin Mesa" - desasignar si tenía mesa
      if (overIdStr === 'sin-mesa') {
        const invitado = invitadosData?.invitados?.find(i => i.id === invitadoId);
        if (invitado?.mesa_id) {
          try {
            await desasignarInvitado.mutateAsync({ invitadoId, eventoId });
            toast.success('Invitado desasignado de mesa');
          } catch (error) {
            toast.error(error.message);
          }
        }
        return;
      }

      // Caso: Soltar en una mesa específica
      if (overIdStr.startsWith('mesa-')) {
        const mesaId = parseInt(overIdStr.replace('mesa-', ''));

        try {
          await asignarInvitado.mutateAsync({
            eventoId,
            mesaId,
            invitadoId,
          });
          toast.success('Invitado asignado a mesa');
        } catch (error) {
          toast.error(error.message);
        }
      }
      return;
    }

    // Caso: Mover mesa en el canvas (si hay movimiento significativo)
    if (activeIdStr.startsWith('mesa-') && (Math.abs(delta.x) > 5 || Math.abs(delta.y) > 5)) {
      const mesaId = parseInt(activeIdStr.replace('mesa-', ''));
      const mesa = mesas.find((m) => m.id === mesaId);

      if (!mesa) return;

      // Calcular nueva posición en porcentaje
      const canvas = document.getElementById('seating-canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = parseFloat(mesa.posicion_x) || 50;
      const currentY = parseFloat(mesa.posicion_y) || 50;
      const newX = Math.max(5, Math.min(95, currentX + (delta.x / rect.width) * 100));
      const newY = Math.max(5, Math.min(95, currentY + (delta.y / rect.height) * 100));

      try {
        await actualizarPosiciones.mutateAsync({
          eventoId,
          posiciones: [{ id: mesaId, posicion_x: newX, posicion_y: newY }],
        });
      } catch (error) {
        toast.error('Error moviendo mesa');
      }
    }
  }, [mesas, eventoId, asignarInvitado, desasignarInvitado, actualizarPosiciones, toast, invitadosData]);

  // Crear nueva mesa
  const handleCreateMesa = async () => {
    if (!newMesaData.nombre.trim()) {
      toast.error('El nombre de la mesa es requerido');
      return;
    }

    try {
      await crearMesa.mutateAsync({
        eventoId,
        data: {
          ...newMesaData,
          numero: newMesaData.numero ? parseInt(newMesaData.numero) : undefined,
        },
      });
      toast.success('Mesa creada');
      setShowCreateMesa(false);
      setNewMesaData({ nombre: '', numero: '', tipo: 'redonda', capacidad: 8 });
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Eliminar mesa
  const handleDeleteMesa = async (mesaId) => {
    try {
      await eliminarMesa.mutateAsync({ mesaId, eventoId });
      toast.success('Mesa eliminada');
      setMesaAEliminar(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Desasignar invitado de mesa
  const handleDesasignarInvitado = async (invitadoId) => {
    try {
      await desasignarInvitado.mutateAsync({ invitadoId, eventoId });
      toast.success('Invitado desasignado');
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Actualizar mesa
  const handleUpdateMesa = async (mesaId, data) => {
    try {
      await actualizarMesa.mutateAsync({ eventoId, mesaId, data });
      toast.success('Mesa actualizada');
      setEditingMesa(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Obtener ocupación de una mesa (suma num_asistentes de cada invitado)
  const getOcupacion = (mesa) => {
    const asignados = mesa.invitados?.reduce((sum, inv) => sum + (inv.num_asistentes || 1), 0) || 0;
    const porcentaje = (asignados / mesa.capacidad) * 100;
    return { asignados, porcentaje };
  };

  // Color según ocupación
  const getOcupacionColor = (porcentaje) => {
    if (porcentaje >= 100) return 'bg-red-500';
    if (porcentaje >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loadingMesas || loadingInvitados) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 dark:border-pink-400" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col lg:flex-row gap-4 min-h-[400px] lg:h-[600px]">
        {/* Panel lateral - Invitados sin mesa */}
        <div
          ref={setSinMesaRef}
          className={`w-full lg:w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg border-2 overflow-hidden transition-colors ${
            isOverSinMesa ? 'border-pink-400 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Sin Mesa ({invitadosSinMesa.length})</span>
            </div>
          </div>
          <div className="p-2 overflow-y-auto max-h-[120px] lg:max-h-[500px]">
            {invitadosSinMesa.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Todos los invitados confirmados tienen mesa
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {invitadosSinMesa.map((invitado) => (
                  <InvitadoChip
                    key={invitado.id}
                    invitado={invitado}
                    isDraggable
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas principal */}
        <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-gray-800 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 sm:gap-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm sm:text-base">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Distribución de</span> Mesas
              </h3>
              {estadisticas && (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {estadisticas.total_mesas} mesas • {estadisticas.total_asignados}/{estadisticas.capacidad_total} asientos
                </div>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateMesa(true)}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva</span> Mesa
            </Button>
          </div>

          {/* Canvas de mesas */}
          <div
            ref={setCanvasRef}
            id="seating-canvas"
            className="flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-b-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[250px]"
          >
            {/* Grid de fondo */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Mesas */}
            {mesas.map((mesa) => {
              const { asignados, porcentaje } = getOcupacion(mesa);
              return (
                <MesaVisual
                  key={mesa.id}
                  mesa={mesa}
                  asignados={asignados}
                  porcentaje={porcentaje}
                  isEditing={editingMesa?.id === mesa.id}
                  onEdit={() => setEditingMesa(mesa)}
                  onDelete={() => setMesaAEliminar(mesa)}
                  onDesasignarInvitado={handleDesasignarInvitado}
                  onSave={(data) => handleUpdateMesa(mesa.id, data)}
                  onCancelEdit={() => setEditingMesa(null)}
                />
              );
            })}

            {/* Mensaje cuando no hay mesas */}
            {mesas.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay mesas configuradas</p>
                  <p className="text-sm">Crea una mesa para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer crear mesa */}
      <Drawer
        isOpen={showCreateMesa}
        onClose={() => {
          setShowCreateMesa(false);
          setNewMesaData({ nombre: '', numero: '', tipo: 'redonda', capacidad: 8 });
        }}
        title="Nueva Mesa"
        subtitle="Configura una nueva mesa para el evento"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Mesa Familiar, Mesa VIP"
            value={newMesaData.nombre}
            onChange={(e) => setNewMesaData({ ...newMesaData, nombre: e.target.value })}
          />
          <Input
            label="Número (opcional)"
            type="number"
            placeholder="Ej: 1, 2, 3..."
            value={newMesaData.numero}
            onChange={(e) => setNewMesaData({ ...newMesaData, numero: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de mesa
            </label>
            <select
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={newMesaData.tipo}
              onChange={(e) => setNewMesaData({ ...newMesaData, tipo: e.target.value })}
            >
              <option value="redonda">Redonda</option>
              <option value="cuadrada">Cuadrada</option>
              <option value="rectangular">Rectangular</option>
            </select>
          </div>
          <Input
            label="Capacidad"
            type="number"
            min={1}
            max={50}
            value={newMesaData.capacidad}
            onChange={(e) => setNewMesaData({ ...newMesaData, capacidad: parseInt(e.target.value) || 8 })}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowCreateMesa(false);
              setNewMesaData({ nombre: '', numero: '', tipo: 'redonda', capacidad: 8 });
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCreateMesa}
            isLoading={crearMesa.isPending}
          >
            Crear Mesa
          </Button>
        </div>
      </Drawer>

      {/* Modal confirmar eliminar mesa */}
      <ConfirmDialog
        isOpen={!!mesaAEliminar}
        onClose={() => setMesaAEliminar(null)}
        onConfirm={() => handleDeleteMesa(mesaAEliminar.id)}
        title="Eliminar Mesa"
        message={`¿Estás seguro de eliminar la mesa "${mesaAEliminar?.nombre}"? Los invitados asignados serán desasignados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMesa.isPending}
      />

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && dragType === 'invitado' && (
          <div className="bg-white dark:bg-gray-800 border-2 border-pink-400 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {invitadosData?.invitados?.find((i) => i.id === parseInt(String(activeId).replace('invitado-', '')))?.nombre}
            </span>
          </div>
        )}
        {activeId && dragType === 'mesa' && (
          <div className="w-20 h-20 bg-pink-100 dark:bg-pink-900/40 border-2 border-pink-400 rounded-full shadow-lg flex items-center justify-center">
            <span className="text-xs font-medium text-pink-800 dark:text-pink-300">Moviendo...</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default SeatingChartEditor;
