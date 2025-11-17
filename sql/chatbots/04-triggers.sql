-- ====================================================================
-- 🔄 MÓDULO CHATBOTS - TRIGGERS AUTOMÁTICOS
-- ====================================================================
--
-- PROPÓSITO:
-- Triggers para mantenimiento automático y auditoría de chatbots.
--
-- COMPONENTES:
-- • Trigger updated_at en chatbot_config
--
-- CARACTERÍSTICAS:
-- ✅ Actualización automática de timestamps
-- ✅ Auditoría de modificaciones
--
-- ORDEN DE CARGA: #11 (después de RLS)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER: ACTUALIZAR TIMESTAMP EN CHATBOT_CONFIG
-- ====================================================================
-- Actualiza automáticamente actualizado_en cuando se modifica un chatbot.
-- Útil para auditoría de cambios de configuración.
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER trigger_actualizar_timestamp_chatbot_config
    BEFORE UPDATE ON chatbot_config
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trigger_actualizar_timestamp_chatbot_config ON chatbot_config IS
'Actualiza automáticamente el campo actualizado_en en chatbot_config.
Permite rastrear cuándo fue la última modificación de configuración del chatbot.
Agregado: 2025-10-22 - Sistema de chatbots multi-plataforma';
