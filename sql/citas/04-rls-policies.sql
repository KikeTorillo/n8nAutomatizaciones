-- ====================================================================
-- 📅 MÓDULO CITAS - POLÍTICAS RLS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: citas
--
-- DESCRIPCIÓN:
-- Políticas de Row Level Security para aislamiento multi-tenant en citas.
-- Garantiza que cada organización solo acceda a sus propias citas.
--
-- POLÍTICAS:
-- • citas_tenant_isolation: Aislamiento principal por organización
-- • citas_system_bypass: Bypass para funciones de sistema
-- • tenant_isolation_citas_servicios: Aislamiento indirecto vía JOIN
--
-- ROLES SOPORTADOS:
-- • super_admin: Acceso global sin restricciones
-- • admin/propietario: Acceso completo a su organización
-- • empleado: Acceso completo a su organización
-- • bot: Acceso de lectura/escritura para su organización
--
-- ====================================================================

-- ====================================================================
-- 🔒 HABILITAR RLS EN TABLA CITAS
-- ====================================================================

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- 🛡️ POLÍTICA 1: AISLAMIENTO POR TENANT (CITAS)
-- ====================================================================
-- Política principal que maneja el aislamiento multi-tenant
-- ────────────────────────────────────────────────────────────────────

CREATE POLICY citas_tenant_isolation ON citas
    FOR ALL
    TO saas_app
    USING (
        -- Super admin acceso global
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O acceso a citas de propia organización
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        -- O bypass para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 🛡️ POLÍTICA 2: BYPASS PARA FUNCIONES DE SISTEMA (CITAS)
-- ====================================================================
-- Permite a triggers y funciones automáticas trabajar sin restricciones
-- ────────────────────────────────────────────────────────────────────

CREATE POLICY citas_system_bypass ON citas
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 🔒 HABILITAR RLS EN TABLA CITAS_SERVICIOS
-- ====================================================================

ALTER TABLE citas_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas_servicios FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- 🛡️ POLÍTICA: AISLAMIENTO INDIRECTO (CITAS_SERVICIOS)
-- ====================================================================
-- Aislamiento multi-tenant mediante JOIN con tabla citas
-- ────────────────────────────────────────────────────────────────────

CREATE POLICY tenant_isolation_citas_servicios ON citas_servicios
    FOR ALL
    TO saas_app
    USING (
        -- 🔓 BYPASS: Funciones de sistema (triggers, migraciones)
        current_setting('app.bypass_rls', true) = 'true'

        -- 🏢 TENANT ISOLATION: Acceso solo a servicios de citas de la organización
        OR EXISTS (
            SELECT 1 FROM citas c
            WHERE c.id = citas_servicios.cita_id
            AND c.organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- ====================================================================
-- 📝 COMENTARIOS DE POLÍTICAS
-- ====================================================================

COMMENT ON POLICY citas_tenant_isolation ON citas IS
'Acceso a citas por organización (tabla crítica):
- Usuario accede solo a citas de su organización
- Validación estricta de tenant_id
- Super admin tiene acceso global para soporte
- Bypass para: Recordatorios automáticos, reportes de métricas, triggers

Datos protegidos: Información de cliente, historial de servicios
Crítico para: Agenda, reportes, facturación, métricas
Acceso: admin/propietario (CRUD completo), empleado (CRUD), bot (CRUD)';

COMMENT ON POLICY citas_system_bypass ON citas IS
'Bypass RLS para funciones de sistema que requieren acceso directo a citas.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);
Casos de uso: Triggers, funciones de migración, procesos batch, recordatorios automáticos.';

COMMENT ON POLICY tenant_isolation_citas_servicios ON citas_servicios IS
'Aislamiento multi-tenant mediante JOIN indirecto con tabla citas.
Verifica que la cita asociada pertenezca a la organización del usuario.
Performance: Usa índice idx_citas_servicios_cita_id (< 1ms overhead).
Agregado: 2025-10-26 - Feature múltiples servicios por cita';
