-- ============================================================================
-- MÓDULO: INVENTARIO - ÓRDENES DE COMPRA (FUNCIONES Y TRIGGERS)
-- Descripción: Automatización de folios, totales y estados
-- Versión: 1.0
-- Fecha: 27 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: Generar folio automático para orden de compra
-- Formato: OC-YYYY-#### (ej: OC-2025-0001)
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_orden_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_year INTEGER;
    v_contador INTEGER;
    v_folio VARCHAR(20);
BEGIN
    -- Obtener año actual
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Obtener siguiente número secuencial para esta org y año
    SELECT COALESCE(
        MAX(
            CAST(
                SUBSTRING(folio FROM 'OC-\d{4}-(\d+)') AS INTEGER
            )
        ), 0
    ) + 1
    INTO v_contador
    FROM ordenes_compra
    WHERE organizacion_id = NEW.organizacion_id
      AND folio LIKE 'OC-' || v_year || '-%';

    -- Generar folio
    v_folio := 'OC-' || v_year || '-' || LPAD(v_contador::TEXT, 4, '0');

    NEW.folio := v_folio;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_folio_orden_compra() IS 'Genera folio secuencial OC-YYYY-#### por organización y año';

-- Trigger para generar folio
CREATE TRIGGER trg_generar_folio_orden_compra
    BEFORE INSERT ON ordenes_compra
    FOR EACH ROW
    WHEN (NEW.folio IS NULL OR NEW.folio = '')
    EXECUTE FUNCTION generar_folio_orden_compra();

-- ============================================================================
-- FUNCIÓN: Calcular totales de orden de compra
-- Recalcula subtotal y total basado en items
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_totales_orden_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(12,2);
    v_total DECIMAL(12,2);
    v_descuento_monto DECIMAL(12,2);
    v_impuestos DECIMAL(12,2);
    v_orden_id INTEGER;
BEGIN
    -- Determinar ID de la orden
    IF TG_OP = 'DELETE' THEN
        v_orden_id := OLD.orden_compra_id;
    ELSE
        v_orden_id := NEW.orden_compra_id;
    END IF;

    -- Calcular subtotal de items
    SELECT COALESCE(SUM(cantidad_ordenada * precio_unitario), 0)
    INTO v_subtotal
    FROM ordenes_compra_items
    WHERE orden_compra_id = v_orden_id
      AND estado != 'cancelado';

    -- Obtener descuentos e impuestos actuales
    SELECT
        descuento_porcentaje,
        descuento_monto,
        impuestos
    INTO
        v_descuento_monto,
        v_descuento_monto,
        v_impuestos
    FROM ordenes_compra
    WHERE id = v_orden_id;

    -- Calcular descuento si es porcentaje
    SELECT
        CASE
            WHEN descuento_porcentaje > 0 THEN v_subtotal * (descuento_porcentaje / 100)
            ELSE descuento_monto
        END
    INTO v_descuento_monto
    FROM ordenes_compra
    WHERE id = v_orden_id;

    -- Obtener impuestos
    SELECT COALESCE(impuestos, 0)
    INTO v_impuestos
    FROM ordenes_compra
    WHERE id = v_orden_id;

    -- Calcular total
    v_total := v_subtotal - COALESCE(v_descuento_monto, 0) + COALESCE(v_impuestos, 0);

    -- Actualizar orden
    UPDATE ordenes_compra
    SET
        subtotal = v_subtotal,
        total = v_total,
        actualizado_en = NOW()
    WHERE id = v_orden_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_totales_orden_compra() IS 'Recalcula totales de la orden cuando cambian los items';

-- Trigger para recalcular totales
CREATE TRIGGER trg_calcular_totales_orden_compra
    AFTER INSERT OR UPDATE OR DELETE ON ordenes_compra_items
    FOR EACH ROW
    EXECUTE FUNCTION calcular_totales_orden_compra();

-- ============================================================================
-- FUNCIÓN: Actualizar estado de item según cantidades recibidas
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_estado_item_orden_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar estado basado en cantidades
    IF NEW.cantidad_recibida = 0 THEN
        NEW.estado := 'pendiente';
    ELSIF NEW.cantidad_recibida < NEW.cantidad_ordenada THEN
        NEW.estado := 'parcial';
    ELSIF NEW.cantidad_recibida >= NEW.cantidad_ordenada THEN
        NEW.estado := 'completo';
        NEW.fecha_ultima_recepcion := NOW();
    END IF;

    NEW.actualizado_en := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_estado_item_orden_compra() IS 'Actualiza estado del item según cantidad recibida';

