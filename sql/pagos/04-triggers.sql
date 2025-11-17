-- ====================================================================
-- 🔄 MÓDULO PAGOS - TRIGGERS AUTOMÁTICOS
-- ====================================================================
--
-- PROPÓSITO:
-- Triggers para mantenimiento automático de timestamps en tablas de pagos.
--
-- COMPONENTES:
-- • Trigger updated_at en tabla pagos
-- • Trigger updated_at en tabla metodos_pago
--
-- CARACTERÍSTICAS:
-- ✅ Actualización automática de updated_at
-- ✅ Auditoría de modificaciones
-- ✅ Usa función global actualizar_timestamp()
--
-- ORDEN DE CARGA: #10 (después de RLS)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER 1: ACTUALIZAR TIMESTAMP EN PAGOS
-- ====================================================================
-- Actualiza automáticamente updated_at cuando se modifica un pago.
-- Útil para auditoría de cambios de estado desde webhooks.
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_pagos_updated_at
    BEFORE UPDATE ON pagos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER update_pagos_updated_at ON pagos IS
'Actualiza updated_at automáticamente en cada UPDATE - útil para rastrear cambios de estado desde webhooks MP';

-- ====================================================================
-- TRIGGER 2: ACTUALIZAR TIMESTAMP EN METODOS_PAGO
-- ====================================================================
-- Actualiza automáticamente updated_at cuando se modifica un método de pago.
-- Permite rastrear cuándo se actualizó o desactivó un método.
-- ────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_metodos_pago_updated_at
    BEFORE UPDATE ON metodos_pago
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER update_metodos_pago_updated_at ON metodos_pago IS
'Actualiza updated_at automáticamente - rastreo de cambios en métodos de pago (activación/desactivación)';
