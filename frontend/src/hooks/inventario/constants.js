/**
 * Constantes para el módulo de Inventario
 * Query keys y configuración compartida
 * Ene 2026 - Centralización de query keys
 */

/**
 * Query keys para React Query - Inventario
 */
export const INVENTARIO_KEYS = {
  all: ['inventario'],

  // Productos
  productos: {
    all: () => ['productos'],
    list: (params) => [...INVENTARIO_KEYS.productos.all(), 'list', params],
    detail: (id) => ['producto', id],
    buscar: (params) => ['buscar-productos', params],
    stockCritico: () => ['stock-critico'],
    valorInventario: () => ['valor-inventario'],
  },

  // Categorías
  categorias: {
    all: () => ['categorias'],
    list: (params) => [...INVENTARIO_KEYS.categorias.all(), 'list', params],
    arbol: (params) => [...INVENTARIO_KEYS.categorias.all(), 'arbol', params],
    detail: (id) => ['categoria', id],
  },

  // Proveedores
  proveedores: {
    all: () => ['proveedores'],
    list: (params) => [...INVENTARIO_KEYS.proveedores.all(), 'list', params],
    detail: (id) => ['proveedor', id],
    productos: (proveedorId) => ['proveedor-productos', proveedorId],
  },

  // Variantes y Atributos
  variantes: {
    all: () => ['variantes'],
    byProducto: (productoId) => ['variantes', productoId],
    detail: (id) => ['variante', id],
  },
  atributos: {
    all: () => ['atributos'],
    list: (params) => [...INVENTARIO_KEYS.atributos.all(), 'list', params],
    detail: (id) => ['atributo', id],
    valores: (atributoId) => ['atributo', atributoId, 'valores'],
  },

  // Movimientos e Historial
  movimientos: {
    all: () => ['movimientos'],
    list: (params) => [...INVENTARIO_KEYS.movimientos.all(), 'list', params],
    kardex: (productoId, params) => ['kardex', productoId, params],
    historial: (productoId) => ['historial-producto', productoId],
  },

  // Órdenes de Compra
  ordenesCompra: {
    all: () => ['ordenes-compra'],
    list: (params) => [...INVENTARIO_KEYS.ordenesCompra.all(), 'list', params],
    detail: (id) => ['orden-compra', id],
    items: (ordenId) => [...INVENTARIO_KEYS.ordenesCompra.all(), ordenId, 'items'],
    recepciones: (ordenId) => [...INVENTARIO_KEYS.ordenesCompra.all(), ordenId, 'recepciones'],
  },

  // Landed Costs
  landedCosts: {
    all: (ordenCompraId) => ['landed-costs', ordenCompraId],
    resumen: (ordenCompraId) => ['landed-costs', ordenCompraId, 'resumen'],
    distribucion: (ordenCompraId, costoId) => ['landed-costs', ordenCompraId, 'distribucion', costoId],
    porItems: (ordenCompraId) => ['landed-costs', ordenCompraId, 'por-items'],
  },

  // Conteos
  conteos: {
    all: () => ['conteos'],
    list: (params) => [...INVENTARIO_KEYS.conteos.all(), 'list', params],
    detail: (id) => ['conteo', id],
    lineas: (conteoId) => ['conteo', conteoId, 'lineas'],
    discrepancias: (conteoId) => ['conteo', conteoId, 'discrepancias'],
  },

  // Ajustes Masivos
  ajustesMasivos: {
    all: () => ['ajustes-masivos'],
    list: (params) => [...INVENTARIO_KEYS.ajustesMasivos.all(), 'list', params],
    detail: (id) => ['ajuste-masivo', id],
  },

  // Transferencias
  transferencias: {
    all: () => ['transferencias'],
    list: (params) => [...INVENTARIO_KEYS.transferencias.all(), 'list', params],
    detail: (id) => ['transferencia', id],
    pendientes: () => [...INVENTARIO_KEYS.transferencias.all(), 'pendientes'],
  },

  // Ubicaciones de Almacén
  ubicaciones: {
    all: () => ['ubicaciones-almacen'],
    list: (params) => [...INVENTARIO_KEYS.ubicaciones.all(), 'list', params],
    arbol: (sucursalId) => [...INVENTARIO_KEYS.ubicaciones.all(), 'arbol', sucursalId],
    detail: (id) => ['ubicacion-almacen', id],
    disponibles: (sucursalId) => [...INVENTARIO_KEYS.ubicaciones.all(), 'disponibles', sucursalId],
  },

  // Rutas de Operación
  rutas: {
    all: () => ['rutas-operacion'],
    list: (params) => [...INVENTARIO_KEYS.rutas.all(), 'list', params],
    detail: (id) => ['ruta-operacion', id],
  },

  // Reglas de Reabastecimiento
  reglasReabastecimiento: {
    all: () => ['reglas-reabastecimiento'],
    list: (params) => [...INVENTARIO_KEYS.reglasReabastecimiento.all(), 'list', params],
    detail: (id) => ['regla-reabastecimiento', id],
    sugerencias: () => ['sugerencias-reabastecimiento'],
  },

  // Reservas de Stock
  reservas: {
    all: () => ['reservas-stock'],
    list: (params) => [...INVENTARIO_KEYS.reservas.all(), 'list', params],
    byProducto: (productoId) => [...INVENTARIO_KEYS.reservas.all(), 'producto', productoId],
  },

  // Alertas
  alertas: {
    all: () => ['alertas-inventario'],
    noLeidas: () => [...INVENTARIO_KEYS.alertas.all(), 'no-leidas'],
    count: () => [...INVENTARIO_KEYS.alertas.all(), 'count'],
  },

  // Números de Serie / Lotes
  numerosSerie: {
    all: () => ['numeros-serie'],
    list: (params) => [...INVENTARIO_KEYS.numerosSerie.all(), 'list', params],
    detail: (id) => ['numero-serie', id],
    byProducto: (productoId) => [...INVENTARIO_KEYS.numerosSerie.all(), 'producto', productoId],
    disponibles: (productoId, sucursalId) => [
      ...INVENTARIO_KEYS.numerosSerie.all(),
      'disponibles',
      productoId,
      sucursalId,
    ],
  },

  // Valoración
  valoracion: {
    all: () => ['valoracion-inventario'],
    resumen: (params) => [...INVENTARIO_KEYS.valoracion.all(), 'resumen', params],
    porCategoria: (params) => [...INVENTARIO_KEYS.valoracion.all(), 'por-categoria', params],
    historico: (fecha, params) => ['inventario-historico', fecha, params],
  },

  // Reportes
  reportes: {
    all: () => ['reportes-inventario'],
    existencias: (params) => [...INVENTARIO_KEYS.reportes.all(), 'existencias', params],
    movimientos: (params) => [...INVENTARIO_KEYS.reportes.all(), 'movimientos', params],
    rotacion: (params) => [...INVENTARIO_KEYS.reportes.all(), 'rotacion', params],
  },

  // Auto OC
  autoOC: {
    all: () => ['auto-oc'],
    sugerencias: (params) => [...INVENTARIO_KEYS.autoOC.all(), 'sugerencias', params],
    configuracion: () => [...INVENTARIO_KEYS.autoOC.all(), 'configuracion'],
  },
};

