/**
 * ====================================================================
 * HOOK - COMBOS Y MODIFICADORES PARA POS
 * ====================================================================
 *
 * Hook combinado que orquesta combos y modificadores durante
 * el proceso de venta en el POS.
 *
 * Ene 2026 - Fase 3 POS
 * Feb 2026 - Extraído de useCombosModificadores.js
 * ====================================================================
 */

import { useVerificarCombo, useCombo } from './useCombos';
import { useTieneModificadores, useModificadoresProducto } from './useModificadores';

// ========================================================================
// HOOK COMBINADO PARA POS
// ========================================================================

/**
 * Hook combinado para uso en el POS
 * Proporciona toda la funcionalidad necesaria para manejar combos y modificadores
 * durante el proceso de venta.
 *
 * @param {number} productoId - ID del producto seleccionado (opcional)
 * @returns {Object} Estado y métodos para combos/modificadores
 */
export function useCombosModificadoresPOS(productoId = null) {
    // Verificar si es combo
    const { data: esComboData, isLoading: loadingEsCombo } = useVerificarCombo(productoId, {
        enabled: !!productoId,
    });

    // Obtener datos del combo si aplica
    const { data: comboData, isLoading: loadingCombo } = useCombo(productoId, {
        enabled: !!productoId && esComboData?.es_combo === true,
    });

    // Verificar si tiene modificadores
    const { data: tieneModificadoresData, isLoading: loadingTieneModificadores } = useTieneModificadores(productoId, {
        enabled: !!productoId,
    });

    // Obtener modificadores si aplica
    const { data: modificadoresData, isLoading: loadingModificadores } = useModificadoresProducto(productoId, {
        enabled: !!productoId && tieneModificadoresData?.tiene_modificadores === true,
    });

    // Estado derivado
    const esCombo = esComboData?.es_combo === true;
    const tieneModificadores = tieneModificadoresData?.tiene_modificadores === true;
    const requiereSeleccion = esCombo || tieneModificadores;

    const isLoading = loadingEsCombo || loadingCombo || loadingTieneModificadores || loadingModificadores;

    return {
        // Estado
        esCombo,
        tieneModificadores,
        requiereSeleccion,
        isLoading,

        // Datos
        combo: comboData,
        modificadores: modificadoresData,

        // Métodos para calcular precio con modificadores
        calcularPrecioConModificadores: (precioBase, modificadoresSeleccionados = []) => {
            const precioAdicional = modificadoresSeleccionados.reduce((sum, mod) => {
                return sum + (parseFloat(mod.precio_adicional) || 0);
            }, 0);
            return parseFloat(precioBase) + precioAdicional;
        },

        // Formatear descripción de modificadores para el carrito
        formatearDescripcionModificadores: (modificadoresSeleccionados = []) => {
            if (!modificadoresSeleccionados.length) return '';
            return modificadoresSeleccionados
                .map(mod => `${mod.prefijo ? mod.prefijo + ' ' : ''}${mod.nombre}`)
                .join(', ');
        },

        // Validar selección de modificadores obligatorios
        validarSeleccionObligatoria: (grupos = [], seleccion = {}) => {
            const gruposObligatorios = grupos.filter(g => g.es_obligatorio);
            const faltantes = gruposObligatorios.filter(g => {
                const seleccionGrupo = seleccion[g.id] || [];
                const cantidad = Array.isArray(seleccionGrupo) ? seleccionGrupo.length : (seleccionGrupo ? 1 : 0);
                return cantidad < (g.minimo_seleccion || 1);
            });
            return {
                valido: faltantes.length === 0,
                faltantes: faltantes.map(g => g.nombre),
            };
        },
    };
}
