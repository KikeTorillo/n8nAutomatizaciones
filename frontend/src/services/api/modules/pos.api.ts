import { AxiosResponse } from 'axios';
import apiClient from '../client';
import type {
  Venta,
  VentaItem,
  SesionCaja,
  MovimientoCaja,
  Cupon,
  Promocion,
  EstadoVenta,
  MetodoPago,
  TipoVenta,
  TipoMovimientoCaja,
  ConfiguracionLealtad,
  NivelLealtad,
  PuntosCliente,
  Combo,
  GrupoModificadores,
  Modificador,
} from '@/types/entities/venta';
import type { ApiResponse, ApiListResponse } from '@/types/entities/common';

// ========== Request Types ==========

interface CrearVentaItem {
  producto_id: number;
  cantidad: number;
  precio_unitario?: number;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  aplica_comision?: boolean;
  notas?: string;
}

interface CrearVentaRequest {
  tipo_venta?: TipoVenta;
  cliente_id?: number;
  cita_id?: number;
  profesional_id?: number;
  usuario_id?: number;
  items: CrearVentaItem[];
  descuento_porcentaje?: number;
  descuento_monto?: number;
  impuestos?: number;
  metodo_pago: MetodoPago;
  monto_pagado?: number;
  fecha_apartado?: string;
  fecha_vencimiento_apartado?: string;
  notas?: string;
}

interface ListarVentasParams {
  estado?: EstadoVenta;
  estado_pago?: string;
  tipo_venta?: TipoVenta;
  cliente_id?: number;
  profesional_id?: number;
  metodo_pago?: MetodoPago;
  fecha_desde?: string;
  fecha_hasta?: string;
  folio?: string;
  limit?: number;
  offset?: number;
}

interface ActualizarVentaRequest {
  tipo_venta?: TipoVenta;
  cliente_id?: number;
  profesional_id?: number;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  impuestos?: number;
  metodo_pago?: MetodoPago;
  fecha_apartado?: string;
  fecha_vencimiento_apartado?: string;
  notas?: string;
}

interface ActualizarEstadoVentaRequest {
  estado: EstadoVenta;
}

interface RegistrarPagoRequest {
  monto_pago: number;
  metodo_pago: MetodoPago;
  pago_id?: number;
}

interface CancelarVentaRequest {
  motivo?: string;
  usuario_id: number;
}

interface DevolverItemsRequest {
  items_devueltos: Array<{ item_id: number; cantidad: number }>;
  motivo?: string;
  usuario_id: number;
}

interface AgregarItemsRequest {
  items: CrearVentaItem[];
}

interface TicketOptions {
  paper_size?: '58mm' | '80mm';
  download?: boolean;
}

interface CorteCajaParams {
  fecha_inicio: string;
  fecha_fin: string;
  usuario_id?: number;
}

interface VentasDiariasParams {
  fecha: string;
  profesional_id?: number;
  usuario_id?: number;
}

interface PagosSplitRequest {
  pagos: Array<{
    metodo_pago: MetodoPago;
    monto: number;
    monto_recibido?: number;
    referencia?: string;
  }>;
  cliente_id?: number;
}

interface AbrirSesionCajaRequest {
  sucursal_id?: number;
  monto_inicial?: number;
  nota_apertura?: string;
}

interface CerrarSesionCajaRequest {
  sesion_id: number;
  monto_contado: number;
  nota_cierre?: string;
  desglose?: Record<string, unknown>;
}

interface ListarSesionesCajaParams {
  sucursal_id?: number;
  usuario_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}

interface RegistrarMovimientoRequest {
  tipo: TipoMovimientoCaja;
  monto: number;
  motivo: string;
}

interface ValidarCuponRequest {
  codigo: string;
  subtotal: number;
  cliente_id?: number;
  productos_ids?: number[];
}

