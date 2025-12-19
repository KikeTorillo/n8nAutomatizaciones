-- ====================================================================
-- MÓDULO PROFESIONALES: TRIGGERS AUTOMÁTICOS
-- ====================================================================
-- Triggers de mantenimiento para la tabla profesionales.
-- Extraído de sql/negocio/ para modularización (Dic 2025)
-- ====================================================================

-- ====================================================================
-- 👨‍💼 TRIGGERS PARA TABLA PROFESIONALES
-- ====================================================================
-- Timestamps automáticos
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_profesionales
    BEFORE UPDATE ON profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trigger_actualizar_profesionales ON profesionales IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';
