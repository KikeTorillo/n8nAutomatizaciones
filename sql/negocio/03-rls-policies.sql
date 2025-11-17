-- ====================================================================
-- MÓDULO NEGOCIO: POLÍTICAS ROW LEVEL SECURITY
-- ====================================================================
-- Implementa aislamiento multi-tenant para las tablas del modelo de negocio
-- mediante Row Level Security de PostgreSQL.
--
-- TABLAS CON RLS:
-- • profesionales - Aislamiento por organización
-- • clientes - Aislamiento con validación regex + super admin
-- • servicios - Aislamiento con bypass para sistema
-- • servicios_profesionales - Aislamiento indirecto vía JOIN
--
-- Migrado de: sql/schema/08-rls-policies.sql
-- Fecha migración: 17 Noviembre 2025
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

-- ====================================================================
-- 🧑‍💼 RLS PARA TABLA CLIENTES
-- ====================================================================
-- Aislamiento por organización para base de datos de clientes
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes FORCE ROW LEVEL SECURITY;

-- POLÍTICA 1: AISLAMIENTO POR ORGANIZACIÓN (CORREGIDO 2025-10-03)
-- Validación REGEX para prevenir SQL injection y tenant_id vacío
CREATE POLICY clientes_isolation ON clientes
    FOR ALL
    TO saas_app
    USING (
        -- Validar que tenant_id sea numérico antes de comparar
        current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
        AND organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
            0
        )
    )
    WITH CHECK (
        -- Validar que tenant_id sea numérico para escritura
        current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
        AND organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
            0
        )
    );

-- POLÍTICA 2: ACCESO SUPER ADMIN
CREATE POLICY clientes_super_admin ON clientes
    FOR ALL
    TO PUBLIC
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE email = current_user
            AND rol = 'super_admin'
        )
    );

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
-- Aislamiento DIRECTO por organizacion_id (MEJORADO - Nov 2025)
-- Anteriormente usaba JOIN indirecto, ahora usa columna directa para
-- mejor performance y seguridad.
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
-- Comentarios explicativos para todas las políticas del módulo negocio
-- ────────────────────────────────────────────────────────────────────

-- Política de profesionales (MEJORADO OCT 2025)
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
COMMENT ON POLICY tenant_isolation_profesionales ON profesionales IS
'Aislamiento multi-tenant para profesionales:
- Usuario accede solo a profesionales de su organización
- Super admin tiene acceso global
- Validación de formato numérico en tenant_id (seguridad)

Crítico para: Agendamiento, asignación de citas, reportes.
Aplica a: SELECT, INSERT, UPDATE, DELETE';

-- Política de clientes (isolation) - MEJORADO OCT 2025
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
COMMENT ON POLICY clientes_isolation ON clientes IS
'Aislamiento principal para clientes:
- Usuario accede solo a clientes de su organización
- Tenant ID validado con regex ^[0-9]+$ (previene SQL injection)
- Bloquea intentos de injection como "1 OR 1=1" o tenant_id vacío
- Bypass para funciones de sistema

Datos sensibles protegidos: teléfono, email, historial de citas.
Ver también: clientes_super_admin para acceso global.
Corregido: 2025-10-03';

-- Política de clientes (super admin) - MEJORADO OCT 2025
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
COMMENT ON POLICY clientes_super_admin ON clientes IS
'Acceso global para super_admin:
- Permite operaciones cross-tenant para soporte
- Usado en: Admin panel, reportes globales, migrations
- Auditoría completa en eventos_sistema

Permite gestión centralizada de datos para soporte y administración.';

-- Política de servicios - MEJORADO OCT 2025
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
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

-- Política de servicios profesionales (MEJORADO Nov 2025)
COMMENT ON POLICY servicios_profesionales_tenant_isolation ON servicios_profesionales IS
'Aislamiento DIRECTO por organizacion_id (SIN JOIN):
- Validación directa organizacion_id = current_tenant (más rápido)
- Organizacion_id poblado automáticamente via trigger
- Trigger valida que servicio y profesional sean de misma org
- Previene mezcla de organizaciones (seguridad multi-tenant)

MEJORA: Anteriormente usaba EXISTS + JOIN con servicios (más lento).
Ahora usa columna directa con índice para mejor performance.
Fecha: 17 Noviembre 2025';
