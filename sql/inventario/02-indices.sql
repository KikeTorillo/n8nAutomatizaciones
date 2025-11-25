-- ============================================================================
-- MÓDULO: INVENTARIO - ÍNDICES
-- Descripción: Índices optimizados para consultas frecuentes y búsquedas
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- ÍNDICES: categorias_productos
-- ============================================================================

-- Índice básico por organización (para filtrado RLS)
CREATE INDEX IF NOT EXISTS idx_categorias_productos_org
    ON categorias_productos(organizacion_id);

-- Índice para búsqueda por nombre
CREATE INDEX IF NOT EXISTS idx_categorias_productos_nombre
    ON categorias_productos(organizacion_id, nombre);

-- Índice para categorías activas (consulta frecuente)
CREATE INDEX IF NOT EXISTS idx_categorias_productos_activas
    ON categorias_productos(organizacion_id, activo)
    WHERE activo = true;

-- Índice para jerarquía (buscar hijos de una categoría padre)
CREATE INDEX IF NOT EXISTS idx_categorias_productos_padre
    ON categorias_productos(categoria_padre_id)
    WHERE categoria_padre_id IS NOT NULL;

-- Índice para ordenamiento
CREATE INDEX IF NOT EXISTS idx_categorias_productos_orden
    ON categorias_productos(organizacion_id, orden, nombre);

-- ============================================================================
-- ÍNDICES: proveedores
-- ============================================================================

-- Índice básico por organización
CREATE INDEX IF NOT EXISTS idx_proveedores_org
    ON proveedores(organizacion_id);

-- Índice para búsqueda por nombre
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre
    ON proveedores(organizacion_id, nombre);

-- Índice para proveedores activos
CREATE INDEX IF NOT EXISTS idx_proveedores_activos
    ON proveedores(organizacion_id, activo)
    WHERE activo = true;

-- Índice para búsqueda por RFC (México)
CREATE INDEX IF NOT EXISTS idx_proveedores_rfc
    ON proveedores(rfc)
    WHERE rfc IS NOT NULL;

-- Índice para búsqueda por ciudad (FK normalizada - Nov 2025)
CREATE INDEX IF NOT EXISTS idx_proveedores_ciudad
    ON proveedores(ciudad_id)
    WHERE ciudad_id IS NOT NULL;

-- ============================================================================
-- ÍNDICES: productos
-- ============================================================================

-- Índice básico por organización
CREATE INDEX IF NOT EXISTS idx_productos_org
    ON productos(organizacion_id);

-- Índice único para SKU (búsqueda rápida)
CREATE INDEX IF NOT EXISTS idx_productos_sku
    ON productos(organizacion_id, sku)
    WHERE sku IS NOT NULL;

-- Índice único para código de barras (búsqueda rápida en POS)
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras
    ON productos(organizacion_id, codigo_barras)
    WHERE codigo_barras IS NOT NULL;

-- Índice para productos activos
CREATE INDEX IF NOT EXISTS idx_productos_activos
    ON productos(organizacion_id, activo)
    WHERE activo = true;

-- Índice por categoría (filtrado frecuente)
CREATE INDEX IF NOT EXISTS idx_productos_categoria
    ON productos(categoria_id)
    WHERE categoria_id IS NOT NULL;

-- Índice por proveedor
CREATE INDEX IF NOT EXISTS idx_productos_proveedor
    ON productos(proveedor_id)
    WHERE proveedor_id IS NOT NULL;

-- Índice compuesto para filtros frecuentes (categoría + activo)
CREATE INDEX IF NOT EXISTS idx_productos_categoria_activo
    ON productos(organizacion_id, categoria_id, activo)
    WHERE activo = true AND categoria_id IS NOT NULL;

-- Índice para productos con stock bajo (alertas)
CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo
    ON productos(organizacion_id, stock_actual, stock_minimo)
    WHERE stock_actual <= stock_minimo AND activo = true;

-- Índice para productos agotados
CREATE INDEX IF NOT EXISTS idx_productos_agotados
    ON productos(organizacion_id)
    WHERE stock_actual = 0 AND activo = true;

-- Índice para productos perecederos
CREATE INDEX IF NOT EXISTS idx_productos_perecederos
    ON productos(organizacion_id, es_perecedero)
    WHERE es_perecedero = true AND activo = true;

-- Índice GIN para búsqueda full-text en nombre (español)
CREATE INDEX IF NOT EXISTS idx_productos_nombre_gin
    ON productos USING gin(to_tsvector('spanish', nombre));

-- Índice GIN para búsqueda full-text en descripción (opcional)
CREATE INDEX IF NOT EXISTS idx_productos_descripcion_gin
    ON productos USING gin(to_tsvector('spanish', descripcion))
    WHERE descripcion IS NOT NULL;

-- Índice para ordenamiento por nombre
CREATE INDEX IF NOT EXISTS idx_productos_nombre_orden
    ON productos(organizacion_id, LOWER(nombre));

-- Índice para ordenamiento por precio
CREATE INDEX IF NOT EXISTS idx_productos_precio
    ON productos(organizacion_id, precio_venta);

