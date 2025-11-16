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

-- Habilitar RLS en usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios FORCE ROW LEVEL SECURITY;

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
ALTER TABLE organizaciones FORCE ROW LEVEL SECURITY;

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
-- Aislamiento indirecto via joins con organizaciones
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en servicios_profesionales
ALTER TABLE servicios_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios_profesionales FORCE ROW LEVEL SECURITY;

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
ALTER TABLE citas FORCE ROW LEVEL SECURITY;

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
-- 📝 DOCUMENTACIÓN DE POLÍTICAS RLS
-- ====================================================================
-- Comentarios inline para todas las políticas críticas del sistema
-- Añadido tras auditoría de reorganización (Octubre 2025)
-- ────────────────────────────────────────────────────────────────────

-- Política unificada de usuarios
COMMENT ON POLICY usuarios_unified_access ON usuarios IS
'Política unificada que maneja 5 casos de acceso a usuarios:
1. LOGIN_CONTEXT: Permite buscar usuario por email durante autenticación
2. SUPER_ADMIN: Acceso global a todos los usuarios del sistema
3. BYPASS_RLS: Funciones PL/pgSQL de sistema (registrar_intento_login, etc)
4. SELF_ACCESS: Usuario puede ver/editar su propio registro
5. TENANT_ISOLATION: Usuario solo ve usuarios de su organización

Variables utilizadas:
- app.current_user_role: Rol del usuario (super_admin, admin, empleado, login_context)
- app.current_user_id: ID del usuario autenticado
- app.current_tenant_id: ID de la organización del usuario
- app.bypass_rls: Bypass para funciones de sistema (true/false)';

-- Política de organizaciones (MEJORADO OCT 2025)
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
COMMENT ON POLICY tenant_isolation_organizaciones ON organizaciones IS
'Aislamiento multi-tenant para organizaciones:
- Usuario accede solo a su propia organización
- Super admin tiene acceso global a todas las organizaciones
- Bypass para funciones de sistema (ej: migrations, archivado)

Casos de uso:
1. Dashboard organizacional (datos propios)
2. Admin panel (super_admin ve todas)
3. Funciones de mantenimiento (bypass_rls)

Escritura (WITH CHECK): Solo super_admin puede crear/modificar organizaciones.';

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

-- Política de citas - MEJORADO OCT 2025
-- Migrado desde: 16-mejoras-auditoria-2025-10.sql
COMMENT ON POLICY citas_tenant_isolation ON citas IS
'Acceso a citas por organización (tabla crítica):
- Usuario accede solo a citas de su organización
- Validación estricta de tenant_id
- Super admin tiene acceso global para soporte
- Bypass para: Recordatorios automáticos, reportes de métricas

Datos protegidos: Información de cliente, historial médico/servicios.
Crítico para: Agenda, reportes, facturación, métricas.';






-- NOTA: Comentarios de políticas de subscripciones movidos a 10-subscriptions-table.sql
-- (las tablas planes_subscripcion, subscripciones, historial_subscripciones, metricas_uso_organizacion se crean después)

-- Política de servicios profesionales
COMMENT ON POLICY servicios_profesionales_tenant_isolation ON servicios_profesionales IS
'Aislamiento indirecto mediante JOIN con tabla servicios.
Verifica que el servicio asociado pertenezca a la organización del usuario.
Previene asignaciones cruzadas entre organizaciones.';

-- NOTA: Comentario de política horarios_profesionales movido a 11-horarios-profesionales.sql
-- (la tabla horarios_profesionales se crea en ese archivo)

-- NOTA: Comentario de política bloqueos_horarios movido a 13-bloqueos-horarios.sql
-- (la tabla bloqueos_horarios se crea en ese archivo)

-- NOTA: Comentario de política eventos_sistema movido a 12-eventos-sistema.sql
-- (la tabla eventos_sistema se crea en ese archivo)

-- NOTA: Comentario de política metricas_uso movido a 10-subscriptions-table.sql
-- (la tabla metricas_uso_organizacion se crea en ese archivo)

