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
 * ```js
 * import { queryKeys } from '@/hooks/config';
 *
 * // En queries
 * queryKey: queryKeys.inventario.productos.list(params)
 *
 * // En invalidaciones
 * queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all })
 * ```
 */

export const queryKeys = {
  // ============================================================
  // INVENTARIO
  // ============================================================
  inventario: {
    productos: {
      all: ['productos'],
      list: (params) => ['productos', params],
      detail: (id) => ['producto', id],
      search: (params) => ['buscar-productos', params],
      stockCritico: ['stock-critico'],
      kardex: (id) => ['kardex', id],
      historicoStock: (productoId, dias) => ['inventario', 'historico-stock', productoId, dias],
    },
    categorias: {
      all: ['categorias'],
      list: (params) => ['categorias', params],
      detail: (id) => ['categoria', id],
      arbol: ['categorias-arbol'],
    },
    proveedores: {
      all: ['proveedores'],
      list: (params) => ['proveedores', params],
      detail: (id) => ['proveedor', id],
    },
    ordenesCompra: {
      all: ['ordenes-compra'],
      list: (params) => ['ordenes-compra', params],
      detail: (id) => ['orden-compra', id],
      pendientes: ['ordenes-compra-pendientes'],
      sugerencias: ['sugerencias-oc'],
    },
    movimientos: {
      all: ['movimientos'],
      list: (params) => ['movimientos', params],
    },
    numerosSerie: {
      all: ['numeros-serie'],
      list: (params) => ['numeros-serie', params],
      detail: (id) => ['numeros-serie', id],
      historial: (id) => ['numeros-serie', id, 'historial'],
      disponibles: (productoId, sucursalId) => ['numeros-serie', 'disponibles', productoId, sucursalId],
      resumen: (productoId) => ['numeros-serie', 'resumen', productoId],
      productosConSerie: ['numeros-serie', 'productos-con-serie'],
      estadisticas: ['numeros-serie', 'estadisticas'],
      proximosVencer: (dias) => ['numeros-serie', 'proximos-vencer', dias],
      existe: (productoId, numeroSerie) => ['numeros-serie', 'existe', productoId, numeroSerie],
    },
    variantes: {
      all: ['variantes'],
      list: (productoId) => ['variantes', productoId],
      detail: (id) => ['variante', id],
    },
    atributos: {
      all: ['atributos'],
      list: (params) => ['atributos', params],
    },
    conteos: {
      all: ['conteos'],
      list: (params) => ['conteos', params],
      detail: (id) => ['conteo', id],
      estadisticas: (params) => ['estadisticas-conteos', params],
    },
    ubicaciones: {
      all: ['ubicaciones-almacen'],
      list: (params) => ['ubicaciones-almacen', params],
      detail: (id) => ['ubicacion', id],
      arbol: ['ubicaciones-arbol'],
    },
    valoracion: {
      resumen: ['valor-inventario'],
      historico: (params) => ['valoracion-historico', params],
    },
    landedCosts: {
      all: ['landed-costs'],
      list: (params) => ['landed-costs', params],
    },
    alertas: {
      all: ['alertas-inventario'],
      vencimientos: ['alertas-vencimientos'],
    },
    transferencias: {
      all: ['transferencias'],
      list: (params) => ['transferencias', params],
    },
    reportes: {
      abc: (params) => ['reporte-abc', params],
      rotacion: (params) => ['reporte-rotacion', params],
    },
  },

  // ============================================================
  // ALMACEN
  // ============================================================
  almacen: {
    operaciones: {
      all: ['operaciones-almacen'],
      list: (params) => ['operaciones-almacen', params],
      detail: (id) => ['operacion', id],
    },
    batchPicking: {
      all: ['batch-picking'],
      list: (params) => ['batch-picking', params],
    },
    configuracion: ['configuracion-almacen'],
    consigna: {
      all: ['consigna'],
      list: (params) => ['consigna', params],
    },
    dropship: {
      all: ['dropship'],
      list: (params) => ['dropship', params],
      estadisticas: ['dropship', 'estadisticas'],
      configuracion: ['dropship', 'configuracion'],
      pendientes: ['dropship', 'pendientes'],
      ordenes: {
        all: ['dropship', 'ordenes'],
        list: (filtros) => ['dropship', 'ordenes', filtros],
        detail: (id) => ['dropship', 'ordenes', id],
      },
    },
    reorden: {
      all: ['reorden'],
      dashboard: ['reorden', 'dashboard'],
      productosBajoMinimo: (filtros) => ['reorden', 'productos-bajo-minimo', filtros],
      rutas: (filtros) => ['reorden', 'rutas', filtros],
      reglas: {
        all: ['reorden', 'reglas'],
        list: (filtros) => ['reorden', 'reglas', filtros],
        detail: (id) => ['reorden', 'regla', id],
      },
      logs: {
        all: ['reorden', 'logs'],
        list: (filtros) => ['reorden', 'logs', filtros],
        detail: (id) => ['reorden', 'log', id],
      },
    },
  },

  // ============================================================
  // POS
  // ============================================================
  pos: {
    ventas: {
      all: ['ventas'],
      list: (params) => ['ventas', params],
      detail: (id) => ['venta', id],
      resumen: (params) => ['ventas-resumen', params],
      corteCajaBase: ['corte-caja'],
      corteCaja: (params) => ['corte-caja', params],
      diariasBase: ['ventas-diarias'],
      diarias: (params) => ['ventas-diarias', params],
    },
    cupones: {
      all: ['cupones'],
      list: (params) => ['cupones', params],
      validar: (codigo) => ['validar-cupon', codigo],
      historial: (cuponId, params) => ['cupon-historial', cuponId, params],
      estadisticas: (cuponId) => ['cupon-estadisticas', cuponId],
      vigentes: ['cupones-vigentes'],
    },
    promociones: {
      all: ['promociones'],
      list: (params) => ['promociones', params],
      evaluar: (params) => ['promociones-evaluar', params],
      vigentesBase: ['promociones-vigentes'],
      vigentes: (params) => ['promociones-vigentes', params],
      historial: (promocionId, params) => ['promocion-historial', promocionId, params],
      estadisticas: (promocionId) => ['promocion-estadisticas', promocionId],
    },
    sesionCaja: {
      actual: ['sesion-caja'],
      activaBase: ['sesion-caja-activa'],
      activa: (params) => ['sesion-caja-activa', params],
      historialBase: ['sesiones-caja'],
      historial: (params) => ['sesiones-caja', params],
      detail: (id) => ['sesion-caja', id],
      resumenBase: ['resumen-sesion-caja'],
      resumen: (id) => ['resumen-sesion-caja', id],
      movimientos: (sesionId) => ['movimientos-caja', sesionId],
    },
    pagos: {
      ventaBase: ['pagos-venta'],
      venta: (ventaId) => ['pagos-venta', ventaId],
    },
    stockDisponible: (productoId) => ['stock-disponible', productoId],
    categoriasPOS: ['categorias-pos'],
    productosPOS: (params) => ['productos-pos', params],
    tasaCambio: (monedaOrg, monedaSecundaria) => ['tasa-cambio', monedaOrg, monedaSecundaria],
    // Combos (Feb 2026)
    combos: {
      all: ['combos'],
      list: (params) => ['combos', params],
      detail: (productoId) => ['combo', productoId],
      verificar: (productoId) => ['combo-verificar', productoId],
      precio: (productoId) => ['combo-precio', productoId],
      stock: (productoId, cantidad) => ['combo-stock', productoId, cantidad],
    },
    // Modificadores (Feb 2026)
    modificadores: {
      gruposBase: ['grupos-modificadores'],
      grupos: (params) => ['grupos-modificadores', params],
      productoBase: ['modificadores-producto'],
      producto: (productoId) => ['modificadores-producto', productoId],
      tieneBase: ['tiene-modificadores'],
      tiene: (productoId) => ['tiene-modificadores', productoId],
      asignaciones: (productoId) => ['asignaciones-producto', productoId],
    },
    // Lealtad (Ene 2026)
    lealtad: {
      configuracion: ['lealtad-configuracion'],
      estadisticas: (sucursalId) => ['lealtad-estadisticas', sucursalId],
      puntos: (clienteId) => ['lealtad-puntos', clienteId],
      historialBase: ['lealtad-historial'],
      historial: (clienteId, params) => ['lealtad-historial', clienteId, params],
      nivelesBase: ['lealtad-niveles'],
      niveles: (options) => ['lealtad-niveles', options],
      clientesBase: ['lealtad-clientes'],
      clientes: (params) => ['lealtad-clientes', params],
    },
    // Turnos/Colas (Ene 2026)
    turnos: {
      activos: (sucursalId) => ['turnos-activos', sucursalId],
      historial: (params) => ['turnos-historial', params],
    },
  },

  // ============================================================
  // AGENDAMIENTO
  // ============================================================
  agendamiento: {
    citas: {
      all: ['citas'],
      list: (params) => ['citas', params],
      detail: (id) => ['cita', id],
      calendario: (params) => ['citas-calendario', params],
    },
    servicios: {
      all: ['servicios'],
      list: (params) => ['servicios', params],
      detail: (id) => ['servicio', id],
    },
    horarios: {
      all: ['horarios'],
      list: (params) => ['horarios', params],
      profesional: (profesionalId) => ['horarios-profesional', profesionalId],
    },
    disponibilidad: (params) => ['disponibilidad', params],
    disponibilidadInmediata: (params) => ['disponibilidad-inmediata', params],
    bloqueos: {
      all: ['bloqueos'],
      list: (params) => ['bloqueos', params],
    },
    tiposBloqueo: ['tipos-bloqueo'],
    citasDelDia: ['citas-del-dia'],
    citasHoy: (hoy) => ['citas-hoy', hoy],
    citasCliente: (clienteId) => ['citas-cliente', clienteId],
    configuracion: ['configuracion-agendamiento'],
  },

  // ============================================================
  // PERSONAS
  // ============================================================
  personas: {
    clientes: {
      all: ['clientes'],
      list: (params) => ['clientes', params],
      detail: (id) => ['cliente', id],
      actividades: (id) => ['cliente-actividades', id],
      documentos: (id) => ['cliente-documentos', id],
      credito: (id) => ['cliente-credito', id],
    },
    profesionales: {
      all: ['profesionales'],
      list: (params) => ['profesionales', params],
      detail: (id) => ['profesional', id],
      usuario: (usuarioId) => ['profesional-usuario', usuarioId],
      disponibles: ['usuarios-disponibles'],
    },
    usuarios: {
      all: ['usuarios'],
      list: (params) => ['usuarios', params],
      detail: (id) => ['usuario', id],
    },
    departamentos: {
      all: ['departamentos'],
      list: (params) => ['departamentos', params],
      arbol: ['departamentos-arbol'],
    },
    puestos: {
      all: ['puestos'],
      list: (params) => ['puestos', params],
    },
    vacaciones: {
      solicitudes: (params) => ['vacaciones-solicitudes', params],
      saldos: (usuarioId) => ['vacaciones-saldos', usuarioId],
      politicas: ['vacaciones-politicas'],
    },
    // Tabs de profesionales
    educacionFormal: (profesionalId) => ['educacion-formal', profesionalId],
    experienciaLaboral: (profesionalId) => ['experiencia-laboral', profesionalId],
    habilidades: (profesionalId) => ['habilidades', profesionalId],
    cuentasBancarias: (profesionalId) => ['cuentas-bancarias', profesionalId],
    documentosEmpleado: (profesionalId) => ['documentos-empleado', profesionalId],
    // Incapacidades (Ene 2026)
    incapacidades: {
      all: ['incapacidades'],
      list: (filtros) => ['incapacidades', filtros],
      detail: (id) => ['incapacidades', id],
      estadisticas: (filtros) => ['incapacidades', 'estadisticas', filtros],
    },
    // Oportunidades/CRM (Ene 2026)
    oportunidades: {
      all: ['oportunidades'],
      list: (params) => ['oportunidades', params],
      detail: (id) => ['oportunidad', id],
      pipeline: (vendedorId) => ['pipeline', vendedorId],
      estadisticas: (vendedorId) => ['pipeline-estadisticas', vendedorId],
    },
  },

  // ============================================================
  // SISTEMA
  // ============================================================
  sistema: {
    permisos: {
      verificar: (codigo, sucursalId) => ['permiso', codigo, sucursalId],
      resumen: (usuarioId, sucursalId) => ['permisos-resumen', usuarioId, sucursalId],
    },
    modulos: ['modulos'],
    notificaciones: {
      all: ['notificaciones'],
      list: (params) => ['notificaciones', params],
      noLeidas: ['notificaciones-no-leidas'],
      count: ['notificaciones-count'],
      preferencias: ['notificaciones-preferencias'],
      plantillas: ['notificaciones-plantillas'],
      tipos: ['notificaciones-tipos'],
    },
    sucursales: {
      all: ['sucursales'],
      detail: (id) => ['sucursal', id],
    },
    workflows: {
      all: ['workflows'],
      list: (params) => ['workflows', params],
      detail: (id) => ['workflow', id],
    },
    customFields: {
      byEntity: (entidad) => ['custom-fields', entidad],
      definiciones: (params) => ['custom-fields-definiciones', params],
      valores: (tipo, id) => ['custom-fields-valores', tipo, id],
    },
    // Suscripciones (Ene 2026)
    suscripcion: {
      estado: (orgId) => ['estado-suscripcion', orgId],
      planes: ['planes-disponibles'],
      historial: (orgId) => ['suscripcion-historial', orgId],
    },
    // Roles (Ene 2026)
    roles: {
      all: ['roles'],
      list: (params) => ['roles', params],
      detail: (id) => ['rol', id],
      permisos: (rolId) => ['rol-permisos', rolId],
    },
    // Superadmin (Ene 2026)
    superadmin: {
      dashboard: ['superadmin', 'dashboard'],
      organizaciones: (filtros) => ['superadmin', 'organizaciones', filtros],
      organizacionDetail: (id) => ['superadmin', 'organizacion', id],
      metricas: (params) => ['superadmin', 'metricas', params],
    },
    // Auditoría (Ene 2026)
    auditoria: {
      logs: (params) => ['auditoria-logs', params],
      detail: (id) => ['auditoria-log', id],
    },
  },

  // ============================================================
  // CATALOGOS
  // ============================================================
  catalogos: {
    categoriasPago: ['categorias-pago'],
    motivosSalida: ['motivos-salida'],
    ubicacionesTrabajo: ['ubicaciones-trabajo'],
    categoriasProfesional: ['categorias-profesional'],
    etiquetasClientes: ['etiquetas-clientes'],
    monedas: ['monedas'],
    paises: ['paises'],
    estados: (paisId) => ['estados', paisId],
    ciudades: (estadoId) => ['ciudades', estadoId],
  },

  // ============================================================
  // EVENTOS DIGITALES
  // ============================================================
  eventosDigitales: {
    eventos: {
      all: ['eventos'],
      list: (params) => ['eventos', params],
      detail: (id) => ['evento', id],
      bloques: (eventoId) => ['evento', eventoId, 'bloques'],
    },
    publico: {
      evento: (slug) => ['evento-publico', slug],
      estadisticas: (eventoId) => ['evento-publico-estadisticas', eventoId],
      invitacion: (slug, token) => ['invitacion-publica', slug, token],
      galeria: (slug, limit) => ['galeria-publica', slug, limit],
    },
    plantillas: {
      porTipo: (tipoEvento) => ['plantillas-tipo', tipoEvento],
    },
  },

  // ============================================================
  // AUSENCIAS
  // ============================================================
  ausencias: {
    all: ['ausencias'],
    list: (params) => ['ausencias', params],
    calendario: (params) => ['ausencias', 'calendario', params],
    estadisticas: {
      vacaciones: (anio) => ['ausencias', 'estadisticas', 'vacaciones', anio],
      incapacidades: (anio) => ['ausencias', 'estadisticas', 'incapacidades', anio],
    },
  },

  // ============================================================
  // PRECIOS
  // ============================================================
  precios: {
    listas: {
      all: ['listas-precios'],
      list: (params) => ['listas-precios', params],
      activas: ['listas-precios-activas'],
      items: (listaId) => ['lista-items', listaId],
      clientes: (listaId) => ['lista-clientes', listaId],
    },
  },

  // ============================================================
  // SUSCRIPCIONES NEGOCIO
  // ============================================================
  suscripcionesNegocio: {
    planes: {
      publicos: ['planes-publicos'],
      preview: ['planes-publicos-preview'],
    },
  },

  // ============================================================
  // AUTH / SETUP
  // ============================================================
  auth: {
    usuario: ['usuario'],
    organizacion: ['organizacion'],
    setupProgress: (orgId) => ['setup-progress', orgId],
    setupCheck: ['setup', 'check'],
  },

  // ============================================================
  // STORAGE / MEDIA
  // ============================================================
  storage: {
    archivos: {
      all: ['archivos'],
      list: (params) => ['archivos', params],
      detail: (id) => ['archivo', id],
    },
    usage: ['storage-usage'],
    presignedUrl: (id, expiry) => ['presigned-url', id, expiry],
    unsplash: (query, page) => ['unsplash', 'search', query, page],
  },

  // ============================================================
  // OTROS MODULOS
  // ============================================================
  estadisticas: {
    organizacion: (orgId) => ['estadisticas', orgId],
    dashboard: (params) => ['estadisticas-dashboard', params],
    ventas: (params) => ['estadisticas-ventas', params],
    inventario: (params) => ['estadisticas-inventario', params],
    asignaciones: ['estadisticas-asignaciones'],
    serviciosDashboard: ['servicios-dashboard'],
    bloqueosDashboard: (hoy, treintaDias) => ['bloqueos-dashboard', hoy, treintaDias],
    clientes: ['clientes-estadisticas'],
    clienteDetail: (clienteId) => ['cliente-estadisticas', clienteId],
  },

  contabilidad: {
    cuentas: {
      all: ['cuentas-contables'],
      arbol: ['cuentas-arbol'],
    },
    asientos: {
      all: ['asientos'],
      list: (params) => ['asientos', params],
    },
  },

  marketplace: {
    perfiles: {
      all: ['perfiles-marketplace'],
      list: (params) => ['perfiles-marketplace', params],
      miPerfil: ['mi-perfil-marketplace'],
      publico: (slug) => ['perfil-publico', slug],
    },
    resenas: (slug, params) => ['resenas-negocio', slug, params],
    categorias: ['categorias-marketplace'],
    setupProgress: ['organizacion-setup-progress'],
    estadisticasPerfil: (id, params) => ['estadisticas-perfil', id, params],
    serviciosPublicos: (organizacionId) => ['servicios-publicos', organizacionId],
    disponibilidadPublica: (organizacionId, params) => ['disponibilidad-publica', organizacionId, params],
  },

  website: {
    config: ['website-config'],
    paginas: ['website-paginas'],
    bloques: (paginaId) => ['website-bloques', paginaId],
    templates: {
      all: ['website', 'templates'],
      industrias: ['website', 'templates', 'industrias'],
    },
    versiones: ['website', 'versiones'],
    serviciosErp: ['website-servicios-erp'],
    publico: (slug, pagina) => ['sitio-publico', slug, pagina],
  },

  chatbots: {
    all: ['chatbots'],
    detail: (id) => ['chatbot', id],
    conversaciones: (botId) => ['conversaciones', botId],
    estadisticas: (id, params) => ['chatbot-estadisticas', id, params],
  },

  comisiones: {
    all: ['comisiones'],
    configuracion: (params) => ['comisiones', 'configuracion', params],
    historialConfiguracion: (params) => ['comisiones', 'historial-configuracion', params],
    profesional: (profesionalId, params) => ['comisiones', 'profesional', profesionalId, params],
    periodo: (params) => ['comisiones', 'periodo', params],
    detail: (id) => ['comisiones', id],
    dashboard: (params) => ['comisiones', 'dashboard', params],
    estadisticas: (params) => ['comisiones', 'estadisticas', params],
    graficaPorDia: (params) => ['comisiones', 'grafica-por-dia', params],
  },

  // ============================================================
  // PÚBLICO
  // ============================================================
  publico: {
    servicios: (slug, params) => ['servicios-publicos', slug, params],
    profesionales: (slug, params) => ['profesionales-publicos', slug, params],
    disponibilidad: (organizacionId, params) => ['disponibilidad-publica', organizacionId, params],
  },
};

/**
 * Helper para obtener todas las keys de un dominio (para invalidación masiva)
 * @param {string} dominio - 'inventario' | 'pos' | 'agendamiento' | etc.
 * @returns {string[]} Array de query keys base
 *
 * @example
 * // Invalidar todo el inventario
 * getDomainKeys('inventario').forEach(key => {
 *   queryClient.invalidateQueries({ queryKey: [key], refetchType: 'active' });
 * });
 */
export function getDomainKeys(dominio) {
  const domain = queryKeys[dominio];
  if (!domain) return [];

  const keys = [];
  const extractKeys = (obj, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        keys.push(value[0]);
      } else if (typeof value === 'function') {
        // Ignorar funciones
      } else if (typeof value === 'object') {
        extractKeys(value, `${prefix}${key}.`);
      }
    });
  };

  extractKeys(domain);
  return [...new Set(keys)];
}

export default queryKeys;
