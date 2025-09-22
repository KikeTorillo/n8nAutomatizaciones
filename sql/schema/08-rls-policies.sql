-- ====================================================================
-- 🛡️ POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ====================================================================
--
-- Este archivo implementa el sistema de seguridad multi-tenant mediante
-- Row Level Security de PostgreSQL, garantizando aislamiento completo.
--
-- 🔒 POLÍTICAS IMPLEMENTADAS:
-- • usuarios: 1 política unificada para 5 casos de acceso
-- • organizaciones: Aislamiento por tenant con acceso admin
-- • plantillas_servicios: Lectura global, escritura super_admin
-- • profesionales: Aislamiento por organización
-- • clientes: Aislamiento por organización + super_admin
-- • servicios: Aislamiento por organización con bypass
-- • servicios_profesionales: Aislamiento indirecto vía joins
-- • citas: Aislamiento por organización con bypass
-- • horarios_disponibilidad: Aislamiento por organización con bypass
--
-- 🔄 ORDEN DE EJECUCIÓN: #8 (Después de indexes)
-- 🎯 SEGURIDAD: Aislamiento automático por organizacion_id
-- ====================================================================

-- ====================================================================
-- 👤 RLS PARA TABLA USUARIOS
-- ====================================================================
-- Política unificada que maneja todos los casos de acceso a usuarios
-- ────────────────────────────────────────────────────────────────────