interface AplicarCuponRequest {
  cupon_id: number;
  venta_pos_id: number;
  cliente_id?: number;
  subtotal_antes?: number;
}

interface ListarCuponesParams {
  page?: number;
  limit?: number;
  busqueda?: string;
  activo?: boolean;
  vigente?: boolean;
  ordenPor?: string;
  orden?: 'ASC' | 'DESC';
}

interface EvaluarPromocionesRequest {
  items: Array<{
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    categoria_id?: number;
  }>;
  subtotal: number;
  cliente_id?: number;
  sucursal_id?: number;
}

interface AplicarPromocionRequest {
  promocion_id: number;
  venta_pos_id: number;
  cliente_id?: number;
  descuento_total: number;
  productos_aplicados?: number[];
}

interface ListarPromocionesParams {
  page?: number;
  limit?: number;
  busqueda?: string;
  activo?: boolean;
  vigente?: boolean;
  tipo?: string;
  ordenPor?: string;
  orden?: 'ASC' | 'DESC';
}

interface HistorialPuntosParams {
  limit?: number;
  offset?: number;
  tipo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

interface ClientesConPuntosParams {
  limit?: number;
  offset?: number;
  busqueda?: string;
  nivel_id?: number;
  orden?: string;
}

interface CalcularPuntosRequest {
  cliente_id?: number;
  monto: number;
  tiene_cupon?: boolean;
}

interface ValidarCanjeRequest {
  cliente_id: number;
  puntos: number;
  total_venta: number;
}

interface CanjearPuntosRequest {
  cliente_id: number;
  venta_id?: number;
  puntos: number;
  descuento: number;
  descripcion?: string;
}

interface AcumularPuntosRequest {
  cliente_id: number;
  venta_id: number;
  monto: number;
  descripcion?: string;
}

interface AjustarPuntosRequest {
  cliente_id: number;
  puntos: number;
  motivo: string;
}

interface CrearComboRequest {
  producto_id: number;
  tipo_precio: string;
  descuento_porcentaje?: number;
  componentes: Array<{ producto_id: number; cantidad: number }>;
}

interface CrearGrupoModificadoresRequest {
  nombre: string;
  descripcion?: string;
  tipo_seleccion: string;
  es_obligatorio?: boolean;
  minimo_seleccion?: number;
  maximo_seleccion?: number;
  modificadores?: Array<Partial<Modificador>>;
}

interface CrearModificadorRequest {
  grupo_id: number;
  nombre: string;
  descripcion?: string;
  precio_adicional?: number;
  prefijo?: string;
  orden?: number;
  activo?: boolean;
}

// ========== Response Types ==========

type VentaResponse = AxiosResponse<ApiResponse<Venta>>;
type VentaDetailResponse = AxiosResponse<ApiResponse<{ venta: Venta; items: VentaItem[] }>>;
type VentasListResponse = AxiosResponse<ApiResponse<{ ventas: Venta[]; total: number }>>;
type SesionCajaResponse = AxiosResponse<ApiResponse<SesionCaja>>;
type CuponResponse = AxiosResponse<ApiResponse<Cupon>>;
type PromocionResponse = AxiosResponse<ApiResponse<Promocion>>;

// ========== API ==========

export const posApi = {
  // ========== Configuracion POS ==========

  /** Obtener tipos de venta disponibles */
  obtenerTiposVenta: (): Promise<AxiosResponse> =>
    apiClient.get('/pos/config/tipos-venta'),

  // ========== Ventas POS ==========

  /** Crear venta con items */
  crearVenta: (data: CrearVentaRequest): Promise<VentaResponse> =>
    apiClient.post('/pos/ventas', data),

  /** Listar ventas con filtros */
  listarVentas: (params: ListarVentasParams = {}): Promise<VentasListResponse> =>
    apiClient.get('/pos/ventas', { params }),

  /** Obtener venta por ID con sus items */
  obtenerVenta: (id: number): Promise<VentaDetailResponse> =>
    apiClient.get(`/pos/ventas/${id}`),

  /** Actualizar venta */
  actualizarVenta: (id: number, data: ActualizarVentaRequest): Promise<VentaResponse> =>
    apiClient.put(`/pos/ventas/${id}`, data),

  /** Actualizar estado de venta */
  actualizarEstadoVenta: (id: number, data: ActualizarEstadoVentaRequest): Promise<VentaResponse> =>
    apiClient.patch(`/pos/ventas/${id}/estado`, data),

  /** Registrar pago en venta */
  registrarPago: (id: number, data: RegistrarPagoRequest): Promise<VentaResponse> =>
    apiClient.post(`/pos/ventas/${id}/pago`, data),

  /** Cancelar venta y revertir stock */
  cancelarVenta: (id: number, data: CancelarVentaRequest): Promise<VentaResponse> =>
    apiClient.post(`/pos/ventas/${id}/cancelar`, data),

  /** Procesar devolucion parcial o total de items */
  devolverItems: (id: number, data: DevolverItemsRequest): Promise<AxiosResponse> =>
    apiClient.post(`/pos/ventas/${id}/devolver`, data),

  /** Agregar items a venta existente */
  agregarItems: (id: number, data: AgregarItemsRequest): Promise<VentaResponse> =>
    apiClient.post(`/pos/ventas/${id}/items`, data),

  /** Eliminar venta (marca como cancelada y revierte stock) */
  eliminarVenta: (id: number, data: CancelarVentaRequest): Promise<AxiosResponse> =>
    apiClient.delete(`/pos/ventas/${id}`, { data }),

  // ========== Tickets PDF ==========

  /** Generar ticket PDF de una venta */
  generarTicket: (id: number, options: TicketOptions = {}): Promise<AxiosResponse<Blob>> => {
    const params = new URLSearchParams();
    if (options.paper_size) params.append('paper_size', options.paper_size);
    if (options.download !== undefined) params.append('download', String(options.download));
    const queryString = params.toString();
    const url = `/pos/ventas/${id}/ticket${queryString ? '?' + queryString : ''}`;
    return apiClient.get(url, { responseType: 'blob' });
  },

  /** Obtener URL para descargar ticket (util para abrir en nueva pestana) */
  getTicketUrl: (id: number, options: TicketOptions = {}): string => {
    const params = new URLSearchParams();
    if (options.paper_size) params.append('paper_size', options.paper_size);
    params.append('download', 'false');
    const queryString = params.toString();
    return `/api/v1/pos/ventas/${id}/ticket?${queryString}`;
  },

  // ========== Reportes POS ==========

  /** Obtener corte de caja por periodo */
  obtenerCorteCaja: (params: CorteCajaParams): Promise<AxiosResponse> =>
    apiClient.get('/pos/corte-caja', { params }),

  /** Obtener reporte de ventas diarias */
  obtenerVentasDiarias: (params: VentasDiariasParams): Promise<AxiosResponse> =>
    apiClient.get('/pos/reportes/ventas-diarias', { params }),

  // ========== Pago Split (Ene 2026) ==========

  /** Registrar pagos split (multiples metodos de pago) */
  registrarPagosSplit: (ventaId: number, data: PagosSplitRequest): Promise<AxiosResponse> =>
    apiClient.post(`/pos/ventas/${ventaId}/pagos-split`, data),

  /** Obtener desglose de pagos de una venta */
  obtenerPagosVenta: (ventaId: number): Promise<AxiosResponse> =>
    apiClient.get(`/pos/ventas/${ventaId}/pagos`),

  // ========== Sesiones de Caja ==========

  /** Abrir nueva sesion de caja */
  abrirSesionCaja: (data: AbrirSesionCajaRequest): Promise<SesionCajaResponse> =>
    apiClient.post('/pos/sesiones-caja/abrir', data),

  /** Obtener sesion de caja activa del usuario */
  obtenerSesionActiva: (params: { sucursal_id?: number } = {}): Promise<AxiosResponse> =>
    apiClient.get('/pos/sesiones-caja/activa', { params }),

  /** Cerrar sesion de caja */
  cerrarSesionCaja: (data: CerrarSesionCajaRequest): Promise<SesionCajaResponse> =>
    apiClient.post('/pos/sesiones-caja/cerrar', data),

  /** Listar sesiones de caja con filtros */
  listarSesionesCaja: (params: ListarSesionesCajaParams = {}): Promise<AxiosResponse<ApiListResponse<SesionCaja>>> =>
    apiClient.get('/pos/sesiones-caja', { params }),

  /** Obtener sesion de caja por ID */
  obtenerSesionCaja: (id: number): Promise<SesionCajaResponse> =>
    apiClient.get(`/pos/sesiones-caja/${id}`),

  /** Obtener resumen de sesion para cierre */
  obtenerResumenSesion: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/pos/sesiones-caja/${id}/resumen`),

  /** Registrar movimiento de efectivo (entrada/salida) */
  registrarMovimientoCaja: (id: number, data: RegistrarMovimientoRequest): Promise<AxiosResponse<ApiResponse<MovimientoCaja>>> =>
    apiClient.post(`/pos/sesiones-caja/${id}/movimiento`, data),

  /** Listar movimientos de una sesion */
  listarMovimientosCaja: (id: number): Promise<AxiosResponse<ApiResponse<MovimientoCaja[]>>> =>
    apiClient.get(`/pos/sesiones-caja/${id}/movimientos`),

  // ========== Cupones de Descuento (Ene 2026) ==========

  /** Listar cupones vigentes (para selector en POS) */
  listarCuponesVigentes: (): Promise<AxiosResponse<ApiResponse<Cupon[]>>> =>
    apiClient.get('/pos/cupones/vigentes'),

  /** Validar cupon sin aplicar (preview) */
  validarCupon: (data: ValidarCuponRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/cupones/validar', data),

  /** Aplicar cupon a una venta */
  aplicarCupon: (data: AplicarCuponRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/cupones/aplicar', data),

  /** Listar cupones con paginacion (administracion) */
  listarCupones: (params: ListarCuponesParams = {}): Promise<AxiosResponse<ApiListResponse<Cupon>>> =>
    apiClient.get('/pos/cupones', { params }),

  /** Crear nuevo cupon */
  crearCupon: (data: Partial<Cupon>): Promise<CuponResponse> =>
    apiClient.post('/pos/cupones', data),

  /** Obtener cupon por ID */
  obtenerCupon: (id: number): Promise<CuponResponse> =>
    apiClient.get(`/pos/cupones/${id}`),

  /** Actualizar cupon */
  actualizarCupon: (id: number, data: Partial<Cupon>): Promise<CuponResponse> =>
    apiClient.put(`/pos/cupones/${id}`, data),

  /** Eliminar cupon (solo si no tiene usos) */
  eliminarCupon: (id: number): Promise<AxiosResponse> =>
    apiClient.delete(`/pos/cupones/${id}`),

  /** Obtener historial de uso de un cupon */
  obtenerHistorialCupon: (id: number, params: { limit?: number; offset?: number } = {}): Promise<AxiosResponse> =>
    apiClient.get(`/pos/cupones/${id}/historial`, { params }),

  /** Obtener estadisticas de un cupon */
  obtenerEstadisticasCupon: (id: number, params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get(`/pos/cupones/${id}/estadisticas`, { params }),

  /** Activar/desactivar cupon */
  cambiarEstadoCupon: (id: number, activo: boolean): Promise<CuponResponse> =>
    apiClient.patch(`/pos/cupones/${id}/estado`, { activo }),

  // ========== Promociones Automaticas (Ene 2026) ==========

  /** Listar promociones vigentes (para aplicar en POS) */
  listarPromocionesVigentes: (params: { sucursal_id?: number } = {}): Promise<AxiosResponse<ApiResponse<Promocion[]>>> =>
    apiClient.get('/pos/promociones/vigentes', { params }),

  /** Evaluar promociones aplicables a un carrito */
  evaluarPromociones: (data: EvaluarPromocionesRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/promociones/evaluar', data),

  /** Aplicar promocion a una venta (registrar uso) */
  aplicarPromocion: (data: AplicarPromocionRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/promociones/aplicar', data),

  /** Listar promociones con paginacion (administracion) */
  listarPromociones: (params: ListarPromocionesParams = {}): Promise<AxiosResponse<ApiListResponse<Promocion>>> =>
    apiClient.get('/pos/promociones', { params }),

  /** Crear nueva promocion */
  crearPromocion: (data: Partial<Promocion>): Promise<PromocionResponse> =>
    apiClient.post('/pos/promociones', data),

  /** Obtener promocion por ID */
  obtenerPromocion: (id: number): Promise<PromocionResponse> =>
    apiClient.get(`/pos/promociones/${id}`),

  /** Actualizar promocion */
  actualizarPromocion: (id: number, data: Partial<Promocion>): Promise<PromocionResponse> =>
    apiClient.put(`/pos/promociones/${id}`, data),

  /** Eliminar promocion (solo si no tiene usos) */
  eliminarPromocion: (id: number): Promise<AxiosResponse> =>
    apiClient.delete(`/pos/promociones/${id}`),

  /** Obtener historial de uso de una promocion */
  obtenerHistorialPromocion: (id: number, params: { limit?: number; offset?: number } = {}): Promise<AxiosResponse> =>
    apiClient.get(`/pos/promociones/${id}/historial`, { params }),

  /** Obtener estadisticas de una promocion */
  obtenerEstadisticasPromocion: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/pos/promociones/${id}/estadisticas`),

