/**
 * Query Keys Centralizadas
 *
 * Ene 2026: Centraliza todas las query keys del frontend para:
 * - Consistencia en invalidaciones
 * - Evitar errores de tipeo
 * - Facilitar refactoring
 * - Mejorar DX con autocompletado
 *
 * Convenciones:
 * - `all`: Lista sin filtros
 * - `list(params)`: Lista con filtros/paginación
 * - `detail(id)`: Detalle por ID
 * - `search(params)`: Búsqueda
 *
 * Uso:
 * ```ts
 * import { queryKeys } from '@/hooks/config';
 *
 * // En queries
 * queryKey: queryKeys.inventario.productos.list(params)
 *
 * // En invalidaciones
 * queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all })
 * ```
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = Record<string, any>;
type Id = number | string | null | undefined;

export const queryKeys = {
  // ============================================================
  // INVENTARIO
  // ============================================================
  inventario: {
    productos: {
      all: ['productos'] as const,
      list: (params?: Params) => ['productos', params] as const,
      detail: (id: Id) => ['producto', id] as const,
      search: (params?: Params) => ['buscar-productos', params] as const,
      stockCritico: ['stock-critico'] as const,
      kardex: (id: Id) => ['kardex', id] as const,
      historicoStock: (productoId: Id, dias: number) => ['inventario', 'historico-stock', productoId, dias] as const,
    },
    categorias: {
      all: ['categorias'] as const,
      list: (params?: Params) => ['categorias', params] as const,
      detail: (id: Id) => ['categoria', id] as const,
      arbol: ['categorias-arbol'] as const,
    },
    proveedores: {
      all: ['proveedores'] as const,
      list: (params?: Params) => ['proveedores', params] as const,
      detail: (id: Id) => ['proveedor', id] as const,
    },
    ordenesCompra: {
      all: ['ordenes-compra'] as const,
      list: (params?: Params) => ['ordenes-compra', params] as const,
      detail: (id: Id) => ['orden-compra', id] as const,
      pendientes: ['ordenes-compra-pendientes'] as const,
      sugerencias: ['sugerencias-oc'] as const,
    },
    movimientos: {
      all: ['movimientos'] as const,
      list: (params?: Params) => ['movimientos', params] as const,
    },
    numerosSerie: {
      all: ['numeros-serie'] as const,
      list: (params?: Params) => ['numeros-serie', params] as const,
      detail: (id: Id) => ['numeros-serie', id] as const,
      historial: (id: Id) => ['numeros-serie', id, 'historial'] as const,
      disponibles: (productoId: Id, sucursalId: Id) => ['numeros-serie', 'disponibles', productoId, sucursalId] as const,
      resumen: (productoId: Id) => ['numeros-serie', 'resumen', productoId] as const,
      productosConSerie: ['numeros-serie', 'productos-con-serie'] as const,
      estadisticas: ['numeros-serie', 'estadisticas'] as const,
      proximosVencer: (dias: number) => ['numeros-serie', 'proximos-vencer', dias] as const,
      existe: (productoId: Id, numeroSerie: string) => ['numeros-serie', 'existe', productoId, numeroSerie] as const,
    },
    variantes: {
      all: ['variantes'] as const,
      list: (productoId: Id) => ['variantes', productoId] as const,
      detail: (id: Id) => ['variante', id] as const,
    },
    atributos: {
      all: ['atributos'] as const,
      list: (params?: Params) => ['atributos', params] as const,
    },
    conteos: {
      all: ['conteos'] as const,
      list: (params?: Params) => ['conteos', params] as const,
      detail: (id: Id) => ['conteo', id] as const,
      estadisticas: (params?: Params) => ['estadisticas-conteos', params] as const,
    },
    ubicaciones: {
      all: ['ubicaciones-almacen'] as const,
      list: (params?: Params) => ['ubicaciones-almacen', params] as const,
      detail: (id: Id) => ['ubicacion', id] as const,
      arbol: ['ubicaciones-arbol'] as const,
    },
    valoracion: {
      resumen: ['valor-inventario'] as const,
      historico: (params?: Params) => ['valoracion-historico', params] as const,
    },
    landedCosts: {
      all: ['landed-costs'] as const,
      list: (params?: Params) => ['landed-costs', params] as const,
    },
    alertas: {
      all: ['alertas-inventario'] as const,
      vencimientos: ['alertas-vencimientos'] as const,
    },
    transferencias: {
      all: ['transferencias'] as const,
      list: (params?: Params) => ['transferencias', params] as const,
    },
    reportes: {
      abc: (params?: Params) => ['reporte-abc', params] as const,
      rotacion: (params?: Params) => ['reporte-rotacion', params] as const,
    },
  },

  // ============================================================
  // ALMACEN
  // ============================================================
  almacen: {
    operaciones: {
      all: ['operaciones-almacen'] as const,
      list: (params?: Params) => ['operaciones-almacen', params] as const,
      detail: (id: Id) => ['operacion', id] as const,
    },
    batchPicking: {
      all: ['batch-picking'] as const,
      list: (params?: Params) => ['batch-picking', params] as const,
    },
    configuracion: ['configuracion-almacen'] as const,
    consigna: {
      all: ['consigna'] as const,
      list: (params?: Params) => ['consigna', params] as const,
    },
    paquetes: {
      all: ['paquetes'] as const,
      porOperacion: (operacionId: Id) => ['paquetes', 'operacion', operacionId] as const,
      detail: (id: Id) => ['paquetes', 'detail', id] as const,
      itemsDisponibles: (operacionId: Id) => ['paquetes', 'items-disponibles', operacionId] as const,
      resumen: (operacionId: Id) => ['paquetes', 'resumen', operacionId] as const,
      etiqueta: (id: Id) => ['paquetes', 'etiqueta', id] as const,
    },
    dropship: {
      all: ['dropship'] as const,
      list: (params?: Params) => ['dropship', params] as const,
      estadisticas: ['dropship', 'estadisticas'] as const,
      configuracion: ['dropship', 'configuracion'] as const,
      pendientes: ['dropship', 'pendientes'] as const,
      ordenes: {
        all: ['dropship', 'ordenes'] as const,
        list: (filtros?: Params) => ['dropship', 'ordenes', filtros] as const,
        detail: (id: Id) => ['dropship', 'ordenes', id] as const,
      },
    },
    reorden: {
      all: ['reorden'] as const,
      dashboard: ['reorden', 'dashboard'] as const,
      productosBajoMinimo: (filtros?: Params) => ['reorden', 'productos-bajo-minimo', filtros] as const,
      rutas: (filtros?: Params) => ['reorden', 'rutas', filtros] as const,
      reglas: {
        all: ['reorden', 'reglas'] as const,
        list: (filtros?: Params) => ['reorden', 'reglas', filtros] as const,
        detail: (id: Id) => ['reorden', 'regla', id] as const,
      },
      logs: {
        all: ['reorden', 'logs'] as const,
        list: (filtros?: Params) => ['reorden', 'logs', filtros] as const,
        detail: (id: Id) => ['reorden', 'log', id] as const,
      },
    },
  },

  // ============================================================
  // POS
  // ============================================================
  pos: {
    ventas: {
      all: ['ventas'] as const,
      list: (params?: Params) => ['ventas', params] as const,
      detail: (id: Id) => ['venta', id] as const,
      resumen: (params?: Params) => ['ventas-resumen', params] as const,
      corteCajaBase: ['corte-caja'] as const,
      corteCaja: (params?: Params) => ['corte-caja', params] as const,
      diariasBase: ['ventas-diarias'] as const,
      diarias: (params?: Params) => ['ventas-diarias', params] as const,
    },
    cupones: {
      all: ['cupones'] as const,
      list: (params?: Params) => ['cupones', params] as const,
      validar: (codigo: string) => ['validar-cupon', codigo] as const,
      historial: (cuponId: Id, params?: Params) => ['cupon-historial', cuponId, params] as const,
      estadisticas: (cuponId: Id) => ['cupon-estadisticas', cuponId] as const,
      vigentes: ['cupones-vigentes'] as const,
    },
    promociones: {
      all: ['promociones'] as const,
      list: (params?: Params) => ['promociones', params] as const,
      evaluar: (params?: Params) => ['promociones-evaluar', params] as const,
      vigentesBase: ['promociones-vigentes'] as const,
      vigentes: (params?: Params) => ['promociones-vigentes', params] as const,
      historial: (promocionId: Id, params?: Params) => ['promocion-historial', promocionId, params] as const,
      estadisticas: (promocionId: Id) => ['promocion-estadisticas', promocionId] as const,
    },
    sesionCaja: {
      actual: ['sesion-caja'] as const,
      activaBase: ['sesion-caja-activa'] as const,
      activa: (params?: Params) => ['sesion-caja-activa', params] as const,
      historialBase: ['sesiones-caja'] as const,
      historial: (params?: Params) => ['sesiones-caja', params] as const,
      detail: (id: Id) => ['sesion-caja', id] as const,
      resumenBase: ['resumen-sesion-caja'] as const,
      resumen: (id: Id) => ['resumen-sesion-caja', id] as const,
      movimientos: (sesionId: Id) => ['movimientos-caja', sesionId] as const,
    },
    pagos: {
      ventaBase: ['pagos-venta'] as const,
      venta: (ventaId: Id) => ['pagos-venta', ventaId] as const,
    },
    stockDisponible: (productoId: Id) => ['stock-disponible', productoId] as const,
    categoriasPOS: ['categorias-pos'] as const,
    productosPOS: (params?: Params) => ['productos-pos', params] as const,
    tasaCambio: (monedaOrg: string, monedaSecundaria: string) => ['tasa-cambio', monedaOrg, monedaSecundaria] as const,
    // Combos (Feb 2026)
    combos: {
      all: ['combos'] as const,
      list: (params?: Params) => ['combos', params] as const,
      detail: (productoId: Id) => ['combo', productoId] as const,
      verificar: (productoId: Id) => ['combo-verificar', productoId] as const,
      precio: (productoId: Id) => ['combo-precio', productoId] as const,
      stock: (productoId: Id, cantidad: number) => ['combo-stock', productoId, cantidad] as const,
    },
    // Modificadores (Feb 2026)
    modificadores: {
      gruposBase: ['grupos-modificadores'] as const,
      grupos: (params?: Params) => ['grupos-modificadores', params] as const,
      productoBase: ['modificadores-producto'] as const,
      producto: (productoId: Id) => ['modificadores-producto', productoId] as const,
      tieneBase: ['tiene-modificadores'] as const,
      tiene: (productoId: Id) => ['tiene-modificadores', productoId] as const,
      asignaciones: (productoId: Id) => ['asignaciones-producto', productoId] as const,
    },
    // Lealtad (Ene 2026)
    lealtad: {
      configuracion: ['lealtad-configuracion'] as const,
      estadisticas: (sucursalId: Id) => ['lealtad-estadisticas', sucursalId] as const,
      puntos: (clienteId: Id) => ['lealtad-puntos', clienteId] as const,
      historialBase: ['lealtad-historial'] as const,
      historial: (clienteId: Id, params?: Params) => ['lealtad-historial', clienteId, params] as const,
      nivelesBase: ['lealtad-niveles'] as const,
      niveles: (options?: Params) => ['lealtad-niveles', options] as const,
      clientesBase: ['lealtad-clientes'] as const,
      clientes: (params?: Params) => ['lealtad-clientes', params] as const,
    },
    // Turnos/Colas (Ene 2026)
    turnos: {
      activos: (sucursalId: Id) => ['turnos-activos', sucursalId] as const,
      historial: (params?: Params) => ['turnos-historial', params] as const,
    },
  },

  // ============================================================
  // AGENDAMIENTO
  // ============================================================
  agendamiento: {
    citas: {
      all: ['citas'] as const,
      list: (params?: Params) => ['citas', params] as const,
      detail: (id: Id) => ['cita', id] as const,
      calendario: (params?: Params) => ['citas-calendario', params] as const,
    },
    servicios: {
      all: ['servicios'] as const,
      list: (params?: Params) => ['servicios', params] as const,
      detail: (id: Id) => ['servicio', id] as const,
    },
    horarios: {
      all: ['horarios'] as const,
      list: (params?: Params) => ['horarios', params] as const,
      detail: (id: Id) => ['horario', id] as const,
      profesional: (profesionalId: Id) => ['horarios-profesional', profesionalId] as const,
    },
    disponibilidad: (params?: Params) => ['disponibilidad', params] as const,
    disponibilidadInmediata: (params?: Params) => ['disponibilidad-inmediata', params] as const,
    bloqueos: {
      all: ['bloqueos'] as const,
      list: (params?: Params) => ['bloqueos', params] as const,
    },
    tiposBloqueo: ['tipos-bloqueo'] as const,
    citasDelDia: ['citas-del-dia'] as const,
    citasHoy: (hoy: string) => ['citas-hoy', hoy] as const,
    citasCliente: (clienteId: Id) => ['citas-cliente', clienteId] as const,
    configuracion: ['configuracion-agendamiento'] as const,
  },

  // ============================================================
  // PERSONAS
  // ============================================================
  personas: {
    clientes: {
      all: ['clientes'] as const,
      list: (params?: Params) => ['clientes', params] as const,
      detail: (id: Id) => ['cliente', id] as const,
      actividades: (id: Id) => ['cliente-actividades', id] as const,
      documentos: (id: Id) => ['cliente-documentos', id] as const,
      credito: (id: Id) => ['cliente-credito', id] as const,
    },
    profesionales: {
      all: ['profesionales'] as const,
      list: (params?: Params) => ['profesionales', params] as const,
      detail: (id: Id) => ['profesional', id] as const,
      usuario: (usuarioId: Id) => ['profesional-usuario', usuarioId] as const,
      disponibles: ['usuarios-disponibles'] as const,
    },
    usuarios: {
      all: ['usuarios'] as const,
      list: (params?: Params) => ['usuarios', params] as const,
      detail: (id: Id) => ['usuario', id] as const,
    },
    departamentos: {
      all: ['departamentos'] as const,
      list: (params?: Params) => ['departamentos', params] as const,
      arbol: ['departamentos-arbol'] as const,
    },
    puestos: {
      all: ['puestos'] as const,
      list: (params?: Params) => ['puestos', params] as const,
    },
    vacaciones: {
      solicitudes: (params?: Params) => ['vacaciones-solicitudes', params] as const,
      saldos: (usuarioId: Id) => ['vacaciones-saldos', usuarioId] as const,
      politicas: ['vacaciones-politicas'] as const,
    },
    // Tabs de profesionales
    educacionFormal: (profesionalId: Id) => ['educacion-formal', profesionalId] as const,
    cuentasBancarias: (profesionalId: Id) => ['cuentas-bancarias', profesionalId] as const,
    documentosEmpleado: (profesionalId: Id) => ['documentos-empleado', profesionalId] as const,
    // Experiencia laboral (centralizado Feb 2026)
    experienciaLaboral: {
      all: ['experiencia-laboral'] as const,
      lists: () => ['experiencia-laboral', 'list'] as const,
      list: (profesionalId: Id, filters?: Params) => ['experiencia-laboral', 'list', profesionalId, filters] as const,
      details: () => ['experiencia-laboral', 'detail'] as const,
      detail: (profesionalId: Id, experienciaId: Id) => ['experiencia-laboral', 'detail', profesionalId, experienciaId] as const,
      actual: (profesionalId: Id) => ['experiencia-laboral', 'actual', profesionalId] as const,
    },
    // Habilidades (centralizado Feb 2026)
    habilidades: {
      catalogo: {
        all: ['catalogo-habilidades'] as const,
        lists: () => ['catalogo-habilidades', 'list'] as const,
        list: (filters?: Params) => ['catalogo-habilidades', 'list', filters] as const,
        details: () => ['catalogo-habilidades', 'detail'] as const,
        detail: (habilidadId: Id) => ['catalogo-habilidades', 'detail', habilidadId] as const,
        profesionales: (habilidadId: Id) => ['catalogo-habilidades', 'profesionales', habilidadId] as const,
      },
      empleado: {
        all: ['habilidades-empleado'] as const,
        lists: () => ['habilidades-empleado', 'list'] as const,
        list: (profesionalId: Id, filters?: Params) => ['habilidades-empleado', 'list', profesionalId, filters] as const,
        details: () => ['habilidades-empleado', 'detail'] as const,
        detail: (profesionalId: Id, habilidadEmpleadoId: Id) => ['habilidades-empleado', 'detail', profesionalId, habilidadEmpleadoId] as const,
      },
    },
    // Incapacidades (Ene 2026)
    incapacidades: {
      all: ['incapacidades'] as const,
      list: (filtros?: Params) => ['incapacidades', filtros] as const,
      detail: (id: Id) => ['incapacidades', id] as const,
      estadisticas: (filtros?: Params) => ['incapacidades', 'estadisticas', filtros] as const,
    },
    // Oportunidades/CRM (Ene 2026)
    oportunidades: {
      all: ['oportunidades'] as const,
      list: (params?: Params) => ['oportunidades', params] as const,
      detail: (id: Id) => ['oportunidad', id] as const,
      pipeline: (vendedorId: Id) => ['pipeline', vendedorId] as const,
      estadisticas: (vendedorId: Id) => ['pipeline-estadisticas', vendedorId] as const,
    },
  },

  // ============================================================
  // SISTEMA
  // ============================================================
  sistema: {
    permisos: {
      verificar: (codigo: string, sucursalId: Id) => ['permiso', codigo, sucursalId] as const,
      resumen: (usuarioId: Id, sucursalId: Id) => ['permisos-resumen', usuarioId, sucursalId] as const,
    },
    modulos: ['modulos'] as const,
    notificaciones: {
      all: ['notificaciones'] as const,
      list: (params?: Params) => ['notificaciones', params] as const,
      noLeidas: ['notificaciones-no-leidas'] as const,
      count: ['notificaciones-count'] as const,
      preferencias: ['notificaciones-preferencias'] as const,
      plantillas: ['notificaciones-plantillas'] as const,
      tipos: ['notificaciones-tipos'] as const,
    },
    sucursales: {
      all: ['sucursales'] as const,
      detail: (id: Id) => ['sucursal', id] as const,
      matriz: ['sucursal-matriz'] as const,
      porUsuario: (usuarioId: Id) => ['sucursales-usuario', usuarioId] as const,
      usuarios: (sucursalId: Id) => ['sucursal-usuarios', sucursalId] as const,
      profesionales: (sucursalId: Id) => ['sucursal-profesionales', sucursalId] as const,
      metricas: (params?: Params) => ['metricas-sucursales', params] as const,
      transferencia: (id: Id) => ['transferencia', id] as const,
    },
    workflows: {
      all: ['workflows'] as const,
      list: (params?: Params) => ['workflows', params] as const,
      detail: (id: Id) => ['workflow', id] as const,
    },
    customFields: {
      byEntity: (entidad: string) => ['custom-fields', entidad] as const,
      definiciones: (params?: Params) => ['custom-fields-definiciones', params] as const,
      valores: (tipo: string | null | undefined, id: Id) => ['custom-fields-valores', tipo, id] as const,
    },
    // Suscripciones (Ene 2026)
    suscripcion: {
      estado: (orgId: Id) => ['estado-suscripcion', orgId] as const,
      planes: ['planes-disponibles'] as const,
      historial: (orgId: Id) => ['suscripcion-historial', orgId] as const,
    },
    // Roles (Ene 2026)
    roles: {
      all: ['roles'] as const,
      list: (params?: Params) => ['roles', params] as const,
      detail: (id: Id) => ['rol', id] as const,
      permisos: (rolId: Id) => ['rol-permisos', rolId] as const,
    },
    // Superadmin (Ene 2026)
    superadmin: {
      dashboard: ['superadmin', 'dashboard'] as const,
      organizaciones: (filtros?: Params) => ['superadmin', 'organizaciones', filtros] as const,
      organizacionDetail: (id: Id) => ['superadmin', 'organizacion', id] as const,
      metricas: (params?: Params) => ['superadmin', 'metricas', params] as const,
    },
    // Auditoría (Ene 2026)
    auditoria: {
      logs: (params?: Params) => ['auditoria-logs', params] as const,
      detail: (id: Id) => ['auditoria-log', id] as const,
    },
  },

  // ============================================================
  // CATALOGOS
  // ============================================================
  catalogos: {
    categoriasPago: ['categorias-pago'] as const,
    motivosSalida: ['motivos-salida'] as const,
    ubicacionesTrabajo: ['ubicaciones-trabajo'] as const,
    categoriasProfesional: ['categorias-profesional'] as const,
    etiquetasClientes: ['etiquetas-clientes'] as const,
    monedas: ['monedas'] as const,
    paises: ['paises'] as const,
    estados: (paisId: Id) => ['estados', paisId] as const,
    ciudades: (estadoId: Id) => ['ciudades', estadoId] as const,
  },

  // ============================================================
  // EVENTOS DIGITALES
  // ============================================================
  eventosDigitales: {
    eventos: {
      all: ['eventos'] as const,
      list: (params?: Params) => ['eventos', params] as const,
      detail: (id: Id) => ['evento', id] as const,
      bloques: (eventoId: Id) => ['evento', eventoId, 'bloques'] as const,
    },
    publico: {
      evento: (slug: string) => ['evento-publico', slug] as const,
      estadisticas: (eventoId: Id) => ['evento-publico-estadisticas', eventoId] as const,
      invitacion: (slug: string, token: string) => ['invitacion-publica', slug, token] as const,
      galeria: (slug: string, limit?: number) => ['galeria-publica', slug, limit] as const,
    },
    plantillas: {
      porTipo: (tipoEvento: string) => ['plantillas-tipo', tipoEvento] as const,
    },
  },

  // ============================================================
  // AUSENCIAS
  // ============================================================
  ausencias: {
    all: ['ausencias'] as const,
    list: (params?: Params) => ['ausencias', params] as const,
    calendario: (params?: Params) => ['ausencias', 'calendario', params] as const,
    estadisticas: {
      vacaciones: (anio: number) => ['ausencias', 'estadisticas', 'vacaciones', anio] as const,
      incapacidades: (anio: number) => ['ausencias', 'estadisticas', 'incapacidades', anio] as const,
    },
  },

  // ============================================================
  // PRECIOS
  // ============================================================
  precios: {
    listas: {
      all: ['listas-precios'] as const,
      list: (params?: Params) => ['listas-precios', params] as const,
      activas: ['listas-precios-activas'] as const,
      items: (listaId: Id) => ['lista-items', listaId] as const,
      clientes: (listaId: Id) => ['lista-clientes', listaId] as const,
    },
  },

  // ============================================================
  // SUSCRIPCIONES NEGOCIO
  // ============================================================
  suscripcionesNegocio: {
    planes: {
      publicos: ['planes-publicos'] as const,
      preview: ['planes-publicos-preview'] as const,
    },
  },

  // ============================================================
  // AUTH / SETUP
  // ============================================================
  auth: {
    usuario: ['usuario'] as const,
    organizacion: ['organizacion'] as const,
    setupProgress: (orgId: Id) => ['setup-progress', orgId] as const,
    setupCheck: ['setup', 'check'] as const,
  },

  // ============================================================
  // STORAGE / MEDIA
  // ============================================================
  storage: {
    archivos: {
      all: ['archivos'] as const,
      list: (params?: Params) => ['archivos', params] as const,
      detail: (id: Id) => ['archivo', id] as const,
    },
    usage: ['storage-usage'] as const,
    presignedUrl: (id: Id, expiry?: number) => ['presigned-url', id, expiry] as const,
    unsplash: (query: string, page?: number) => ['unsplash', 'search', query, page] as const,
  },

  // ============================================================
  // OTROS MODULOS
  // ============================================================
  estadisticas: {
    organizacion: (orgId: Id) => ['estadisticas', orgId] as const,
    dashboard: (params?: Params) => ['estadisticas-dashboard', params] as const,
    ventas: (params?: Params) => ['estadisticas-ventas', params] as const,
    inventario: (params?: Params) => ['estadisticas-inventario', params] as const,
    asignaciones: ['estadisticas-asignaciones'] as const,
    serviciosDashboard: ['servicios-dashboard'] as const,
    bloqueosDashboard: (hoy: string, treintaDias: string) => ['bloqueos-dashboard', hoy, treintaDias] as const,
    clientes: ['clientes-estadisticas'] as const,
    clienteDetail: (clienteId: Id) => ['cliente-estadisticas', clienteId] as const,
  },

  contabilidad: {
    cuentas: {
      all: ['cuentas-contables'] as const,
      arbol: ['cuentas-arbol'] as const,
    },
    asientos: {
      all: ['asientos'] as const,
      list: (params?: Params) => ['asientos', params] as const,
    },
  },

  marketplace: {
    perfiles: {
      all: ['perfiles-marketplace'] as const,
      list: (params?: Params) => ['perfiles-marketplace', params] as const,
      miPerfil: ['mi-perfil-marketplace'] as const,
      publico: (slug: string) => ['perfil-publico', slug] as const,
    },
    resenas: (slug: string, params?: Params) => ['resenas-negocio', slug, params] as const,
    categorias: ['categorias-marketplace'] as const,
    setupProgress: ['organizacion-setup-progress'] as const,
    estadisticasPerfil: (id: Id, params?: Params) => ['estadisticas-perfil', id, params] as const,
    serviciosPublicos: (organizacionId: Id) => ['servicios-publicos', organizacionId] as const,
    disponibilidadPublica: (organizacionId: Id, params?: Params) => ['disponibilidad-publica', organizacionId, params] as const,
  },

  website: {
    config: ['website-config'] as const,
    paginas: ['website-paginas'] as const,
    bloques: (paginaId: Id) => ['website-bloques', paginaId] as const,
    templates: {
      all: ['website', 'templates'] as const,
      industrias: ['website', 'templates', 'industrias'] as const,
    },
    versiones: ['website', 'versiones'] as const,
    serviciosErp: ['website-servicios-erp'] as const,
    publico: (slug: string, pagina?: string) => ['sitio-publico', slug, pagina] as const,
  },

  chatbots: {
    all: ['chatbots'] as const,
    detail: (id: Id) => ['chatbot', id] as const,
    conversaciones: (botId: Id) => ['conversaciones', botId] as const,
    estadisticas: (id: Id, params?: Params) => ['chatbot-estadisticas', id, params] as const,
  },

  comisiones: {
    all: ['comisiones'] as const,
    configuracion: (params?: Params) => ['comisiones', 'configuracion', params] as const,
    historialConfiguracion: (params?: Params) => ['comisiones', 'historial-configuracion', params] as const,
    profesional: (profesionalId: Id, params?: Params) => ['comisiones', 'profesional', profesionalId, params] as const,
    periodo: (params?: Params) => ['comisiones', 'periodo', params] as const,
    detail: (id: Id) => ['comisiones', id] as const,
    dashboard: (params?: Params) => ['comisiones', 'dashboard', params] as const,
    estadisticas: (params?: Params) => ['comisiones', 'estadisticas', params] as const,
    graficaPorDia: (params?: Params) => ['comisiones', 'grafica-por-dia', params] as const,
  },

  // ============================================================
  // PÚBLICO
  // ============================================================
  publico: {
    servicios: (slug: string, params?: Params) => ['servicios-publicos', slug, params] as const,
    profesionales: (slug: string, params?: Params) => ['profesionales-publicos', slug, params] as const,
    disponibilidad: (organizacionId: Id, params?: Params) => ['disponibilidad-publica', organizacionId, params] as const,
  },
} as const;

/**
 * Helper para obtener todas las keys de un dominio (para invalidación masiva)
 *
 * @example
 * // Invalidar todo el inventario
 * getDomainKeys('inventario').forEach(key => {
 *   queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
 * });
 */
export function getDomainKeys(dominio: keyof typeof queryKeys): string[] {
  const domain = queryKeys[dominio];
  if (!domain) return [];

  const keys: string[] = [];
  const extractKeys = (obj: Record<string, unknown>) => {
    Object.values(obj).forEach((value) => {
      if (Array.isArray(value)) {
        keys.push(value[0] as string);
      } else if (typeof value === 'function') {
        // Ignorar funciones
      } else if (typeof value === 'object' && value !== null) {
        extractKeys(value as Record<string, unknown>);
      }
    });
  };

  extractKeys(domain as unknown as Record<string, unknown>);
  return [...new Set(keys)];
}

export default queryKeys;
