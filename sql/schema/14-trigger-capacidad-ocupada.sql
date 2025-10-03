-- ====================================================================
-- 🔄 TRIGGER: Gestión Automática de capacidad_ocupada
-- ====================================================================
--
-- PROPÓSITO:
-- Mantener sincronizado el campo `capacidad_ocupada` en la tabla
-- `horarios_disponibilidad` basándose en las citas activas.
--
-- CASOS DE USO:
-- 1. Servicios grupales (clases, talleres) con capacidad_maxima > 1
-- 2. Prevenir sobreventa automáticamente
-- 3. Mantener integridad de datos sin código manual
--
-- 🔄 ORDEN DE EJECUCIÓN: #14 (Después de bloqueos-horarios)
-- 🔒 SEGURIDAD: Opera dentro de RLS de tabla citas
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: sync_capacidad_ocupada_horario()
-- ====================================================================
-- Actualiza el contador de capacidad_ocupada cuando:
-- - Se crea una cita (INSERT)
-- - Se actualiza el estado de una cita (UPDATE)
-- - Se cancela/elimina una cita (DELETE)
-- ====================================================================

CREATE OR REPLACE FUNCTION sync_capacidad_ocupada_horario()
RETURNS TRIGGER AS $$
DECLARE
    v_horario_id INTEGER;
    v_organizacion_id INTEGER;
BEGIN
    -- ================================================================
    -- CASO 1: INSERT - Nueva cita creada
    -- ================================================================
    IF (TG_OP = 'INSERT') THEN
        -- Solo contar si tiene horario vinculado y estado activo
        IF NEW.horario_id IS NOT NULL AND
           NEW.estado IN ('confirmada', 'en_curso') THEN

            UPDATE horarios_disponibilidad
            SET capacidad_ocupada = capacidad_ocupada + 1,
                actualizado_en = NOW(),
                version = version + 1
            WHERE id = NEW.horario_id
              AND organizacion_id = NEW.organizacion_id
              AND capacidad_ocupada < capacidad_maxima;

            -- Log para debugging (solo en desarrollo)
            -- RAISE NOTICE 'Incrementada capacidad_ocupada para horario_id: %, cita_id: %',
            --     NEW.horario_id, NEW.id;
        END IF;

        RETURN NEW;

    -- ================================================================
    -- CASO 2: UPDATE - Cambio de estado de cita
    -- ================================================================
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Detectar cambio de estado relevante
        IF OLD.estado IS DISTINCT FROM NEW.estado OR
           OLD.horario_id IS DISTINCT FROM NEW.horario_id THEN

            -- ESCENARIO A: Cita pasó de inactiva a activa
            IF OLD.estado NOT IN ('confirmada', 'en_curso') AND
               NEW.estado IN ('confirmada', 'en_curso') AND
               NEW.horario_id IS NOT NULL THEN

                UPDATE horarios_disponibilidad
                SET capacidad_ocupada = capacidad_ocupada + 1,
                    actualizado_en = NOW(),
                    version = version + 1
                WHERE id = NEW.horario_id
                  AND organizacion_id = NEW.organizacion_id
                  AND capacidad_ocupada < capacidad_maxima;

            -- ESCENARIO B: Cita pasó de activa a inactiva (cancelada/completada)
            ELSIF OLD.estado IN ('confirmada', 'en_curso') AND
                  NEW.estado NOT IN ('confirmada', 'en_curso') AND
                  OLD.horario_id IS NOT NULL THEN

                UPDATE horarios_disponibilidad
                SET capacidad_ocupada = GREATEST(0, capacidad_ocupada - 1),
                    actualizado_en = NOW(),
                    version = version + 1
                WHERE id = OLD.horario_id
                  AND organizacion_id = OLD.organizacion_id;

            -- ESCENARIO C: Cambio de horario (reprogramación)
            ELSIF OLD.horario_id IS DISTINCT FROM NEW.horario_id AND
                  NEW.estado IN ('confirmada', 'en_curso') THEN

                -- Decrementar horario anterior
                IF OLD.horario_id IS NOT NULL THEN
                    UPDATE horarios_disponibilidad
                    SET capacidad_ocupada = GREATEST(0, capacidad_ocupada - 1),
                        actualizado_en = NOW(),
                        version = version + 1
                    WHERE id = OLD.horario_id
                      AND organizacion_id = OLD.organizacion_id;
                END IF;

                -- Incrementar horario nuevo
                IF NEW.horario_id IS NOT NULL THEN
                    UPDATE horarios_disponibilidad
                    SET capacidad_ocupada = capacidad_ocupada + 1,
                        actualizado_en = NOW(),
                        version = version + 1
                    WHERE id = NEW.horario_id
                      AND organizacion_id = NEW.organizacion_id
                      AND capacidad_ocupada < capacidad_maxima;
                END IF;

            END IF;
        END IF;

        RETURN NEW;

    -- ================================================================
    -- CASO 3: DELETE - Cita eliminada
    -- ================================================================
    ELSIF (TG_OP = 'DELETE') THEN
        -- Solo decrementar si era una cita activa con horario vinculado
        IF OLD.horario_id IS NOT NULL AND
           OLD.estado IN ('confirmada', 'en_curso') THEN

            UPDATE horarios_disponibilidad
            SET capacidad_ocupada = GREATEST(0, capacidad_ocupada - 1),
                actualizado_en = NOW(),
                version = version + 1
            WHERE id = OLD.horario_id
              AND organizacion_id = OLD.organizacion_id;

        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- TRIGGER: trigger_sync_capacidad_ocupada
-- ====================================================================
-- Se ejecuta DESPUÉS de INSERT/UPDATE/DELETE en la tabla citas
-- Garantiza que capacidad_ocupada siempre esté sincronizada
-- ====================================================================

DROP TRIGGER IF EXISTS trigger_sync_capacidad_ocupada ON citas;

CREATE TRIGGER trigger_sync_capacidad_ocupada
    AFTER INSERT OR UPDATE OR DELETE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION sync_capacidad_ocupada_horario();

-- ====================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON FUNCTION sync_capacidad_ocupada_horario() IS
'Sincroniza automáticamente el contador de capacidad_ocupada en horarios_disponibilidad basándose en citas activas (confirmada, en_curso). Soporta servicios grupales y previene sobreventa.';

COMMENT ON TRIGGER trigger_sync_capacidad_ocupada ON citas IS
'Mantiene sincronizado el campo capacidad_ocupada cuando se crean, modifican o eliminan citas. Crítico para servicios grupales con capacidad_maxima > 1.';
