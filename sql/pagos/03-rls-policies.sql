-- ====================================================================
-- 🛡️ MÓDULO PAGOS - ROW LEVEL SECURITY (RLS)
-- ====================================================================
--
-- PROPÓSITO:
-- Aislamiento multi-tenant para sistema de pagos Mercado Pago.
-- Garantiza que cada organización solo vea sus propios pagos y métodos.
--
-- COMPONENTES:
-- • 3 políticas para tabla pagos (SELECT, INSERT, UPDATE)
-- • 4 políticas para tabla metodos_pago (SELECT, INSERT, UPDATE, DELETE)
--
-- SEGURIDAD:
-- ✅ Aislamiento total por organización
-- ✅ Validación en INSERT y UPDATE
-- ✅ Webhooks pueden actualizar estado de pagos
-- ✅ Control completo de métodos de pago
--
-- ORDEN DE CARGA: #10 (después de índices)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN AMBAS TABLAS
-- ====================================================================

ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodos_pago ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS RLS: TABLA PAGOS
-- ====================================================================

-- Política SELECT: Los usuarios solo ven pagos de su organización
CREATE POLICY pagos_select_policy ON pagos
    FOR SELECT
    USING (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- Política INSERT: Solo se pueden insertar pagos de la propia organización
CREATE POLICY pagos_insert_policy ON pagos
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- Política UPDATE: Solo se pueden actualizar pagos de la propia organización
-- NOTA: Necesaria para que webhooks puedan actualizar estado de pagos
CREATE POLICY pagos_update_policy ON pagos
    FOR UPDATE
    USING (organizacion_id = current_setting('rls.organizacion_id', true)::integer)
    WITH CHECK (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- ====================================================================
-- POLÍTICAS RLS: TABLA METODOS_PAGO
-- ====================================================================

-- Política SELECT: Los usuarios solo ven métodos de pago de su organización
CREATE POLICY metodos_pago_select_policy ON metodos_pago
    FOR SELECT
    USING (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- Política INSERT: Solo se pueden insertar métodos de la propia organización
CREATE POLICY metodos_pago_insert_policy ON metodos_pago
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- Política UPDATE: Solo se pueden actualizar métodos de la propia organización
CREATE POLICY metodos_pago_update_policy ON metodos_pago
    FOR UPDATE
    USING (organizacion_id = current_setting('rls.organizacion_id', true)::integer)
    WITH CHECK (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- Política DELETE: Solo se pueden eliminar métodos de la propia organización
CREATE POLICY metodos_pago_delete_policy ON metodos_pago
    FOR DELETE
    USING (organizacion_id = current_setting('rls.organizacion_id', true)::integer);

-- ====================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON POLICY pagos_update_policy ON pagos IS
'Permite actualizar estado de pagos desde webhooks de Mercado Pago manteniendo aislamiento multi-tenant';

COMMENT ON POLICY metodos_pago_delete_policy ON metodos_pago IS
'Permite a organizaciones eliminar sus propios métodos de pago (ej: tarjetas vencidas)';
