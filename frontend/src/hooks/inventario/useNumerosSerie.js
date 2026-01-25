import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createSearchHook } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';

/**
 * Hooks para Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 */

// ==================== LISTADOS Y BUSQUEDAS ====================

/**
 * Hook para listar numeros de serie con filtros y paginacion
 * Ene 2026: Migrado a queryKeys centralizados
 */
export function useNumerosSerie(filtros = {}) {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.list(filtros),
        queryFn: async () => {
            const sanitizedParams = Object.entries(filtros).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await inventarioApi.listarNumerosSerie(sanitizedParams);
            return response.data;
        },
        staleTime: STALE_TIMES.DYNAMIC,
    });
}

/**
 * Hook para buscar numeros de serie
 * Refactorizado con createSearchHook - Ene 2026
 */
export const useBuscarNumeroSerie = createSearchHook({
    key: 'numeros-serie',
    searchFn: (params) => inventarioApi.buscarNumeroSerie(params.q),
    staleTime: STALE_TIMES.REAL_TIME,
});

/**
 * Hook para obtener numero de serie por ID
 */
export function useNumeroSerie(id) {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.detail(id),
        queryFn: async () => {
            const response = await inventarioApi.obtenerNumeroSerie(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: STALE_TIMES.DYNAMIC,
    });
}

/**
 * Hook para obtener historial de un numero de serie
 */
export function useHistorialNumeroSerie(id) {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.historial(id),
        queryFn: async () => {
            const response = await inventarioApi.obtenerHistorialNumeroSerie(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: STALE_TIMES.DYNAMIC,
    });
}

// ==================== POR PRODUCTO ====================

/**
 * Hook para obtener numeros de serie disponibles de un producto
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @param {number} options.sucursalId - ID de la sucursal (opcional)
 * @param {boolean} options.enabled - Si la consulta está habilitada (default: true)
 */
export function useNumerosSerieDisponibles(productoId, options = {}) {
    const { sucursalId, enabled = true } = options;

    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.disponibles(productoId, sucursalId),
        queryFn: async () => {
            const response = await inventarioApi.obtenerNumerosSerieDisponibles(
                productoId,
                sucursalId ? { sucursal_id: sucursalId } : {}
            );
            return response.data.data;
        },
        enabled: !!productoId && enabled,
        staleTime: STALE_TIMES.REAL_TIME,
    });
}

/**
 * Hook para obtener resumen de numeros de serie por producto
 */
export function useResumenNumeroSerieProducto(productoId) {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.resumen(productoId),
        queryFn: async () => {
            const response = await inventarioApi.obtenerResumenNumeroSerieProducto(productoId);
            return response.data.data;
        },
        enabled: !!productoId,
        staleTime: STALE_TIMES.DYNAMIC,
    });
}

/**
 * Hook para obtener productos que requieren numero de serie
 */