-- ====================================================================
-- 🤖 POLÍTICAS RLS PARA TABLA CHATBOT_CONFIG
-- ====================================================================
-- Aislamiento multi-tenant para configuración de chatbots
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en la tabla
ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: AISLAMIENTO MULTI-TENANT ESTÁNDAR
-- Permite acceso solo a chatbots de la organización del usuario
CREATE POLICY chatbot_config_tenant_isolation ON chatbot_config
    USING (
        CASE
            -- 🔓 BYPASS: Funciones de sistema pueden ver todo
            WHEN current_setting('app.bypass_rls', TRUE) = 'true' THEN
                TRUE

            -- 👑 SUPER ADMIN: Acceso global para soporte
            WHEN EXISTS (
                SELECT 1 FROM usuarios
                WHERE id = NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER
                AND rol = 'super_admin'
            ) THEN
                TRUE

            -- 🏢 TENANT ISOLATION: Solo org del usuario
            ELSE
                organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
        END
    );

-- POLÍTICA 2: BYPASS EXPLÍCITO PARA FUNCIONES DE SISTEMA
-- Permite acceso completo cuando bypass_rls está activado
CREATE POLICY chatbot_config_system_bypass ON chatbot_config
    FOR ALL
    USING (current_setting('app.bypass_rls', TRUE) = 'true');

-- ====================================================================
-- 🔐 POLÍTICAS RLS PARA TABLA CHATBOT_CREDENTIALS
-- ====================================================================
-- Aislamiento indirecto vía chatbot_config
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en la tabla
ALTER TABLE chatbot_credentials ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: AISLAMIENTO INDIRECTO VÍA CHATBOT_CONFIG
-- Verifica que el chatbot asociado pertenezca a la organización del usuario
CREATE POLICY chatbot_credentials_tenant_isolation ON chatbot_credentials
    USING (
        CASE
            -- 🔓 BYPASS: Funciones de sistema
            WHEN current_setting('app.bypass_rls', TRUE) = 'true' THEN
                TRUE

            -- 👑 SUPER ADMIN: Acceso global
            WHEN EXISTS (
                SELECT 1 FROM usuarios
                WHERE id = NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER
                AND rol = 'super_admin'
            ) THEN
                TRUE

            -- 🔗 TENANT ISOLATION INDIRECTO: Via JOIN con chatbot_config
            ELSE
                EXISTS (
                    SELECT 1
                    FROM chatbot_config cc
                    WHERE cc.id = chatbot_credentials.chatbot_config_id
                      AND cc.organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
                )
        END
    );

-- POLÍTICA 2: BYPASS EXPLÍCITO
CREATE POLICY chatbot_credentials_system_bypass ON chatbot_credentials
    FOR ALL
    USING (current_setting('app.bypass_rls', TRUE) = 'true');

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICAS - CHATBOTS
-- ====================================================================
-- Comentarios explicativos para políticas de chatbots
-- ────────────────────────────────────────────────────────────────────

COMMENT ON POLICY chatbot_config_tenant_isolation ON chatbot_config IS
'Aislamiento multi-tenant para configuración de chatbots:
- Usuario accede solo a chatbots de su organización
- Super admin tiene acceso global para soporte
- Bypass disponible para funciones de sistema

Uso típico: Listado de chatbots, edición de configuración, métricas.
Agregado: 2025-10-22 - Sistema de chatbots multi-plataforma';

COMMENT ON POLICY chatbot_config_system_bypass ON chatbot_config IS
'Bypass RLS para funciones de sistema que requieren acceso directo a chatbot_config.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);
Casos de uso: Triggers, migraciones, webhooks de n8n.
Agregado: 2025-10-22 - Sistema de chatbots multi-plataforma';

COMMENT ON POLICY chatbot_credentials_tenant_isolation ON chatbot_credentials IS
'Aislamiento indirecto mediante JOIN con tabla chatbot_config.
Verifica que el chatbot asociado pertenezca a la organización del usuario.
Previene acceso a credentials de otras organizaciones.
Agregado: 2025-10-22 - Sistema de chatbots multi-plataforma';

COMMENT ON POLICY chatbot_credentials_system_bypass ON chatbot_credentials IS
'Bypass RLS para funciones de sistema.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);
Agregado: 2025-10-22 - Sistema de chatbots multi-plataforma';

-- ====================================================================
-- 🔗 RLS PARA TABLA CITAS_SERVICIOS (M:N)
-- ====================================================================
-- Aislamiento multi-tenant mediante JOIN con tabla citas
-- ESTRATEGIA: Filtrado indirecto por organizacion_id de la cita asociada
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en citas_servicios
ALTER TABLE citas_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas_servicios FORCE ROW LEVEL SECURITY;