/**
 * Estados de Órdenes de Compra
 */
export const ESTADOS_ORDEN_COMPRA = {
  BORRADOR: 'borrador',
  ENVIADA: 'enviada',
  CONFIRMADA: 'confirmada',
  RECIBIDA_PARCIAL: 'recibida_parcial',
  RECIBIDA: 'recibida',
  CANCELADA: 'cancelada',
};

/**
 * Tipos de Movimientos
 */
export const TIPOS_MOVIMIENTO = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE_POSITIVO: 'ajuste_positivo',
  AJUSTE_NEGATIVO: 'ajuste_negativo',
  TRANSFERENCIA_ENTRADA: 'transferencia_entrada',
  TRANSFERENCIA_SALIDA: 'transferencia_salida',
  VENTA: 'venta',
  DEVOLUCION: 'devolucion',
};

/**
 * Estados de Conteo
 */
export const ESTADOS_CONTEO = {
  BORRADOR: 'borrador',
  EN_PROGRESO: 'en_progreso',
  COMPLETADO: 'completado',
  APROBADO: 'aprobado',
  CANCELADO: 'cancelado',
};

/**
 * Tipos de Seguimiento
 */
export const TIPOS_SEGUIMIENTO = {
  NINGUNO: 'ninguno',
  LOTE: 'lote',
  SERIE: 'serie',
};
