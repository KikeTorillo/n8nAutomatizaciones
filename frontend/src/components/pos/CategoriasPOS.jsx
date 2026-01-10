import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Grid3X3, Package } from 'lucide-react';

/**
 * Tabs horizontales de categorías para POS
 * Permite filtrar productos por categoría con scroll táctil
 */
export default function CategoriasPOS({
  categorias = [],
  categoriaActiva,
  onCategoriaChange,
  isLoading = false
}) {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Verificar si necesita flechas de scroll
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categorias]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Agregar "Todos" como primera opción
  const categoriasConTodos = [
    { id: null, nombre: 'Todos', icono: 'grid', productos_count: null },
    ...categorias
  ];

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Flecha izquierda */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 shadow-lg rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Contenedor de tabs con scroll */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categoriasConTodos.map((categoria) => {
          const isActive = categoriaActiva === categoria.id;

          return (
            <button
              key={categoria.id ?? 'todos'}
              onClick={() => onCategoriaChange(categoria.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                whitespace-nowrap transition-all flex-shrink-0
                ${isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {categoria.id === null ? (
                <Grid3X3 className="h-4 w-4" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              <span>{categoria.nombre}</span>
              {categoria.productos_count !== null && categoria.productos_count > 0 && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {categoria.productos_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Flecha derecha */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-gray-800 shadow-lg rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
