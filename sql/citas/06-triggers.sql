-- ====================================================================
-- 📅 MÓDULO CITAS - TRIGGERS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: citas
--
-- DESCRIPCIÓN:
-- Triggers automáticos para validaciones y actualizaciones en citas.
-- Garantizan integridad de datos y automatizan tareas repetitivas.
--
-- TRIGGERS TABLA CITAS (3 triggers):
-- • trigger_generar_codigo_cita: Auto-generación de código único
-- • trigger_validar_coherencia_cita: Validación organizacional
-- • trigger_actualizar_timestamp_citas: Actualización de timestamps
--
-- TRIGGERS TABLA CITAS_SERVICIOS (1 trigger):
-- • trigger_actualizar_timestamp_citas_servicios: Actualización de timestamps
--
-- ====================================================================

-- ====================================================================
-- ⚡ TRIGGERS PARA TABLA CITAS
-- ====================================================================

-- TRIGGER 1: AUTO-GENERACIÓN DE CÓDIGO DE CITA
-- Genera código único automáticamente si no se proporciona
-- Formato: ORG001-20251116-001
CREATE TRIGGER trigger_generar_codigo_cita
    BEFORE INSERT ON citas
    FOR EACH ROW
    EXECUTE FUNCTION generar_codigo_cita();

-- TRIGGER 2: VALIDACIÓN DE COHERENCIA ORGANIZACIONAL
-- Valida que cliente y profesional pertenezcan a la misma organización
CREATE TRIGGER trigger_validar_coherencia_cita
    BEFORE INSERT OR UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION validar_coherencia_cita();

-- TRIGGER 3: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en y versión automáticamente
CREATE TRIGGER trigger_actualizar_timestamp_citas
    BEFORE UPDATE ON citas
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_citas();

-- ====================================================================
-- ⚡ TRIGGERS PARA TABLA CITAS_SERVICIOS
-- ====================================================================

-- TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- Actualiza campo actualizado_en automáticamente en cada UPDATE
CREATE TRIGGER trigger_actualizar_timestamp_citas_servicios
    BEFORE UPDATE ON citas_servicios
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 📝 COMENTARIOS DE TRIGGERS
-- ====================================================================

COMMENT ON TRIGGER trigger_generar_codigo_cita ON citas IS
'Auto-genera codigo_cita único (formato: ORG001-20251116-001) antes de insertar si no se proporciona.
Función: generar_codigo_cita()
Ejecución: BEFORE INSERT
Previene: Errores de duplicate key
Agregado: 2025-10-03 - Corrección crítica para integridad de datos';

COMMENT ON TRIGGER trigger_validar_coherencia_cita ON citas IS
'Valida que cliente y profesional pertenezcan a la misma organización.
Función: validar_coherencia_cita()
Ejecución: BEFORE INSERT OR UPDATE
Previene: Incoherencia organizacional en citas
NOTA: Servicios se validan en tabla citas_servicios (M:N)';

COMMENT ON TRIGGER trigger_actualizar_timestamp_citas ON citas IS
'Actualiza automáticamente el campo actualizado_en y versión al modificar una cita.
Función: actualizar_timestamp_citas()
Ejecución: BEFORE UPDATE
Auditoría: Tracking de cambios con versionado';

COMMENT ON TRIGGER trigger_actualizar_timestamp_citas_servicios ON citas_servicios IS
'Actualiza automáticamente el campo actualizado_en en citas_servicios.
Función: actualizar_timestamp() - Reutilizada de otras tablas.
Ejecución: BEFORE UPDATE
Agregado: 2025-10-26 - Feature múltiples servicios por cita';
