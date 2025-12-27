import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hooks para Numeros de Serie / Lotes
 * Gap Media Prioridad - Dic 2025
 */

// ==================== LISTADOS Y BUSQUEDAS ====================

/**
 * Hook para listar numeros de serie con filtros y paginacion
 */
export function useNumerosSerie(filtros = {}) {
    return useQuery({
        queryKey: ['numeros-serie', filtros],
        queryFn: async () => {
            console.log('[useNumerosSerie] queryFn ejecutándose con filtros:', filtros);
            const sanitizedParams = Object.entries(filtros).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});
            console.log('[useNumerosSerie] Parámetros sanitizados:', sanitizedParams);

            try {
                console.log('[useNumerosSerie] inventarioApi:', inventarioApi);
                console.log('[useNumerosSerie] listarNumerosSerie:', inventarioApi?.listarNumerosSerie);
                const response = await inventarioApi.listarNumerosSerie(sanitizedParams);
                console.log('[useNumerosSerie] Respuesta recibida:', response.data);
                return response.data;
            } catch (error) {
                console.error('[useNumerosSerie] Error en petición:', error);
                console.error('[useNumerosSerie] Error message:', error?.message);
                console.error('[useNumerosSerie] Error response:', error?.response);
                throw error;
            }
        },
        staleTime: 1000 * 60 * 2,
    });
}

/**
 * Hook para buscar numeros de serie
 */
export function useBuscarNumeroSerie(termino) {
    return useQuery({
        queryKey: ['numeros-serie', 'buscar', termino],
        queryFn: async () => {
            const response = await inventarioApi.buscarNumeroSerie(termino);
            return response.data.data;
        },
        enabled: termino?.length >= 2,
        staleTime: 1000 * 30,
    });
}

/**
 * Hook para obtener numero de serie por ID
 */
export function useNumeroSerie(id) {
    return useQuery({
        queryKey: ['numeros-serie', id],
        queryFn: async () => {
            const response = await inventarioApi.obtenerNumeroSerie(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
    });
}

/**
 * Hook para obtener historial de un numero de serie
 */
export function useHistorialNumeroSerie(id) {
    return useQuery({
        queryKey: ['numeros-serie', id, 'historial'],
        queryFn: async () => {
            const response = await inventarioApi.obtenerHistorialNumeroSerie(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 2,
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
        queryKey: ['numeros-serie', 'disponibles', productoId, sucursalId],
        queryFn: async () => {
            const response = await inventarioApi.obtenerNumerosSerieDisponibles(
                productoId,
                sucursalId ? { sucursal_id: sucursalId } : {}
            );
            return response.data.data;
        },
        enabled: !!productoId && enabled,
        staleTime: 1000 * 30,
    });
}

/**
 * Hook para obtener resumen de numeros de serie por producto
 */
export function useResumenNumeroSerieProducto(productoId) {
    return useQuery({
        queryKey: ['numeros-serie', 'resumen', productoId],
        queryFn: async () => {
            const response = await inventarioApi.obtenerResumenNumeroSerieProducto(productoId);
            return response.data.data;
        },
        enabled: !!productoId,
        staleTime: 1000 * 60 * 2,
    });
}

/**
 * Hook para obtener productos que requieren numero de serie
 */
export function useProductosConSerie() {
    return useQuery({
        queryKey: ['numeros-serie', 'productos-con-serie'],
        queryFn: async () => {
            const response = await inventarioApi.obtenerProductosConSerie();
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5,
    });
}

// ==================== ESTADISTICAS Y ALERTAS ====================

/**
 * Hook para obtener estadisticas generales
 */
export function useEstadisticasNumerosSerie() {
    return useQuery({
        queryKey: ['numeros-serie', 'estadisticas'],
        queryFn: async () => {
            const response = await inventarioApi.obtenerEstadisticasNumerosSerie();
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook para obtener numeros de serie proximos a vencer
 */
export function useProximosVencer(dias = 30) {
    return useQuery({
        queryKey: ['numeros-serie', 'proximos-vencer', dias],
        queryFn: async () => {
            const response = await inventarioApi.obtenerProximosVencer(dias);
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5,
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie']);
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
            queryClient.invalidateQueries(['numeros-serie', variables.id]);
        },
    });
}

/**
 * Hook para verificar existencia de numero de serie
 */
export function useVerificarExistencia(productoId, numeroSerie) {
    return useQuery({
        queryKey: ['numeros-serie', 'existe', productoId, numeroSerie],
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
