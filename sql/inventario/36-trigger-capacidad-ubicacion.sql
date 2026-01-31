-- ============================================================================
-- SINCRONIZACIÓN AUTOMÁTICA DE capacidad_ocupada EN UBICACIONES
-- Enero 2026 - Mejora de integridad de datos
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TRIGGER: Sincronizar capacidad_ocupada cuando cambia stock_ubicaciones
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sincronizar_capacidad_ubicacion()
RETURNS TRIGGER AS $$
DECLARE
    v_ubicacion_id INTEGER;
BEGIN
    -- Determinar ubicación afectada
    IF TG_OP = 'DELETE' THEN
        v_ubicacion_id := OLD.ubicacion_id;
    ELSE
        v_ubicacion_id := NEW.ubicacion_id;
    END IF;

    -- Recalcular capacidad_ocupada desde la fuente de verdad
    UPDATE ubicaciones_almacen
    SET capacidad_ocupada = COALESCE(
        (SELECT SUM(cantidad) FROM stock_ubicaciones WHERE ubicacion_id = v_ubicacion_id), 0
    ),
    actualizado_en = NOW()
    WHERE id = v_ubicacion_id;

    -- Si es UPDATE y cambió la ubicación, actualizar también la anterior
    IF TG_OP = 'UPDATE' AND OLD.ubicacion_id != NEW.ubicacion_id THEN
        UPDATE ubicaciones_almacen
        SET capacidad_ocupada = COALESCE(
            (SELECT SUM(cantidad) FROM stock_ubicaciones WHERE ubicacion_id = OLD.ubicacion_id), 0
        ),
        actualizado_en = NOW()
        WHERE id = OLD.ubicacion_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sincronizar_capacidad_ubicacion IS
'Trigger que mantiene capacidad_ocupada sincronizado con SUM(stock_ubicaciones.cantidad)';

DROP TRIGGER IF EXISTS trg_sincronizar_capacidad ON stock_ubicaciones;
CREATE TRIGGER trg_sincronizar_capacidad
    AFTER INSERT OR UPDATE OR DELETE ON stock_ubicaciones
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_capacidad_ubicacion();

-- ----------------------------------------------------------------------------
-- FUNCIÓN: Validar capacidad_ocupada (para job diario)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validar_capacidad_ocupada()
RETURNS TABLE(
    organizacion_id INTEGER,
    ubicacion_id INTEGER,
    codigo VARCHAR(30),
    capacidad_actual INTEGER,
    capacidad_real BIGINT,
    diferencia BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.organizacion_id,
        ua.id,
        ua.codigo,
        ua.capacidad_ocupada,
        COALESCE(SUM(su.cantidad), 0)::BIGINT,
        (COALESCE(SUM(su.cantidad), 0) - ua.capacidad_ocupada)::BIGINT
    FROM ubicaciones_almacen ua
    LEFT JOIN stock_ubicaciones su ON su.ubicacion_id = ua.id
    WHERE ua.activo = true
    GROUP BY ua.id
    HAVING ua.capacidad_ocupada != COALESCE(SUM(su.cantidad), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validar_capacidad_ocupada IS
'Detecta ubicaciones con capacidad_ocupada desincronizada';

-- ----------------------------------------------------------------------------
-- FUNCIÓN: Reparar capacidad_ocupada de todas las ubicaciones
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reparar_capacidad_ocupada_todas()
RETURNS TABLE(
    ubicacion_id INTEGER,
    codigo VARCHAR(30),
    capacidad_antes INTEGER,
    capacidad_despues INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH estado_antes AS (
        SELECT ua.id, ua.codigo, ua.capacidad_ocupada as antes
        FROM ubicaciones_almacen ua
    ),
    reparaciones AS (
        UPDATE ubicaciones_almacen ua
        SET capacidad_ocupada = COALESCE(
            (SELECT SUM(cantidad) FROM stock_ubicaciones su WHERE su.ubicacion_id = ua.id), 0
        ),
        actualizado_en = NOW()
        RETURNING ua.id, ua.capacidad_ocupada as despues
    )
    SELECT
        ea.id,
        ea.codigo,
        ea.antes,
        r.despues
    FROM estado_antes ea
    JOIN reparaciones r ON r.id = ea.id
    WHERE ea.antes != r.despues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reparar_capacidad_ocupada_todas IS
'Repara todas las ubicaciones con capacidad_ocupada incorrecta';
