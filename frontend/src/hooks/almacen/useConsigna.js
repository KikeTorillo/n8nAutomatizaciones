/**
 * ====================================================================
 * HOOKS: Consigna (Inventario en Consignacion)
 * ====================================================================
 * React Query hooks para gestion de inventario en consignacion
 * Stock de proveedores en tu almacen, pago solo al vender
 * Fecha: 31 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { consignaApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';

/**
 * QUERY KEYS para consigna
 */
export const CONSIGNA_KEYS = {
  all: ['consigna'],
  // Acuerdos
  acuerdos: () => [...CONSIGNA_KEYS.all, 'acuerdos'],
  acuerdosList: (filtros) => [...CONSIGNA_KEYS.acuerdos(), { filtros }],
  acuerdoDetail: (id) => [...CONSIGNA_KEYS.acuerdos(), 'detail', id],
  acuerdoProductos: (acuerdoId) => [...CONSIGNA_KEYS.acuerdos(), acuerdoId, 'productos'],
  // Stock
  stock: () => [...CONSIGNA_KEYS.all, 'stock'],
  stockList: (filtros) => [...CONSIGNA_KEYS.stock(), { filtros }],
  // Liquidaciones
  liquidaciones: () => [...CONSIGNA_KEYS.all, 'liquidaciones'],
  liquidacionesList: (filtros) => [...CONSIGNA_KEYS.liquidaciones(), { filtros }],
  liquidacionDetail: (id) => [...CONSIGNA_KEYS.liquidaciones(), 'detail', id],
  // Reportes
  reportes: () => [...CONSIGNA_KEYS.all, 'reportes'],
  reporteStock: (filtros) => [...CONSIGNA_KEYS.reportes(), 'stock', { filtros }],
  reporteVentas: (filtros) => [...CONSIGNA_KEYS.reportes(), 'ventas', { filtros }],
  reportePendiente: () => [...CONSIGNA_KEYS.reportes(), 'pendiente'],
};

// ==================== QUERIES - ACUERDOS ====================

/**
 * Hook para listar acuerdos de consignacion
 * @param {Object} filtros - { proveedor_id?, estado?, busqueda?, limit?, offset? }
 */
export function useAcuerdosConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.acuerdosList(filtros),
    queryFn: async () => {
      const response = await consignaApi.listarAcuerdos(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener acuerdo por ID
 * @param {number} id - ID del acuerdo
 */
export function useAcuerdoConsigna(id) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.acuerdoDetail(id),
    queryFn: async () => {
      const response = await consignaApi.obtenerAcuerdo(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para listar productos de un acuerdo
 * @param {number} acuerdoId - ID del acuerdo
 */
export function useProductosAcuerdo(acuerdoId) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId),
    queryFn: async () => {
      const response = await consignaApi.listarProductos(acuerdoId);
      return response.data.data || [];
    },
    enabled: !!acuerdoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ==================== QUERIES - STOCK ====================

/**
 * Hook para consultar stock en consignacion
 * @param {Object} filtros - { acuerdo_id?, proveedor_id?, producto_id?, almacen_id?, solo_disponible? }
 */
export function useStockConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.stockList(filtros),
    queryFn: async () => {
      const response = await consignaApi.consultarStock(filtros);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

// ==================== QUERIES - LIQUIDACIONES ====================

/**
 * Hook para listar liquidaciones
 * @param {Object} filtros - { acuerdo_id?, proveedor_id?, estado?, limit?, offset? }
 */
export function useLiquidacionesConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.liquidacionesList(filtros),
    queryFn: async () => {
      const response = await consignaApi.listarLiquidaciones(filtros);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener liquidacion con detalle
 * @param {number} id - ID de la liquidacion
 */
export function useLiquidacionConsigna(id) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.liquidacionDetail(id),
    queryFn: async () => {
      const response = await consignaApi.obtenerLiquidacion(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ==================== QUERIES - REPORTES ====================

/**
 * Hook para reporte de stock consigna
 * @param {Object} filtros - { proveedor_id? }
 */
export function useReporteStockConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.reporteStock(filtros),
    queryFn: async () => {
      const response = await consignaApi.reporteStock(filtros);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para reporte de ventas consigna
 * @param {Object} filtros - { fecha_desde, fecha_hasta }
 */
export function useReporteVentasConsigna(filtros) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.reporteVentas(filtros),
    queryFn: async () => {
      const response = await consignaApi.reporteVentas(filtros);
      return response.data.data || [];
    },
    enabled: !!(filtros?.fecha_desde && filtros?.fecha_hasta),
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para reporte pendiente de liquidar
 */
export function usePendienteLiquidar() {
  return useQuery({
    queryKey: CONSIGNA_KEYS.reportePendiente(),
    queryFn: async () => {
      const response = await consignaApi.reportePendiente();
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// ==================== MUTATIONS - ACUERDOS ====================

/**
 * Hook para crear acuerdo de consignacion
 */
export function useCrearAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => consignaApi.crearAcuerdo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos() });
      toast.success('Acuerdo de consignacion creado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear acuerdo');
    },
  });
}

/**
 * Hook para actualizar acuerdo
 */
export function useActualizarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => consignaApi.actualizarAcuerdo(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos() });
      toast.success('Acuerdo actualizado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar acuerdo');
    },
  });
}

/**
 * Hook para activar acuerdo
 */
export function useActivarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.activarAcuerdo(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos() });
      toast.success('Acuerdo activado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al activar acuerdo');
    },
  });
}

