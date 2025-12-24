-- ====================================================================
-- MÓDULO PRECIOS: POLÍTICAS RLS
-- ====================================================================
-- Políticas de Row Level Security para aislamiento multi-tenant
--
-- Fase 5 - Diciembre 2025
-- ====================================================================

-- ====================================================================
-- RLS: listas_precios
-- ====================================================================

ALTER TABLE listas_precios ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento por organización
CREATE POLICY listas_precios_tenant_isolation ON listas_precios
    FOR ALL TO saas_app
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- RLS: listas_precios_items
-- ====================================================================
-- Los items heredan el tenant de la lista padre

ALTER TABLE listas_precios_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY listas_items_tenant_isolation ON listas_precios_items
    FOR ALL TO saas_app
    USING (
        lista_precio_id IN (
            SELECT id FROM listas_precios
            WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        lista_precio_id IN (
            SELECT id FROM listas_precios
            WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- GRANT PERMISSIONS
-- ====================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON listas_precios TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON listas_precios_items TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE listas_precios_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE listas_precios_items_id_seq TO saas_app;

-- ====================================================================
-- FIN: POLÍTICAS RLS
-- ====================================================================
