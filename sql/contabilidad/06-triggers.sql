-- ====================================================================
-- 🔄 MÓDULO CONTABILIDAD - TRIGGERS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: contabilidad
--
-- DESCRIPCIÓN:
-- Triggers automáticos para el módulo de contabilidad.
-- Incluye triggers para actualizar timestamps, validar periodos,
-- calcular totales y generar asientos automáticos.
--
-- TOTAL: 8 triggers
--
-- TRIGGERS:
-- 1. updated_at: Actualiza timestamps en todas las tablas
-- 2. numero_asiento: Asigna número secuencial al crear asiento
-- 3. validar_periodo: Valida que el periodo esté abierto
-- 4. actualizar_totales: Actualiza totales del asiento
-- 5. actualizar_saldo_cuenta: Actualiza saldos de cuenta
-- 6. asiento_venta_pos: Genera asiento al completar venta POS
-- 7. asiento_compra: Genera asiento al recibir orden de compra
-- 8. validar_cuadre: Valida cuadre al publicar asiento
--
-- ====================================================================

-- ====================================================================
-- TRIGGER 1: Actualizar timestamps (updated_at)
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_contabilidad_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$;

-- Aplicar a todas las tablas con actualizado_en
CREATE TRIGGER trg_cuentas_updated_at
    BEFORE UPDATE ON cuentas_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contabilidad_updated_at();

CREATE TRIGGER trg_periodos_updated_at
    BEFORE UPDATE ON periodos_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contabilidad_updated_at();

CREATE TRIGGER trg_asientos_updated_at
    BEFORE UPDATE ON asientos_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contabilidad_updated_at();

CREATE TRIGGER trg_config_updated_at
    BEFORE UPDATE ON config_contabilidad
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contabilidad_updated_at();

CREATE TRIGGER trg_saldos_updated_at
    BEFORE UPDATE ON saldos_cuentas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_contabilidad_updated_at();


