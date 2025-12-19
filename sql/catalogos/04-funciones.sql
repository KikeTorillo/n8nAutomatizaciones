-- ====================================================================
-- MÓDULO CATÁLOGOS: FUNCIONES PL/PGSQL
-- ====================================================================
-- Funciones para triggers de catálogos dinámicos.
--
-- FUNCIONES:
-- • actualizar_timestamp_tipos_bloqueo() - Timestamps automáticos
-- • proteger_tipos_sistema() - Protección de tipos del sistema
-- • actualizar_timestamp_tipos_profesional() - Timestamps automáticos
-- • proteger_tipos_profesional_sistema() - Protección de tipos del sistema
--
-- Migrado de: sql/schema/04-catalog-tables.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN 1: ACTUALIZAR TIMESTAMP TIPOS_BLOQUEO
-- ====================================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_tipos_bloqueo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_timestamp_tipos_bloqueo() IS
'Actualiza automáticamente actualizado_en cuando se modifica un tipo de bloqueo';

-- ====================================================================
-- FUNCIÓN 2: PROTEGER TIPOS DEL SISTEMA (TIPOS_BLOQUEO)
-- ====================================================================

CREATE OR REPLACE FUNCTION proteger_tipos_sistema()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.es_sistema = true THEN
        -- No eliminar físicamente
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'No se pueden eliminar tipos del sistema. Use soft delete (activo = false) si es necesario.';
        END IF;

        -- No desactivar
        IF TG_OP = 'UPDATE' AND NEW.activo = false THEN
            RAISE EXCEPTION 'No se pueden desactivar tipos del sistema';
        END IF;

        -- No cambiar código
        IF TG_OP = 'UPDATE' AND OLD.codigo != NEW.codigo THEN
            RAISE EXCEPTION 'No se puede cambiar el código de tipos del sistema';
        END IF;

        -- No cambiar organizacion_id de NULL a NOT NULL
        IF TG_OP = 'UPDATE' AND OLD.organizacion_id IS NULL AND NEW.organizacion_id IS NOT NULL THEN
            RAISE EXCEPTION 'No se puede asignar un tipo del sistema a una organización';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION proteger_tipos_sistema() IS
'Protege tipos del sistema en tipos_bloqueo. Previene: eliminación, desactivación, cambio de código, asignación a organización';