  /** Activar/desactivar promocion */
  cambiarEstadoPromocion: (id: number, activo: boolean): Promise<PromocionResponse> =>
    apiClient.patch(`/pos/promociones/${id}/estado`, { activo }),

  /** Duplicar promocion */
  duplicarPromocion: (id: number): Promise<PromocionResponse> =>
    apiClient.post(`/pos/promociones/${id}/duplicar`),

  // ========== Programa de Lealtad (Ene 2026) ==========

  /** Obtener configuracion del programa de lealtad */
  obtenerConfiguracionLealtad: (): Promise<AxiosResponse<ApiResponse<ConfiguracionLealtad>>> =>
    apiClient.get('/pos/lealtad/configuracion'),

  /** Guardar configuracion del programa de lealtad */
  guardarConfiguracionLealtad: (data: ConfiguracionLealtad): Promise<AxiosResponse<ApiResponse<ConfiguracionLealtad>>> =>
    apiClient.put('/pos/lealtad/configuracion', data),

  /** Listar niveles de lealtad */
  listarNivelesLealtad: (params: { incluir_inactivos?: boolean } = {}): Promise<AxiosResponse<ApiResponse<NivelLealtad[]>>> =>
    apiClient.get('/pos/lealtad/niveles', { params }),

  /** Crear nivel de lealtad */
  crearNivelLealtad: (data: Partial<NivelLealtad>): Promise<AxiosResponse<ApiResponse<NivelLealtad>>> =>
    apiClient.post('/pos/lealtad/niveles', data),