-- ====================================================================
-- TRIGGER 2: Asignar número de asiento automático
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_asignar_numero_asiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Solo asignar si no viene número (asientos manuales)
    IF NEW.numero_asiento IS NULL OR NEW.numero_asiento = 0 THEN
        NEW.numero_asiento := obtener_siguiente_numero_asiento(NEW.organizacion_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_asiento_numero
    BEFORE INSERT ON asientos_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_asignar_numero_asiento();


-- ====================================================================
-- TRIGGER 3: Validar periodo abierto antes de crear/modificar asiento
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_validar_periodo_asiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_periodo RECORD;
BEGIN
    -- Buscar periodo para la fecha del asiento
    SELECT * INTO v_periodo
    FROM periodos_contables
    WHERE organizacion_id = NEW.organizacion_id
    AND NEW.fecha BETWEEN fecha_inicio AND fecha_fin;

    -- Si existe periodo y está cerrado, rechazar
    IF FOUND AND v_periodo.estado = 'cerrado' THEN
        RAISE EXCEPTION 'No se pueden crear/modificar asientos en periodo cerrado: % %',
            v_periodo.anio, v_periodo.mes;
    END IF;

    -- Si existe periodo y está en_cierre, rechazar
    IF FOUND AND v_periodo.estado = 'en_cierre' THEN
        RAISE EXCEPTION 'El periodo % % está en proceso de cierre',
            v_periodo.anio, v_periodo.mes;
    END IF;

    -- Crear periodo si no existe (solo en INSERT)
    IF TG_OP = 'INSERT' AND NOT FOUND THEN
        PERFORM crear_periodo_contable_si_no_existe(NEW.organizacion_id, NEW.fecha);
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_asiento_validar_periodo
    BEFORE INSERT OR UPDATE ON asientos_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_periodo_asiento();


-- ====================================================================
-- TRIGGER 4: Actualizar totales del asiento al modificar movimientos
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_actualizar_totales_asiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_asiento_id INTEGER;
    v_asiento_fecha DATE;
BEGIN
    -- Determinar el asiento afectado
    IF TG_OP = 'DELETE' THEN
        v_asiento_id := OLD.asiento_id;
        v_asiento_fecha := OLD.asiento_fecha;
    ELSE
        v_asiento_id := NEW.asiento_id;
        v_asiento_fecha := NEW.asiento_fecha;
    END IF;

    -- Actualizar totales en el asiento
    UPDATE asientos_contables
    SET
        total_debe = COALESCE((
            SELECT SUM(debe)
            FROM movimientos_contables
            WHERE asiento_id = v_asiento_id AND asiento_fecha = v_asiento_fecha
        ), 0),
        total_haber = COALESCE((
            SELECT SUM(haber)
            FROM movimientos_contables
            WHERE asiento_id = v_asiento_id AND asiento_fecha = v_asiento_fecha
        ), 0)
    WHERE id = v_asiento_id AND fecha = v_asiento_fecha;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimientos_actualizar_totales
    AFTER INSERT OR UPDATE OR DELETE ON movimientos_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_totales_asiento();


-- ====================================================================
-- TRIGGER 5: Actualizar saldos de cuenta al modificar movimientos
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_actualizar_saldo_cuenta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cuenta_id INTEGER;
    v_total_debe DECIMAL(15, 2);
    v_total_haber DECIMAL(15, 2);
    v_naturaleza VARCHAR(10);
BEGIN
    -- Determinar la cuenta afectada
    IF TG_OP = 'DELETE' THEN
        v_cuenta_id := OLD.cuenta_id;
    ELSE
        v_cuenta_id := NEW.cuenta_id;
    END IF;

    -- Calcular totales de todos los movimientos publicados
    SELECT
        COALESCE(SUM(mc.debe), 0),
        COALESCE(SUM(mc.haber), 0)
    INTO v_total_debe, v_total_haber
    FROM movimientos_contables mc
    JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
    WHERE mc.cuenta_id = v_cuenta_id
    AND ac.estado = 'publicado';

    -- Obtener naturaleza de la cuenta
    SELECT naturaleza INTO v_naturaleza
    FROM cuentas_contables
    WHERE id = v_cuenta_id;

    -- Actualizar saldos en la cuenta
    UPDATE cuentas_contables
    SET
        saldo_deudor = v_total_debe,
        saldo_acreedor = v_total_haber,
        saldo_final = CASE
            WHEN v_naturaleza = 'deudora' THEN saldo_inicial + v_total_debe - v_total_haber
            ELSE saldo_inicial + v_total_haber - v_total_debe
        END,
        actualizado_en = NOW()
    WHERE id = v_cuenta_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_movimientos_actualizar_saldo
    AFTER INSERT OR UPDATE OR DELETE ON movimientos_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_saldo_cuenta();


-- ====================================================================
-- TRIGGER 6: Validar cuadre al publicar asiento
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_validar_cuadre_publicar()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Solo validar cuando se cambia a estado 'publicado'
    IF NEW.estado = 'publicado' AND (OLD.estado IS NULL OR OLD.estado = 'borrador') THEN
        -- Verificar que el asiento cuadre
        IF NEW.total_debe != NEW.total_haber THEN
            RAISE EXCEPTION 'El asiento % no cuadra. Debe: %, Haber: %',
                NEW.numero_asiento, NEW.total_debe, NEW.total_haber;
        END IF;

        -- Verificar que tenga movimientos
        IF NEW.total_debe = 0 AND NEW.total_haber = 0 THEN
            RAISE EXCEPTION 'El asiento % no tiene movimientos', NEW.numero_asiento;
        END IF;

        -- Establecer fecha de publicación
        NEW.publicado_en := NOW();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_asiento_validar_cuadre
    BEFORE UPDATE ON asientos_contables
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_cuadre_publicar();


-- ====================================================================
-- TRIGGER 7: Asiento automático desde Venta POS
-- ====================================================================
-- Este trigger se ejecuta en ventas_pos cuando una venta se completa.
-- Genera el asiento contable automáticamente.
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_asiento_venta_pos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Solo crear asiento cuando la venta se completa
    IF NEW.estado = 'completada' AND (OLD IS NULL OR OLD.estado != 'completada') THEN
        PERFORM crear_asiento_venta_pos(NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

-- NOTA: El trigger en ventas_pos se crea aquí
-- Se activa al completar una venta
CREATE TRIGGER trg_venta_pos_asiento_contable
    AFTER INSERT OR UPDATE OF estado ON ventas_pos
    FOR EACH ROW
    WHEN (NEW.estado = 'completada')
    EXECUTE FUNCTION trigger_asiento_venta_pos();


-- ====================================================================
-- TRIGGER 8: Asiento automático desde Orden de Compra
-- ====================================================================
-- Este trigger se ejecuta en ordenes_compra cuando se recibe mercancía.
-- Genera el asiento contable automáticamente.
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_asiento_orden_compra()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Solo crear asiento cuando la orden se recibe
    IF NEW.estado = 'recibida' AND (OLD IS NULL OR OLD.estado != 'recibida') THEN
        PERFORM crear_asiento_compra(NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

-- NOTA: El trigger en ordenes_compra se crea aquí
-- Se activa al recibir mercancía
CREATE TRIGGER trg_orden_compra_asiento_contable
    AFTER UPDATE OF estado ON ordenes_compra
    FOR EACH ROW
    WHEN (NEW.estado = 'recibida')
    EXECUTE FUNCTION trigger_asiento_orden_compra();


-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON FUNCTION trigger_contabilidad_updated_at IS
'Actualiza el campo actualizado_en en todas las tablas del módulo contabilidad.';

COMMENT ON FUNCTION trigger_asignar_numero_asiento IS
'Asigna número secuencial al crear un asiento contable.
El número es único por organización y se genera automáticamente.';

COMMENT ON FUNCTION trigger_validar_periodo_asiento IS
'Valida que el periodo contable esté abierto antes de crear/modificar asientos.
Si no existe periodo, lo crea automáticamente.';

COMMENT ON FUNCTION trigger_actualizar_totales_asiento IS
'Actualiza los totales (debe/haber) del asiento al modificar sus movimientos.
Se ejecuta después de INSERT/UPDATE/DELETE en movimientos_contables.';

COMMENT ON FUNCTION trigger_actualizar_saldo_cuenta IS
'Actualiza los saldos de la cuenta contable al modificar movimientos.
Calcula saldo_deudor, saldo_acreedor y saldo_final según naturaleza.';

COMMENT ON FUNCTION trigger_validar_cuadre_publicar IS
'Valida que el asiento cuadre (debe = haber) al cambiar a estado publicado.
Rechaza la publicación si no cuadra o no tiene movimientos.';

COMMENT ON FUNCTION trigger_asiento_venta_pos IS
'Genera asiento contable automático al completar venta POS.
Llama a crear_asiento_venta_pos(venta_id).';

COMMENT ON FUNCTION trigger_asiento_orden_compra IS
'Genera asiento contable automático al recibir orden de compra.
Llama a crear_asiento_compra(orden_id).';


-- ====================================================================
-- ✅ TOTAL: 8 triggers + funciones asociadas
-- ====================================================================
