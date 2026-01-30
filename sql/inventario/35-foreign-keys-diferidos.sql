-- ============================================================================
-- MODULO INVENTARIO: FOREIGN KEYS DIFERIDOS
-- ============================================================================
-- FKs que requieren tablas de otros módulos que se crean después de
-- inventario/01-tablas.sql.
--
-- Este archivo debe ejecutarse DESPUÉS de:
-- - inventario/20-variantes-producto.sql
-- - inventario/13-ubicaciones-almacen.sql
-- - pos/01-tablas.sql
--
-- Fecha: Enero 2026
-- ============================================================================

-- FK: variante_id -> variantes_producto
-- Dependencia: sql/inventario/20-variantes-producto.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_movimientos_variante'
    ) THEN
        ALTER TABLE movimientos_inventario
        ADD CONSTRAINT fk_movimientos_variante
        FOREIGN KEY (variante_id) REFERENCES variantes_producto(id) ON DELETE SET NULL;

        RAISE NOTICE 'FK fk_movimientos_variante creado exitosamente';
    ELSE
        RAISE NOTICE 'FK fk_movimientos_variante ya existe';
    END IF;
END $$;

-- FK: ubicacion_origen_id -> ubicaciones_almacen
-- Dependencia: sql/inventario/13-ubicaciones-almacen.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_movimientos_ubicacion_origen'
    ) THEN
        ALTER TABLE movimientos_inventario
        ADD CONSTRAINT fk_movimientos_ubicacion_origen
        FOREIGN KEY (ubicacion_origen_id) REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL;

        RAISE NOTICE 'FK fk_movimientos_ubicacion_origen creado exitosamente';
    ELSE
        RAISE NOTICE 'FK fk_movimientos_ubicacion_origen ya existe';
    END IF;
END $$;

-- FK: ubicacion_destino_id -> ubicaciones_almacen
-- Dependencia: sql/inventario/13-ubicaciones-almacen.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_movimientos_ubicacion_destino'
    ) THEN
        ALTER TABLE movimientos_inventario
        ADD CONSTRAINT fk_movimientos_ubicacion_destino
        FOREIGN KEY (ubicacion_destino_id) REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL;

        RAISE NOTICE 'FK fk_movimientos_ubicacion_destino creado exitosamente';
    ELSE
        RAISE NOTICE 'FK fk_movimientos_ubicacion_destino ya existe';
    END IF;
END $$;

-- FK: venta_pos_id -> ventas_pos
-- Dependencia: sql/pos/01-tablas.sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_movimientos_venta_pos'
    ) THEN
        ALTER TABLE movimientos_inventario
        ADD CONSTRAINT fk_movimientos_venta_pos
        FOREIGN KEY (venta_pos_id) REFERENCES ventas_pos(id) ON DELETE SET NULL;

        RAISE NOTICE 'FK fk_movimientos_venta_pos creado exitosamente';
    ELSE
        RAISE NOTICE 'FK fk_movimientos_venta_pos ya existe';
    END IF;
END $$;

-- NOTA: FK a citas NO se implementa porque citas es particionada por fecha_cita
-- y movimientos_inventario no tiene esa columna. Validación en backend.

-- ============================================================================
-- FIN: FOREIGN KEYS DIFERIDOS DE INVENTARIO
-- ============================================================================