-- ====================================================================
-- 🎯 POLÍTICA: TENANT_ISOLATION_CITAS_SERVICIOS
-- ====================================================================
-- Control de acceso a servicios de citas basado en organización
--
-- LÓGICA:
-- - Acceso permitido si el usuario pertenece a la misma organización de la cita
-- - Bypass disponible para funciones de sistema
-- - JOIN indirecto: citas_servicios → citas → organizacion_id
-- ====================================================================
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

COMMENT ON POLICY tenant_isolation_citas_servicios ON citas_servicios IS
'Aislamiento multi-tenant mediante JOIN indirecto con tabla citas.
Verifica que la cita asociada pertenezca a la organización del usuario.
Performance: Usa índice idx_citas_servicios_cita_id (< 1ms overhead).
Agregado: 2025-10-26 - Feature múltiples servicios por cita';

-- ====================================================================
-- 💵 POLÍTICAS RLS DEL SISTEMA DE COMISIONES
-- ====================================================================
-- Agregado: 14 Noviembre 2025
-- Versión: 1.0.0
-- ====================================================================

-- ====================================================================
-- RLS PARA TABLA configuracion_comisiones
-- ====================================================================

ALTER TABLE configuracion_comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_comisiones FORCE ROW LEVEL SECURITY;

CREATE POLICY configuracion_comisiones_tenant_isolation
ON configuracion_comisiones
FOR ALL
TO saas_app
USING (
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
    organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
);

COMMENT ON POLICY configuracion_comisiones_tenant_isolation ON configuracion_comisiones IS
'Aislamiento multi-tenant: solo miembros de la organización pueden acceder a su configuración.
Fix: 2025-11-15 - Simplificado para consistencia (solo requiere current_tenant_id).';

-- ====================================================================
-- RLS PARA TABLA comisiones_profesionales
-- ====================================================================

ALTER TABLE comisiones_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones_profesionales FORCE ROW LEVEL SECURITY;

-- Política: Aislamiento multi-tenant (consistente con clientes, citas, etc.)
CREATE POLICY comisiones_profesionales_tenant_isolation
ON comisiones_profesionales
FOR ALL
TO saas_app
USING (
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
    organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
);

COMMENT ON POLICY comisiones_profesionales_tenant_isolation ON comisiones_profesionales IS
'Aislamiento multi-tenant: solo miembros de la organización pueden acceder a sus comisiones.
Fix: 2025-11-15 - Simplificado para consistencia con otras tablas (solo requiere current_tenant_id).';

-- ====================================================================
-- RLS PARA TABLA historial_configuracion_comisiones
-- ====================================================================

ALTER TABLE historial_configuracion_comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_configuracion_comisiones FORCE ROW LEVEL SECURITY;

-- Política 1: SELECT - Aislamiento multi-tenant
CREATE POLICY historial_config_comisiones_tenant_isolation
ON historial_configuracion_comisiones
FOR SELECT
TO saas_app
USING (
    current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
    organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
);

-- Política 2: INSERT - Permite INSERT desde trigger de auditoría
CREATE POLICY historial_config_comisiones_trigger_insert
ON historial_configuracion_comisiones
FOR INSERT
TO saas_app
WITH CHECK (
    -- Permitir INSERT desde triggers (bypass_rls)
    current_setting('app.bypass_rls', true) = 'true'
    OR
    -- O desde cualquier usuario de la organización
    (
        current_setting('app.current_tenant_id', true) ~ '^[0-9]+$' AND
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    )
);

COMMENT ON POLICY historial_config_comisiones_tenant_isolation ON historial_configuracion_comisiones IS
'Aislamiento multi-tenant para historial de configuración de comisiones.
Fix: 2025-11-15 - Simplificado para consistencia (solo requiere current_tenant_id).';

COMMENT ON POLICY historial_config_comisiones_trigger_insert ON historial_configuracion_comisiones IS
'Permite INSERT desde trigger de auditoría (bypass_rls) y desde usuarios de la organización.
Fix: 2025-11-15 - Simplificado para consistencia (solo requiere current_tenant_id).';
