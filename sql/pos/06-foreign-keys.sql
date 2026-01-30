-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - FOREIGN KEYS DIFERIDOS
-- Descripción: FKs que requieren tablas de otros módulos (inventario avanzado)
-- Versión: 1.0
-- Fecha: 30 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- FK: ventas_pos_items.numero_serie_id -> numeros_serie.id
-- Dependencia: inventario/15-numeros-serie.sql debe ejecutarse primero
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ventas_pos_items_numero_serie_id_fkey'
          AND table_name = 'ventas_pos_items'
    ) THEN
        ALTER TABLE ventas_pos_items
        ADD CONSTRAINT ventas_pos_items_numero_serie_id_fkey
        FOREIGN KEY (numero_serie_id) REFERENCES numeros_serie(id) ON DELETE SET NULL;

        RAISE NOTICE 'FK ventas_pos_items_numero_serie_id_fkey creado exitosamente';
    ELSE
        RAISE NOTICE 'FK ventas_pos_items_numero_serie_id_fkey ya existe';
    END IF;
END $$;

-- ============================================================================
-- FK: ventas_pos_items.variante_id -> variantes_producto.id
-- Dependencia: inventario/20-variantes-producto.sql debe ejecutarse primero
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ventas_pos_items_variante_id_fkey'
          AND table_name = 'ventas_pos_items'
    ) THEN
        ALTER TABLE ventas_pos_items
        ADD CONSTRAINT ventas_pos_items_variante_id_fkey
        FOREIGN KEY (variante_id) REFERENCES variantes_producto(id) ON DELETE SET NULL;

        RAISE NOTICE 'FK ventas_pos_items_variante_id_fkey creado exitosamente';
    ELSE
        RAISE NOTICE 'FK ventas_pos_items_variante_id_fkey ya existe';
    END IF;
END $$;

-- ============================================================================
-- ÍNDICES para los nuevos FKs (si no existen)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_numero_serie
    ON ventas_pos_items(numero_serie_id)
    WHERE numero_serie_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ventas_pos_items_variante
    ON ventas_pos_items(variante_id)
    WHERE variante_id IS NOT NULL;

-- ============================================================================
-- NOTA: FK ventas_pos.sesion_caja_id -> sesiones_caja
-- Movido al final de pos/07-sesiones-caja.sql (dependencia directa)
-- ============================================================================

-- ============================================================================
-- FIN: FOREIGN KEYS DIFERIDOS POS
-- ============================================================================