  /** Actualizar nivel de lealtad */
  actualizarNivelLealtad: (id: number, data: Partial<NivelLealtad>): Promise<AxiosResponse<ApiResponse<NivelLealtad>>> =>
    apiClient.put(`/pos/lealtad/niveles/${id}`, data),

  /** Eliminar nivel de lealtad */
  eliminarNivelLealtad: (id: number): Promise<AxiosResponse> =>
    apiClient.delete(`/pos/lealtad/niveles/${id}`),

  /** Crear niveles por defecto (Bronze, Silver, Gold, Platinum) */
  crearNivelesLealtadDefault: (): Promise<AxiosResponse<ApiResponse<NivelLealtad[]>>> =>
    apiClient.post('/pos/lealtad/niveles/default'),

  /** Obtener puntos de un cliente */
  obtenerPuntosCliente: (clienteId: number): Promise<AxiosResponse<ApiResponse<PuntosCliente>>> =>
    apiClient.get(`/pos/lealtad/clientes/${clienteId}/puntos`),

  /** Obtener historial de transacciones de puntos de un cliente */
  obtenerHistorialPuntos: (clienteId: number, params: HistorialPuntosParams = {}): Promise<AxiosResponse> =>
    apiClient.get(`/pos/lealtad/clientes/${clienteId}/historial`, { params }),

