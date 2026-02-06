import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { ICONOS_MAP, CATEGORIAS_ICONOS } from '@/components/ui/organisms/icon-picker/constants';

interface UseIconPickerLogicOptions {
  /** Máximo de iconos a mostrar en la lista filtrada */
  maxItems?: number;
  /** Máximo de categorías a mostrar */
  maxCategories?: number;
  /** Cerrar al seleccionar (para compact) */
  onSelectClose?: () => void;
}

/**
 * useIconPickerLogic - Lógica compartida entre IconPicker e IconPickerCompact
 *
 * Extrae: todosLosIconos, iconosFiltrados, renderIcon, state management
 */
export function useIconPickerLogic({
  maxItems,
  maxCategories,
  onSelectClose,
}: UseIconPickerLogicOptions = {}) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);

  const todosLosIconos = useMemo(() => Object.keys(ICONOS_MAP), []);

  const categorias = useMemo(
    () => (maxCategories ? CATEGORIAS_ICONOS.slice(0, maxCategories) : CATEGORIAS_ICONOS),
    [maxCategories]
  );

  const iconosFiltrados = useMemo(() => {
    let lista = todosLosIconos;

    if (categoriaActiva) {
      const cat = CATEGORIAS_ICONOS.find((c) => c.nombre === categoriaActiva);
      if (cat) lista = cat.iconos.filter((i) => ICONOS_MAP[i]);
    }

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      lista = lista.filter((nombre) => nombre.toLowerCase().includes(termino));
    }

    return maxItems ? lista.slice(0, maxItems) : lista;
  }, [busqueda, categoriaActiva, todosLosIconos, maxItems]);

  const totalFiltrados = useMemo(() => {
    let lista = todosLosIconos;

    if (categoriaActiva) {
      const cat = CATEGORIAS_ICONOS.find((c) => c.nombre === categoriaActiva);
      if (cat) lista = cat.iconos.filter((i) => ICONOS_MAP[i]);
    }

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      lista = lista.filter((nombre) => nombre.toLowerCase().includes(termino));
    }

    return lista.length;
  }, [busqueda, categoriaActiva, todosLosIconos]);

  const renderIcon = useCallback((nombreIcono: string, size = 20): ReactNode => {
    const IconComponent = ICONOS_MAP[nombreIcono];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  }, []);

  const handleSelect = useCallback(
    (nombreIcono: string, onChange: (nombre: string) => void) => {
      onChange(nombreIcono);
      onSelectClose?.();
      if (onSelectClose) setBusqueda('');
    },
    [onSelectClose]
  );

  const resetSearch = useCallback(() => {
    setBusqueda('');
    setCategoriaActiva(null);
  }, []);

  return {
    busqueda,
    setBusqueda,
    categoriaActiva,
    setCategoriaActiva,
    todosLosIconos,
    categorias,
    iconosFiltrados,
    totalFiltrados,
    renderIcon,
    handleSelect,
    resetSearch,
  };
}
