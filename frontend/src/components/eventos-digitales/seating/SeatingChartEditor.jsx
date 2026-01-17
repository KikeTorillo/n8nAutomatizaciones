import { useState, useCallback } from 'react';
import { useModalManager } from '@/hooks/utils';
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
import { Plus, Users, LayoutGrid, Check, Move, GripVertical } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  Drawer,
  Input
} from '@/components/ui';
import { useToast } from '@/hooks/utils';
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
} from '@/hooks/otros';
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
  const [editingMesa, setEditingMesa] = useState(null); // Se mantiene como useState porque edita sus datos
  const [isEditMode, setIsEditMode] = useState(false); // Modo edición para mover mesas

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    create: { isOpen: false },
    delete: { isOpen: false, data: null },
  });
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

  // Sensors para drag-drop
  // Solo habilitado en modo edición (mesas e invitados)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        tolerance: 5,
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
    const activeIdStr = String(active.id);

    // Si NO está en modo edición, cancelar cualquier drag
    if (!isEditMode) {
      return;
    }

    setActiveId(active.id);

    // Determinar tipo de elemento siendo arrastrado
    if (activeIdStr.startsWith('mesa-')) {
      setDragType('mesa');
    } else if (activeIdStr.startsWith('invitado-')) {
      setDragType('invitado');
    }
  }, [isEditMode]);

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
      closeModal('create');
      setNewMesaData({ nombre: '', numero: '', tipo: 'redonda', capacidad: 8 });
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Eliminar mesa
  const handleDeleteMesa = async () => {
    const mesaAEliminar = getModalData('delete');
    if (!mesaAEliminar) return;
    try {
      await eliminarMesa.mutateAsync({ mesaId: mesaAEliminar.id, eventoId });
      toast.success('Mesa eliminada');
      closeModal('delete');
    } catch (err) {
      toast.error(err.message);
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
                    isDraggable={isEditMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas principal */}
        <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0">
          {/* Toolbar */}
          <div className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-t-lg border border-b-0 transition-colors ${
            isEditMode
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center gap-2 sm:gap-4">
              {isEditMode ? (
                <h3 className="font-medium text-primary-700 dark:text-primary-300 flex items-center gap-2 text-sm sm:text-base">
                  <Move className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Editando</span> Acomodo
                </h3>
              ) : (
                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm sm:text-base">
                  <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Distribución de</span> Mesas
                </h3>
              )}
              {estadisticas && !isEditMode && (
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {estadisticas.total_mesas} mesas • {estadisticas.total_asignados}/{estadisticas.capacidad_total} asientos
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Botón modo edición */}
              <Button
                variant={isEditMode ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="flex items-center gap-1 text-xs sm:text-sm"
              >
                {isEditMode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Listo</span>
                  </>
                ) : (
                  <>
                    <GripVertical className="w-4 h-4" />
                    <span className="hidden sm:inline">Editar Acomodo</span>
                  </>
                )}
              </Button>
              {/* Botón nueva mesa - solo visible en modo edición */}
              {isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal('create')}
                  className="flex items-center gap-1 text-xs sm:text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Mesa</span>
                </Button>
              )}
            </div>
          </div>

          {/* Canvas de mesas */}
          <div
            ref={setCanvasRef}
            id="seating-canvas"
            className={`flex-1 relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-b-lg border overflow-hidden min-h-[250px] transition-all ${
              isEditMode
                ? 'border-primary-300 dark:border-primary-700 ring-2 ring-primary-200 dark:ring-primary-800 touch-none'
                : 'border-gray-200 dark:border-gray-700'
            }`}
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
                  isEditMode={isEditMode}
                  onEdit={() => setEditingMesa(mesa)}
                  onDelete={() => openModal('delete', mesa)}
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
                  <p className="text-sm">Activa "Editar Acomodo" y crea una mesa</p>
                </div>
              </div>
            )}

            {/* Hint en modo edición */}
            {isEditMode && mesas.length > 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-primary-600 dark:bg-primary-500 text-white text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                <Move className="w-4 h-4" />
                Arrastra mesas e invitados para organizar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer crear mesa */}
      <Drawer
        isOpen={isOpen('create')}
        onClose={() => {
          closeModal('create');
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
              closeModal('create');
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

      {/* Drawer editar mesa */}
      <Drawer
        isOpen={!!editingMesa}
        onClose={() => setEditingMesa(null)}
        title="Editar Mesa"
        subtitle={`Modificar configuración de ${editingMesa?.nombre || 'la mesa'}`}
      >
        {editingMesa && (
          <>
            <div className="space-y-4">
              <Input
                label="Nombre"
                placeholder="Ej: Mesa Familiar, Mesa VIP"
                value={editingMesa.nombre}
                onChange={(e) => setEditingMesa({ ...editingMesa, nombre: e.target.value })}
              />
              <Input
                label="Número (opcional)"
                type="number"
                placeholder="Ej: 1, 2, 3..."
                value={editingMesa.numero || ''}
                onChange={(e) => setEditingMesa({ ...editingMesa, numero: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de mesa
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={editingMesa.tipo}
                  onChange={(e) => setEditingMesa({ ...editingMesa, tipo: e.target.value })}
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
                value={editingMesa.capacidad}
                onChange={(e) => setEditingMesa({ ...editingMesa, capacidad: parseInt(e.target.value) || 8 })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingMesa(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleUpdateMesa(editingMesa.id, {
                  nombre: editingMesa.nombre,
                  numero: editingMesa.numero,
                  tipo: editingMesa.tipo,
                  capacidad: editingMesa.capacidad,
                })}
                isLoading={actualizarMesa.isPending}
              >
                Guardar
              </Button>
            </div>
          </>
        )}
      </Drawer>

      {/* Modal confirmar eliminar mesa */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleDeleteMesa}
        title="Eliminar Mesa"
        message={`¿Estás seguro de eliminar la mesa "${getModalData('delete')?.nombre}"? Los invitados asignados serán desasignados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminarMesa.isPending}
      />

      {/* Drag Overlay - solo para invitados */}
      <DragOverlay>
        {activeId && dragType === 'invitado' && (
          <div className="bg-white dark:bg-gray-800 border-2 border-pink-400 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {invitadosData?.invitados?.find((i) => i.id === parseInt(String(activeId).replace('invitado-', '')))?.nombre}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

export default SeatingChartEditor;
