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
    },
    cupones: {
      all: ['cupones'],
      list: (params) => ['cupones', params],
      validar: (codigo) => ['validar-cupon', codigo],
    },
    promociones: {
      all: ['promociones'],
      list: (params) => ['promociones', params],
      evaluar: (params) => ['promociones-evaluar', params],
    },
    sesionCaja: {
      actual: ['sesion-caja'],
      activa: (params) => ['sesion-caja-activa', params],
      historial: (params) => ['sesiones-caja', params],
      detail: (id) => ['sesion-caja', id],
    },
    stockDisponible: (productoId) => ['stock-disponible', productoId],
    categoriasPOS: ['categorias-pos'],
    // Lealtad (Ene 2026)
    lealtad: {
      configuracion: ['lealtad-configuracion'],
      estadisticas: (sucursalId) => ['lealtad-estadisticas', sucursalId],
      puntos: (clienteId) => ['lealtad-puntos', clienteId],
      historial: (clienteId, params) => ['lealtad-historial', clienteId, params],
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
    bloqueos: {
      all: ['bloqueos'],
      list: (params) => ['bloqueos', params],
    },
    tiposBloqueo: ['tipos-bloqueo'],
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
  // OTROS MODULOS
  // ============================================================
  estadisticas: {
    dashboard: (params) => ['estadisticas-dashboard', params],
    ventas: (params) => ['estadisticas-ventas', params],
    inventario: (params) => ['estadisticas-inventario', params],
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
      all: ['marketplace-perfiles'],
      list: (params) => ['marketplace-perfiles', params],
      miPerfil: ['mi-perfil-marketplace'],
    },
    resenas: (perfilSlug) => ['resenas', perfilSlug],
    categorias: ['marketplace-categorias'],
  },

  website: {
    config: ['website-config'],
    paginas: ['website-paginas'],
    bloques: (paginaId) => ['website-bloques', paginaId],
  },

  chatbots: {
    all: ['chatbots'],
    detail: (id) => ['chatbot', id],
    conversaciones: (botId) => ['conversaciones', botId],
  },

  comisiones: {
    config: ['comisiones-config'],
    calculo: (params) => ['comisiones-calculo', params],
    historial: (params) => ['comisiones-historial', params],
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
