-- ====================================================================
-- 🔄 MÓDULO MANTENIMIENTO - TRIGGERS AUTOMÁTICOS
-- ====================================================================
--
-- PROPÓSITO:
-- Triggers para mantenimiento automático de timestamps en configuración.
--
-- COMPONENTES:
-- • Trigger updated_at en configuracion_sistema
--
-- CARACTERÍSTICAS:
-- ✅ Actualización automática de timestamps
-- ✅ Auditoría de modificaciones en configuración crítica
--
-- ORDEN DE CARGA: #12 (después de funciones)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER: ACTUALIZAR TIMESTAMP EN CONFIGURACION_SISTEMA
-- ====================================================================
-- Actualiza automáticamente actualizado_en cuando se modifica la configuración.
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_configuracion_sistema_timestamp
    BEFORE UPDATE ON configuracion_sistema
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER update_configuracion_sistema_timestamp ON configuracion_sistema IS
'Actualiza automáticamente el campo actualizado_en en configuracion_sistema.
Permite auditoría de cambios en configuración crítica del sistema.';
