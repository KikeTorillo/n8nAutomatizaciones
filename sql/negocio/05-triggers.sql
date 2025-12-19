-- ====================================================================
-- MÓDULO NEGOCIO: TRIGGERS AUTOMÁTICOS
-- ====================================================================
-- Triggers de mantenimiento y validación para las tablas del modelo
-- de negocio.
--
-- TRIGGERS INCLUIDOS:
-- • trigger_actualizar_profesionales - Timestamps en profesionales
-- • trigger_actualizar_timestamp_servicios - Timestamps en servicios
-- • trigger_actualizar_timestamp_servicios_profesionales - Timestamps en relaciones
-- • trigger_poblar_organizacion_id_servicios_profesionales - Multi-tenant
--
-- Migrado de: sql/schema/09-triggers.sql
-- Fecha migración: 17 Noviembre 2025
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

-- TRIGGER 1: POBLAR Y VALIDAR ORGANIZACION_ID AUTOMÁTICAMENTE
-- Garantiza aislamiento multi-tenant poblando organizacion_id desde servicios/profesionales
CREATE TRIGGER trigger_poblar_organizacion_id_servicios_profesionales
    BEFORE INSERT OR UPDATE ON servicios_profesionales
    FOR EACH ROW EXECUTE FUNCTION poblar_organizacion_id_servicios_profesionales();

-- TRIGGER 2: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
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

COMMENT ON TRIGGER trigger_actualizar_timestamp_servicios ON servicios IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp_servicios()';

COMMENT ON TRIGGER trigger_poblar_organizacion_id_servicios_profesionales ON servicios_profesionales IS
'Pobla y valida automáticamente organizacion_id garantizando que servicio y profesional pertenezcan a la misma organización. Previene violaciones de seguridad multi-tenant usando función poblar_organizacion_id_servicios_profesionales()';

COMMENT ON TRIGGER trigger_actualizar_timestamp_servicios_profesionales ON servicios_profesionales IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';
