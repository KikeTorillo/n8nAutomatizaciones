-- ====================================================================
-- 🛡️ MÓDULO BLOQUEOS - ROW LEVEL SECURITY (RLS)
-- ====================================================================
--
-- PROPÓSITO:
-- Políticas de seguridad a nivel de fila para garantizar aislamiento
-- multi-tenant en la tabla bloqueos_horarios.
--
-- COMPONENTES:
-- • 2 políticas RLS
--
-- CARACTERÍSTICAS:
-- ✅ Aislamiento multi-tenant por organizacion_id
-- ✅ Acceso total para super_admin
-- ✅ Bypass para funciones del sistema
-- ✅ Validación en INSERT/UPDATE/DELETE
--
-- SEGURIDAD:
-- • Usuarios solo acceden a bloqueos de su organización
-- • Super admin tiene visibilidad global
-- • Funciones del sistema pueden operar sin restricciones
--
-- ORDEN DE CARGA: #8 (después de índices)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN LA TABLA
-- ====================================================================

ALTER TABLE bloqueos_horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueos_horarios FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICA 1: AISLAMIENTO MULTI-TENANT
-- ====================================================================
-- Garantiza que cada organización solo acceda a sus propios bloqueos
-- ────────────────────────────────────────────────────────────────────

CREATE POLICY bloqueos_horarios_tenant_isolation ON bloqueos_horarios
    TO saas_app
    USING (
        -- Super admin ve todo
        (current_setting('app.current_user_role', true) = 'super_admin') OR
        -- Usuarios normales solo ven su organización
        (organizacion_id = COALESCE(
            (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
        )) OR
        -- Bypass RLS para funciones del sistema
        (current_setting('app.bypass_rls', true) = 'true')
    )
    WITH CHECK (
        -- Solo super_admin puede crear sin restricciones
        (current_setting('app.current_user_role', true) = 'super_admin') OR
        -- Usuarios normales solo pueden crear en su organización
        (organizacion_id = COALESCE(
            (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
        )) OR
        -- Bypass para funciones del sistema
        (current_setting('app.bypass_rls', true) = 'true')
    );

COMMENT ON POLICY bloqueos_horarios_tenant_isolation ON bloqueos_horarios IS
'Aislamiento multi-tenant para bloqueos de horarios:
- Usuario accede solo a bloqueos de su organización
- Super admin tiene acceso global
- Bypass para funciones automáticas

Tipos de bloqueo: vacaciones, feriados, capacitación, emergencia, mantenimiento.';

-- ====================================================================
-- POLÍTICA 2: BYPASS DEL SISTEMA
-- ====================================================================
-- Permite a funciones del sistema operar sin restricciones RLS
-- Usado por triggers y funciones automáticas
-- ────────────────────────────────────────────────────────────────────

CREATE POLICY bloqueos_horarios_system_bypass ON bloqueos_horarios
    TO saas_app
    USING (current_setting('app.bypass_rls', true) = 'true');

COMMENT ON POLICY bloqueos_horarios_system_bypass ON bloqueos_horarios IS
'Política de bypass para funciones del sistema. Permite operaciones sin restricciones RLS cuando app.bypass_rls=true.';

-- ====================================================================
-- 📊 RESUMEN DE POLÍTICAS RLS
-- ====================================================================
-- Total: 2 políticas
--
-- Cobertura:
-- • SELECT: ✅ Política tenant_isolation + system_bypass
-- • INSERT: ✅ WITH CHECK en tenant_isolation
-- • UPDATE: ✅ USING + WITH CHECK en tenant_isolation
-- • DELETE: ✅ USING en tenant_isolation
--
-- Contexto requerido:
-- • app.current_tenant_id: ID de la organización del usuario
-- • app.current_user_role: Rol del usuario (super_admin, admin, etc.)
-- • app.bypass_rls: Flag para bypass del sistema (opcional)
--
-- Configuración:
-- SET LOCAL app.current_tenant_id = '123';
-- SET LOCAL app.current_user_role = 'admin';
-- SET LOCAL app.bypass_rls = 'true';  -- Solo para funciones del sistema
-- ====================================================================
