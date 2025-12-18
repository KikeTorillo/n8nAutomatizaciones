-- ====================================================================
-- MODULO SUCURSALES: POLITICAS RLS
-- ====================================================================
-- Row Level Security para aislamiento multi-tenant y multi-sucursal.
--
-- Variables de contexto:
-- * app.current_tenant_id - ID de la organización actual
-- * app.current_user_id - ID del usuario actual
-- * app.current_sucursal_id - ID de la sucursal activa (opcional, NULL = todas)
-- * app.bypass_rls - 'true' para bypass (super_admin, operaciones sistema)
--
-- IMPORTANTE: Usamos NULLIF(current_setting(...), '')::INTEGER para evitar
-- errores de cast cuando current_tenant_id está vacío. PostgreSQL evalúa
-- los casts durante el parsing, incluso en expresiones OR short-circuit.
-- NULLIF convierte '' a NULL, y NULL::INTEGER es válido (devuelve NULL).
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- RLS: sucursales
-- ====================================================================
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales FORCE ROW LEVEL SECURITY;

-- Política SELECT: Ver sucursales de mi organización
CREATE POLICY sucursales_select_policy ON sucursales
    FOR SELECT
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

-- Política INSERT: Crear sucursales en mi organización
CREATE POLICY sucursales_insert_policy ON sucursales
    FOR INSERT
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

-- Política UPDATE: Modificar sucursales de mi organización
CREATE POLICY sucursales_update_policy ON sucursales
    FOR UPDATE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

-- Política DELETE: Eliminar sucursales de mi organización
CREATE POLICY sucursales_delete_policy ON sucursales
    FOR DELETE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

-- ====================================================================
-- RLS: usuarios_sucursales
-- ====================================================================
ALTER TABLE usuarios_sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_sucursales FORCE ROW LEVEL SECURITY;

-- Política SELECT: Ver asignaciones de sucursales de mi organización
CREATE POLICY usuarios_sucursales_select_policy ON usuarios_sucursales
    FOR SELECT
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- Política INSERT
CREATE POLICY usuarios_sucursales_insert_policy ON usuarios_sucursales
    FOR INSERT
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- Política UPDATE
CREATE POLICY usuarios_sucursales_update_policy ON usuarios_sucursales
    FOR UPDATE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- Política DELETE
CREATE POLICY usuarios_sucursales_delete_policy ON usuarios_sucursales
    FOR DELETE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- ====================================================================
-- RLS: profesionales_sucursales
-- ====================================================================
ALTER TABLE profesionales_sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesionales_sucursales FORCE ROW LEVEL SECURITY;

CREATE POLICY profesionales_sucursales_select_policy ON profesionales_sucursales
    FOR SELECT
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY profesionales_sucursales_insert_policy ON profesionales_sucursales
    FOR INSERT
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY profesionales_sucursales_update_policy ON profesionales_sucursales
    FOR UPDATE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY profesionales_sucursales_delete_policy ON profesionales_sucursales
    FOR DELETE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- ====================================================================
-- RLS: servicios_sucursales
-- ====================================================================
ALTER TABLE servicios_sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_sucursales FORCE ROW LEVEL SECURITY;

CREATE POLICY servicios_sucursales_select_policy ON servicios_sucursales
    FOR SELECT
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY servicios_sucursales_insert_policy ON servicios_sucursales
    FOR INSERT
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY servicios_sucursales_update_policy ON servicios_sucursales
    FOR UPDATE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY servicios_sucursales_delete_policy ON servicios_sucursales
    FOR DELETE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- ====================================================================
-- RLS: stock_sucursales
-- ====================================================================
ALTER TABLE stock_sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_sucursales FORCE ROW LEVEL SECURITY;

CREATE POLICY stock_sucursales_select_policy ON stock_sucursales
    FOR SELECT
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY stock_sucursales_insert_policy ON stock_sucursales
    FOR INSERT
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY stock_sucursales_update_policy ON stock_sucursales
    FOR UPDATE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY stock_sucursales_delete_policy ON stock_sucursales
    FOR DELETE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR sucursal_id IN (
            SELECT id FROM sucursales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- ====================================================================
-- RLS: transferencias_stock
-- ====================================================================
ALTER TABLE transferencias_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_stock FORCE ROW LEVEL SECURITY;

CREATE POLICY transferencias_stock_select_policy ON transferencias_stock
    FOR SELECT
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

CREATE POLICY transferencias_stock_insert_policy ON transferencias_stock
    FOR INSERT
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

CREATE POLICY transferencias_stock_update_policy ON transferencias_stock
    FOR UPDATE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

CREATE POLICY transferencias_stock_delete_policy ON transferencias_stock
    FOR DELETE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

-- ====================================================================
-- RLS: transferencias_stock_items
-- ====================================================================
ALTER TABLE transferencias_stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_stock_items FORCE ROW LEVEL SECURITY;

CREATE POLICY transferencias_stock_items_select_policy ON transferencias_stock_items
    FOR SELECT
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR transferencia_id IN (
            SELECT id FROM transferencias_stock
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY transferencias_stock_items_insert_policy ON transferencias_stock_items
    FOR INSERT
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR transferencia_id IN (
            SELECT id FROM transferencias_stock
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY transferencias_stock_items_update_policy ON transferencias_stock_items
    FOR UPDATE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR transferencia_id IN (
            SELECT id FROM transferencias_stock
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

CREATE POLICY transferencias_stock_items_delete_policy ON transferencias_stock_items
    FOR DELETE
    USING (
        current_setting('app.bypass_rls', true) = 'true'
        OR transferencia_id IN (
            SELECT id FROM transferencias_stock
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
    );

-- ====================================================================
-- FIN: POLITICAS RLS DE SUCURSALES
-- ====================================================================
