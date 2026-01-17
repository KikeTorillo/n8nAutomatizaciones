/**
 * ====================================================================
 * CLIENTE TIMELINE - TIMELINE UNIFICADO DE ACTIVIDADES
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * Muestra el timeline completo del cliente (notas, citas, ventas, tareas)
 *
 * ====================================================================
 */

import { useState, useCallback } from 'react';
import { History, RefreshCw, Filter, Loader2 } from 'lucide-react';
import {
  useTimelineCliente,
  useCrearActividad,
  useCompletarTarea,
  useEliminarActividad,
  TIPOS_TIMELINE,
} from '@/hooks/personas';
import TimelineItem from './TimelineItem';
import QuickNoteInput from './QuickNoteInput';
import TareaDrawer from './TareaDrawer';
import { ConfirmDialog, EmptyState } from '@/components/ui';
import { useToast } from '@/hooks/utils';

export default function ClienteTimeline({
  clienteId,
  usuarios = [],
  limit = 20,
}) {
  const { toast } = useToast();

  // Estado para filtros
  const [filtroTipo, setFiltroTipo] = useState(null);

  // Estado para drawer de tarea
  const [tareaDrawerOpen, setTareaDrawerOpen] = useState(false);

  // Estado para confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, item: null });

  // Queries y mutations
  const {
    data: timeline,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useTimelineCliente(clienteId, { limit });

  const crearActividad = useCrearActividad();
  const completarTarea = useCompletarTarea();
  const eliminarActividad = useEliminarActividad();

  // Filtrar timeline por tipo
  const timelineFiltrado = filtroTipo
    ? timeline?.timeline?.filter((item) => item.tipo === filtroTipo)
    : timeline?.timeline;

  // Handlers
  const handleCrearNota = useCallback(async (data) => {
    try {
      await crearActividad.mutateAsync({
        clienteId,
        data,
      });
      toast('Nota agregada al timeline', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo agregar la nota', { type: 'error' });
    }
  }, [clienteId, crearActividad, toast]);

  const handleCrearTarea = useCallback(async (data) => {
    try {
      await crearActividad.mutateAsync({
        clienteId,
        data,
      });
      toast('Tarea creada exitosamente', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo crear la tarea', { type: 'error' });
    }
  }, [clienteId, crearActividad, toast]);

  const handleCompletarTarea = useCallback(async (item) => {
    try {
      await completarTarea.mutateAsync({
        clienteId,
        actividadId: item.id,
      });
      toast('Tarea marcada como completada', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo completar la tarea', { type: 'error' });
    }
  }, [clienteId, completarTarea, toast]);

  const handleEliminar = useCallback((item) => {
    setDeleteConfirm({ open: true, item });
  }, []);

  const confirmEliminar = useCallback(async () => {
    if (!deleteConfirm.item) return;

    try {
      await eliminarActividad.mutateAsync({
        clienteId,
        actividadId: deleteConfirm.item.id,
      });
      toast('Actividad eliminada del timeline', { type: 'success' });
    } catch (error) {
      toast(error.message || 'No se pudo eliminar la actividad', { type: 'error' });
    } finally {
      setDeleteConfirm({ open: false, item: null });
    }
  }, [clienteId, deleteConfirm.item, eliminarActividad, toast]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error al cargar el timeline</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input rápido */}
      <QuickNoteInput
        onSubmit={handleCrearNota}
        onOpenTareaDrawer={() => setTareaDrawerOpen(true)}
        isLoading={crearActividad.isPending}
      />

      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Historial
          </h3>
          {timeline?.total > 0 && (
            <span className="text-sm text-gray-500">
              ({timeline.total} eventos)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro por tipo */}
          <div className="relative">
            <select
              value={filtroTipo || ''}
              onChange={(e) => setFiltroTipo(e.target.value || null)}
              className="
                appearance-none pl-8 pr-8 py-1.5 rounded-lg text-sm
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                text-gray-700 dark:text-gray-300
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            >
              <option value="">Todos</option>
              {TIPOS_TIMELINE.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Botón refrescar */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      {timelineFiltrado?.length > 0 ? (
        <div className="relative">
          {timelineFiltrado.map((item) => (
            <TimelineItem
              key={`${item.tipo}-${item.id}`}
              item={item}
              onComplete={handleCompletarTarea}
              onDelete={handleEliminar}
              isLoading={completarTarea.isPending || eliminarActividad.isPending}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="Sin actividad"
          description={
            filtroTipo
              ? `No hay ${TIPOS_TIMELINE.find(t => t.value === filtroTipo)?.label.toLowerCase() || 'actividades'} para mostrar`
              : 'Agrega una nota o registra una actividad para comenzar'
          }
        />
      )}

      {/* Drawer para tareas */}
      <TareaDrawer
        isOpen={tareaDrawerOpen}
        onClose={() => setTareaDrawerOpen(false)}
        onSubmit={handleCrearTarea}
        isLoading={crearActividad.isPending}
        usuarios={usuarios}
      />

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, item: null })}
        onConfirm={confirmEliminar}
        title="Eliminar actividad"
        description={`¿Estás seguro de eliminar "${deleteConfirm.item?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={eliminarActividad.isPending}
      />
    </div>
  );
}