/**
 * Hook para pausar acuerdo
 */
export function usePausarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.pausarAcuerdo(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos() });
      toast.success('Acuerdo pausado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al pausar acuerdo');
    },
  });
}

/**
 * Hook para terminar acuerdo
 */
export function useTerminarAcuerdoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.terminarAcuerdo(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(id) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdos() });
      toast.success('Acuerdo terminado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al terminar acuerdo');
    },
  });
}

// ==================== MUTATIONS - PRODUCTOS ====================

/**
 * Hook para agregar producto al acuerdo
 */
export function useAgregarProductoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, data }) => consignaApi.agregarProducto(acuerdoId, data),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId) });
      toast.success('Producto agregado al acuerdo');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al agregar producto');
    },
  });
}

/**
 * Hook para actualizar producto del acuerdo
 */
export function useActualizarProductoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, productoId, data, varianteId }) =>
      consignaApi.actualizarProducto(acuerdoId, productoId, data, varianteId),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId) });
      toast.success('Producto actualizado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
    },
  });
}

/**
 * Hook para remover producto del acuerdo
 */
export function useRemoverProductoConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, productoId, varianteId }) =>
      consignaApi.removerProducto(acuerdoId, productoId, varianteId),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoProductos(acuerdoId) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId) });
      toast.success('Producto removido del acuerdo');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al remover producto');
    },
  });
}

// ==================== MUTATIONS - STOCK ====================

/**
 * Hook para recibir mercancia en consignacion
 */
export function useRecibirMercanciaConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, data }) => consignaApi.recibirMercancia(acuerdoId, data),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.stock() });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportes() });
      toast.success('Mercancia recibida en consignacion');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al recibir mercancia');
    },
  });
}

/**
 * Hook para ajustar stock consigna
 */
export function useAjustarStockConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ stockId, data }) => consignaApi.ajustarStock(stockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.stock() });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportes() });
      toast.success('Stock ajustado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al ajustar stock');
    },
  });
}

/**
 * Hook para devolver mercancia al proveedor
 */
export function useDevolverMercanciaConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, data }) => consignaApi.devolverMercancia(acuerdoId, data),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.stock() });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportes() });
      toast.success('Devolucion registrada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al registrar devolucion');
    },
  });
}

// ==================== MUTATIONS - LIQUIDACIONES ====================

/**
 * Hook para generar liquidacion
 */
export function useGenerarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => consignaApi.generarLiquidacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones() });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportePendiente() });
      toast.success('Liquidacion generada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al generar liquidacion');
    },
  });
}

/**
 * Hook para confirmar liquidacion
 */
export function useConfirmarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.confirmarLiquidacion(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidacionDetail(id) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones() });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportePendiente() });
      toast.success('Liquidacion confirmada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al confirmar liquidacion');
    },
  });
}

/**
 * Hook para pagar liquidacion
 */
export function usePagarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => consignaApi.pagarLiquidacion(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidacionDetail(id) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones() });
      toast.success('Pago registrado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    },
  });
}

/**
 * Hook para cancelar liquidacion
 */
export function useCancelarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.cancelarLiquidacion(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidacionDetail(id) });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones() });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportePendiente() });
      toast.success('Liquidacion cancelada');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cancelar liquidacion');
    },
  });
}
