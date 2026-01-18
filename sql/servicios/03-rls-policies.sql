-- ====================================================================
-- MÓDULO NEGOCIO: POLÍTICAS ROW LEVEL SECURITY
-- ====================================================================
-- Implementa aislamiento multi-tenant para las tablas de servicios.
-- Refactorizado Dic 2025: políticas de profesionales y clientes movidas a sus módulos.
-- ====================================================================

-- ====================================================================
-- 🎯 RLS PARA TABLA SERVICIOS
-- ====================================================================
-- Aislamiento por organización con bypass para sistema
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en servicios
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios FORCE ROW LEVEL SECURITY;

-- POLÍTICA 1: AISLAMIENTO POR TENANT
CREATE POLICY servicios_tenant_isolation ON servicios
    FOR ALL
    TO saas_app
    USING (
        -- Super admin acceso global
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O acceso a servicios de propia organización
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        -- O bypass para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- POLÍTICA 2: BYPASS PARA FUNCIONES DE SISTEMA
CREATE POLICY servicios_system_bypass ON servicios
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 🔗 RLS PARA TABLA SERVICIOS_PROFESIONALES
-- ====================================================================
-- Aislamiento DIRECTO por organizacion_id
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en servicios_profesionales
ALTER TABLE servicios_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_profesionales FORCE ROW LEVEL SECURITY;

-- POLÍTICA: AISLAMIENTO DIRECTO POR ORGANIZACION_ID
CREATE POLICY servicios_profesionales_tenant_isolation ON servicios_profesionales
    FOR ALL
    TO saas_app
    USING (
        -- Super admin acceso global
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O acceso directo por organizacion_id (SIN JOIN, más rápido)
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        -- O bypass para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================

-- Política de servicios
COMMENT ON POLICY servicios_tenant_isolation ON servicios IS
'Acceso a catálogo de servicios por organización:
- Usuario accede solo a servicios de su organización
- Super admin gestiona servicios globales
- Bypass para importación masiva de plantillas

Usado en: Catálogo de servicios, agendamiento, facturación.';

-- Política de servicios (bypass)
COMMENT ON POLICY servicios_system_bypass ON servicios IS
'Bypass RLS para funciones de sistema que requieren acceso directo a servicios.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);
Casos de uso: Triggers, funciones de migración, procesos batch.';

-- Política de servicios profesionales
COMMENT ON POLICY servicios_profesionales_tenant_isolation ON servicios_profesionales IS
'Aislamiento DIRECTO por organizacion_id (SIN JOIN):
- Validación directa organizacion_id = current_tenant (más rápido)
- Organizacion_id poblado automáticamente via trigger
- Trigger valida que servicio y profesional sean de misma org
- Previene mezcla de organizaciones (seguridad multi-tenant)';