-- Trigger para actualizar estado de item
CREATE TRIGGER trg_actualizar_estado_item_oc
    BEFORE UPDATE OF cantidad_recibida ON ordenes_compra_items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_item_orden_compra();

-- ============================================================================
-- FUNCIÓN: Actualizar estado de orden según items
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_estado_orden_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_items_completos INTEGER;
    v_items_parciales INTEGER;
    v_nuevo_estado VARCHAR(20);
BEGIN
    -- Contar items por estado
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE estado = 'completo'),
        COUNT(*) FILTER (WHERE estado = 'parcial')
    INTO v_total_items, v_items_completos, v_items_parciales
    FROM ordenes_compra_items
    WHERE orden_compra_id = NEW.orden_compra_id
      AND estado != 'cancelado';

    -- Solo actualizar si la orden está en proceso (enviada o parcial)
    IF EXISTS (
        SELECT 1 FROM ordenes_compra
        WHERE id = NEW.orden_compra_id
          AND estado IN ('enviada', 'parcial')
    ) THEN
        -- Determinar nuevo estado
        IF v_items_completos = v_total_items AND v_total_items > 0 THEN
            v_nuevo_estado := 'recibida';
        ELSIF v_items_completos > 0 OR v_items_parciales > 0 THEN
            v_nuevo_estado := 'parcial';
        ELSE
            v_nuevo_estado := 'enviada';
        END IF;

        -- Actualizar orden
        UPDATE ordenes_compra
        SET
            estado = v_nuevo_estado,
            fecha_recepcion = CASE
                WHEN v_nuevo_estado = 'recibida' THEN NOW()
                ELSE fecha_recepcion
            END,
            actualizado_en = NOW()
        WHERE id = NEW.orden_compra_id
          AND estado != v_nuevo_estado;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_estado_orden_compra() IS 'Actualiza estado de la orden según el estado de sus items';

-- Trigger para actualizar estado de orden
CREATE TRIGGER trg_actualizar_estado_orden_compra
    AFTER UPDATE OF estado ON ordenes_compra_items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_orden_compra();

-- ============================================================================
-- FUNCIÓN: Calcular fecha vencimiento pago al recibir
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_vencimiento_pago_orden()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la orden pasa a recibida y tiene días de crédito
    IF NEW.estado = 'recibida' AND OLD.estado != 'recibida' THEN
        IF NEW.dias_credito > 0 THEN
            NEW.fecha_vencimiento_pago := CURRENT_DATE + NEW.dias_credito;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_vencimiento_pago_orden() IS 'Calcula fecha de vencimiento de pago al recibir la orden';

-- Trigger para calcular vencimiento
CREATE TRIGGER trg_calcular_vencimiento_pago
    BEFORE UPDATE OF estado ON ordenes_compra
    FOR EACH ROW
    EXECUTE FUNCTION calcular_vencimiento_pago_orden();

-- ============================================================================
-- FUNCIÓN: Actualizar timestamp de modificación
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp_orden_compra()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE TRIGGER trg_actualizar_timestamp_oc
    BEFORE UPDATE ON ordenes_compra
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_orden_compra();

-- ============================================================================
-- FUNCIÓN: Heredar días de crédito del proveedor
-- ============================================================================
CREATE OR REPLACE FUNCTION heredar_dias_credito_proveedor()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no se especificó días de crédito, heredar del proveedor
    IF NEW.dias_credito IS NULL OR NEW.dias_credito = 0 THEN
        SELECT COALESCE(dias_credito, 0)
        INTO NEW.dias_credito
        FROM proveedores
        WHERE id = NEW.proveedor_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION heredar_dias_credito_proveedor() IS 'Hereda días de crédito del proveedor si no se especifica';

-- Trigger para heredar días de crédito
CREATE TRIGGER trg_heredar_dias_credito
    BEFORE INSERT ON ordenes_compra
    FOR EACH ROW
    EXECUTE FUNCTION heredar_dias_credito_proveedor();

-- ============================================================================
-- FUNCIÓN: Validar eliminación de orden (solo borradores)
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_eliminacion_orden_compra()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado != 'borrador' THEN
        RAISE EXCEPTION 'Solo se pueden eliminar órdenes en estado borrador. Estado actual: %', OLD.estado;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_eliminacion_orden_compra() IS 'Previene eliminación de órdenes que no son borradores';

-- Trigger para validar eliminación
CREATE TRIGGER trg_validar_eliminacion_oc
    BEFORE DELETE ON ordenes_compra
    FOR EACH ROW
    EXECUTE FUNCTION validar_eliminacion_orden_compra();

-- ============================================================================
-- FIN: FUNCIONES Y TRIGGERS DE ÓRDENES DE COMPRA
-- ============================================================================
