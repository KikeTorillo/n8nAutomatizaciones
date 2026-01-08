-- =====================================================
-- MÓDULO INCAPACIDADES - Políticas RLS
-- Enero 2026
-- =====================================================
-- Row Level Security para aislamiento multi-tenant
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE incapacidades ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICA PRINCIPAL: Aislamiento por tenant
-- =====================================================
-- Permite acceso solo a registros de la organización actual
-- o bypass completo si app.bypass_rls = 'true'
-- =====================================================
CREATE POLICY incapacidades_tenant_policy ON incapacidades
    FOR ALL
    USING (
        organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::integer,
            0
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON POLICY incapacidades_tenant_policy ON incapacidades IS
'Política RLS que garantiza aislamiento multi-tenant. Solo permite acceso
a incapacidades de la organización configurada en app.current_tenant_id.';
