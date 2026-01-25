/**
 * ====================================================================
 * SLASH MENU
 * ====================================================================
 * Menú contextual que aparece al escribir "/" en el editor.
 * Permite insertar bloques rápidamente mediante comandos.
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout,
  Briefcase,
  MessageCircle,
  Users,
  Megaphone,
  Mail,
  FileText,
  Image,
  Video,
  Minus,
  Sparkles,
  Search,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ========== BLOCK TYPES ==========

const BLOCK_TYPES = [
  {
    id: 'hero',
    label: 'Hero',
    description: 'Sección principal con título y llamada a la acción',
    icon: Layout,
    category: 'estructura',
    keywords: ['hero', 'banner', 'principal', 'inicio', 'header'],
  },
  {
    id: 'servicios',
    label: 'Servicios',
    description: 'Lista de servicios o características',
    icon: Briefcase,
    category: 'contenido',
    keywords: ['servicios', 'features', 'caracteristicas', 'productos'],
  },
  {
    id: 'testimonios',
    label: 'Testimonios',
    description: 'Reseñas y opiniones de clientes',
    icon: MessageCircle,
    category: 'social',
    keywords: ['testimonios', 'reviews', 'opiniones', 'reseñas', 'clientes'],
  },
  {
    id: 'equipo',
    label: 'Equipo',
    description: 'Presenta a los miembros del equipo',
    icon: Users,
    category: 'contenido',
    keywords: ['equipo', 'team', 'personas', 'staff', 'miembros'],
  },
  {
    id: 'cta',
    label: 'Llamada a la Acción',
    description: 'Botón destacado con mensaje persuasivo',
    icon: Megaphone,
    category: 'conversion',
    keywords: ['cta', 'call to action', 'boton', 'accion', 'conversion'],
  },
  {
    id: 'contacto',
    label: 'Contacto',
    description: 'Formulario de contacto',
    icon: Mail,
    category: 'conversion',
    keywords: ['contacto', 'formulario', 'form', 'email', 'mensaje'],
  },
  {
    id: 'texto',
    label: 'Texto',
    description: 'Bloque de texto enriquecido',
    icon: FileText,
    category: 'contenido',
    keywords: ['texto', 'parrafo', 'contenido', 'articulo', 'blog'],
  },
  {
    id: 'galeria',
    label: 'Galería',
    description: 'Grid de imágenes',
    icon: Image,
    category: 'media',
    keywords: ['galeria', 'imagenes', 'fotos', 'grid', 'portfolio'],
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Video de YouTube o Vimeo',
    icon: Video,
    category: 'media',
    keywords: ['video', 'youtube', 'vimeo', 'multimedia'],
  },
  {
    id: 'separador',
    label: 'Separador',
    description: 'Espacio o línea divisora',
    icon: Minus,
    category: 'estructura',
    keywords: ['separador', 'divider', 'linea', 'espacio', 'hr'],
  },
  {
    id: 'footer',
    label: 'Footer',
    description: 'Pie de página con enlaces y redes sociales',
    icon: Layers,
    category: 'estructura',
    keywords: ['footer', 'pie', 'enlaces', 'copyright'],
  },
];

const CATEGORIES = {
  estructura: { label: 'Estructura', order: 1 },
  contenido: { label: 'Contenido', order: 2 },
  media: { label: 'Media', order: 3 },
  social: { label: 'Social', order: 4 },
  conversion: { label: 'Conversión', order: 5 },
};

// ========== MAIN COMPONENT ==========

/**
 * SlashMenu
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el menú está abierto
 * @param {Object} props.position - Posición {x, y} del menú
 * @param {string} props.query - Texto de búsqueda después del "/"
 * @param {Function} props.onSelect - Callback al seleccionar un bloque
 * @param {Function} props.onClose - Callback para cerrar el menú
 * @param {Function} props.onGenerateAI - Callback para generar con IA
 */