-- Índice para ordenamiento por stock
CREATE INDEX IF NOT EXISTS idx_productos_stock
    ON productos(organizacion_id, stock_actual DESC);

-- ============================================================================
-- ÍNDICES: movimientos_inventario
-- NOTA: Esta tabla será particionada - los índices se crean en cada partición
-- ============================================================================

-- Índice básico por organización
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_org
    ON movimientos_inventario(organizacion_id);

-- Índice por producto (kardex)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto
    ON movimientos_inventario(producto_id, creado_en DESC);

-- Índice compuesto org + producto (consulta más frecuente)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_org_producto
    ON movimientos_inventario(organizacion_id, producto_id, creado_en DESC);

-- Índice por tipo de movimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_tipo
    ON movimientos_inventario(organizacion_id, tipo_movimiento, creado_en DESC);

-- Índice por fecha (para reportes y consultas por rango)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_fecha
    ON movimientos_inventario(organizacion_id, creado_en DESC);

-- Índice por proveedor (compras)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_proveedor
    ON movimientos_inventario(proveedor_id, creado_en DESC)
    WHERE proveedor_id IS NOT NULL;

-- Índice por venta POS (trazabilidad)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_venta
    ON movimientos_inventario(venta_pos_id)
    WHERE venta_pos_id IS NOT NULL;

-- Índice por cita (trazabilidad)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_cita
    ON movimientos_inventario(cita_id)
    WHERE cita_id IS NOT NULL;

-- Índice por usuario (auditoría)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_usuario
    ON movimientos_inventario(usuario_id, creado_en DESC)
    WHERE usuario_id IS NOT NULL;

-- Índice por lote (trazabilidad)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_lote
    ON movimientos_inventario(lote, creado_en DESC)
    WHERE lote IS NOT NULL;

-- Índice para productos con vencimiento próximo
-- NOTA: No incluye filtro temporal (>= CURRENT_DATE) porque CURRENT_DATE no es IMMUTABLE
-- El filtro por fecha debe hacerse en las queries, no en el índice
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_vencimiento
    ON movimientos_inventario(fecha_vencimiento)
    WHERE fecha_vencimiento IS NOT NULL;

-- ============================================================================
-- ÍNDICES: alertas_inventario
-- ============================================================================

-- Índice básico por organización
CREATE INDEX IF NOT EXISTS idx_alertas_inventario_org
    ON alertas_inventario(organizacion_id);

-- Índice por producto
CREATE INDEX IF NOT EXISTS idx_alertas_inventario_producto
    ON alertas_inventario(producto_id, creado_en DESC);

-- Índice para alertas no leídas (consulta más frecuente)
CREATE INDEX IF NOT EXISTS idx_alertas_inventario_no_leidas
    ON alertas_inventario(organizacion_id, leida, nivel, creado_en DESC)
    WHERE leida = false;

-- Índice por tipo de alerta
CREATE INDEX IF NOT EXISTS idx_alertas_inventario_tipo
    ON alertas_inventario(organizacion_id, tipo_alerta, creado_en DESC);

-- Índice por nivel de criticidad
CREATE INDEX IF NOT EXISTS idx_alertas_inventario_nivel
    ON alertas_inventario(organizacion_id, nivel, creado_en DESC)
    WHERE leida = false;

-- Índice por fecha de creación (para limpiezas automáticas)
-- NOTA: No incluye filtro temporal (< NOW() - 90 días) porque NOW() no es IMMUTABLE
-- El filtro por antigüedad debe hacerse en las queries de limpieza
CREATE INDEX IF NOT EXISTS idx_alertas_inventario_fecha
    ON alertas_inventario(creado_en);

-- ⚠️ ÍNDICE ÚNICO: Evita alertas duplicadas del mismo tipo en el mismo día
-- NOTA: Usa función IMMUTABLE extraer_fecha_immutable() para convertir TIMESTAMPTZ a DATE
-- Esto es necesario porque el cast directo (creado_en::DATE) no es IMMUTABLE
CREATE UNIQUE INDEX IF NOT EXISTS idx_alertas_unique_tipo_dia
    ON alertas_inventario(producto_id, tipo_alerta, extraer_fecha_immutable(creado_en));

COMMENT ON INDEX idx_alertas_unique_tipo_dia IS 'Evita alertas duplicadas del mismo tipo por producto en el mismo día';

-- ============================================================================
-- ANÁLISIS Y ESTADÍSTICAS
-- ============================================================================

-- Actualizar estadísticas para el optimizador de PostgreSQL
ANALYZE categorias_productos;
ANALYZE proveedores;
ANALYZE productos;
ANALYZE movimientos_inventario;
ANALYZE alertas_inventario;

-- ============================================================================
-- FIN: ÍNDICES DE INVENTARIO
-- ============================================================================

-- Nota sobre rendimiento:
-- - Los índices GIN para búsqueda full-text pueden ser costosos en INSERT/UPDATE
-- - Los índices parciales (WHERE) son más eficientes para consultas específicas
-- - Los índices compuestos deben ordenarse por selectividad (más restrictivo primero)
-- - Revisar periódicamente con pg_stat_user_indexes para detectar índices no usados
