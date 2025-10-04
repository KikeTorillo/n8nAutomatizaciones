-- ====================================================================
-- ⚡ TRIGGERS AUTOMÁTICOS DEL SISTEMA
-- ====================================================================
--
-- Este archivo contiene todos los triggers que automatizan validaciones,
-- actualizaciones de timestamps y mantenimiento de integridad.
--
-- 🔧 TRIGGERS IMPLEMENTADOS:
-- • trigger_validar_email_usuario: Valida unicidad de emails
-- • trigger_actualizar_usuarios: Timestamps automáticos en usuarios
-- • trigger_actualizar_organizaciones: Timestamps en organizaciones
-- • trigger_actualizar_profesionales: Timestamps en profesionales
-- • trigger_validar_profesional_industria: Coherencia tipo-industria
-- • trigger_actualizar_timestamp_servicios: Timestamps en servicios
-- • trigger_actualizar_timestamp_servicios_profesionales: Timestamps en relaciones
-- • trigger_actualizar_timestamp_citas: Timestamps en citas
-- • trigger_validar_coherencia_cita: Coherencia organizacional en citas
-- • trigger_generar_codigo_cita: Auto-generación de código único ✨ NUEVO
-- • trigger_actualizar_timestamp_horarios: Timestamps en horarios
-- • trigger_validar_coherencia_horario: Coherencia organizacional en horarios
--
-- 🔄 ORDEN DE EJECUCIÓN: #9 (Después de RLS policies)
-- 🎯 AUTOMÁTICO: Se ejecutan transparentemente en cada operación
-- ====================================================================

-- ====================================================================
-- 👤 TRIGGERS PARA TABLA USUARIOS
-- ====================================================================
-- Validaciones de email y actualizaciones automáticas de timestamps
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER 1: VALIDACIÓN DE EMAIL ÚNICO
-- Valida unicidad de email antes de INSERT/UPDATE
CREATE TRIGGER trigger_validar_email_usuario
    BEFORE INSERT OR UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION validar_email_usuario();

-- TRIGGER 2: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 🏢 TRIGGERS PARA TABLA ORGANIZACIONES
-- ====================================================================
-- Mantenimiento automático de timestamps
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_organizaciones
    BEFORE UPDATE ON organizaciones
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

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
-- 📅 TRIGGERS PARA TABLA CITAS
-- ====================================================================
-- Timestamps automáticos y validación de coherencia organizacional
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER 1: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_citas
    BEFORE UPDATE ON citas
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_citas();

-- TRIGGER 2: VALIDACIÓN DE COHERENCIA ORGANIZACIONAL
-- Valida que cliente, profesional y servicio pertenezcan a la misma organización
CREATE TRIGGER trigger_validar_coherencia_cita
    BEFORE INSERT OR UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION validar_coherencia_cita();

-- TRIGGER 3: AUTO-GENERACIÓN DE CÓDIGO DE CITA (AGREGADO 2025-10-03)
-- Genera código único automáticamente si no se proporciona
CREATE TRIGGER trigger_generar_codigo_cita
    BEFORE INSERT ON citas
    FOR EACH ROW
    EXECUTE FUNCTION generar_codigo_cita();

-- ====================================================================
-- ⏰ TRIGGERS PARA TABLA HORARIOS_DISPONIBILIDAD
-- ====================================================================
-- Timestamps automáticos y validación de coherencia organizacional
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER 1: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_horarios
    BEFORE UPDATE ON horarios_disponibilidad
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_horarios();

-- TRIGGER 2: VALIDACIÓN DE COHERENCIA ORGANIZACIONAL
-- Valida coherencia entre organización, profesional y servicio
CREATE TRIGGER trigger_validar_coherencia_horario
    BEFORE INSERT OR UPDATE ON horarios_disponibilidad
    FOR EACH ROW EXECUTE FUNCTION validar_coherencia_horario();

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE TRIGGERS
-- ====================================================================
-- Comentarios explicativos para cada trigger implementado
-- ────────────────────────────────────────────────────────────────────

COMMENT ON TRIGGER trigger_validar_email_usuario ON usuarios IS
'Valida unicidad de email usando función validar_email_usuario() antes de INSERT/UPDATE';

COMMENT ON TRIGGER trigger_actualizar_usuarios ON usuarios IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';

COMMENT ON TRIGGER trigger_actualizar_organizaciones ON organizaciones IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';

COMMENT ON TRIGGER trigger_actualizar_profesionales ON profesionales IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';

COMMENT ON TRIGGER trigger_validar_profesional_industria ON profesionales IS
'Valida coherencia entre tipo_profesional y industria de la organización usando función validar_profesional_industria()';

COMMENT ON TRIGGER trigger_actualizar_timestamp_servicios ON servicios IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp_servicios()';

COMMENT ON TRIGGER trigger_actualizar_timestamp_servicios_profesionales ON servicios_profesionales IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp()';

COMMENT ON TRIGGER trigger_actualizar_timestamp_citas ON citas IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp_citas()';

COMMENT ON TRIGGER trigger_validar_coherencia_cita ON citas IS
'Valida que cliente, profesional y servicio pertenezcan a la misma organización usando función validar_coherencia_cita()';

COMMENT ON TRIGGER trigger_generar_codigo_cita ON citas IS
'Auto-genera codigo_cita único (formato: ORG001-20251003-001) antes de insertar si no se proporciona. Previene errores de duplicate key. Agregado: 2025-10-03';

COMMENT ON TRIGGER trigger_actualizar_timestamp_horarios ON horarios_disponibilidad IS
'Actualiza automáticamente el campo actualizado_en usando función actualizar_timestamp_horarios()';

COMMENT ON TRIGGER trigger_validar_coherencia_horario ON horarios_disponibilidad IS
'Valida coherencia organizacional entre profesional, servicio y organización usando función validar_coherencia_horario()';
