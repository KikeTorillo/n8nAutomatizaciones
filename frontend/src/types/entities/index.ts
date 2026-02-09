/**
 * Entity Types — Barrel Export
 *
 * Tipos de entidades del dominio de Nexo.
 * Usar como: import type { Cliente, Producto } from '@/types/entities';
 */

// Base
export type {
  BaseEntity,
  PaginatedResponse,
  ApiResponse,
  ApiListResponse,
  ListParams,
  EstadoActivo,
  ISODateString,
} from './common';

// Entidades
export type { Cliente, ClienteEstadisticas, Etiqueta } from './cliente';
export type { Producto, Categoria } from './producto';
export type {
  Cita,
  EstadoCita,
  CitasListParams,
  CitasListResponse,
  CrearCitaData,
  ActualizarCitaData,
  CancelarCitaVariables,
  ConfirmarCitaVariables,
  IniciarCitaVariables,
  CompletarCitaVariables,
  NoShowCitaVariables,
} from './cita';
export type { OrdenCompra, OrdenCompraItem, EstadoOrdenCompra } from './orden-compra';
export type { Servicio } from './servicio';
export type {
  PlanSuscripcion,
  SuscripcionOrg,
  PagoSuscripcion,
  CuponSuscripcion,
  CicloFacturacion,
  EstadoSuscripcion,
  EstadoPago,
  TipoDescuento,
} from './suscripcion';
export type {
  EventoDigital,
  Invitado,
  Plantilla,
  Mesa,
  FotoGaleria,
  Felicitacion,
  Ubicacion,
  Regalo,
  TipoEvento,
  EstadoEvento,
  EstadoRsvp,
  TipoMesa,
  EstadoFoto,
  TipoUbicacion,
} from './evento';
export type {
  Venta,
  VentaItem,
  SesionCaja,
  MovimientoCaja,
  Cupon,
  Promocion,
  EstadoVenta,
  EstadoPagoVenta,
  TipoVenta,
  MetodoPago,
  TipoDescuentoPOS,
  EstadoSesionCaja,
  TipoMovimientoCaja,
  TipoPromocion,
  ConfiguracionLealtad,
  NivelLealtad,
  PuntosCliente,
  Combo,
  ComboComponente,
  GrupoModificadores,
  Modificador,
} from './venta';
export type {
  Usuario,
  RolUsuario,
  CrearUsuarioData,
  ActualizarUsuarioData,
  AsignacionUbicacion,
} from './usuario';
export type {
  Organizacion,
  OrganizacionRegisterData,
  SetupProgress,
  EstadoSuscripcionOrg,
  EstadisticasOrganizacion,
} from './organizacion';
export type {
  WebsiteConfig,
  WebsiteTema,
  WebsitePagina,
  WebsiteBloque,
  WebsiteTemplate,
  WebsiteVersion,
  AnalyticsResumen,
  AuditoriaSEO,
} from './website';
export type {
  Sucursal,
  CrearSucursalData,
  ActualizarSucursalData,
  Transferencia,
  TransferenciaItem,
  EstadoTransferencia,
} from './sucursal';
export type {
  Profesional,
  CrearProfesionalData,
  ActualizarProfesionalData,
  EstadoLaboral,
  TipoContratacion,
  Genero,
  EstadoCivil,
  FormaPago,
} from './profesional';
export type {
  DocumentoEmpleado,
  TipoDocumentoEmpleado,
  EstadoVencimientoDocumento,
  ExperienciaLaboral,
  EducacionFormal,
  NivelEducacion,
  EstadoEstudio,
  Habilidad,
  HabilidadEmpleado,
  NivelHabilidad,
  CategoriaHabilidad,
  CuentaBancaria,
  TipoCuentaBancaria,
  UsoCuentaBancaria,
  MonedaCuenta,
  Incapacidad,
  TipoIncapacidad,
  EstadoIncapacidad,
  Prorroga,
  CategoriaProfesional,
  PlantillaOnboarding,
  TareaOnboarding,
  ProgresoOnboarding,
} from './empleado';
export type {
  Horario,
  DiaSemana,
  Bloqueo,
  TipoBloqueo,
  TipoBloqueoConfig,
  Recordatorio,
  TipoRecordatorio,
  MomentoRecordatorio,
  DisponibilidadSlot,
  DisponibilidadDia,
} from './agendamiento';
export type {
  Rol,
  Permiso,
  PermisoRol,
  Modulo,
  Notificacion,
  TipoNotificacion,
  CanalNotificacion,
  PreferenciasNotificacion,
  Workflow,
  WorkflowNodo,
  EstadoWorkflow,
  TipoNodoWorkflow,
  EjecucionWorkflow,
  CustomField,
  TipoCampoCustom,
  CustomFieldValue,
} from './sistema';
export type {
  Atributo,
  Variante,
  MovimientoStock,
  ReservaStock,
  ConteoInventario,
  EstadoConteo,
  ConteoItem,
  UbicacionAlmacen,
  TipoUbicacionAlmacen,
  ValoracionInventario,
  MetodoCosteo,
  AcuerdoConsigna,
  EstadoAcuerdoConsigna,
  LiquidacionConsigna,
  EstadoLiquidacion,
} from './inventario';
