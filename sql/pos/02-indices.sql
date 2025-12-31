-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - ÍNDICES
-- Descripción: Índices optimizados para ventas y reportes
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- ÍNDICES: ventas_pos
-- ============================================================================

-- Índice básico por organización
CREATE INDEX IF NOT EXISTS idx_ventas_pos_org
    ON ventas_pos(organizacion_id);

-- Índice único por folio (búsqueda rápida de venta)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_folio
    ON ventas_pos(organizacion_id, folio);

-- Índice por fecha de venta (consultas de reportes diarios/mensuales)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_fecha
    ON ventas_pos(organizacion_id, fecha_venta DESC);

-- Índice por cliente (historial de compras)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_cliente
    ON ventas_pos(cliente_id, fecha_venta DESC)
    WHERE cliente_id IS NOT NULL;

-- Índice por profesional (ventas por vendedor)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_profesional
    ON ventas_pos(profesional_id, fecha_venta DESC)
    WHERE profesional_id IS NOT NULL;

-- Índice por usuario (auditoría - quién registró)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_usuario
    ON ventas_pos(usuario_id, fecha_venta DESC);

-- Índice por cita (ventas asociadas a servicios)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_cita
    ON ventas_pos(cita_id)
    WHERE cita_id IS NOT NULL;

-- Índice por estado de venta
CREATE INDEX IF NOT EXISTS idx_ventas_pos_estado
    ON ventas_pos(organizacion_id, estado, fecha_venta DESC);

-- Índice por estado de pago
CREATE INDEX IF NOT EXISTS idx_ventas_pos_estado_pago
    ON ventas_pos(organizacion_id, estado_pago, fecha_venta DESC);

-- Índice compuesto para ventas completadas (consulta frecuente)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_completadas
    ON ventas_pos(organizacion_id, fecha_venta DESC, total)
    WHERE estado = 'completada' AND estado_pago = 'pagado';

-- Índice para ventas pendientes de pago
CREATE INDEX IF NOT EXISTS idx_ventas_pos_pendientes
    ON ventas_pos(organizacion_id, fecha_venta DESC, monto_pendiente)
    WHERE estado_pago IN ('pendiente', 'parcial');

-- Índice por método de pago (reportes de corte de caja)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_metodo_pago
    ON ventas_pos(organizacion_id, metodo_pago, fecha_venta DESC)
    WHERE metodo_pago IS NOT NULL;

-- Índice por tipo de venta
CREATE INDEX IF NOT EXISTS idx_ventas_pos_tipo
    ON ventas_pos(organizacion_id, tipo_venta, fecha_venta DESC);

-- Índice por sucursal (Multi-sucursal: reportes y filtros por ubicación)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_sucursal
    ON ventas_pos(organizacion_id, sucursal_id, fecha_venta DESC)
    WHERE sucursal_id IS NOT NULL;

-- Índice para apartados activos (vencimiento próximo)
-- NOTA: No incluye filtro temporal (>= CURRENT_DATE) porque CURRENT_DATE no es IMMUTABLE
-- El filtro por vencimiento debe hacerse en las queries
CREATE INDEX IF NOT EXISTS idx_ventas_pos_apartados
    ON ventas_pos(organizacion_id, fecha_vencimiento_apartado)
    WHERE tipo_venta = 'apartado'
    AND estado NOT IN ('completada', 'cancelada');

-- Índice por pago_id (integración con tabla pagos)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_pago
    ON ventas_pos(pago_id)
    WHERE pago_id IS NOT NULL;

-- Índice compuesto para reportes de ventas diarias
-- NOTA: No se puede usar cast ::DATE en índice (no es IMMUTABLE)
-- El filtro/agrupación por fecha debe hacerse en las queries
CREATE INDEX IF NOT EXISTS idx_ventas_pos_reporte_diario
    ON ventas_pos(organizacion_id, fecha_venta, estado, total)
    WHERE estado = 'completada';

-- Índice para búsqueda por rango de fechas (reportes)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_rango_fechas
    ON ventas_pos(organizacion_id, fecha_venta, total)
    WHERE estado = 'completada';

