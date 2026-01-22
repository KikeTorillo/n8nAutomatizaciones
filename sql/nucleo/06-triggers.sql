-- ====================================================================
-- MÓDULO NÚCLEO: TRIGGERS AUTOMÁTICOS
-- ====================================================================
-- Triggers que mantienen automáticamente:
-- • Métricas de uso actualizadas (contadores en metricas_uso_organizacion)
-- • Auditoría de subscripciones (historial_subscripciones)
-- • Timestamps de actualización (updated_at en organizaciones y usuarios)
--
-- Migrado de: sql/schema/10-subscriptions-table.sql y 09-triggers.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- ====================================================================
-- Actualiza automáticamente el campo actualizado_en cuando se modifica
-- una fila en las tablas organizaciones y usuarios.
-- ====================================================================

-- Trigger para organizaciones
CREATE TRIGGER trigger_actualizar_organizaciones
    BEFORE UPDATE ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Trigger para usuarios
CREATE TRIGGER trigger_actualizar_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TRIGGER trigger_actualizar_organizaciones ON organizaciones IS
'Actualiza automáticamente actualizado_en cuando se modifica una organización';

COMMENT ON TRIGGER trigger_actualizar_usuarios ON usuarios IS
'Actualiza automáticamente actualizado_en cuando se modifica un usuario';

-- ====================================================================
-- 📧 TRIGGERS ADICIONALES DE USUARIOS Y ORGANIZACIONES (Migrado de schema/)
-- ====================================================================
-- Fecha de migración: 17 Noviembre 2025
-- Origen: sql/schema/09-triggers.sql
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER: VALIDACIÓN DE EMAIL ÚNICO
-- Valida unicidad de email antes de INSERT/UPDATE
CREATE TRIGGER trigger_validar_email_usuario
    BEFORE INSERT OR UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION validar_email_usuario();

-- TRIGGER: AUTO-CREACIÓN DE USUARIO BOT
-- Crea automáticamente un usuario con rol 'bot' después de insertar una organización
-- Este usuario será usado por los chatbots de IA para autenticarse vía MCP Server
CREATE TRIGGER trigger_crear_usuario_bot
    AFTER INSERT ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION crear_usuario_bot_organizacion();

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE TRIGGERS ADICIONALES
-- ====================================================================

COMMENT ON TRIGGER trigger_validar_email_usuario ON usuarios IS
'Valida unicidad global de email usando función validar_email_usuario() antes de INSERT/UPDATE.
Complementa el CONSTRAINT usuarios_email_key con mensajes de error más claros.
Migrado de schema/09-triggers.sql el 17 Nov 2025.';

COMMENT ON TRIGGER trigger_crear_usuario_bot ON organizaciones IS
'Crea automáticamente un usuario con rol bot después de insertar una organización.
Este usuario es usado por chatbots de IA para autenticación vía MCP Server.
Email formato: bot@org{id}.internal
Función: crear_usuario_bot_organizacion()
Migrado de schema/09-triggers.sql el 17 Nov 2025.';
