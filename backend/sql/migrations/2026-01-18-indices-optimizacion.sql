-- =============================================================================
-- Migración: Índices de Optimización para Búsquedas
-- Fecha: 2026-01-18
-- Descripción: Agrega índices para mejorar rendimiento en búsquedas frecuentes
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. EXTENSIÓN TRIGRAM (para búsquedas ILIKE más eficientes)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- 2. COLUMNA TELÉFONO NORMALIZADO (clientes)
-- Normaliza teléfonos eliminando espacios, guiones, paréntesis y prefijos
-- -----------------------------------------------------------------------------

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clientes' AND column_name = 'telefono_normalizado'
    ) THEN
        ALTER TABLE clientes
        ADD COLUMN telefono_normalizado VARCHAR(20)
        GENERATED ALWAYS AS (
            REGEXP_REPLACE(
                REGEXP_REPLACE(COALESCE(telefono, ''), '[\s\-\(\)\+]', '', 'g'),
                '^(52|1)', '', 'g'
            )
        ) STORED;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. ÍNDICES PARA CLIENTES
-- -----------------------------------------------------------------------------

-- Índice para búsqueda por teléfono normalizado
CREATE INDEX IF NOT EXISTS idx_clientes_telefono_normalizado
ON clientes(organizacion_id, telefono_normalizado)
WHERE telefono_normalizado IS NOT NULL AND telefono_normalizado != '' AND eliminado_en IS NULL;

-- Índice trigram para búsqueda de nombre (ILIKE %texto%)
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm
ON clientes USING GIN(LOWER(nombre) gin_trgm_ops)
WHERE eliminado_en IS NULL;

-- Índice trigram para búsqueda de email
CREATE INDEX IF NOT EXISTS idx_clientes_email_trgm
ON clientes USING GIN(LOWER(email) gin_trgm_ops)
WHERE eliminado_en IS NULL;

-- Índice compuesto para listados frecuentes
CREATE INDEX IF NOT EXISTS idx_clientes_org_activo
ON clientes(organizacion_id, activo, creado_en DESC)
WHERE eliminado_en IS NULL;

-- -----------------------------------------------------------------------------
-- 4. ÍNDICES PARA PRODUCTOS
-- -----------------------------------------------------------------------------

-- Índice trigram para búsqueda de nombre de producto
CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm
ON productos USING GIN(nombre gin_trgm_ops)
WHERE eliminado_en IS NULL;

-- Índice trigram para búsqueda de SKU
CREATE INDEX IF NOT EXISTS idx_productos_sku_trgm
ON productos USING GIN(sku gin_trgm_ops)
WHERE eliminado_en IS NULL AND sku IS NOT NULL;

-- Índice compuesto para listados con filtros comunes
CREATE INDEX IF NOT EXISTS idx_productos_org_categoria_activo
ON productos(organizacion_id, categoria_id, activo)
WHERE eliminado_en IS NULL;

-- Índice para búsqueda por proveedor
CREATE INDEX IF NOT EXISTS idx_productos_proveedor
ON productos(organizacion_id, proveedor_id)
WHERE eliminado_en IS NULL AND proveedor_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. ÍNDICES PARA PROFESIONALES
-- -----------------------------------------------------------------------------

-- Índice trigram para búsqueda de nombre
CREATE INDEX IF NOT EXISTS idx_profesionales_nombre_trgm
ON profesionales USING GIN(LOWER(nombre) gin_trgm_ops)
WHERE eliminado_en IS NULL;

-- Índice compuesto para listados frecuentes
CREATE INDEX IF NOT EXISTS idx_profesionales_org_activo
ON profesionales(organizacion_id, activo, creado_en DESC)
WHERE eliminado_en IS NULL;

-- -----------------------------------------------------------------------------
-- 6. ÍNDICES PARA CITAS (agendamiento)
-- -----------------------------------------------------------------------------

-- Índice para consultas de disponibilidad
CREATE INDEX IF NOT EXISTS idx_citas_profesional_fecha
ON citas(profesional_id, fecha_inicio, fecha_fin)
WHERE eliminado_en IS NULL;

-- Índice para citas del día
CREATE INDEX IF NOT EXISTS idx_citas_sucursal_fecha
ON citas(sucursal_id, fecha_inicio)
WHERE eliminado_en IS NULL AND estado NOT IN ('cancelada', 'no_asistio');

-- -----------------------------------------------------------------------------
-- 7. ÍNDICES PARA MOVIMIENTOS DE INVENTARIO
-- -----------------------------------------------------------------------------

-- Índice para consultas de historial por producto
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_fecha
ON movimientos_inventario(producto_id, creado_en DESC)
WHERE eliminado_en IS NULL;

-- Índice para consultas por proveedor
CREATE INDEX IF NOT EXISTS idx_movimientos_proveedor
ON movimientos_inventario(proveedor_id, creado_en DESC)
WHERE eliminado_en IS NULL AND proveedor_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 8. ÍNDICES PARA VENTAS (POS)
-- -----------------------------------------------------------------------------

-- Índice para ventas por cliente
CREATE INDEX IF NOT EXISTS idx_ventas_cliente
ON ventas(cliente_id, fecha DESC)
WHERE eliminado_en IS NULL AND cliente_id IS NOT NULL;

-- Índice para reportes de ventas por fecha
CREATE INDEX IF NOT EXISTS idx_ventas_sucursal_fecha
ON ventas(sucursal_id, fecha)
WHERE eliminado_en IS NULL;

-- -----------------------------------------------------------------------------
-- 9. VERIFICACIÓN DE ÍNDICES CREADOS
-- -----------------------------------------------------------------------------

-- Comentario: Ejecutar para verificar los índices creados
-- SELECT indexname, tablename, pg_size_pretty(pg_relation_size(indexrelid::regclass))
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

COMMIT;

-- =============================================================================
-- NOTAS DE ROLLBACK
-- =============================================================================
-- Para revertir esta migración, ejecutar:
--
-- DROP INDEX IF EXISTS idx_clientes_telefono_normalizado;
-- DROP INDEX IF EXISTS idx_clientes_nombre_trgm;
-- DROP INDEX IF EXISTS idx_clientes_email_trgm;
-- DROP INDEX IF EXISTS idx_clientes_org_activo;
-- DROP INDEX IF EXISTS idx_productos_nombre_trgm;
-- DROP INDEX IF EXISTS idx_productos_sku_trgm;
-- DROP INDEX IF EXISTS idx_productos_org_categoria_activo;
-- DROP INDEX IF EXISTS idx_productos_proveedor;
-- DROP INDEX IF EXISTS idx_profesionales_nombre_trgm;
-- DROP INDEX IF EXISTS idx_profesionales_org_activo;
-- DROP INDEX IF EXISTS idx_citas_profesional_fecha;
-- DROP INDEX IF EXISTS idx_citas_sucursal_fecha;
-- DROP INDEX IF EXISTS idx_movimientos_producto_fecha;
-- DROP INDEX IF EXISTS idx_movimientos_proveedor;
-- DROP INDEX IF EXISTS idx_ventas_cliente;
-- DROP INDEX IF EXISTS idx_ventas_sucursal_fecha;
-- ALTER TABLE clientes DROP COLUMN IF EXISTS telefono_normalizado;
-- =============================================================================
