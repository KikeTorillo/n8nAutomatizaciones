-- ====================================================================
-- MÓDULO NEGOCIO: TRIGGERS AUTOMÁTICOS
-- ====================================================================
-- Triggers de mantenimiento y validación para las tablas del modelo
-- de negocio.
--
-- TRIGGERS INCLUIDOS:
-- • trigger_actualizar_profesionales - Timestamps en profesionales
-- • trigger_validar_profesional_industria - Validación tipo/industria
-- • trigger_actualizar_timestamp_servicios - Timestamps en servicios
-- • trigger_actualizar_timestamp_servicios_profesionales - Timestamps en relaciones
--
-- Migrado de: sql/schema/09-triggers.sql
-- Fecha migración: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- 👨‍💼 TRIGGERS PARA TABLA PROFESIONALES
-- ====================================================================
-- Timestamps automáticos y validación de coherencia industria-profesional
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER 1: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_profesionales
    BEFORE UPDATE ON profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- TRIGGER 2: VALIDACIÓN DE COHERENCIA INDUSTRIA-PROFESIONAL
-- Valida que tipo_profesional sea compatible con industria de la organización
CREATE TRIGGER trigger_validar_profesional_industria
    BEFORE INSERT OR UPDATE ON profesionales
    FOR EACH ROW EXECUTE FUNCTION validar_profesional_industria();

-- ====================================================================
-- 🎯 TRIGGERS PARA TABLA SERVICIOS
-- ====================================================================
-- Mantenimiento automático de timestamps
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_servicios
    BEFORE UPDATE ON servicios
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_servicios();

-- ====================================================================
-- 🔗 TRIGGERS PARA TABLA SERVICIOS_PROFESIONALES
-- ====================================================================
-- Mantenimiento automático de timestamps en relaciones
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_servicios_profesionales
    BEFORE UPDATE ON servicios_profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE TRIGGERS
-- ====================================================================
-- Comentarios explicativos para cada trigger implementado
-- ────────────────────────────────────────────────────────────────────

COMMENT ON TRIGGER trigger_actualizar_profesionales ON profesionales IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';

COMMENT ON TRIGGER trigger_validar_profesional_industria ON profesionales IS
'Valida coherencia entre tipo_profesional y industria de la organización usando función validar_profesional_industria()';

COMMENT ON TRIGGER trigger_actualizar_timestamp_servicios ON servicios IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp_servicios()';

COMMENT ON TRIGGER trigger_actualizar_timestamp_servicios_profesionales ON servicios_profesionales IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';