  /** Listar clientes con puntos (administracion) */
  listarClientesConPuntos: (params: ClientesConPuntosParams = {}): Promise<AxiosResponse> =>
    apiClient.get('/pos/lealtad/clientes', { params }),

  /** Calcular puntos que ganaria una venta (preview) */
  calcularPuntosVenta: (data: CalcularPuntosRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/lealtad/calcular', data),

  /** Validar canje de puntos (preview sin aplicar) */
  validarCanjePuntos: (data: ValidarCanjeRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/lealtad/validar-canje', data),

  /** Canjear puntos por descuento */
  canjearPuntos: (data: CanjearPuntosRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/lealtad/canjear', data),

  /** Acumular puntos por una venta */
  acumularPuntos: (data: AcumularPuntosRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/lealtad/acumular', data),

  /** Ajuste manual de puntos (administracion) */
  ajustarPuntos: (data: AjustarPuntosRequest): Promise<AxiosResponse> =>
    apiClient.post('/pos/lealtad/ajustar', data),

  /** Obtener estadisticas del programa de lealtad */
  obtenerEstadisticasLealtad: (sucursalId?: number): Promise<AxiosResponse> =>
    apiClient.get('/pos/lealtad/estadisticas', {
      params: sucursalId ? { sucursalId } : {}
    }),

  // ========== Combos y Modificadores (Migrado a Inventario - Ene 2026) ==========

  // --- Combos / Kits ---

  /** Verificar si un producto es combo */
  verificarCombo: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/combos/verificar/${productoId}`),

  /** Obtener combo por producto ID */
  obtenerCombo: (productoId: number): Promise<AxiosResponse<ApiResponse<Combo>>> =>
    apiClient.get(`/inventario/combos/${productoId}`),

  /** Listar combos */
  listarCombos: (params: { limit?: number; offset?: number; busqueda?: string; activo?: boolean } = {}): Promise<AxiosResponse<ApiListResponse<Combo>>> =>
    apiClient.get('/inventario/combos', { params }),

  /** Crear combo */
  crearCombo: (data: CrearComboRequest): Promise<AxiosResponse<ApiResponse<Combo>>> =>
    apiClient.post('/inventario/combos', data),

  /** Actualizar combo */
  actualizarCombo: (productoId: number, data: Partial<CrearComboRequest>): Promise<AxiosResponse<ApiResponse<Combo>>> =>
    apiClient.put(`/inventario/combos/${productoId}`, data),

  /** Eliminar combo */
  eliminarCombo: (productoId: number, sucursalId: number): Promise<AxiosResponse> =>
    apiClient.delete(`/inventario/combos/${productoId}`, { params: { sucursalId } }),

  /** Calcular precio de combo */
  calcularPrecioCombo: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/combos/${productoId}/precio`),

  /** Verificar stock de combo */
  verificarStockCombo: (productoId: number, cantidad: number = 1): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/combos/${productoId}/stock`, { params: { cantidad } }),

  // --- Grupos de Modificadores ---

  /** Listar grupos de modificadores */
  listarGruposModificadores: (params: { activo?: boolean; incluir_modificadores?: boolean } = {}): Promise<AxiosResponse<ApiResponse<GrupoModificadores[]>>> =>
    apiClient.get('/inventario/modificadores/grupos', { params }),

  /** Crear grupo de modificadores */
  crearGrupoModificadores: (data: CrearGrupoModificadoresRequest): Promise<AxiosResponse<ApiResponse<GrupoModificadores>>> =>
    apiClient.post('/inventario/modificadores/grupos', data),

  /** Actualizar grupo de modificadores */
  actualizarGrupoModificadores: (id: number, data: Partial<GrupoModificadores>): Promise<AxiosResponse<ApiResponse<GrupoModificadores>>> =>
    apiClient.put(`/inventario/modificadores/grupos/${id}`, data),

  /** Eliminar grupo de modificadores */
  eliminarGrupoModificadores: (id: number): Promise<AxiosResponse> =>
    apiClient.delete(`/inventario/modificadores/grupos/${id}`),

  // --- Modificadores ---

  /** Crear modificador */
  crearModificador: (data: CrearModificadorRequest): Promise<AxiosResponse<ApiResponse<Modificador>>> =>
    apiClient.post('/inventario/modificadores', data),

  /** Actualizar modificador */
  actualizarModificador: (id: number, data: Partial<Modificador>): Promise<AxiosResponse<ApiResponse<Modificador>>> =>
    apiClient.put(`/inventario/modificadores/${id}`, data),

  /** Eliminar modificador */
  eliminarModificador: (id: number): Promise<AxiosResponse> =>
    apiClient.delete(`/inventario/modificadores/${id}`),

  // --- Modificadores de Producto ---

  /** Obtener modificadores de un producto */
  obtenerModificadoresProducto: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/productos/${productoId}/modificadores`),

  /** Verificar si un producto tiene modificadores */
  tieneModificadores: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/productos/${productoId}/tiene-modificadores`),

  /** Listar asignaciones de grupos a un producto */
  listarAsignacionesProducto: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/productos/${productoId}/grupos`),

  /** Asignar grupo a producto */
  asignarGrupoAProducto: (productoId: number, data: { grupo_id: number; orden?: number }): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/productos/${productoId}/grupos`, data),

  /** Eliminar asignacion de grupo a producto */
  eliminarAsignacionProducto: (productoId: number, grupoId: number): Promise<AxiosResponse> =>
    apiClient.delete(`/inventario/productos/${productoId}/grupos/${grupoId}`),

  /** Asignar grupo a categoria */
  asignarGrupoACategoria: (categoriaId: number, data: { grupo_id: number; orden?: number }): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/categorias/${categoriaId}/grupos`, data),

  // ========== Point Terminal - MercadoPago (Feb 2026) ==========

  /** Crear orden de pago en terminal Point */
  crearOrdenPoint: (data: { terminal_id: string; venta_id: number; monto: number; descripcion?: string; expiration_time?: string }): Promise<AxiosResponse> =>
    apiClient.post('/pos/point/orders', data),

  /** Obtener estado de una orden Point */
  obtenerOrdenPoint: (orderId: string): Promise<AxiosResponse> =>
    apiClient.get(`/pos/point/orders/${orderId}`),

  /** Cancelar orden Point */
  cancelarOrdenPoint: (orderId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/pos/point/orders/${orderId}`),

  /** Listar terminales Point disponibles */
  listarTerminales: (): Promise<AxiosResponse> =>
    apiClient.get('/pos/point/terminals'),

  // Alias de compatibilidad (Ene 2026)
  obtenerVentas: (params: ListarVentasParams = {}): Promise<AxiosResponse<ApiListResponse<Venta>>> =>
    apiClient.get('/pos/ventas', { params }),
};
