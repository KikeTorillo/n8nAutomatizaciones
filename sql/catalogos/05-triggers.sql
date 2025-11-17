-- ====================================================================
-- MÓDULO CATÁLOGOS: TRIGGERS AUTOMÁTICOS
-- ====================================================================
-- Triggers que automatizan:
-- • Actualización de timestamps
-- • Protección de tipos del sistema
--
-- Migrado de: sql/schema/04-catalog-tables.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGERS PARA TIPOS_BLOQUEO (2 triggers)
-- ====================================================================

-- Trigger 1: Actualizar timestamp automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_tipos_bloqueo
BEFORE UPDATE ON tipos_bloqueo
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_tipos_bloqueo();

-- Trigger 2: Proteger tipos del sistema
CREATE TRIGGER trigger_proteger_tipos_sistema
BEFORE UPDATE OR DELETE ON tipos_bloqueo
FOR EACH ROW
WHEN (OLD.es_sistema = true)
EXECUTE FUNCTION proteger_tipos_sistema();

-- ====================================================================
-- TRIGGERS PARA TIPOS_PROFESIONAL (2 triggers)
-- ====================================================================

-- Trigger 1: Actualizar timestamp automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_tipos_profesional
BEFORE UPDATE ON tipos_profesional
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_tipos_profesional();

-- Trigger 2: Proteger tipos del sistema
CREATE TRIGGER trigger_proteger_tipos_profesional_sistema
BEFORE UPDATE OR DELETE ON tipos_profesional
FOR EACH ROW
WHEN (OLD.es_sistema = true)
EXECUTE FUNCTION proteger_tipos_profesional_sistema();

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TRIGGER trigger_actualizar_timestamp_tipos_bloqueo ON tipos_bloqueo IS
'Actualiza automáticamente actualizado_en usando función actualizar_timestamp_tipos_bloqueo()';

COMMENT ON TRIGGER trigger_proteger_tipos_sistema ON tipos_bloqueo IS
'Protege tipos del sistema contra eliminación, desactivación y modificación de código';

COMMENT ON TRIGGER trigger_actualizar_timestamp_tipos_profesional ON tipos_profesional IS
'Actualiza automáticamente actualizado_en usando función actualizar_timestamp_tipos_profesional()';

COMMENT ON TRIGGER trigger_proteger_tipos_profesional_sistema ON tipos_profesional IS
'Protege tipos del sistema contra eliminación, desactivación y modificación de código';
