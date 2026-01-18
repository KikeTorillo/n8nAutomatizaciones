import { useEffect, useState, useMemo } from 'react';

/**
 * Hook para calcular totales de servicios seleccionados (duración y precio)
 *
 * @param {Array<string>} serviciosIds - IDs de servicios seleccionados
 * @param {Array} serviciosDisponiblesConEstado - Servicios con estado de disponibilidad
 * @param {Array} serviciosCatalogo - Catálogo general de servicios (fallback)
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {boolean} isEditMode - Si está en modo edición
 * @param {Function} setValue - Función para actualizar valores del formulario
 */
export function useServicesTotalCalculation({
  serviciosIds,
  serviciosDisponiblesConEstado,
  serviciosCatalogo,
  isOpen,
  isEditMode,
  setValue,
}) {
  const [precioCalculado, setPrecioCalculado] = useState(0);

  // Calcular totales de servicios seleccionados
  useEffect(() => {
    // Guard: No ejecutar si el modal está cerrado
    if (!isOpen) return;

    if (serviciosIds && serviciosIds.length > 0) {
      // Calcular totales sumando TODOS los servicios seleccionados
      let duracionTotal = 0;
      let precioTotal = 0;

      // Usar serviciosDisponiblesConEstado que funciona tanto con profesional específico como con Round-Robin
      // Si está vacío, usar el catálogo general de servicios
      const listaServicios = serviciosDisponiblesConEstado.length > 0
        ? serviciosDisponiblesConEstado
        : (serviciosCatalogo?.servicios || []);

      serviciosIds.forEach((servicioId) => {
        const servicio = listaServicios.find(
          (s) => s.id === parseInt(servicioId)
        );
        if (servicio) {
          duracionTotal += servicio.duracion_minutos || 0;
          precioTotal += parseFloat(servicio.precio) || 0;
        }
      });

      setValue('duracion_minutos', duracionTotal);
      setValue('precio_servicio', precioTotal);
    } else if (isOpen && !isEditMode) {
      // Si no hay servicios seleccionados y es modo crear, resetear a 0
      // No resetear en modo edición para preservar valores cargados
      setValue('duracion_minutos', 0);
      setValue('precio_servicio', 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, serviciosIds, serviciosDisponiblesConEstado, serviciosCatalogo, isEditMode]);

  // Calcular precio total con descuento
  const calcularPrecioTotal = (precio, descuento) => {
    const p = parseFloat(precio) || 0;
    const d = parseFloat(descuento) || 0;
    setPrecioCalculado(p - d);
    return p - d;
  };

  // Mostrar duración como texto calculado (solo si hay servicios y no es edit)
  const mostrarDuracionCalculada = useMemo(() => {
    return !isEditMode && serviciosIds?.length > 0;
  }, [isEditMode, serviciosIds]);

  // Mostrar precio como texto calculado (solo si hay servicios y no es edit)
  const mostrarPrecioCalculado = useMemo(() => {
    return !isEditMode && serviciosIds?.length > 0;
  }, [isEditMode, serviciosIds]);

  return {
    precioCalculado,
    setPrecioCalculado,
    calcularPrecioTotal,
    mostrarDuracionCalculada,
    mostrarPrecioCalculado,
  };
}

export default useServicesTotalCalculation;
