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
-- 🛍️ RLS PARA TABLA PLANTILLAS_SERVICIOS
-- ====================================================================
-- Tabla global compartida con lectura pública y escritura restringida
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en plantillas_servicios
ALTER TABLE plantillas_servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_servicios FORCE ROW LEVEL SECURITY;

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
-- ⏰ RLS PARA TABLA HORARIOS_DISPONIBILIDAD
-- ====================================================================
-- Aislamiento por organización para gestión de disponibilidad
-- ────────────────────────────────────────────────────────────────────

-- Habilitar RLS en horarios_disponibilidad
ALTER TABLE horarios_disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_disponibilidad FORCE ROW LEVEL SECURITY;

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

-- Política de organizaciones
COMMENT ON POLICY tenant_isolation_organizaciones ON organizaciones IS
'Aislamiento multi-tenant para organizaciones:
- Super admin: Acceso a todas las organizaciones
- Usuario regular: Solo acceso a su propia organización (id = app.current_tenant_id)
- Bypass: Funciones de sistema (registro, onboarding)

Escritura (WITH CHECK): Solo super_admin puede crear/modificar organizaciones.';

-- Política de profesionales
COMMENT ON POLICY tenant_isolation_profesionales ON profesionales IS
'Aislamiento multi-tenant para profesionales:
- Permite acceso solo a profesionales de la organización del usuario
- Super admin tiene acceso global
- Bypass disponible para funciones de sistema

Aplica a: SELECT, INSERT, UPDATE, DELETE';

-- Política de clientes (isolation)
COMMENT ON POLICY clientes_isolation ON clientes IS
'Aislamiento multi-tenant seguro para clientes (CORREGIDO 2025-10-03):
- Valida formato numérico de tenant_id con REGEX ^[0-9]+$ (previene SQL injection)
- Usuario solo puede acceder a clientes de su organización
- Bloquea intentos de injection como "1 OR 1=1" o tenant_id vacío
- Ver también: clientes_super_admin para acceso global';

-- Política de clientes (super admin)
COMMENT ON POLICY clientes_super_admin ON clientes IS
'Acceso global para super_admin a todos los clientes del sistema.
Permite gestión centralizada de datos para soporte y administración.';

-- Política de servicios
COMMENT ON POLICY servicios_tenant_isolation ON servicios IS
'Aislamiento multi-tenant para servicios:
- Usuario accede solo a servicios de su organización
- Super admin tiene acceso global
- Bypass disponible para funciones de sistema

Uso típico: Catálogo de servicios, asignación a profesionales, pricing.';

-- Política de servicios (bypass)
COMMENT ON POLICY servicios_system_bypass ON servicios IS
'Bypass RLS para funciones de sistema que requieren acceso directo a servicios.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);
Casos de uso: Triggers, funciones de migración, procesos batch.';

-- Política de citas
COMMENT ON POLICY citas_tenant_isolation ON citas IS
'Aislamiento multi-tenant para citas:
- Usuario accede solo a citas de su organización
- Super admin tiene acceso global para soporte
- Bypass para triggers y funciones automáticas

Crítico para: Agenda, reportes, facturación, métricas.';

-- Política de horarios disponibilidad
COMMENT ON POLICY horarios_tenant_isolation ON horarios_disponibilidad IS
'Aislamiento multi-tenant para horarios de disponibilidad:
- Usuario accede solo a horarios de su organización
- Super admin tiene acceso global
- Bypass para generación automática de horarios

Optimizado para: Búsqueda de slots disponibles, reservas temporales.';

-- Política de plantillas (lectura pública)
COMMENT ON POLICY plantillas_public_read ON plantillas_servicios IS
'Lectura pública de plantillas activas para todos los usuarios.
Permite a cualquier organización ver el catálogo de servicios sugeridos.
Solo plantillas con activo=true son visibles.';

-- Política de plantillas (escritura admin)
COMMENT ON POLICY plantillas_admin_insert ON plantillas_servicios IS
'Permite INSERT de plantillas sin restricciones de rol.
NOTA: Combinar con validación a nivel de aplicación para controlar quién puede insertar.';

-- Política de plantillas (actualización admin)
COMMENT ON POLICY plantillas_admin_update ON plantillas_servicios IS
'Solo super_admin puede actualizar plantillas de servicios.
Protege integridad del catálogo oficial de plantillas.';

-- Política de plantillas (eliminación admin)
COMMENT ON POLICY plantillas_admin_delete ON plantillas_servicios IS
'Solo super_admin puede eliminar plantillas de servicios.
RECOMENDACIÓN: Usar soft-delete (activo=false) en lugar de DELETE físico.';

-- Política de plantillas (bypass)
COMMENT ON POLICY plantillas_system_bypass ON plantillas_servicios IS
'Bypass RLS para carga masiva de plantillas y scripts de mantenimiento.
Activado mediante: SELECT set_config(''app.bypass_rls'', ''true'', true);';

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