-- ============================================================================
-- ÍNDICES: ventas_pos_items
-- ============================================================================

-- Índice básico por venta (JOIN frecuente)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_venta
    ON ventas_pos_items(venta_pos_id);

-- Índice por producto (análisis de productos vendidos)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_producto
    ON ventas_pos_items(producto_id, creado_en DESC);

-- Índice compuesto para análisis de ventas por producto
CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_producto_cantidad
    ON ventas_pos_items(producto_id, cantidad, subtotal, creado_en DESC);

-- Índice para items con comisión
CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_comision
    ON ventas_pos_items(venta_pos_id, aplica_comision)
    WHERE aplica_comision = true;

-- Índice compuesto para reportes de productos más vendidos
-- Nota: Se usará con JOIN a ventas_pos para filtrar por fecha y organización
CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_top_ventas
    ON ventas_pos_items(producto_id, cantidad, subtotal);

-- Índice para trazabilidad de números de serie en ventas (Dic 2025)
CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_ns
    ON ventas_pos_items(numero_serie_id)
    WHERE numero_serie_id IS NOT NULL;

-- ============================================================================
-- ÍNDICES ESPECIALIZADOS PARA REPORTES
-- ============================================================================

-- Índice parcial para ventas completadas (consulta frecuente)
-- NOTA: No incluye filtro temporal porque CURRENT_DATE no es IMMUTABLE
-- Los filtros por fecha (hoy, mes actual) deben hacerse en las queries
CREATE INDEX IF NOT EXISTS idx_ventas_pos_hoy
    ON ventas_pos(organizacion_id, fecha_venta, total)
    WHERE estado = 'completada';

-- Índice para ventas completadas (reportes)
-- NOTA: No incluye filtro temporal porque DATE_TRUNC con CURRENT_DATE no es IMMUTABLE
-- Los filtros por mes deben hacerse en las queries
CREATE INDEX IF NOT EXISTS idx_ventas_pos_mes_actual
    ON ventas_pos(organizacion_id, fecha_venta, total)
    WHERE estado = 'completada';

-- Índice para corte de caja diario
-- NOTA: No se puede usar cast ::DATE en índice (no es IMMUTABLE)
-- El filtro/agrupación por fecha debe hacerse en las queries
CREATE INDEX IF NOT EXISTS idx_ventas_pos_corte_caja
    ON ventas_pos(organizacion_id, fecha_venta, metodo_pago, total)
    WHERE estado = 'completada' AND estado_pago = 'pagado';

-- ⚠️ ÍNDICE CRÍTICO: Optimiza la función analisis_abc_productos()
-- NOTA: Este índice es ESENCIAL para el análisis Pareto de productos más vendidos
-- Incluye columna id para evitar lookup adicional en el JOIN
CREATE INDEX IF NOT EXISTS idx_ventas_pos_abc_analysis
    ON ventas_pos(organizacion_id, fecha_venta, estado)
    INCLUDE (id)
    WHERE estado = 'completada';

COMMENT ON INDEX idx_ventas_pos_abc_analysis IS 'Optimiza función analisis_abc_productos() del módulo inventario (análisis Pareto)';

-- ============================================================================
-- ANÁLISIS Y ESTADÍSTICAS
-- ============================================================================

-- Actualizar estadísticas para el optimizador de PostgreSQL
ANALYZE ventas_pos;
ANALYZE ventas_pos_items;

-- ============================================================================
-- FIN: ÍNDICES DE PUNTO DE VENTA
-- ============================================================================

-- Nota sobre rendimiento:
-- - Los índices parciales con WHERE son más eficientes para consultas específicas
-- - Los índices en fecha_venta con DESC optimizan ORDER BY ... DESC
-- - Los índices compuestos deben incluir columnas filtradas frecuentemente primero
-- - Revisar pg_stat_user_indexes periódicamente para detectar índices no usados
-- - Los índices para "hoy" y "mes actual" pueden crecer indefinidamente, considerar
--   mantenimiento con pg_cron si el volumen es muy alto
