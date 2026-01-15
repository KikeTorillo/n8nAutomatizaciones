import { useState } from 'react';
import { useModalManager } from '@/hooks/useModalManager';
import {
  FileText,
  Plus,
  MoreVertical,
  Trash2,
  Edit3,
  Home,
  GripVertical,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useReordenarPaginas } from '@/hooks/useWebsite';

/**
 * PageManager - Gestión de páginas del sitio
 */
function PageManager({
  paginas,
  paginaActiva,
  onSeleccionar,
  onCrear,
  onActualizar,
  onEliminar,
}) {
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Modales centralizados
  const { openModal, closeModal, isOpen, getModalData } = useModalManager({
    delete: { isOpen: false, data: null },
  });

  const reordenarPaginas = useReordenarPaginas();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = paginas.findIndex(p => p.id === active.id);
      const newIndex = paginas.findIndex(p => p.id === over.id);

      const nuevasPositiones = arrayMove(paginas, oldIndex, newIndex);
      const ordenamiento = nuevasPositiones.map((p, idx) => ({
        id: p.id,
        orden: idx
      }));

      try {
        await reordenarPaginas.mutateAsync(ordenamiento);
      } catch (error) {
        toast.error('Error al reordenar páginas');
      }
    }
  };

  const handleCrearPagina = async (datos) => {
    try {
      await onCrear(datos);
      setMostrarNueva(false);
      toast.success('Página creada');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear página');
    }
  };

  const handleEliminar = async () => {
    const paginaAEliminar = getModalData('delete');
    if (!paginaAEliminar) return;

    setEliminando(true);
    try {
      await onEliminar(paginaAEliminar.id);
      if (paginaActiva?.id === paginaAEliminar.id) {
        const otraPagina = paginas.find(p => p.id !== paginaAEliminar.id);
        onSeleccionar(otraPagina);
      }
      toast.success('Página eliminada');
      closeModal('delete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setEliminando(false);
    }
    setMenuAbiertoId(null);
  };

  const handleConfirmarEliminar = (pagina) => {
    if (pagina.es_inicio) {
      toast.error('No puedes eliminar la página de inicio');
      return;
    }
    openModal('delete', pagina);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Páginas</h3>
          <button
            onClick={() => setMostrarNueva(true)}
            className="p-1.5 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Arrastra para reordenar el menú
        </p>
      </div>

      {/* Lista de páginas */}
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={paginas.map(p => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {paginas.map((pagina) => (
              <PaginaItem
                key={pagina.id}
                pagina={pagina}
                isActive={paginaActiva?.id === pagina.id}
                isEditing={editandoId === pagina.id}
                menuAbierto={menuAbiertoId === pagina.id}
                onSelect={() => onSeleccionar(pagina)}
                onEdit={() => setEditandoId(pagina.id)}
                onCancelEdit={() => setEditandoId(null)}
                onSaveEdit={async (datos) => {
                  try {
                    await onActualizar({ id: pagina.id, data: datos });
                    setEditandoId(null);
                    toast.success('Página actualizada');
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Error');
                  }
                }}
                onDelete={() => handleConfirmarEliminar(pagina)}
                onToggleMenu={() => setMenuAbiertoId(
                  menuAbiertoId === pagina.id ? null : pagina.id
                )}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Formulario nueva página */}
        {mostrarNueva && (
          <NuevaPaginaForm
            onCrear={handleCrearPagina}
            onCancelar={() => setMostrarNueva(false)}
          />
        )}
      </div>

      {/* Modal confirmar eliminar página */}
      <ConfirmDialog
        isOpen={isOpen('delete')}
        onClose={() => closeModal('delete')}
        onConfirm={handleEliminar}
        title="Eliminar Página"
        message={`¿Estás seguro de eliminar la página "${getModalData('delete')?.titulo}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={eliminando}
      />
    </div>
  );
}

/**
 * Item de página sorteable
 */
function PaginaItem({
  pagina,
  isActive,
  isEditing,
  menuAbierto,
  onSelect,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onToggleMenu,
}) {
  const [titulo, setTitulo] = useState(pagina.titulo);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pagina.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (isEditing) {
    return (
      <div className="p-2 bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-700 rounded-lg mb-1">
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          autoFocus
        />
        <div className="flex justify-end gap-1 mt-2">
          <button
            onClick={onCancelEdit}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSaveEdit({ titulo })}
            className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded text-primary-600 dark:text-primary-400"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 p-2 rounded-lg mb-1 cursor-pointer transition-colors
        ${isActive
          ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
        }
      `}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Contenido */}
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center gap-2">
          {pagina.es_inicio ? (
            <Home className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
          <span className={`text-sm truncate ${isActive ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
            {pagina.titulo}
          </span>
        </div>
        {pagina.slug && (
          <p className="text-xs text-gray-400 dark:text-gray-500 ml-6 truncate">/{pagina.slug}</p>
        )}
      </div>

      {/* Menú */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>

        {menuAbierto && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 w-32">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
                onToggleMenu();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </button>
            {!pagina.es_inicio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Formulario para crear nueva página
 */
function NuevaPaginaForm({ onCrear, onCancelar }) {
  const [form, setForm] = useState({ titulo: '', slug: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [slugManual, setSlugManual] = useState(false);

  // Auto-generar slug
  const handleTituloChange = (e) => {
    const titulo = e.target.value;
    setForm(prev => ({
      ...prev,
      titulo,
      slug: slugManual ? prev.slug : titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    setIsLoading(true);
    try {
      await onCrear(form);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="mb-3">
        <input
          type="text"
          value={form.titulo}
          onChange={handleTituloChange}
          placeholder="Título de la página"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          autoFocus
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          value={form.slug}
          onChange={(e) => {
            setSlugManual(true);
            setForm(prev => ({
              ...prev,
              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
            }));
          }}
          placeholder="url-de-la-pagina"
          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading || !form.titulo.trim()}
          className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear
        </button>
      </div>
    </form>
  );
}

export default PageManager;
