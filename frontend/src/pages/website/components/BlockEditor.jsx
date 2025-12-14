import { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Loader2,
  Layout,
  Briefcase,
  MessageSquareQuote,
  Users,
  MousePointerClick,
  Mail,
  PanelBottom,
  Type,
  Image,
  Video,
  Minus,
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

// Editores de bloques específicos
import HeroEditor from './blocks/HeroEditor';
import ServiciosEditor from './blocks/ServiciosEditor';
import TestimoniosEditor from './blocks/TestimoniosEditor';
import EquipoEditor from './blocks/EquipoEditor';
import CtaEditor from './blocks/CtaEditor';
import ContactoEditor from './blocks/ContactoEditor';
import FooterEditor from './blocks/FooterEditor';
import TextoEditor from './blocks/TextoEditor';
import GaleriaEditor from './blocks/GaleriaEditor';
import VideoEditor from './blocks/VideoEditor';
import SeparadorEditor from './blocks/SeparadorEditor';

/**
 * Iconos y colores por tipo de bloque
 */
const BLOQUES_CONFIG = {
  hero: { icon: Layout, color: 'purple', label: 'Hero' },
  servicios: { icon: Briefcase, color: 'blue', label: 'Servicios' },
  testimonios: { icon: MessageSquareQuote, color: 'amber', label: 'Testimonios' },
  equipo: { icon: Users, color: 'green', label: 'Equipo' },
  cta: { icon: MousePointerClick, color: 'red', label: 'CTA' },
  contacto: { icon: Mail, color: 'indigo', label: 'Contacto' },
  footer: { icon: PanelBottom, color: 'gray', label: 'Footer' },
  texto: { icon: Type, color: 'slate', label: 'Texto' },
  galeria: { icon: Image, color: 'pink', label: 'Galería' },
  video: { icon: Video, color: 'rose', label: 'Video' },
  separador: { icon: Minus, color: 'neutral', label: 'Separador' },
};

/**
 * Editores por tipo de bloque
 */
const EDITORES_BLOQUE = {
  hero: HeroEditor,
  servicios: ServiciosEditor,
  testimonios: TestimoniosEditor,
  equipo: EquipoEditor,
  cta: CtaEditor,
  contacto: ContactoEditor,
  footer: FooterEditor,
  texto: TextoEditor,
  galeria: GaleriaEditor,
  video: VideoEditor,
  separador: SeparadorEditor,
};

/**
 * BlockEditor - Editor principal de bloques
 */
function BlockEditor({
  pagina,
  bloques,
  bloqueSeleccionado,
  onSeleccionar,
  onActualizar,
  onEliminar,
  onDuplicar,
  onReordenar,
  isLoading,
  tema,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = bloques.findIndex(b => b.id === active.id);
      const newIndex = bloques.findIndex(b => b.id === over.id);

      const nuevasPositiones = arrayMove(bloques, oldIndex, newIndex);
      const ordenamiento = nuevasPositiones.map((b, idx) => ({
        id: b.id,
        orden: idx
      }));

      try {
        await onReordenar(ordenamiento);
      } catch (error) {
        toast.error('Error al reordenar bloques');
      }
    }
  };

  if (!pagina) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layout className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Selecciona una página
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Elige una página del panel de páginas para empezar a editarla
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (bloques.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layout className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Página vacía
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Agrega bloques desde la paleta de la izquierda para construir tu página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info de página */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{pagina.titulo}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">/{pagina.slug || ''}</p>
      </div>

      {/* Lista de bloques */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={bloques.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {bloques.map((bloque, index) => (
              <BloqueItem
                key={bloque.id}
                bloque={bloque}
                index={index}
                total={bloques.length}
                isSelected={bloqueSeleccionado?.id === bloque.id}
                onSelect={() => onSeleccionar(bloque)}
                onActualizar={(contenido) => onActualizar(bloque.id, contenido)}
                onEliminar={() => onEliminar(bloque.id)}
                onDuplicar={() => onDuplicar(bloque.id)}
                tema={tema}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/**
 * Item de bloque individual
 */
function BloqueItem({
  bloque,
  index,
  total,
  isSelected,
  onSelect,
  onActualizar,
  onEliminar,
  onDuplicar,
  tema,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const config = BLOQUES_CONFIG[bloque.tipo] || {
    icon: Layout,
    color: 'gray',
    label: bloque.tipo
  };
  const Icon = config.icon;

  const EditorComponent = EDITORES_BLOQUE[bloque.tipo];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bloque.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleGuardar = async (nuevoContenido) => {
    setIsSaving(true);
    try {
      await onActualizar(nuevoContenido);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = () => {
    onEliminar();
    setConfirmarEliminar(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border-2 transition-all
        ${isSelected
          ? 'border-primary-400 dark:border-primary-500 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${isDragging ? 'shadow-lg' : ''}
      `}
    >
      {/* Header del bloque */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => {
          onSelect();
          setIsExpanded(!isExpanded);
        }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Icono y tipo */}
        <div className={`p-2 rounded-lg bg-${config.color}-100`}>
          <Icon className={`w-5 h-5 text-${config.color}-600`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-gray-100">{config.label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Bloque {index + 1} de {total}</p>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-1">
          {isSaving && (
            <Loader2 className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicar();
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmarEliminar(true);
            }}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Editor expandido */}
      {isExpanded && EditorComponent && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <EditorComponent
            contenido={bloque.contenido || {}}
            onGuardar={handleGuardar}
            tema={tema}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Modal confirmar eliminar bloque */}
      <ConfirmDialog
        isOpen={confirmarEliminar}
        onClose={() => setConfirmarEliminar(false)}
        onConfirm={handleEliminar}
        title="Eliminar Bloque"
        message={`¿Estás seguro de eliminar el bloque "${config.label}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}

export default BlockEditor;
