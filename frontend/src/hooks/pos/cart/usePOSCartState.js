import { useState, useRef } from 'react';

/**
 * Hook para el estado puro del carrito POS
 * Ene 2026: Extraído de usePOSCart para modularización
 *
 * Responsabilidades:
 * - Estado del carrito (items, cliente, descuentos)
 * - Cache de precios
 * - Setters básicos
 */
export function usePOSCartState() {
  // Estado del carrito
  const [items, setItems] = useState([]);
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [cuponActivo, setCuponActivo] = useState(null);
  const [descuentoPuntos, setDescuentoPuntos] = useState(0);
  const [puntosCanjeados, setPuntosCanjeados] = useState(0);
  const [recalculandoPrecios, setRecalculandoPrecios] = useState(false);

  // Cache de precios
  const preciosCache = useRef(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Ref para detectar cambios de cliente
  const clienteIdRef = useRef(null);

  return {
    // Estado
    items,
    setItems,
    descuentoGlobal,
    setDescuentoGlobal,
    clienteSeleccionado,
    setClienteSeleccionado,
    cuponActivo,
    setCuponActivo,
    descuentoPuntos,
    setDescuentoPuntos,
    puntosCanjeados,
    setPuntosCanjeados,
    recalculandoPrecios,
    setRecalculandoPrecios,

    // Cache
    preciosCache,
    CACHE_TTL,
    clienteIdRef,
  };
}

export default usePOSCartState;
