/**
 * ====================================================================
 * HOOK - COMBOS Y MODIFICADORES
 * ====================================================================
 *
 * Hook para gestión de combos/paquetes y modificadores de productos
 * en el módulo POS de Nexo.
 *
 * Ene 2026 - Fase 3 POS
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// ========================================================================
// CONSTANTES
// ========================================================================

const QUERY_KEYS = {
    combos: 'combos',
    combo: 'combo',
    comboVerificar: 'combo-verificar',
    comboPrecio: 'combo-precio',
    comboStock: 'combo-stock',
    gruposModificadores: 'grupos-modificadores',
    modificadoresProducto: 'modificadores-producto',
    tieneModificadores: 'tiene-modificadores',
    asignacionesProducto: 'asignaciones-producto',
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const GC_TIME = 30 * 60 * 1000; // 30 minutos

// ========================================================================
// COMBOS / PAQUETES
// ========================================================================

/**
 * Hook para verificar si un producto es combo
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { es_combo }
 */
export function useVerificarCombo(productoId, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.comboVerificar, productoId],
        queryFn: () => posApi.verificarCombo(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para obtener un combo por producto ID
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con datos del combo
 */
export function useCombo(productoId, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.combo, productoId],
        queryFn: () => posApi.obtenerCombo(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para listar combos
 * @param {Object} params - Parámetros de búsqueda { limit, offset, busqueda, activo }
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con lista de combos paginada
 */
export function useCombos(params = {}, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.combos, params],
        queryFn: () => posApi.listarCombos(params),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para crear combo
 * @returns {Object} Mutation result
 */
export function useCrearCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => posApi.crearCombo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.combos], refetchType: 'active' });
            toast.success('Combo creado exitosamente');
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Combo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para actualizar combo
 * @returns {Object} Mutation result
 */
export function useActualizarCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, data }) => posApi.actualizarCombo(productoId, data),
        onSuccess: (_, { productoId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.combos], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.combo, productoId], refetchType: 'active' });
            toast.success('Combo actualizado exitosamente');
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('update', 'Combo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar combo
 * @returns {Object} Mutation result
 */
export function useEliminarCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, sucursalId }) => posApi.eliminarCombo(productoId, sucursalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.combos], refetchType: 'active' });
            toast.success('Combo eliminado exitosamente');
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Combo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para calcular precio de combo
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { precio }
 */
export function useComboPrecio(productoId, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.comboPrecio, productoId],
        queryFn: () => posApi.calcularPrecioCombo(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para verificar stock de combo
 * @param {number} productoId - ID del producto
 * @param {number} cantidad - Cantidad a verificar
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { disponible, componentes }
 */
export function useComboStock(productoId, cantidad = 1, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.comboStock, productoId, cantidad],
        queryFn: () => posApi.verificarStockCombo(productoId, cantidad),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIMES.REAL_TIME, // 30 segundos - stock cambia frecuentemente
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

// ========================================================================
// GRUPOS DE MODIFICADORES
// ========================================================================

/**
 * Hook para listar grupos de modificadores
 * @param {Object} params - { activo, incluir_modificadores }
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con lista de grupos
 */
export function useGruposModificadores(params = {}, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.gruposModificadores, params],
        queryFn: () => posApi.listarGruposModificadores(params),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para crear grupo de modificadores
 * @returns {Object} Mutation result
 */
export function useCrearGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => posApi.crearGrupoModificadores(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposModificadores], refetchType: 'active' });
            toast({
                title: 'Grupo creado',
                description: 'El grupo de modificadores se ha creado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Grupo de modificadores')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para actualizar grupo de modificadores
 * @returns {Object} Mutation result
 */
export function useActualizarGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => posApi.actualizarGrupoModificadores(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposModificadores], refetchType: 'active' });
            toast({
                title: 'Grupo actualizado',
                description: 'El grupo de modificadores se ha actualizado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('update', 'Grupo de modificadores')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar grupo de modificadores
 * @returns {Object} Mutation result
 */
export function useEliminarGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id) => posApi.eliminarGrupoModificadores(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposModificadores], refetchType: 'active' });
            toast({
                title: 'Grupo eliminado',
                description: 'El grupo de modificadores se ha eliminado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Grupo de modificadores')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

// ========================================================================
// MODIFICADORES
// ========================================================================

/**
 * Hook para crear modificador
 * @returns {Object} Mutation result
 */
export function useCrearModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => posApi.crearModificador(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposModificadores], refetchType: 'active' });
            toast({
                title: 'Modificador creado',
                description: 'El modificador se ha creado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Modificador')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para actualizar modificador
 * @returns {Object} Mutation result
 */
export function useActualizarModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => posApi.actualizarModificador(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposModificadores], refetchType: 'active' });
            toast({
                title: 'Modificador actualizado',
                description: 'El modificador se ha actualizado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('update', 'Modificador')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar modificador
 * @returns {Object} Mutation result
 */
export function useEliminarModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id) => posApi.eliminarModificador(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.gruposModificadores], refetchType: 'active' });
            toast({
                title: 'Modificador eliminado',
                description: 'El modificador se ha eliminado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Modificador')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

// ========================================================================
// MODIFICADORES DE PRODUCTO (Para uso en POS)
// ========================================================================

/**
 * Hook para obtener modificadores de un producto
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con grupos y modificadores del producto
 */
export function useModificadoresProducto(productoId, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.modificadoresProducto, productoId],
        queryFn: () => posApi.obtenerModificadoresProducto(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para verificar si un producto tiene modificadores
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { tiene_modificadores }
 */
export function useTieneModificadores(productoId, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.tieneModificadores, productoId],
        queryFn: () => posApi.tieneModificadores(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

// ========================================================================
// ASIGNACIONES DE GRUPOS A PRODUCTOS/CATEGORÍAS
// ========================================================================

/**
 * Hook para listar asignaciones de grupos a un producto
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con lista de asignaciones
 */
export function useAsignacionesProducto(productoId, options = {}) {
    return useQuery({
        queryKey: [QUERY_KEYS.asignacionesProducto, productoId],
        queryFn: () => posApi.listarAsignacionesProducto(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para asignar grupo a producto
 * @returns {Object} Mutation result
 */
export function useAsignarGrupoAProducto() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, data }) => posApi.asignarGrupoAProducto(productoId, data),
        onSuccess: (_, { productoId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.asignacionesProducto, productoId], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modificadoresProducto, productoId], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tieneModificadores, productoId], refetchType: 'active' });
            toast({
                title: 'Grupo asignado',
                description: 'El grupo se ha asignado al producto exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Asignacion de grupo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para asignar grupo a categoría
 * @returns {Object} Mutation result
 */
export function useAsignarGrupoACategoria() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ categoriaId, data }) => posApi.asignarGrupoACategoria(categoriaId, data),
        onSuccess: () => {
            // Invalidar todos los modificadores de productos ya que la categoría afecta a múltiples
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modificadoresProducto], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tieneModificadores], refetchType: 'active' });
            toast({
                title: 'Grupo asignado',
                description: 'El grupo se ha asignado a la categoría exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Asignacion de grupo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar asignación de grupo a producto
 * @returns {Object} Mutation result
 */
export function useEliminarAsignacionProducto() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, grupoId }) => posApi.eliminarAsignacionProducto(productoId, grupoId),
        onSuccess: (_, { productoId }) => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.asignacionesProducto, productoId], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.modificadoresProducto, productoId], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tieneModificadores, productoId], refetchType: 'active' });
            toast({
                title: 'Asignación eliminada',
                description: 'La asignación se ha eliminado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Asignacion')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

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
