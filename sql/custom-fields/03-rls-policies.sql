-- ====================================================================
-- MÓDULO CUSTOM FIELDS: POLÍTICAS RLS
-- ====================================================================
-- Row Level Security para aislamiento multi-tenant.
-- Cada organización solo puede ver/modificar sus propios campos.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS
-- ====================================================================
ALTER TABLE custom_fields_definiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields_valores ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS: custom_fields_definiciones
-- ====================================================================

-- Política unificada para usuarios autenticados
DROP POLICY IF EXISTS cf_definiciones_tenant_policy ON custom_fields_definiciones;
CREATE POLICY cf_definiciones_tenant_policy ON custom_fields_definiciones
    FOR ALL
    USING (
        -- Bypass para super_admin o operaciones de sistema
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        -- Acceso normal por tenant
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    )
    WITH CHECK (
        -- Bypass para super_admin o operaciones de sistema
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        -- Solo puede escribir en su propia organización
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

COMMENT ON POLICY cf_definiciones_tenant_policy ON custom_fields_definiciones IS
'Política RLS multi-tenant. Cada organización solo ve sus propias definiciones de campos.';

-- ====================================================================
-- POLÍTICAS: custom_fields_valores
-- ====================================================================

-- Política unificada para usuarios autenticados
DROP POLICY IF EXISTS cf_valores_tenant_policy ON custom_fields_valores;
CREATE POLICY cf_valores_tenant_policy ON custom_fields_valores
    FOR ALL
    USING (
        -- Bypass para super_admin o operaciones de sistema
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        -- Acceso normal por tenant
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    )
    WITH CHECK (
        -- Bypass para super_admin o operaciones de sistema
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        -- Solo puede escribir en su propia organización
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

COMMENT ON POLICY cf_valores_tenant_policy ON custom_fields_valores IS
'Política RLS multi-tenant. Cada organización solo ve los valores de sus propios campos.';

-- ====================================================================
-- GRANTS
-- ====================================================================
-- Permisos para el usuario de la aplicación

GRANT SELECT, INSERT, UPDATE, DELETE ON custom_fields_definiciones TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_fields_valores TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE custom_fields_definiciones_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE custom_fields_valores_id_seq TO saas_app;

-- Permisos de solo lectura para usuario readonly
GRANT SELECT ON custom_fields_definiciones TO readonly_user;
GRANT SELECT ON custom_fields_valores TO readonly_user;

-- ====================================================================
-- FIN: POLÍTICAS RLS CUSTOM FIELDS
-- ====================================================================