export function useProductosConSerie() {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.productosConSerie,
        queryFn: async () => {
            const response = await inventarioApi.obtenerProductosConSerie();
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

// ==================== ESTADISTICAS Y ALERTAS ====================

/**
 * Hook para obtener estadisticas generales
 */
export function useEstadisticasNumerosSerie() {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.estadisticas,
        queryFn: async () => {
            const response = await inventarioApi.obtenerEstadisticasNumerosSerie();
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

/**
 * Hook para obtener numeros de serie proximos a vencer
 */
export function useProximosVencer(dias = 30) {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.proximosVencer(dias),
        queryFn: async () => {
            const response = await inventarioApi.obtenerProximosVencer(dias);
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

// ==================== MUTACIONES ====================

/**
 * Hook para crear numero de serie
 */
export function useCrearNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await inventarioApi.crearNumeroSerie(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para crear multiples numeros de serie
 */
export function useCrearNumerosSerieMultiple() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (items) => {
            const response = await inventarioApi.crearNumerosSerieMultiple({ items });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para vender numero de serie
 */
export function useVenderNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ventaId, clienteId }) => {
            const response = await inventarioApi.venderNumeroSerie(id, {
                venta_id: ventaId,
                cliente_id: clienteId
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para transferir numero de serie
 */
export function useTransferirNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, sucursalDestinoId, ubicacionDestinoId, notas }) => {
            const response = await inventarioApi.transferirNumeroSerie(id, {
                sucursal_destino_id: sucursalDestinoId,
                ubicacion_destino_id: ubicacionDestinoId,
                notas
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para devolver numero de serie
 */
export function useDevolverNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, sucursalId, ubicacionId, motivo }) => {
            const response = await inventarioApi.devolverNumeroSerie(id, {
                sucursal_id: sucursalId,
                ubicacion_id: ubicacionId,
                motivo
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para marcar como defectuoso
 */
export function useMarcarDefectuoso() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, motivo }) => {
            const response = await inventarioApi.marcarNumeroSerieDefectuoso(id, { motivo });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para reservar numero de serie
 */
export function useReservarNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, notas }) => {
            const response = await inventarioApi.reservarNumeroSerie(id, { notas });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para liberar reserva
 */
export function useLiberarReservaNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await inventarioApi.liberarReservaNumeroSerie(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.all });
        },
    });
}

/**
 * Hook para actualizar garantia
 */
export function useActualizarGarantia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, garantiaData }) => {
            const response = await inventarioApi.actualizarGarantiaNumeroSerie(id, garantiaData);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.inventario.numerosSerie.detail(variables.id) });
        },
    });
}

/**
 * Hook para verificar existencia de numero de serie
 */
export function useVerificarExistencia(productoId, numeroSerie) {
    return useQuery({
        queryKey: queryKeys.inventario.numerosSerie.existe(productoId, numeroSerie),
        queryFn: async () => {
            const response = await inventarioApi.verificarExistenciaNumeroSerie(productoId, numeroSerie);
            return response.data.data.existe;
        },
        enabled: !!productoId && !!numeroSerie,
        staleTime: 0,
    });
}

// ==================== CONSTANTES ====================

export const ESTADOS_NUMERO_SERIE = {
    disponible: { label: 'Disponible', color: 'green' },
    reservado: { label: 'Reservado', color: 'yellow' },
    vendido: { label: 'Vendido', color: 'blue' },
    defectuoso: { label: 'Defectuoso', color: 'red' },
    devuelto: { label: 'Devuelto', color: 'purple' },
    transferido: { label: 'Transferido', color: 'gray' },
};

export const ACCIONES_HISTORIAL = {
    entrada: { label: 'Entrada', icon: 'ArrowDownLeft' },
    venta: { label: 'Venta', icon: 'ShoppingCart' },
    devolucion_cliente: { label: 'Devolución Cliente', icon: 'RotateCcw' },
    devolucion_proveedor: { label: 'Devolución Proveedor', icon: 'Truck' },
    transferencia: { label: 'Transferencia', icon: 'ArrowLeftRight' },
    ajuste: { label: 'Ajuste', icon: 'Edit' },
    reserva: { label: 'Reserva', icon: 'Lock' },
    liberacion: { label: 'Liberación', icon: 'Unlock' },
    defectuoso: { label: 'Defectuoso', icon: 'AlertTriangle' },
    reparacion: { label: 'Reparación', icon: 'Wrench' },
    garantia: { label: 'Garantía', icon: 'Shield' },
};

/**
 * Formatea fecha de vencimiento
 */
export function formatearFechaVencimiento(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    const hoy = new Date();
    const diff = Math.ceil((date - hoy) / (1000 * 60 * 60 * 24));

    const formatted = date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    if (diff < 0) return { text: `Vencido (${formatted})`, status: 'error' };
    if (diff <= 7) return { text: `${formatted} (${diff}d)`, status: 'error' };
    if (diff <= 30) return { text: `${formatted} (${diff}d)`, status: 'warning' };
    return { text: formatted, status: 'normal' };
}
