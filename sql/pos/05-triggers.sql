-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - TRIGGERS
-- Descripción: Triggers automáticos para gestión de ventas y stock
-- Versión: 1.1
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ⚠️ IMPORTANTE: Este archivo requiere que sql/pos/04-funciones.sql se ejecute primero
-- Las funciones están definidas en 04-funciones.sql, este archivo solo crea los triggers

-- ============================================================================
-- TRIGGER 1: Generar folio automático para venta
-- Se ejecuta ANTES de INSERT
-- Función: generar_folio_venta() (definida en 04-funciones.sql)
-- ============================================================================

CREATE TRIGGER trigger_generar_folio_venta
    BEFORE INSERT ON ventas_pos
    FOR EACH ROW
    WHEN (NEW.folio IS NULL)
    EXECUTE FUNCTION generar_folio_venta();

COMMENT ON TRIGGER trigger_generar_folio_venta ON ventas_pos IS 'Genera folio único POS-YYYY-#### automáticamente si no se proporciona';

-- ============================================================================
-- TRIGGER 2: Calcular totales de venta automáticamente
-- Se ejecuta DESPUÉS de INSERT/UPDATE/DELETE en items
-- Función: calcular_totales_venta_pos() (definida en 04-funciones.sql)
-- ============================================================================

CREATE TRIGGER trigger_calcular_totales_venta
    AFTER INSERT OR UPDATE OR DELETE ON ventas_pos_items
    FOR EACH ROW
    EXECUTE FUNCTION calcular_totales_venta_pos();

COMMENT ON TRIGGER trigger_calcular_totales_venta ON ventas_pos_items IS 'Recalcula totales de venta al agregar/modificar/eliminar items';

-- ============================================================================
-- TRIGGER 3: Actualizar stock al completar venta
-- Se ejecuta DESPUÉS de INSERT/UPDATE
-- Función: actualizar_stock_venta_pos() (definida en 04-funciones.sql)
-- ============================================================================

CREATE TRIGGER trigger_actualizar_stock_venta
    AFTER INSERT OR UPDATE OF estado ON ventas_pos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_venta_pos();

COMMENT ON TRIGGER trigger_actualizar_stock_venta ON ventas_pos IS 'Descuenta stock y crea movimientos al completar venta';

-- ============================================================================
-- TRIGGER 4: Actualizar timestamp en ventas_pos
-- Se ejecuta ANTES de UPDATE
-- Función: actualizar_timestamp_venta() (definida en 04-funciones.sql)
-- ============================================================================

CREATE TRIGGER trigger_actualizar_timestamp_venta
    BEFORE UPDATE ON ventas_pos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_venta();

COMMENT ON TRIGGER trigger_actualizar_timestamp_venta ON ventas_pos IS 'Actualiza actualizado_en automáticamente en cada UPDATE';

-- ============================================================================
-- FIN: TRIGGERS DE PUNTO DE VENTA
-- ============================================================================

-- ⚙️ ORDEN DE EJECUCIÓN DE TRIGGERS:
-- 1. BEFORE INSERT: generar_folio_venta (si folio es NULL)
-- 2. INSERT: Se inserta la venta en ventas_pos
-- 3. AFTER INSERT en ventas_pos_items: calcular_totales_venta (recalcula subtotal/total)
-- 4. AFTER UPDATE estado='completada': actualizar_stock_venta (descuenta stock)
-- 5. AFTER INSERT en movimientos_inventario: verificar_alertas_inventario (genera alertas - módulo inventario)
