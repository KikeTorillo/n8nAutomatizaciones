-- ============================================================================
-- MÓDULO: INVENTARIO - ÓRDENES DE COMPRA (ÍNDICES)
-- Descripción: Índices para optimizar consultas de órdenes de compra
-- Versión: 1.0
-- Fecha: 27 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- ÍNDICES: ordenes_compra
-- ============================================================================

-- Índice principal para RLS y filtros por organización
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_org_id
    ON ordenes_compra(organizacion_id);

-- Índice para búsqueda por folio (único por org)
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_folio
    ON ordenes_compra(organizacion_id, folio);

-- Índice para filtrar por proveedor
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_proveedor
    ON ordenes_compra(proveedor_id);

-- Índice para filtrar por estado (consultas frecuentes)
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado
    ON ordenes_compra(organizacion_id, estado);

-- Índice para órdenes pendientes de recibir
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_pendientes
    ON ordenes_compra(organizacion_id, estado)
    WHERE estado IN ('enviada', 'parcial');

-- Índice para filtrar por estado de pago
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_estado_pago
    ON ordenes_compra(organizacion_id, estado_pago)
    WHERE estado_pago IN ('pendiente', 'parcial');

-- Índice para rango de fechas (reportes)
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_fecha_orden
    ON ordenes_compra(organizacion_id, fecha_orden DESC);

-- Índice para órdenes por vencer (pago)
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_vencimiento_pago
    ON ordenes_compra(organizacion_id, fecha_vencimiento_pago)
    WHERE estado_pago = 'pendiente' AND fecha_vencimiento_pago IS NOT NULL;

-- Índice para usuario que creó
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_usuario
    ON ordenes_compra(usuario_id);

-- Índice compuesto para listados con ordenamiento
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_listado
    ON ordenes_compra(organizacion_id, creado_en DESC);

-- ============================================================================
-- ÍNDICES: ordenes_compra_items
-- ============================================================================

-- Índice principal para relación con orden
CREATE INDEX IF NOT EXISTS idx_oc_items_orden_id
    ON ordenes_compra_items(orden_compra_id);

-- Índice para búsqueda por producto
CREATE INDEX IF NOT EXISTS idx_oc_items_producto
    ON ordenes_compra_items(producto_id);

-- Índice para items pendientes de recibir
CREATE INDEX IF NOT EXISTS idx_oc_items_pendientes
    ON ordenes_compra_items(orden_compra_id, estado)
    WHERE estado IN ('pendiente', 'parcial');

-- Índice para items por estado
CREATE INDEX IF NOT EXISTS idx_oc_items_estado
    ON ordenes_compra_items(estado);

-- Índice compuesto orden + producto (para evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_oc_items_orden_producto
    ON ordenes_compra_items(orden_compra_id, producto_id);

-- ============================================================================
-- ÍNDICES: ordenes_compra_recepciones
-- ============================================================================

-- Índice principal para relación con orden
CREATE INDEX IF NOT EXISTS idx_oc_recepciones_orden
    ON ordenes_compra_recepciones(orden_compra_id);

-- Índice para relación con item
CREATE INDEX IF NOT EXISTS idx_oc_recepciones_item
    ON ordenes_compra_recepciones(orden_compra_item_id);

-- Índice para historial cronológico
CREATE INDEX IF NOT EXISTS idx_oc_recepciones_fecha
    ON ordenes_compra_recepciones(orden_compra_id, recibido_en DESC);

-- Índice para trazabilidad de movimientos
CREATE INDEX IF NOT EXISTS idx_oc_recepciones_movimiento
    ON ordenes_compra_recepciones(movimiento_inventario_id)
    WHERE movimiento_inventario_id IS NOT NULL;

-- Índice para auditoría por usuario
CREATE INDEX IF NOT EXISTS idx_oc_recepciones_usuario
    ON ordenes_compra_recepciones(usuario_id);

-- ============================================================================
-- COMENTARIOS DE ÍNDICES
-- ============================================================================

COMMENT ON INDEX idx_ordenes_compra_pendientes IS 'Optimiza consulta de órdenes pendientes de recepción';
COMMENT ON INDEX idx_ordenes_compra_estado_pago IS 'Optimiza consulta de órdenes pendientes de pago';
COMMENT ON INDEX idx_oc_items_orden_producto IS 'Garantiza un producto único por orden de compra';
COMMENT ON INDEX idx_oc_items_pendientes IS 'Optimiza consulta de items pendientes de recibir';

-- ============================================================================
-- FIN: ÍNDICES DE ÓRDENES DE COMPRA
-- ============================================================================
