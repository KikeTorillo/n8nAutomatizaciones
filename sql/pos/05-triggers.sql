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
-- TRIGGER 3: Actualizar stock al completar venta (solo UPDATE)
-- Se ejecuta DESPUÉS de UPDATE cuando cambia el estado
-- Función: actualizar_stock_venta_pos() (definida en 04-funciones.sql)
-- NOTA: Para INSERT, el descuento de stock lo maneja trigger_calcular_totales_venta
-- ============================================================================

CREATE TRIGGER trigger_actualizar_stock_venta
    AFTER UPDATE OF estado ON ventas_pos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_venta_pos();

COMMENT ON TRIGGER trigger_actualizar_stock_venta ON ventas_pos IS 'Descuenta stock al cambiar estado a completada en UPDATE (cotizacion→completada)';

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

-- ⚙️ ORDEN DE EJECUCIÓN DE TRIGGERS (ACTUALIZADO):
--
-- FLUJO 1: CREAR VENTA DIRECTA (estado='completada' desde el inicio)
-- 1. BEFORE INSERT en ventas_pos: generar_folio_venta (si folio es NULL)
-- 2. INSERT en ventas_pos: Se inserta la venta con estado='completada'
-- 3. INSERT en ventas_pos_items: Se insertan los items
-- 4. AFTER INSERT en ventas_pos_items: trigger_calcular_totales_venta
--    a. Recalcula subtotal/total
--    b. ✨ DESCUENTA STOCK (si estado='completada' y no hay movimientos previos)
--    c. Registra movimientos en movimientos_inventario
-- 5. AFTER INSERT en movimientos_inventario: verificar_alertas_inventario (genera alertas)
--
-- FLUJO 2: CREAR COTIZACIÓN Y LUEGO COMPLETARLA (cotizacion → completada)
-- 1. BEFORE INSERT en ventas_pos: generar_folio_venta
-- 2. INSERT en ventas_pos: Se inserta con estado='cotizacion'
-- 3. INSERT en ventas_pos_items: Se insertan los items
-- 4. AFTER INSERT en ventas_pos_items: trigger_calcular_totales_venta
--    a. Recalcula totales
--    b. NO descuenta stock (estado='cotizacion')
-- 5. UPDATE ventas_pos SET estado='completada': Cambiar estado
-- 6. AFTER UPDATE en ventas_pos: trigger_actualizar_stock_venta
--    a. ✨ DESCUENTA STOCK (detecta cambio cotizacion→completada)
--    b. Registra movimientos en movimientos_inventario
-- 7. AFTER INSERT en movimientos_inventario: verificar_alertas_inventario