function SlashMenu({
  isOpen,
  position = { x: 0, y: 0 },
  query = '',
  onSelect,
  onClose,
  onGenerateAI,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Filtrar bloques por query
  const filteredBlocks = BLOCK_TYPES.filter((block) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      block.label.toLowerCase().includes(q) ||
      block.description.toLowerCase().includes(q) ||
      block.keywords.some((k) => k.includes(q))
    );
  });

  // Agrupar por categoría
  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    const category = block.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(block);
    return acc;
  }, {});

  // Ordenar categorías
  const sortedCategories = Object.keys(groupedBlocks).sort(
    (a, b) => CATEGORIES[a].order - CATEGORIES[b].order
  );

  // Lista plana para navegación
  const flatList = sortedCategories.flatMap((cat) => groupedBlocks[cat]);

  // Reset index cuando cambia query
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatList.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatList.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (flatList[selectedIndex]) {
            onSelect?.(flatList[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatList, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const selectedItem = menuRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  // Track current flat index
  let currentFlatIndex = 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          left: Math.min(position.x, window.innerWidth - 320),
          top: Math.min(position.y, window.innerHeight - 400),
          width: 300,
          maxHeight: 380,
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Search className="w-4 h-4" />
            <span>{query ? `Buscando "${query}"` : 'Insertar bloque'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-72">
          {/* AI Generate Option */}
          {onGenerateAI && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => onGenerateAI?.()}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                  'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
                  'hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30',
                  'border border-purple-200/50 dark:border-purple-700/50'
                )}
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-purple-700 dark:text-purple-300 text-sm">
                    Generar con IA
                  </div>
                  <div className="text-xs text-purple-600/70 dark:text-purple-400/70">
                    Crea contenido automáticamente
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Block List */}
          {filteredBlocks.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No se encontraron bloques</p>
              <p className="text-xs mt-1">Prueba con otro término</p>
            </div>
          ) : (
            <div className="p-2">
              {sortedCategories.map((categoryKey) => (
                <div key={categoryKey} className="mb-2 last:mb-0">
                  {/* Category Label */}
                  <div className="px-3 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {CATEGORIES[categoryKey].label}
                  </div>

                  {/* Category Items */}
                  {groupedBlocks[categoryKey].map((block) => {
                    const flatIndex = currentFlatIndex++;
                    const isSelected = flatIndex === selectedIndex;

                    return (
                      <SlashMenuItem
                        key={block.id}
                        block={block}
                        isSelected={isSelected}
                        dataIndex={flatIndex}
                        onClick={() => onSelect?.(block.id)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">↑↓</kbd>
              {' '}navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">↵</kbd>
              {' '}seleccionar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd>
              {' '}cerrar
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ========== MENU ITEM ==========

const SlashMenuItem = memo(function SlashMenuItem({
  block,
  isSelected,
  dataIndex,
  onClick,
  onMouseEnter,
}) {
  const Icon = block.icon;

  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-lg',
          isSelected
            ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-600 dark:text-primary-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-medium text-sm truncate',
            isSelected
              ? 'text-primary-700 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {block.label}
        </div>
        <div
          className={cn(
            'text-xs truncate',
            isSelected
              ? 'text-primary-600/70 dark:text-primary-400/70'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {block.description}
        </div>
      </div>
    </button>
  );
});

// ========== HOOK FOR SLASH DETECTION ==========

/**
 * Hook para detectar cuando el usuario escribe "/" en un input
 * @param {Object} options
 * @param {Function} options.onTrigger - Callback cuando se detecta "/"
 * @returns {Object} { inputProps, slashState }
 */
export function useSlashDetection({ onTrigger }) {
  const [slashState, setSlashState] = useState({
    isActive: false,
    query: '',
    position: { x: 0, y: 0 },
  });

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === '/' && !slashState.isActive) {
        // Obtener posición del cursor
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          setSlashState({
            isActive: true,
            query: '',
            position: {
              x: rect.left,
              y: rect.bottom + 8,
            },
          });

          onTrigger?.();
          e.preventDefault();
        }
      } else if (slashState.isActive) {
        if (e.key === 'Escape') {
          setSlashState({ isActive: false, query: '', position: { x: 0, y: 0 } });
        } else if (e.key === 'Backspace' && slashState.query === '') {
          setSlashState({ isActive: false, query: '', position: { x: 0, y: 0 } });
        } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
          setSlashState((prev) => ({
            ...prev,
            query: prev.query + e.key,
          }));
          e.preventDefault();
        }
      }
    },
    [slashState, onTrigger]
  );

  const closeSlash = useCallback(() => {
    setSlashState({ isActive: false, query: '', position: { x: 0, y: 0 } });
  }, []);

  return {
    slashState,
    handleKeyDown,
    closeSlash,
  };
}

export default memo(SlashMenu);
