-- ====================================================================
-- MÓDULO CLIENTES: POLÍTICAS ROW LEVEL SECURITY
-- ====================================================================
-- Implementa aislamiento multi-tenant para la tabla clientes
-- mediante Row Level Security de PostgreSQL.
-- Extraído de sql/negocio/ para modularización (Dic 2025)
-- ====================================================================

-- ====================================================================
-- 🧑‍💼 RLS PARA TABLA CLIENTES
-- ====================================================================
-- Aislamiento por organización para base de datos de clientes
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes FORCE ROW LEVEL SECURITY;

-- POLÍTICA 1: AISLAMIENTO POR ORGANIZACIÓN
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

-- POLÍTICA 3: BYPASS PARA FUNCIONES DE SISTEMA
-- Necesario para jobs como recordatorios que cruzan organizaciones
CREATE POLICY clientes_system_bypass ON clientes
    FOR ALL
    TO saas_app
    USING (current_setting('app.bypass_rls', true) = 'true')
    WITH CHECK (current_setting('app.bypass_rls', true) = 'true');

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================

-- Política de clientes (isolation)
COMMENT ON POLICY clientes_isolation ON clientes IS
'Aislamiento principal para clientes:
- Usuario accede solo a clientes de su organización
- Tenant ID validado con regex ^[0-9]+$ (previene SQL injection)
- Bloquea intentos de injection como "1 OR 1=1" o tenant_id vacío
- Bypass para funciones de sistema

Datos sensibles protegidos: teléfono, email, historial de citas.
Ver también: clientes_super_admin para acceso global.';

-- Política de clientes (super admin)
COMMENT ON POLICY clientes_super_admin ON clientes IS
'Acceso global para super_admin:
- Permite operaciones cross-tenant para soporte
- Usado en: Admin panel, reportes globales, migrations
- Auditoría completa en eventos_sistema

Permite gestión centralizada de datos para soporte y administración.';

-- Política de bypass
COMMENT ON POLICY clientes_system_bypass ON clientes IS
'Bypass RLS para funciones de sistema que requieren acceso cross-tenant.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);
Casos de uso: Recordatorios, notificaciones, procesos batch.';
