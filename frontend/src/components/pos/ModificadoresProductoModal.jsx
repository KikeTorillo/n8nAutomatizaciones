/**
 * ====================================================================
 * COMPONENTE - MODAL DE MODIFICADORES DE PRODUCTO
 * ====================================================================
 *
 * Modal para seleccionar modificadores al agregar un producto al carrito:
 * - Grupos de modificadores (Tamaño, Extras, etc.)
 * - Selección única (radio) o múltiple (checkbox)
 * - Precios adicionales por modificador
 * - Validación de selecciones obligatorias
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Check, AlertCircle, Package, Sliders } from 'lucide-react';
import { useModificadoresProducto, useCombo, useVerificarCombo } from '@/hooks/pos';

/**
 * Modal para seleccionar modificadores de un producto
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.producto - Producto seleccionado { id, nombre, precio, ... }
 * @param {Function} props.onConfirmar - Callback({ cantidad, modificadoresSeleccionados, precioTotal, descripcionModificadores })
 */
export default function ModificadoresProductoModal({
  isOpen,
  onClose,
  producto,
  onConfirmar,
}) {
  const [cantidad, setCantidad] = useState(1);
  const [selecciones, setSelecciones] = useState({}); // { grupoId: [modificadorId, ...] }

  // Consultas
  const { data: esComboData } = useVerificarCombo(producto?.id, {
    enabled: isOpen && !!producto?.id,
  });

  const { data: comboData, isLoading: loadingCombo } = useCombo(producto?.id, {
    enabled: isOpen && !!producto?.id && esComboData?.es_combo === true,
  });

  const { data: modificadoresData, isLoading: loadingModificadores } = useModificadoresProducto(producto?.id, {
    enabled: isOpen && !!producto?.id,
  });

  const esCombo = esComboData?.es_combo === true;
  const grupos = modificadoresData || [];
  const isLoading = loadingCombo || loadingModificadores;

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setCantidad(1);
      setSelecciones({});
    }
  }, [isOpen, producto?.id]);

  // Calcular precio con modificadores
  const precioCalculado = useMemo(() => {
    let precioBase = parseFloat(producto?.precio || 0);

    // Si es combo con precio calculado
    if (esCombo && comboData?.precio_calculado) {
      precioBase = parseFloat(comboData.precio_calculado);
    }

    // Sumar precios de modificadores seleccionados
    let precioModificadores = 0;
    Object.entries(selecciones).forEach(([grupoId, modIds]) => {
      const grupo = grupos.find(g => (g.grupo_id || g.id) === parseInt(grupoId));
      const mods = grupo?.modificadores || [];
      if (mods.length > 0) {
        modIds.forEach(modId => {
          const mod = mods.find(m => m.id === modId);
          if (mod?.precio_adicional) {
            precioModificadores += parseFloat(mod.precio_adicional);
          }
        });
      }
    });

    return precioBase + precioModificadores;
  }, [producto, esCombo, comboData, grupos, selecciones]);

  // Validar selecciones obligatorias
  const validacion = useMemo(() => {
    const gruposObligatorios = grupos.filter(g => g.requerido || g.es_obligatorio);
    const faltantes = [];

    gruposObligatorios.forEach(grupo => {
      const grupoIdKey = grupo.grupo_id || grupo.id;
      const seleccionGrupo = selecciones[grupoIdKey] || [];
      const minimo = grupo.minimo_seleccion || 1;

      if (seleccionGrupo.length < minimo) {
        faltantes.push({
          grupo: grupo.grupo_nombre || grupo.nombre,
          minimo,
          actual: seleccionGrupo.length,
        });
      }
    });

    return {
      valido: faltantes.length === 0,
      faltantes,
    };
  }, [grupos, selecciones]);

  // Obtener modificadores seleccionados con datos completos
  const modificadoresSeleccionados = useMemo(() => {
    const resultado = [];

    Object.entries(selecciones).forEach(([grupoId, modIds]) => {
      const grupo = grupos.find(g => (g.grupo_id || g.id) === parseInt(grupoId));
      const mods = grupo?.modificadores || [];
      if (mods.length > 0) {
        modIds.forEach(modId => {
          const mod = mods.find(m => m.id === modId);
          if (mod) {
            resultado.push({
              ...mod,
              grupo_id: grupo.grupo_id || grupo.id,
              grupo_nombre: grupo.grupo_nombre || grupo.nombre,
            });
          }
        });
      }
    });

    return resultado;
  }, [grupos, selecciones]);

  // Formatear descripción de modificadores
  const descripcionModificadores = useMemo(() => {
    if (modificadoresSeleccionados.length === 0) return '';

    return modificadoresSeleccionados
      .map(mod => `${mod.prefijo ? mod.prefijo + ' ' : ''}${mod.nombre}`)
      .join(', ');
  }, [modificadoresSeleccionados]);

  if (!isOpen || !producto) return null;

  // Handlers
  const handleSeleccionUnica = (grupoId, modificadorId) => {
    setSelecciones(prev => ({
      ...prev,
      [grupoId]: [modificadorId],
    }));
  };

  const handleSeleccionMultiple = (grupoId, modificadorId, grupo) => {
    setSelecciones(prev => {
      const seleccionActual = prev[grupoId] || [];
      const yaSeleccionado = seleccionActual.includes(modificadorId);
      const maximo = grupo.maximo_seleccion || Infinity;

      if (yaSeleccionado) {
        // Deseleccionar
        return {
          ...prev,
          [grupoId]: seleccionActual.filter(id => id !== modificadorId),
        };
      } else if (seleccionActual.length < maximo) {
        // Seleccionar si no excede máximo
        return {
          ...prev,
          [grupoId]: [...seleccionActual, modificadorId],
        };
      }

      return prev;
    });
  };

  const handleConfirmar = () => {
    if (!validacion.valido) return;

    onConfirmar({
      cantidad,
      modificadoresSeleccionados,
      precioUnitario: precioCalculado,
      precioTotal: precioCalculado * cantidad,
      descripcionModificadores,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
              {esCombo ? (
                <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              ) : (
                <Sliders className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {producto.nombre}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {esCombo ? 'Combo' : 'Personalizar producto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Componentes del combo */}
              {esCombo && comboData?.componentes?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Incluye:
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                    {comboData.componentes.map((comp, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {comp.cantidad}x {comp.producto_nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grupos de modificadores */}
              {grupos.length > 0 ? (
                <div className="space-y-6">
                  {grupos.map((grupo) => {
                    const grupoId = grupo.grupo_id || grupo.id;
                    const grupoNombre = grupo.grupo_nombre || grupo.nombre;
                    const esObligatorio = grupo.requerido || grupo.es_obligatorio;

                    return (
                    <div key={grupoId}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {grupoNombre}
                          {esObligatorio && (
                            <span className="ml-2 text-xs text-red-500">*Obligatorio</span>
                          )}
                        </h3>
                        {grupo.tipo_seleccion === 'multiple' && grupo.maximo_seleccion && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Máx. {grupo.maximo_seleccion}
                          </span>
                        )}
                      </div>

                      {grupo.descripcion && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          {grupo.descripcion}
                        </p>
                      )}

                      <div className="space-y-2">
                        {grupo.modificadores?.map((mod) => {
                          const seleccionGrupo = selecciones[grupoId] || [];
                          const isSelected = seleccionGrupo.includes(mod.id);
                          const esUnico = grupo.tipo_seleccion === 'unico';

                          return (
                            <button
                              key={mod.id}
                              onClick={() =>
                                esUnico
                                  ? handleSeleccionUnica(grupoId, mod.id)
                                  : handleSeleccionMultiple(grupoId, mod.id, grupo)
                              }
                              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Radio o Checkbox */}
                                <div
                                  className={`w-5 h-5 rounded-${esUnico ? 'full' : 'md'} border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>

                                <div className="text-left">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {mod.prefijo && (
                                      <span className="text-gray-500 dark:text-gray-400 mr-1">
                                        {mod.prefijo}
                                      </span>
                                    )}
                                    {mod.nombre}
                                  </span>
                                  {mod.descripcion && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {mod.descripcion}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Precio adicional */}
                              {parseFloat(mod.precio_adicional) > 0 && (
                                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                  +${parseFloat(mod.precio_adicional).toLocaleString('es-MX', {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : !esCombo ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Sliders className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Este producto no tiene modificadores</p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer fijo */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
          {/* Mensaje de validación */}
          {!validacion.valido && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">
                Selecciona: {validacion.faltantes.map(f => f.grupo).join(', ')}
              </span>
            </div>
          )}

          {/* Selector de cantidad */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cantidad
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-lg font-semibold text-gray-900 dark:text-white">
                {cantidad}
              </span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resumen del precio */}
          <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total
              </span>
              {modificadoresSeleccionados.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                  {descripcionModificadores}
                </p>
              )}
            </div>
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
              ${(precioCalculado * cantidad).toLocaleString('es-MX', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!validacion.valido}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