-- 🔐 ACTIVAR RLS EN TABLA USUARIOS
-- Una vez habilitado, TODAS las consultas a usuarios serán filtradas
-- automáticamente por las políticas definidas a continuación.
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 🎯 POLÍTICA UNIFICADA: USUARIOS_UNIFIED_ACCESS
-- ====================================================================
-- Esta es la política MÁS CRÍTICA del sistema. Maneja todos los casos
-- de acceso a usuarios en una sola política para evitar conflictos.
--
-- 💡 VENTAJAS DE POLÍTICA UNIFICADA:
-- • Elimina conflictos entre múltiples políticas activas
-- • Lógica centralizada y más fácil de mantener
-- • Performance optimizada (una sola evaluación)
-- • Debugging simplificado
--
-- 🔍 5 CASOS DE ACCESO SOPORTADOS:
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY usuarios_unified_access ON usuarios
    FOR ALL                                   -- Aplica a SELECT, INSERT, UPDATE, DELETE
    TO saas_app                              -- Solo para usuario de aplicación
    USING (
        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 1: CONTEXTO DE LOGIN (AUTENTICACIÓN INICIAL)          │
        -- └─────────────────────────────────────────────────────────────┘
        -- Permite buscar usuario por email durante el proceso de login
        -- Variable: app.current_user_role = 'login_context'
        -- Uso: Validar credenciales antes de establecer sesión
        current_setting('app.current_user_role', true) = 'login_context'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 2: SUPER ADMIN (ACCESO TOTAL AL SISTEMA)              │
        -- └─────────────────────────────────────────────────────────────┘
        -- Super admins pueden gestionar usuarios de cualquier organización
        -- Variable: app.current_user_role = 'super_admin'
        -- Uso: Administración global del sistema SaaS
        OR current_setting('app.current_user_role', true) = 'super_admin'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 3: BYPASS PARA FUNCIONES DE SISTEMA                   │
        -- └─────────────────────────────────────────────────────────────┘
        -- Funciones PL/pgSQL como registrar_intento_login() necesitan
        -- acceso directo sin restricciones para operaciones críticas
        -- Variable: app.bypass_rls = 'true'
        -- Uso: Funciones de mantenimiento y operaciones automáticas
        OR current_setting('app.bypass_rls', true) = 'true'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 4: ACCESO PROPIO (SELF-ACCESS)                        │
        -- └─────────────────────────────────────────────────────────────┘
        -- Cada usuario puede ver y editar su propio registro
        -- Variable: app.current_user_id = ID del usuario autenticado
        -- Uso: Perfil personal, cambio de configuraciones
        OR id = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::INTEGER, 0)

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 5: AISLAMIENTO MULTI-TENANT (TENANT ISOLATION)        │
        -- └─────────────────────────────────────────────────────────────┘
        -- Usuarios pueden ver otros usuarios solo de su misma organización
        -- Variables: app.current_tenant_id = ID de la organización
        -- Uso: Gestión de equipo, asignación de citas, reportes
        OR (
            organizacion_id IS NOT NULL                                    -- Evita NULL para super_admin
            AND current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' -- Validar formato numérico
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- 📝 DOCUMENTACIÓN DE POLÍTICA EN BASE DE DATOS
COMMENT ON POLICY usuarios_unified_access ON usuarios IS
'Política unificada que maneja los 5 casos de acceso: login_context, super_admin, bypass_rls, self_access y tenant_isolation. Núcleo de la seguridad multi-tenant del sistema';

-- ====================================================================
-- 🏢 RLS PARA TABLA ORGANIZACIONES
-- ====================================================================
-- Implementa aislamiento multi-tenant para la tabla de organizaciones
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en organizaciones
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 🎯 POLÍTICA: TENANT_ISOLATION_ORGANIZACIONES
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

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 2: ACCESO A PROPIA ORGANIZACIÓN                       │
        -- └─────────────────────────────────────────────────────────────┘
        -- Usuario solo puede acceder a su organización (tenant isolation)
        OR id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 3: BYPASS PARA FUNCIONES DE SISTEMA                   │
        -- └─────────────────────────────────────────────────────────────┘
        -- Funciones de registro, onboarding y mantenimiento automático
        OR current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        -- ═══════════════════════════════════════════════════════════════
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
-- 🛍️ RLS PARA TABLA PLANTILLAS_SERVICIOS
-- ====================================================================
-- Tabla global compartida con lectura pública y escritura restringida
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en plantillas_servicios
ALTER TABLE plantillas_servicios ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: LECTURA PÚBLICA
-- Todos los usuarios autenticados pueden leer plantillas activas
-- Esta tabla es compartida globalmente, no es multi-tenant
CREATE POLICY plantillas_public_read ON plantillas_servicios
    FOR SELECT
    TO saas_app
    USING (
        -- Solo plantillas activas son visibles
        activo = TRUE
        -- Sin restricción de tenant - las plantillas son globales
    );

-- POLÍTICA 2: ESCRITURA SOLO SUPER ADMIN (INSERT)
CREATE POLICY plantillas_admin_insert ON plantillas_servicios
    FOR INSERT
    TO saas_app
    WITH CHECK (
        -- Solo super admin puede insertar
        current_setting('app.current_user_role', true) = 'super_admin'
        -- Asegurar que solo se crean plantillas oficiales por super admin
        AND (es_template_oficial = TRUE OR current_setting('app.current_user_role', true) = 'super_admin')
    );

-- POLÍTICA 3: ESCRITURA SOLO SUPER ADMIN (UPDATE)
CREATE POLICY plantillas_admin_update ON plantillas_servicios
    FOR UPDATE
    TO saas_app
    USING (
        -- Solo super admin puede modificar
        current_setting('app.current_user_role', true) = 'super_admin'
    )
    WITH CHECK (
        -- Solo super admin puede modificar
        current_setting('app.current_user_role', true) = 'super_admin'
        AND (es_template_oficial = TRUE OR current_setting('app.current_user_role', true) = 'super_admin')
    );

-- POLÍTICA 4: ESCRITURA SOLO SUPER ADMIN (DELETE)
CREATE POLICY plantillas_admin_delete ON plantillas_servicios
    FOR DELETE
    TO saas_app
    USING (
        -- Solo super admin puede eliminar
        current_setting('app.current_user_role', true) = 'super_admin'
    );

-- POLÍTICA 5: BYPASS PARA FUNCIONES DE SISTEMA
CREATE POLICY plantillas_system_bypass ON plantillas_servicios
    FOR ALL
    TO saas_app
    USING (
        -- Bypass para funciones de sistema (como inicialización de datos)
        current_setting('app.bypass_rls', true) = 'true'
    );

-- 📝 DOCUMENTACIÓN DE POLÍTICAS
COMMENT ON POLICY plantillas_public_read ON plantillas_servicios IS
'Permite lectura de plantillas activas a todos los usuarios autenticados - tabla global sin restricción tenant';

COMMENT ON POLICY plantillas_admin_insert ON plantillas_servicios IS
'Solo super_admin puede insertar plantillas - control centralizado de templates oficiales';

COMMENT ON POLICY plantillas_admin_update ON plantillas_servicios IS
'Solo super_admin puede actualizar plantillas - control centralizado de templates oficiales';

-- ====================================================================
-- 👨‍💼 RLS PARA TABLA PROFESIONALES
-- ====================================================================
-- Aislamiento por organización para gestión de personal
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en profesionales
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;

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

-- POLÍTICA 1: AISLAMIENTO POR ORGANIZACIÓN
CREATE POLICY clientes_isolation ON clientes
    USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

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
-- Aislamiento indirecto via joins con organizaciones
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en servicios_profesionales
ALTER TABLE servicios_profesionales ENABLE ROW LEVEL SECURITY;

-- POLÍTICA: AISLAMIENTO VIA JOINS
CREATE POLICY servicios_profesionales_tenant_isolation ON servicios_profesionales
    FOR ALL
    TO saas_app
    USING (
        -- Super admin acceso global
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O acceso via organización del servicio/profesional
        OR EXISTS (
            SELECT 1 FROM servicios s
            WHERE s.id = servicio_id
            AND s.organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
        -- O bypass para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 📅 RLS PARA TABLA CITAS
-- ====================================================================
-- Aislamiento por organización para gestión de citas
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en citas
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: AISLAMIENTO POR TENANT
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

-- POLÍTICA 2: BYPASS PARA FUNCIONES DE SISTEMA
CREATE POLICY citas_system_bypass ON citas
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- ⏰ RLS PARA TABLA HORARIOS_DISPONIBILIDAD
-- ====================================================================
-- Aislamiento por organización para gestión de disponibilidad
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en horarios_disponibilidad
ALTER TABLE horarios_disponibilidad ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: AISLAMIENTO POR TENANT
CREATE POLICY horarios_tenant_isolation ON horarios_disponibilidad
    FOR ALL
    TO saas_app
    USING (
        -- Super admin acceso global
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O acceso a horarios de propia organización
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        -- O bypass para funciones de sistema
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- POLÍTICA 2: BYPASS PARA FUNCIONES DE SISTEMA
CREATE POLICY horarios_system_bypass ON horarios_disponibilidad
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    );
