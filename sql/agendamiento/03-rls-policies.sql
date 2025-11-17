-- ====================================================================
-- 📅 MÓDULO AGENDAMIENTO - POLÍTICAS RLS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: agendamiento
--
-- DESCRIPCIÓN:
-- Políticas de Row Level Security para aislamiento multi-tenant en horarios.
-- Garantiza que cada organización solo acceda a sus propios horarios.
--
-- POLÍTICAS:
-- • horarios_profesionales_unified_access: Acceso multi-tenant unificado
--
-- ROLES SOPORTADOS:
-- • super_admin: Acceso global sin restricciones
-- • admin/propietario: Acceso completo a su organización
-- • empleado: Acceso completo a su organización
-- • bot: Acceso de lectura para su organización
--
-- ====================================================================

-- ====================================================================
-- 🔒 HABILITAR RLS EN TABLAS
-- ====================================================================

ALTER TABLE horarios_profesionales ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 🛡️ POLÍTICA UNIFICADA PARA HORARIOS_PROFESIONALES
-- ====================================================================
-- Política única que maneja todos los casos de acceso multi-tenant
-- ────────────────────────────────────────────────────────────────────

CREATE POLICY horarios_profesionales_unified_access ON horarios_profesionales
    FOR ALL
    TO saas_app
    USING (
        -- Super admin tiene acceso total
        current_setting('app.current_user_role', true) = 'super_admin'
        -- Bypass RLS para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
        -- Acceso por organización para usuarios regulares
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- ====================================================================
-- 📝 COMENTARIOS DE POLÍTICAS
-- ====================================================================

COMMENT ON POLICY horarios_profesionales_unified_access ON horarios_profesionales IS
'Acceso a configuración de horarios de profesionales:
- Usuario accede solo a horarios de su organización
- Super admin tiene acceso global
- Bypass RLS para funciones de sistema (triggers, cálculos automáticos)
- Validación de formato numérico en tenant_id

Usado para: Configuración de disponibilidad semanal, breaks, horarios premium.
Acceso: admin/propietario (CRUD completo), empleado (CRUD), bot (READ)';
