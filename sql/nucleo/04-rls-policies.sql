-- ====================================================================
-- MÓDULO NÚCLEO: POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ====================================================================
-- Implementación de seguridad multi-tenant a nivel de fila.
-- Políticas unificadas que manejan múltiples casos de acceso.
--
-- 🔒 POLÍTICAS IMPLEMENTADAS:
-- • usuarios: 1 política unificada para 5 casos de acceso
-- • organizaciones: Aislamiento por tenant con acceso admin
-- • planes_subscripcion: Lectura global, escritura solo super_admin
-- • subscripciones: Aislamiento por organización
-- • metricas_uso_organizacion: Aislamiento por organización
-- • historial_subscripciones: Solo lectura para organizaciones
--
-- Migrado de: sql/schema/08-rls-policies.sql y 10-subscriptions-table.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- RLS PARA TABLA USUARIOS
-- ====================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICA: usuarios_unified_access
-- ====================================================================
-- Esta es la política MÁS CRÍTICA del sistema. Maneja todos los casos
-- de acceso a usuarios en una sola política para evitar conflictos.
--
-- 💡 VENTAJAS DE POLÍTICA UNIFICADA:
-- • Evita conflictos entre políticas con USING diferentes
-- • Más fácil de debuggear (una sola fuente de verdad)
-- • Manejo consistente de casos edge (super_admin, bypass, etc.)
--
-- 🔍 5 CASOS DE ACCESO SOPORTADOS:
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY usuarios_unified_access ON usuarios
    FOR ALL                                   -- Aplica a SELECT, INSERT, UPDATE, DELETE
    TO saas_app                              -- Solo para usuario de aplicación
    USING (
        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 1: LOGIN CONTEXT (PARA AUTENTICACIÓN INICIAL)         │
        -- └─────────────────────────────────────────────────────────────┘
        -- Durante login, permitir acceso al usuario por email
        -- Variable: app.login_email = email del usuario que intenta login
        -- Uso: Autenticación inicial, antes de establecer tenant_id
        (current_setting('app.login_email', true) = email)

        OR

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 2: SUPER ADMIN (ACCESO TOTAL AL SISTEMA)              │
        -- └─────────────────────────────────────────────────────────────┘
        -- Super admins pueden gestionar usuarios de cualquier organización
        -- Variable: app.current_user_role = 'super_admin'
        -- Uso: Administración global del sistema SaaS
        (current_setting('app.current_user_role', true) = 'super_admin')

        OR

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 3: BYPASS RLS (PARA OPERACIONES DE SISTEMA)           │
        -- └─────────────────────────────────────────────────────────────┘
        -- Bypass controlado para funciones/triggers del sistema
        -- Variable: app.bypass_rls = 'true'
        -- Uso: Operaciones automáticas que requieren acceso total
        (current_setting('app.bypass_rls', true) = 'true')

        OR

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 4: SELF ACCESS (USUARIO VE SU PROPIO PERFIL)          │
        -- └─────────────────────────────────────────────────────────────┘
        -- Usuario puede ver/editar su propio perfil
        -- Variable: app.current_user_id = ID del usuario autenticado
        -- Uso: Edición de perfil, cambio de contraseña, preferencias
        (id = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::INTEGER, 0))

        OR

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 5: AISLAMIENTO MULTI-TENANT (TENANT ISOLATION)        │
        -- └─────────────────────────────────────────────────────────────┘
        -- Usuarios pueden ver otros usuarios solo de su misma organización
        -- Variables: app.current_tenant_id = ID de la organización
        -- Uso: Gestión de equipo, asignación de citas, reportes
        (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- 📝 DOCUMENTACIÓN DE POLÍTICA EN BASE DE DATOS
COMMENT ON POLICY usuarios_unified_access ON usuarios IS
'Política unificada que maneja los 5 casos de acceso: login_context, super_admin, bypass_rls, self_access y tenant_isolation. Núcleo de la seguridad multi-tenant del sistema';

-- ====================================================================
-- RLS PARA TABLA ORGANIZACIONES
-- ====================================================================

ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizaciones FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICA: tenant_isolation_organizaciones
-- ====================================================================
-- Controla el acceso a los datos de organizaciones basado en el contexto
-- del usuario autenticado y su nivel de permisos.
--
-- 📋 3 CASOS DE ACCESO:
-- • Super admin: Acceso total a todas las organizaciones
-- • Usuario de organización: Solo acceso a su propia organización
-- • Funciones de sistema: Bypass controlado para operaciones automáticas
-- ────────────────────────────────────────────────────────────────────
CREATE POLICY tenant_isolation_organizaciones ON organizaciones
    FOR ALL                                     -- Aplica a todas las operaciones
    TO saas_app                                -- Solo para usuario de aplicación
    USING (
        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 1: SUPER ADMIN (ACCESO GLOBAL)                        │
        -- └─────────────────────────────────────────────────────────────┘
        -- Super admin puede gestionar todas las organizaciones del sistema
        current_setting('app.current_user_role', true) = 'super_admin'

        OR

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 2: BYPASS RLS (OPERACIONES AUTOMÁTICAS)               │
        -- └─────────────────────────────────────────────────────────────┘
        -- Bypass para funciones que necesitan acceso cross-tenant
        current_setting('app.bypass_rls', true) = 'true'

        OR

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 3: AISLAMIENTO MULTI-TENANT (TENANT ISOLATION)        │
        -- └─────────────────────────────────────────────────────────────┘
        -- Usuario solo accede a su propia organización
        (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    )
    WITH CHECK (
        -- RESTRICCIONES PARA ESCRITURA (INSERT/UPDATE)
        -- ═══════════════════════════════════════════════════════════════
        -- Solo super admin puede crear/modificar organizaciones
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O bypass está activado (para proceso de registro automático)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- 📝 DOCUMENTACIÓN DE POLÍTICA
COMMENT ON POLICY tenant_isolation_organizaciones ON organizaciones IS
'Política de aislamiento multi-tenant. Super admin acceso global, usuarios regulares solo su organización';

-- ====================================================================
-- RLS PARA TABLA PLANES_SUBSCRIPCION
-- ====================================================================

ALTER TABLE planes_subscripcion ENABLE ROW LEVEL SECURITY;

-- Política para lectura de planes (todos pueden ver planes activos)
CREATE POLICY planes_subscripcion_select ON planes_subscripcion
    FOR SELECT
    TO saas_app
    USING (activo = true OR current_setting('app.bypass_rls', true) = 'true');

-- Política para modificación de planes (solo super_admin)
CREATE POLICY planes_subscripcion_modify ON planes_subscripcion
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- 📝 DOCUMENTACIÓN DE POLÍTICAS
COMMENT ON POLICY planes_subscripcion_select ON planes_subscripcion IS
'Lectura de planes activos para todos los usuarios.
Permite visualizar catálogo de planes en frontend.
Solo planes con activo=true son visibles.';

COMMENT ON POLICY planes_subscripcion_modify ON planes_subscripcion IS
'Solo super_admin puede crear/modificar/eliminar planes de subscripción.
Operaciones críticas: Pricing, límites, características de planes.';

-- ====================================================================
-- RLS PARA TABLA METRICAS_USO_ORGANIZACION
-- ====================================================================

ALTER TABLE metricas_uso_organizacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY metricas_uso_access ON metricas_uso_organizacion
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

COMMENT ON POLICY metricas_uso_access ON metricas_uso_organizacion IS
'Acceso a métricas de uso de organización:
- Usuario ve métricas de su organización
- Super admin ve todas las métricas
- Usado para: Dashboard, límites de plan, alertas de cuota.';

-- ====================================================================
-- RLS PARA TABLA SUBSCRIPCIONES
-- ====================================================================

ALTER TABLE subscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscripciones_unified_access ON subscripciones
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

COMMENT ON POLICY subscripciones_unified_access ON subscripciones IS
'Acceso a subscripciones por organización:
- Usuario accede solo a subscripción de su organización
- Super admin tiene acceso global
- Validación de formato numérico en tenant_id (regex: ^[0-9]+$)

Crítico para: Facturación, límites de uso, upgrades/downgrades.';

-- ====================================================================
-- RLS PARA TABLA HISTORIAL_SUBSCRIPCIONES
-- ====================================================================

ALTER TABLE historial_subscripciones ENABLE ROW LEVEL SECURITY;

-- Política de lectura
CREATE POLICY historial_subscripciones_access ON historial_subscripciones
    FOR SELECT
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        OR (
            current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- Política de escritura (solo desde triggers con bypass o super_admin)
CREATE POLICY historial_subscripciones_insert ON historial_subscripciones
    FOR INSERT
    TO saas_app
    WITH CHECK (
        current_setting('app.bypass_rls', true) = 'true'
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

COMMENT ON POLICY historial_subscripciones_access ON historial_subscripciones IS
'Acceso de solo lectura al historial de subscripciones:
- Usuario ve historial de su organización
- Super admin ve todo el historial
- Usado para auditoría y reportes de facturación';
