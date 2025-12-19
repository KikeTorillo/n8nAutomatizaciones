-- ====================================================================
-- MÓDULO PROFESIONALES: POLÍTICAS ROW LEVEL SECURITY
-- ====================================================================
-- Implementa aislamiento multi-tenant para la tabla profesionales
-- mediante Row Level Security de PostgreSQL.
-- Extraído de sql/negocio/ para modularización (Dic 2025)
-- ====================================================================

-- ====================================================================
-- 👨‍💼 RLS PARA TABLA PROFESIONALES
-- ====================================================================
-- Aislamiento por organización para gestión de personal
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en profesionales
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesionales FORCE ROW LEVEL SECURITY;

-- POLÍTICA: AISLAMIENTO POR TENANT
CREATE POLICY tenant_isolation_profesionales ON profesionales
    FOR ALL
    TO saas_app
    USING (
        -- Super admin acceso global
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O acceso a propia organización
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        -- O bypass para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Comentario de la política
COMMENT ON POLICY tenant_isolation_profesionales ON profesionales IS
'Aislamiento multi-tenant para profesionales:
- Usuario accede solo a profesionales de su organización
- Super admin tiene acceso global
- Validación de formato numérico en tenant_id (seguridad)

Crítico para: Agendamiento, asignación de citas, reportes.
Aplica a: SELECT, INSERT, UPDATE, DELETE';
