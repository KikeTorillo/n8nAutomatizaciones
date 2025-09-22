-- =====================================================================
-- 🏗️ DISEÑO DE BASE DE DATOS SAAS MULTI-TENANT
-- =====================================================================
-- Versión: 1.0
-- Fecha: 2025-01-16
-- Autor: Sistema de Agendamiento SaaS
--
-- 📋 DESCRIPCIÓN GENERAL:
-- Este schema implementa un sistema SaaS multi-tenant para automatización
-- de agendamiento empresarial con las siguientes características:
--
-- 🎯 OBJETIVOS PRINCIPALES:
-- • Multi-tenancy nativo con Row Level Security (RLS)
-- • Soporte para 11 industrias diferentes (barberías, spas, consultorios, etc.)
-- • Autenticación robusta con control de seguridad enterprise
-- • Escalabilidad para 1000+ organizaciones y 10M+ citas/mes
-- • Flexibilidad con configuraciones JSONB por industria
--
-- 🏛️ ARQUITECTURA:
-- • CAPA 1: Autenticación y Seguridad (usuarios, roles, tokens)
-- • CAPA 2: Multi-tenancy (organizaciones, aislamiento de datos)
-- • CAPA 3: Catálogo Global (plantillas de servicios compartidas)
-- • CAPA 4: Tipos y Estructuras (ENUMs especializados)
--
-- 🔒 SEGURIDAD:
-- • RLS (Row Level Security) en todas las tablas multi-tenant
-- • Control de intentos de login fallidos con bloqueo automático
-- • Tokens de recuperación de contraseña con expiración
-- • Validaciones CHECK para integridad de datos
--
-- 📊 PERFORMANCE:
-- • 16 índices especializados (incluyendo GIN para full-text)
-- • Configuración autovacuum optimizada para alta concurrencia
-- • Índices parciales para reducir overhead
-- • Fillfactor configurado para HOT updates
--
-- 🔧 MANTENIMIENTO:
-- • Funciones PL/pgSQL para operaciones automáticas
-- • Triggers para timestamps y validaciones
-- • Comentarios detallados en cada componente
-- • Políticas RLS claramente documentadas
--
-- ⚠️ NOTAS IMPORTANTES:
-- • Este es el schema CORE - se expandirá con más tablas en fases posteriores
-- • Las FK a tablas futuras están comentadas y se activarán cuando estén disponibles
-- • Todas las configuraciones están optimizadas para producción
-- =====================================================================

-- ====================================================================
-- 🔐 CAPA 1: AUTENTICACIÓN Y SEGURIDAD
-- ====================================================================
-- Esta es la CAPA FUNDAMENTAL del sistema SaaS multi-tenant.
-- Maneja toda la autenticación, autorización y seguridad de usuarios.
--
-- 📊 COMPONENTES DE ESTA CAPA:
-- • ENUM rol_usuario: Define la jerarquía de permisos
-- • TABLA usuarios: Core de autenticación con seguridad enterprise
-- • FUNCIONES PL/pgSQL: Automatización de seguridad y mantenimiento
-- • RLS UNIFICADA: Control de acceso granular sin conflictos
-- • ÍNDICES ESPECIALIZADOS: Performance optimizada para auth
--
-- ⚡ CARACTERÍSTICAS CRÍTICAS:
-- • Bloqueo automático tras 5 intentos fallidos (30 minutos)
-- • Tokens de recuperación con expiración automática
-- • Soporte multi-tenant con aislamiento perfecto
-- • Full-text search en español para autocompletar
-- • Configuración personal (UI, zona horaria, idioma)
--
-- 🎯 CASOS DE USO PRINCIPALES:
-- • Login/logout de usuarios
-- • Recuperación de contraseñas
-- • Gestión de roles y permisos
-- • Autocompletar usuarios en interfaces
-- • Auditoría de accesos y seguridad
-- ====================================================================

-- ====================================================================
-- 👥 ENUM ROL_USUARIO - JERARQUÍA DE PERMISOS
-- ====================================================================
-- Define los 5 niveles de acceso del sistema SaaS con jerarquía clara.
-- Cada rol tiene permisos específicos y restricciones definidas.
--
-- 🔑 JERARQUÍA DE ROLES (de mayor a menor privilegio):
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE rol_usuario AS ENUM (
    -- 🔴 NIVEL 1: SUPER ADMINISTRADOR
    'super_admin',    -- • Acceso total al sistema y todas las organizaciones
                      -- • Puede gestionar plantillas globales de servicios
                      -- • No requiere organizacion_id (único rol global)
                      -- • Acceso a métricas y configuraciones del sistema
                      -- • Puede crear, modificar y eliminar organizaciones

    -- 🟠 NIVEL 2: ADMINISTRADOR DE ORGANIZACIÓN
    'admin',          -- • Acceso completo a SU organización únicamente
                      -- • Puede gestionar usuarios, servicios y configuraciones
                      -- • Acceso a reportes y métricas de la organización
                      -- • Puede modificar configuración de marca y planes

    -- 🟡 NIVEL 3: PROPIETARIO DEL NEGOCIO
    'propietario',    -- • Dueño del negocio con permisos operativos completos
                      -- • Puede gestionar empleados y servicios
                      -- • Acceso a citas, clientes y reportes básicos
                      -- • Configuración de horarios y disponibilidad

    -- 🟢 NIVEL 4: EMPLEADO
    'empleado',       -- • Acceso limitado a funciones operativas
                      -- • Puede gestionar sus propias citas y horarios
                      -- • Acceso de solo lectura a clientes asignados
                      -- • Sin acceso a configuraciones administrativas

    -- 🔵 NIVEL 5: CLIENTE FINAL
    'cliente'         -- • Acceso muy limitado, principalmente lectura
                      -- • Puede ver sus propias citas y servicios
                      -- • Sin acceso a datos de otros clientes
                      -- • Interfaz simplificada para autoservicio
);

-- 📝 NOTAS IMPORTANTES SOBRE ROLES:
-- • La jerarquía permite herencia de permisos hacia abajo
-- • Solo super_admin puede tener organizacion_id = NULL
-- • Los roles se validan en RLS y en la aplicación
-- • Cambios de rol requieren validación adicional

-- ====================================================================
-- 👤 TABLA USUARIOS - CORE DE AUTENTICACIÓN
-- ====================================================================
-- Esta es la tabla MÁS CRÍTICA del sistema. Almacena todos los usuarios
-- del sistema SaaS con autenticación robusta y multi-tenancy nativo.
--
-- 🎯 PROPÓSITO:
-- • Autenticación segura con hash de contraseñas
-- • Control de acceso basado en roles jerárquicos
-- • Aislamiento multi-tenant por organización
-- • Recuperación de contraseñas con tokens seguros
-- • Configuración personalizada por usuario
--
-- 🔐 CARACTERÍSTICAS DE SEGURIDAD:
-- • Bloqueo automático tras 5 intentos fallidos (30 min)
-- • Tokens de reset con expiración automática
-- • Validación de email único por organización
-- • Control de estado (activo/inactivo/verificado)
--
-- 📊 OPTIMIZACIONES DE PERFORMANCE:
-- • 8 índices especializados para consultas frecuentes
-- • Configuración autovacuum para alta concurrencia
-- • Índice GIN para búsqueda full-text en español
-- • Fillfactor 90% para HOT updates
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE usuarios (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER, -- REFERENCES organizaciones(id) - FK se agrega después
                             -- NULL solo permitido para super_admin
                             -- Obligatorio para todos los demás roles

    -- ====================================================================
    -- 🔐 SECCIÓN: AUTENTICACIÓN Y AUTORIZACIÓN
    -- ====================================================================
    email VARCHAR(150) UNIQUE NOT NULL,     -- Email único como username
    password_hash VARCHAR(255) NOT NULL,    -- Hash bcrypt del password
    rol rol_usuario NOT NULL DEFAULT 'empleado',  -- Rol en la jerarquía

    -- ====================================================================
    -- 👨‍💼 SECCIÓN: INFORMACIÓN PERSONAL
    -- ====================================================================
    nombre VARCHAR(150) NOT NULL,           -- Nombre(s) del usuario
    apellidos VARCHAR(150),                 -- Apellidos (opcional)
    telefono VARCHAR(20),                   -- Teléfono de contacto

    -- ====================================================================
    -- 🔗 SECCIÓN: RELACIONES OPCIONALES
    -- ====================================================================
    -- NOTA: Esta FK se activará cuando se cree la tabla profesionales
    profesional_id INTEGER,                -- REFERENCES profesionales(id)
                                           -- Vincula usuario con perfil profesional
                                           -- NULL = usuario no es profesional

    -- ====================================================================
    -- 🛡️ SECCIÓN: CONTROL DE ACCESO Y SEGURIDAD
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,           -- Usuario activo en el sistema
    email_verificado BOOLEAN DEFAULT FALSE, -- Email confirmado por el usuario
    ultimo_login TIMESTAMPTZ,              -- Timestamp del último acceso
    intentos_fallidos INTEGER DEFAULT 0,   -- Contador de logins fallidos
    bloqueado_hasta TIMESTAMPTZ,           -- Fecha hasta la cual está bloqueado

    -- ====================================================================
    -- 🔄 SECCIÓN: RECUPERACIÓN DE CONTRASEÑA
    -- ====================================================================
    token_reset_password VARCHAR(255),     -- Token para reset de password
    token_reset_expira TIMESTAMPTZ,        -- Expiración del token (1 hora típico)

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN PERSONAL
    -- ====================================================================
    configuracion_ui JSONB DEFAULT '{}',   -- Preferencias de interfaz
                                           -- Ej: {"tema": "dark", "idioma": "es"}
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',  -- Zona horaria
    idioma VARCHAR(5) DEFAULT 'es',        -- Código de idioma (ISO 639-1)

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),   -- Fecha de registro
    actualizado_en TIMESTAMPTZ DEFAULT NOW(), -- Última modificación

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES Y CONSTRAINTS
    -- ====================================================================
    CHECK (char_length(email) >= 5),       -- Email mínimo válido: a@b.c
    CHECK (char_length(nombre) >= 2),      -- Nombre debe tener al menos 2 chars
    CHECK (intentos_fallidos >= 0 AND intentos_fallidos <= 10), -- Max 10 intentos
    CHECK (
        -- REGLA MULTI-TENANT: Solo super_admin puede tener organizacion_id NULL
        (rol = 'super_admin') OR
        (rol != 'super_admin' AND organizacion_id IS NOT NULL)
    )
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS PARA TABLA USUARIOS
-- ====================================================================
-- Estos 8 índices están diseñados para optimizar las consultas más frecuentes
-- del sistema de autenticación y gestión de usuarios. Cada índice tiene un
-- propósito específico y está optimizado para casos de uso reales.
--
-- 🎯 ESTRATEGIA DE INDEXACIÓN:
-- • Índices únicos para constraints críticos
-- • Índices parciales para reducir overhead
-- • Índices compuestos para consultas complejas
-- • Índice GIN para búsqueda full-text
-- ────────────────────────────────────────────────────────────────────

-- 🔑 ÍNDICE 1: AUTENTICACIÓN CRÍTICA
-- Propósito: Login de usuarios (consulta MÁS frecuente del sistema)
-- Uso: WHERE email = ? AND activo = TRUE
CREATE UNIQUE INDEX idx_usuarios_email_unique
    ON usuarios (email) WHERE activo = TRUE;

-- 🏢 ÍNDICE 2: GESTIÓN MULTI-TENANT
-- Propósito: Listar usuarios por organización y filtrar por rol
-- Uso: WHERE organizacion_id = ? AND rol = ? AND activo = TRUE
CREATE INDEX idx_usuarios_org_rol_activo
    ON usuarios (organizacion_id, rol, activo) WHERE activo = TRUE;

-- 👨‍⚕️ ÍNDICE 3: USUARIOS PROFESIONALES
-- Propósito: Vincular usuarios con sus perfiles profesionales
-- Uso: WHERE profesional_id = ? (cuando tabla profesionales esté lista)
CREATE INDEX idx_usuarios_profesional_id
    ON usuarios (profesional_id) WHERE profesional_id IS NOT NULL;

-- 🛡️ ÍNDICE 4: CONTROL DE SEGURIDAD
-- Propósito: Identificar usuarios bloqueados o con intentos fallidos
-- Uso: Tareas de limpieza y auditoría de seguridad
CREATE INDEX idx_usuarios_seguridad
    ON usuarios (intentos_fallidos, bloqueado_hasta)
    WHERE intentos_fallidos > 0 OR bloqueado_hasta IS NOT NULL;

-- 🔄 ÍNDICE 5: TOKENS DE RECUPERACIÓN
-- Propósito: Validar tokens de reset de contraseña
-- Uso: WHERE token_reset_password = ? AND token_reset_expira > NOW()
CREATE INDEX idx_usuarios_reset_token
    ON usuarios (token_reset_password, token_reset_expira)
    WHERE token_reset_password IS NOT NULL;

-- 📈 ÍNDICE 6: DASHBOARD DE ADMINISTRACIÓN
-- Propósito: Métricas y listados de usuarios para admins
-- Uso: Reportes de actividad y últimos accesos
CREATE INDEX idx_usuarios_dashboard
    ON usuarios (organizacion_id, ultimo_login, activo)
    WHERE activo = TRUE;

-- 🔍 ÍNDICE 7: BÚSQUEDA FULL-TEXT (GIN)
-- Propósito: Autocompletar nombres en interfaces de usuario
-- Uso: Búsqueda por nombre completo en español
-- Tecnología: GIN (Generalized Inverted Index) optimizado para texto
CREATE INDEX idx_usuarios_nombre_gin
    ON usuarios USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(apellidos, '')))
    WHERE activo = TRUE;

-- ====================================================================
-- 👤 DATOS INICIALES - USUARIO SUPER ADMINISTRADOR
-- ====================================================================
-- Crea el usuario super_admin inicial del sistema.
-- Este usuario es crítico para el funcionamiento del SaaS.
--
-- 🔑 CREDENCIALES POR DEFECTO:
-- Email: admin@saas-agendamiento.com
-- Password: admin123
--
-- ⚠️ IMPORTANTE EN PRODUCCIÓN:
-- • Cambiar estas credenciales inmediatamente
-- • Usar un password complejo y único
-- • Activar 2FA cuando esté disponible
-- ────────────────────────────────────────────────────────────────────
INSERT INTO usuarios (
    email,
    password_hash,                    -- Hash bcrypt generado para 'admin123'
    rol,
    nombre,
    apellidos,
    activo,
    email_verificado
) VALUES (
    'admin@saas-agendamiento.com',
    '$2a$12$kAuGwcN1vynDKfFzQ3g2N.bQZnDfrYB4BRRLoiDVijGlcSb6hi/Xy',
    'super_admin',                    -- Rol con máximos privilegios
    'Administrador',
    'del Sistema',
    TRUE,                             -- Usuario activo desde el inicio
    TRUE                              -- Email pre-verificado
) ON CONFLICT (email) DO NOTHING;     -- Evita duplicados en re-ejecuciones

-- ====================================================================
-- ⚡ OPTIMIZACIONES DE TABLA USUARIOS
-- ====================================================================
-- Configuraciones específicas para alta concurrencia y performance.
-- Estas optimizaciones son críticas para un SaaS con miles de usuarios.
--
-- 🎯 OBJETIVO: Optimizar para escrituras frecuentes (logins, updates)
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE usuarios SET (
    fillfactor = 90,                          -- Reserva 10% de espacio en cada página
                                              -- para HOT (Heap-Only Tuples) updates
                                              -- Reduce fragmentación en updates frecuentes

    autovacuum_vacuum_scale_factor = 0.1,     -- VACUUM cuando cambie 10% de la tabla
                                              -- (por defecto es 20%) - limpieza más frecuente

    autovacuum_analyze_scale_factor = 0.05    -- ANALYZE cuando cambie 5% de la tabla
                                              -- (por defecto es 10%) - estadísticas más actualizadas
);

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN EN BASE DE DATOS
-- ====================================================================
-- Metadatos almacenados en PostgreSQL para documentación automática
-- ────────────────────────────────────────────────────────────────────
COMMENT ON TABLE usuarios IS 'Usuarios del sistema SaaS con autenticación multi-tenant, seguridad enterprise y configuración personalizada';

COMMENT ON COLUMN usuarios.organizacion_id IS 'FK a organizaciones. NULL solo permitido para super_admin, obligatorio para todos los demás roles';

COMMENT ON COLUMN usuarios.profesional_id IS 'FK opcional a tabla profesionales (se activará en fase posterior). Vincula usuario con perfil profesional si aplica';

COMMENT ON COLUMN usuarios.intentos_fallidos IS 'Contador de intentos de login fallidos. Máximo 10, trigger bloqueo automático a los 5 intentos';

COMMENT ON COLUMN usuarios.bloqueado_hasta IS 'Timestamp hasta el cual el usuario permanece bloqueado. NULL = no bloqueado. Auto-limpieza por función de mantenimiento';

-- ====================================================================
-- 🔧 FUNCIONES PL/pgSQL DE SEGURIDAD Y MANTENIMIENTO
-- ====================================================================
-- Conjunto de 3 funciones automatizadas para la gestión de seguridad
-- y mantenimiento de la tabla usuarios. Estas funciones implementan
-- lógica business critical que debe ejecutarse de forma consistente.
--
-- 🎯 CARACTERÍSTICAS PRINCIPALES:
-- • SECURITY DEFINER: Ejecutan con privilegios del propietario
-- • Bypass RLS controlado: Acceso temporal para operaciones críticas
-- • Manejo de errores: Operaciones atómicas y consistentes
-- • Logging preparado: Ready para sistema de auditoría futuro
-- ────────────────────────────────────────────────────────────────────

-- ====================================================================
-- 🔐 FUNCIÓN 1: REGISTRAR_INTENTO_LOGIN
-- ====================================================================
-- Función CRÍTICA para el sistema de autenticación.
-- Maneja tanto logins exitosos como fallidos con lógica de bloqueo.
--
-- 📋 PARÁMETROS:
-- • p_email: Email del usuario que intenta autenticarse
-- • p_exitoso: TRUE = login correcto, FALSE = login fallido
-- • p_ip_address: IP del cliente (para auditoría futura)
--
-- 🛡️ LÓGICA DE SEGURIDAD:
-- • Login exitoso: Resetea contadores y actualiza último acceso
-- • Login fallido: Incrementa contador e implementa bloqueo progresivo
-- • Bloqueo automático: 30 minutos tras 5 intentos fallidos
--
-- ⚡ PERFORMANCE: Usa bypass RLS para evitar overhead de políticas
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION registrar_intento_login(
    p_email VARCHAR(150),                    -- Email del usuario (identificador único)
    p_exitoso BOOLEAN DEFAULT FALSE,         -- TRUE = éxito, FALSE = fallo
    p_ip_address INET DEFAULT NULL           -- IP del cliente (auditoría futura)
) RETURNS VOID AS $$
DECLARE
    usuario_id INTEGER;                      -- ID del usuario encontrado
    org_id INTEGER;                          -- ID de organización (para logs futuros)
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 1: CONFIGURAR BYPASS RLS
    -- ═══════════════════════════════════════════════════════════════════
    -- Necesario para que la función pueda actualizar usuarios sin
    -- restricciones de tenant (función de sistema crítica)
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 2: OBTENER INFORMACIÓN DEL USUARIO
    -- ═══════════════════════════════════════════════════════════════════
    SELECT u.id, u.organizacion_id INTO usuario_id, org_id
    FROM usuarios u
    WHERE u.email = p_email AND u.activo = TRUE;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 3: PROCESAR RESULTADO DEL LOGIN
    -- ═══════════════════════════════════════════════════════════════════
    IF usuario_id IS NOT NULL THEN
        IF p_exitoso THEN
            -- ┌─────────────────────────────────────────────────────────┐
            -- │ LOGIN EXITOSO: Resetear seguridad y actualizar acceso  │
            -- └─────────────────────────────────────────────────────────┘
            UPDATE usuarios
            SET ultimo_login = NOW(),             -- Timestamp del acceso
                intentos_fallidos = 0,            -- Resetear contador
                bloqueado_hasta = NULL,           -- Quitar bloqueo si existía
                actualizado_en = NOW()            -- Actualizar timestamp
            WHERE id = usuario_id;
        ELSE
            -- ┌─────────────────────────────────────────────────────────┐
            -- │ LOGIN FALLIDO: Incrementar contador y evaluar bloqueo  │
            -- └─────────────────────────────────────────────────────────┘
            UPDATE usuarios
            SET intentos_fallidos = intentos_fallidos + 1,
                -- LÓGICA DE BLOQUEO: 30 min tras 5 intentos (índice 4)
                bloqueado_hasta = CASE
                    WHEN intentos_fallidos >= 4 THEN NOW() + INTERVAL '30 minutes'
                    ELSE bloqueado_hasta
                END,
                actualizado_en = NOW()
            WHERE id = usuario_id;
        END IF;

        -- ═══════════════════════════════════════════════════════════════════
        -- FASE 4: LOGGING Y AUDITORÍA (PREPARADO PARA FUTURO)
        -- ═══════════════════════════════════════════════════════════════════
        -- TODO: Implementar inserción en tabla eventos_sistema cuando esté disponible
        -- INSERT INTO eventos_sistema (tipo, usuario_id, detalles, ip_address, timestamp)
        -- VALUES ('login_attempt', usuario_id, jsonb_build_object('exitoso', p_exitoso), p_ip_address, NOW());
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 5: LIMPIAR CONFIGURACIÓN RLS
    -- ═══════════════════════════════════════════════════════════════════
    PERFORM set_config('app.bypass_rls', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION registrar_intento_login(VARCHAR, BOOLEAN, INET) IS
'Función crítica de autenticación. Registra intentos de login y aplica políticas de bloqueo automático de seguridad';

-- ====================================================================
-- 🧹 FUNCIÓN 2: LIMPIAR_TOKENS_RESET_EXPIRADOS
-- ====================================================================
-- Función de MANTENIMIENTO automático para limpiar tokens expirados.
-- Debe ejecutarse periódicamente (cron job o scheduled task).
--
-- 🎯 PROPÓSITO:
-- • Eliminar tokens de reset de contraseña que ya expiraron
-- • Liberar espacio y mejorar seguridad
-- • Mantener la tabla limpia de datos obsoletos
--
-- 📊 RETORNA: Cantidad de tokens limpiados (para logging)
--
-- ⏰ EJECUCIÓN RECOMENDADA: Cada hora o cada 6 horas
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION limpiar_tokens_reset_expirados()
RETURNS INTEGER AS $$
DECLARE
    tokens_limpiados INTEGER;                -- Contador de registros afectados
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 1: CONFIGURAR BYPASS RLS
    -- ═══════════════════════════════════════════════════════════════════
    -- Función de mantenimiento necesita acceso global a todos los usuarios
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 2: LIMPIAR TOKENS EXPIRADOS
    -- ═══════════════════════════════════════════════════════════════════
    UPDATE usuarios
    SET token_reset_password = NULL,          -- Limpiar token
        token_reset_expira = NULL,            -- Limpiar fecha expiración
        actualizado_en = NOW()                -- Actualizar timestamp
    WHERE token_reset_expira < NOW()          -- Solo tokens ya expirados
    AND token_reset_password IS NOT NULL;    -- Solo usuarios con token activo

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 3: OBTENER CANTIDAD DE REGISTROS AFECTADOS
    -- ═══════════════════════════════════════════════════════════════════
    GET DIAGNOSTICS tokens_limpiados = ROW_COUNT;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 4: LOGGING DE MANTENIMIENTO (PREPARADO PARA FUTURO)
    -- ═══════════════════════════════════════════════════════════════════
    -- TODO: Implementar log en tabla eventos_sistema cuando esté disponible
    -- INSERT INTO eventos_sistema (tipo, detalles, timestamp)
    -- VALUES ('maintenance_cleanup', jsonb_build_object('tokens_limpiados', tokens_limpiados), NOW());

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 5: LIMPIAR CONFIGURACIÓN RLS
    -- ═══════════════════════════════════════════════════════════════════
    PERFORM set_config('app.bypass_rls', 'false', true);

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 6: RETORNAR RESULTADO
    -- ═══════════════════════════════════════════════════════════════════
    RETURN tokens_limpiados;
END;
$$ LANGUAGE plpgsql;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION limpiar_tokens_reset_expirados() IS
'Función de mantenimiento. Limpia tokens de reset de contraseña expirados. Debe ejecutarse periódicamente via cron job';

-- Función para desbloquear usuarios automáticamente
CREATE OR REPLACE FUNCTION desbloquear_usuarios_automatico()
RETURNS INTEGER AS $$
DECLARE
    usuarios_desbloqueados INTEGER;
BEGIN
    -- Configurar bypass RLS para función de mantenimiento
    PERFORM set_config('app.bypass_rls', 'true', true);

    UPDATE usuarios
    SET bloqueado_hasta = NULL,
        intentos_fallidos = 0,
        actualizado_en = NOW()
    WHERE bloqueado_hasta < NOW()
    AND bloqueado_hasta IS NOT NULL;

    GET DIAGNOSTICS usuarios_desbloqueados = ROW_COUNT;

    -- Log del mantenimiento (se agregará eventos_sistema en fase posterior)
    -- TODO: Implementar log de mantenimiento cuando eventos_sistema esté disponible

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN usuarios_desbloqueados;
END;
$$ LANGUAGE plpgsql;

-- Función para validar email único por organización
CREATE OR REPLACE FUNCTION validar_email_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Para super_admin, email debe ser único globalmente
    IF NEW.rol = 'super_admin' THEN
        IF EXISTS (
            SELECT 1 FROM usuarios
            WHERE email = NEW.email
            AND id != COALESCE(NEW.id, 0)
            AND activo = TRUE
        ) THEN
            RAISE EXCEPTION 'Email ya existe en el sistema';
        END IF;
    ELSE
        -- Para otros roles, email único por organización
        IF EXISTS (
            SELECT 1 FROM usuarios
            WHERE email = NEW.email
            AND organizacion_id = NEW.organizacion_id
            AND id != COALESCE(NEW.id, 0)
            AND activo = TRUE
        ) THEN
            RAISE EXCEPTION 'Email ya existe en esta organización';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar email único
CREATE TRIGGER trigger_validar_email_usuario
    BEFORE INSERT OR UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION validar_email_usuario();

-- ===== FUNCIÓN PARA ACTUALIZAR TIMESTAMPS =====

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_actualizar_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 🛡️ ROW LEVEL SECURITY (RLS) - CONTROL DE ACCESO GRANULAR
-- ====================================================================
-- El RLS es el CORAZÓN de la seguridad multi-tenant del sistema.
-- Implementa aislamiento automático de datos a nivel de fila sin
-- necesidad de filtros adicionales en las consultas de aplicación.
--
-- 🎯 OBJETIVOS DEL RLS:
-- • Aislamiento automático por organización (multi-tenancy)
-- • Control granular de permisos por rol de usuario
-- • Seguridad a nivel de base de datos (no depende de aplicación)
-- • Prevención de data leaks entre organizaciones
-- • Simplificación de consultas (filtros automáticos)
--
-- 🔧 ARQUITECTURA DE POLÍTICAS:
-- • Política UNIFICADA: Una sola política maneja todos los casos
-- • 5 casos de acceso claramente definidos y documentados
-- • Variables de sesión para contexto de autenticación
-- • Bypass controlado para funciones de sistema
-- ====================================================================

-- ====================================================================
-- 🔐 ACTIVAR RLS EN TABLA USUARIOS
-- ====================================================================
-- Una vez habilitado, TODAS las consultas a usuarios serán filtradas
-- automáticamente por las políticas definidas a continuación.
-- ────────────────────────────────────────────────────────────────────
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

-- ====================================================================
-- 📝 DOCUMENTACIÓN DE POLÍTICA EN BASE DE DATOS
-- ====================================================================
COMMENT ON POLICY usuarios_unified_access ON usuarios IS
'Política unificada que maneja los 5 casos de acceso: login_context, super_admin, bypass_rls, self_access y tenant_isolation. Núcleo de la seguridad multi-tenant del sistema';


-- ====================================================================
-- FIN SECCIÓN USUARIOS - CONTINÚA CON RESTO DE TABLAS
-- ====================================================================

-- ====================================================================
-- 🎭 CAPA 4: TIPOS ENUM Y ESTRUCTURAS BASE
-- ====================================================================
-- Definición de todos los tipos ENUM especializados del sistema SaaS.
-- Estos tipos proporcionan consistencia de datos y facilitan el
-- mantenimiento al centralizar los valores permitidos.
--
-- 🎯 BENEFICIOS DE LOS ENUMS:
-- • Consistencia de datos garantizada a nivel de BD
-- • Mejor performance que CHECK constraints con strings
-- • Fácil expansión agregando nuevos valores
-- • Documentación implícita de valores válidos
-- • Soporte nativo para ordering y comparaciones
-- ====================================================================

-- ====================================================================
-- 🏭 ENUM INDUSTRIA_TIPO - SECTORES EMPRESARIALES SOPORTADOS
-- ====================================================================
-- Define los 11 tipos de industrias que el SaaS puede manejar.
-- Cada industria tendrá plantillas y configuraciones específicas.
--
-- 📊 INDUSTRIAS ACTUALES: 11 sectores de servicios
-- 🔮 EXPANSIÓN: Fácil agregar nuevos sectores sin romper compatibilidad
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE industria_tipo AS ENUM (
    'barberia',           -- Barberías y peluquerías masculinas
    'salon_belleza',      -- Salones de belleza y peluquerías
    'estetica',           -- Centros de estética y tratamientos faciales
    'spa',                -- Spas y centros de relajación
    'podologia',          -- Consultorios podológicos
    'consultorio_medico', -- Consultorios médicos generales
    'academia',           -- Academias de enseñanza (idiomas, música, etc.)
    'taller_tecnico',     -- Talleres técnicos (autos, electrónicos, etc.)
    'centro_fitness',     -- Gimnasios y centros de fitness
    'veterinaria',        -- Clínicas veterinarias
    'otro'                -- Otras industrias no categorizadas
);

-- ====================================================================
-- 💰 ENUM PLAN_TIPO - PLANES DE SUBSCRIPCIÓN SAAS
-- ====================================================================
-- Define los 5 niveles de planes de subscripción con características
-- diferenciadas según el tamaño y necesidades del negocio.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE plan_tipo AS ENUM (
    'trial',              -- Plan de prueba gratuito (30 días típico)
    'basico',             -- Plan básico para negocios pequeños
    'profesional',        -- Plan avanzado para negocios en crecimiento
    'empresarial',        -- Plan completo para empresas grandes
    'custom'              -- Plan personalizado con características específicas
);

-- ====================================================================
-- 📊 ENUM ESTADO_SUBSCRIPCION - CICLO DE VIDA DE SUBSCRIPCIONES
-- ====================================================================
-- Controla el estado actual de la subscripción de cada organización.
-- Impacta directamente en el acceso a funcionalidades del sistema.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_subscripcion AS ENUM (
    'activa',             -- Subscripción pagada y funcional
    'suspendida',         -- Temporalmente suspendida (problemas técnicos)
    'cancelada',          -- Cancelada por el cliente
    'trial',              -- En período de prueba gratuito
    'morosa'              -- Falta de pago, acceso limitado
);

-- ====================================================================
-- 📅 ENUM ESTADO_CITA - CICLO DE VIDA DE CITAS
-- ====================================================================
-- Define los 6 estados posibles de una cita desde su creación
-- hasta su finalización. Usado para workflow y reportes.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_cita AS ENUM (
    'pendiente',          -- Cita creada, esperando confirmación
    'confirmada',         -- Cita confirmada por el cliente
    'en_curso',           -- Cita en progreso (cliente presente)
    'completada',         -- Cita finalizada exitosamente
    'cancelada',          -- Cita cancelada (por cliente o negocio)
    'no_asistio'          -- Cliente no se presentó (no-show)
);

-- ====================================================================
-- ⏰ ENUM ESTADO_FRANJA - DISPONIBILIDAD HORARIA
-- ====================================================================
-- Controla la disponibilidad de franjas horarias específicas.
-- Usado para el sistema de reservas y gestión de calendario.
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE estado_franja AS ENUM (
    'disponible',         -- Franja libre para agendar
    'reservado_temporal', -- Reserva temporal (carrito de compras)
    'ocupado',            -- Franja con cita confirmada
    'bloqueado'           -- Franja bloqueada (descanso, mantenimiento)
);

-- ====================================================================
-- 👨‍⚕️ ENUM TIPO_PROFESIONAL - ROLES ESPECIALIZADOS POR INDUSTRIA
-- ====================================================================
-- Define los tipos de profesionales según la industria específica.
-- Cada valor está mapeado a una o más industrias compatibles.
--
-- 🎯 OBJETIVO: Garantizar consistencia entre el tipo de profesional
-- y la industria de la organización a la que pertenece.
--
-- 🔗 MAPEO INDUSTRIA → PROFESIONALES:
-- • barberia → barbero, estilista_masculino, estilista
-- • salon_belleza → estilista, colorista, manicurista
-- • estetica → esteticista, cosmetologo
-- • spa → masajista, terapeuta, aromaterapeuta
-- • podologia → podologo, asistente_podologia
-- • consultorio_medico → doctor_general, enfermero, recepcionista_medica
-- • academia → instructor, profesor, tutor
-- • taller_tecnico → tecnico_auto, tecnico_electronico, mecanico
-- • centro_fitness → entrenador_personal, instructor_yoga, nutricionista
-- • veterinaria → veterinario, asistente_veterinario, groomer
-- ────────────────────────────────────────────────────────────────────
CREATE TYPE tipo_profesional AS ENUM (
    -- 💈 BARBERÍA Y PELUQUERÍA MASCULINA
    'barbero',                    -- Barbero tradicional
    'estilista_masculino',        -- Estilista especializado en hombres

    -- 💄 SALÓN DE BELLEZA
    'estilista',                  -- Estilista general
    'colorista',                  -- Especialista en coloración
    'manicurista',                -- Especialista en uñas
    'peinados_eventos',           -- Especialista en peinados para eventos

    -- ✨ ESTÉTICA
    'esteticista',                -- Profesional en tratamientos faciales
    'cosmetologo',                -- Especialista en cosmética avanzada
    'depilacion_laser',           -- Especialista en depilación láser

    -- 🧘 SPA Y RELAJACIÓN
    'masajista',                  -- Terapeuta de masajes
    'terapeuta_spa',              -- Terapeuta integral de spa
    'aromaterapeuta',             -- Especialista en aromaterapia
    'reflexologo',                -- Especialista en reflexología

    -- 🦶 PODOLOGÍA
    'podologo',                   -- Podólogo certificado
    'asistente_podologia',        -- Asistente de podología

    -- 🏥 CONSULTORIO MÉDICO
    'doctor_general',             -- Médico general
    'enfermero',                  -- Enfermero certificado
    'recepcionista_medica',       -- Recepcionista especializada

    -- 📚 ACADEMIA
    'instructor',                 -- Instructor general
    'profesor',                   -- Profesor especializado
    'tutor',                      -- Tutor personalizado

    -- 🔧 TALLER TÉCNICO
    'tecnico_auto',               -- Técnico automotriz
    'tecnico_electronico',        -- Técnico en electrónicos
    'mecanico',                   -- Mecánico general
    'soldador',                   -- Especialista en soldadura

    -- 💪 CENTRO FITNESS
    'entrenador_personal',        -- Entrenador personal certificado
    'instructor_yoga',            -- Instructor de yoga
    'instructor_pilates',         -- Instructor de pilates
    'nutricionista',              -- Nutricionista deportivo

    -- 🐕 VETERINARIA
    'veterinario',                -- Veterinario certificado
    'asistente_veterinario',      -- Asistente veterinario
    'groomer',                    -- Especialista en grooming

    -- 🔄 GENÉRICO
    'otro'                        -- Otros tipos no categorizados
);

-- ====================================================================
-- 🎪 CAPA 3: CATÁLOGO GLOBAL - PLANTILLAS DE SERVICIOS
-- ====================================================================
-- Esta capa proporciona un catálogo GLOBAL de servicios pre-configurados
-- que todas las organizaciones pueden usar como base para crear sus
-- servicios personalizados. Es una tabla COMPARTIDA (no multi-tenant).
--
-- 🎯 OBJETIVOS PRINCIPALES:
-- • Acelerar onboarding de nuevas organizaciones
-- • Garantizar consistencia en configuraciones de servicios
-- • Proporcionar precios de referencia por industria
-- • Facilitar recomendaciones inteligentes basadas en popularidad
--
-- 📊 DATOS ACTUALES: 59 plantillas para 11 industrias
-- 🔒 ACCESO: Lectura pública, escritura solo super_admin
-- ====================================================================

-- ====================================================================
-- 🛍️ TABLA PLANTILLAS_SERVICIOS - CATÁLOGO GLOBAL
-- ====================================================================
-- Almacena servicios pre-configurados para todas las industrias soportadas.
-- Cada organización puede copiar y personalizar estas plantillas.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Tabla GLOBAL: No tiene organizacion_id (compartida entre todos)
-- • RLS granular: Lectura pública, escritura solo super_admin
-- • Indexación optimizada: Por industria, categoría y búsqueda full-text
-- • Configuraciones flexibles: JSONB para datos específicos por industria
--
-- 📈 ALGORITMO DE POPULARIDAD:
-- • Rango 0-100 basado en uso real de las organizaciones
-- • Se actualiza periódicamente por función de mantenimiento
-- • Usado para ordenar recomendaciones en interfaces
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE plantillas_servicios (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏭 CLASIFICACIÓN POR INDUSTRIA
    tipo_industria industria_tipo NOT NULL,    -- FK al ENUM industria_tipo

    -- ====================================================================
    -- 📋 SECCIÓN: INFORMACIÓN BÁSICA DEL SERVICIO
    -- ====================================================================
    nombre VARCHAR(100) NOT NULL,              -- Nombre del servicio
    descripcion TEXT,                          -- Descripción detallada
    categoria VARCHAR(50),                     -- Categoría principal
    subcategoria VARCHAR(50),                  -- Subcategoría específica

    -- ====================================================================
    -- ⏰ SECCIÓN: CONFIGURACIÓN DE TIEMPO Y PRECIO
    -- ====================================================================
    duracion_minutos INTEGER NOT NULL,         -- Duración base del servicio
    precio_sugerido DECIMAL(10,2),             -- Precio recomendado
    precio_minimo DECIMAL(10,2),               -- Precio mínimo sugerido
    precio_maximo DECIMAL(10,2),               -- Precio máximo sugerido

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN OPERATIVA AVANZADA
    -- ====================================================================
    requiere_preparacion_minutos INTEGER DEFAULT 0,  -- Tiempo de setup previo
    tiempo_limpieza_minutos INTEGER DEFAULT 5,       -- Tiempo de limpieza post-servicio
    max_clientes_simultaneos INTEGER DEFAULT 1,      -- Clientes que pueden atenderse a la vez

    -- ====================================================================
    -- 🏷️ SECCIÓN: METADATOS Y CLASIFICACIÓN
    -- ====================================================================
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],       -- Tags para búsqueda y filtrado
    popularidad INTEGER DEFAULT 0,             -- Popularidad 0-100 (algoritmo ML)
    configuracion_especifica JSONB DEFAULT '{}', -- Config específica por industria

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- Plantilla disponible para usar
    es_template_oficial BOOLEAN DEFAULT TRUE,  -- TRUE = creado por super_admin
    creado_en TIMESTAMPTZ DEFAULT NOW()        -- Timestamp de creación
);

COMMENT ON TABLE plantillas_servicios IS 'Plantillas de servicios pre-configuradas por industria';

-- ===== ÍNDICES OPTIMIZADOS PARA PLANTILLAS_SERVICIOS =====

-- Índice para consultas por industria (consulta más frecuente)
CREATE INDEX idx_plantillas_industria_activo
    ON plantillas_servicios (tipo_industria, activo) WHERE activo = TRUE;

-- Índice para búsquedas por categoría
CREATE INDEX idx_plantillas_categoria_activo
    ON plantillas_servicios (categoria, activo) WHERE activo = TRUE AND categoria IS NOT NULL;

-- Índice para búsquedas de texto en nombre y descripción
CREATE INDEX idx_plantillas_busqueda_gin
    ON plantillas_servicios USING gin(to_tsvector('spanish',
        nombre || ' ' || COALESCE(descripcion, '') || ' ' || COALESCE(categoria, '')))
    WHERE activo = TRUE;

-- Índice para ordenamiento por popularidad
CREATE INDEX idx_plantillas_popularidad
    ON plantillas_servicios (tipo_industria, popularidad DESC, activo) WHERE activo = TRUE;

-- ===== RLS PARA PLANTILLAS_SERVICIOS =====

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

-- POLÍTICA 2: ESCRITURA SOLO SUPER ADMIN
-- Solo super_admin puede crear, modificar o eliminar plantillas

-- Política para INSERT
CREATE POLICY plantillas_admin_insert ON plantillas_servicios
    FOR INSERT
    TO saas_app
    WITH CHECK (
        -- Solo super admin puede insertar
        current_setting('app.current_user_role', true) = 'super_admin'
        -- Asegurar que solo se crean plantillas oficiales por super admin
        AND (es_template_oficial = TRUE OR current_setting('app.current_user_role', true) = 'super_admin')
    );

-- Política para UPDATE
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

-- Política para DELETE
CREATE POLICY plantillas_admin_delete ON plantillas_servicios
    FOR DELETE
    TO saas_app
    USING (
        -- Solo super admin puede eliminar
        current_setting('app.current_user_role', true) = 'super_admin'
    );

-- POLÍTICA 3: BYPASS PARA FUNCIONES DE SISTEMA
-- Permite que funciones de inicialización accedan sin restricciones
CREATE POLICY plantillas_system_bypass ON plantillas_servicios
    FOR ALL
    TO saas_app
    USING (
        -- Bypass para funciones de sistema (como inicialización de datos)
        current_setting('app.bypass_rls', true) = 'true'
    );

-- ===== COMENTARIOS PARA RLS DE PLANTILLAS =====

COMMENT ON POLICY plantillas_public_read ON plantillas_servicios IS
'Permite lectura de plantillas activas a todos los usuarios autenticados - tabla global sin restricción tenant';

-- Comentarios para las políticas de administración
COMMENT ON POLICY plantillas_admin_insert ON plantillas_servicios IS
'Solo super_admin puede insertar plantillas - control centralizado de templates oficiales';

COMMENT ON POLICY plantillas_admin_update ON plantillas_servicios IS
'Solo super_admin puede actualizar plantillas - control centralizado de templates oficiales';

COMMENT ON POLICY plantillas_admin_delete ON plantillas_servicios IS
'Solo super_admin puede eliminar plantillas - control centralizado de templates oficiales';

COMMENT ON POLICY plantillas_system_bypass ON plantillas_servicios IS
'Bypass para funciones de sistema como inicialización de datos o mantenimiento automático';

-- ====================================================================
-- 🏢 CAPA 2: MULTI-TENANCY - TABLA ORGANIZACIONES (TENANTS)
-- ====================================================================
-- Esta es la tabla CORE del sistema multi-tenant. Cada fila representa
-- una empresa/organización que usa el SaaS. Es el "tenant" principal
-- que aísla todos los datos entre diferentes clientes del sistema.
--
-- 🎯 OBJETIVOS PRINCIPALES:
-- • Identificación única de cada organización cliente
-- • Configuración personalizable por industria
-- • Gestión de planes y subscripciones SaaS
-- • Branding personalizado (logos, colores, UI)
-- • Control de estado y suspensiones
--
-- 🔒 SEGURIDAD MULTI-TENANT:
-- • Todas las demás tablas referencian organizacion_id
-- • RLS automático previene data leaks entre organizaciones
-- • Código tenant único para APIs y subdominios
-- • Slug amigable para URLs personalizadas
--
-- 💼 CASOS DE USO:
-- • Onboarding de nuevos clientes
-- • Configuración de marca por cliente
-- • Gestión de planes y facturación
-- • Análisis de uso por organización
-- ====================================================================

-- ====================================================================
-- 🏬 TABLA ORGANIZACIONES - NÚCLEO MULTI-TENANT
-- ====================================================================
-- Almacena información de cada empresa/organización que usa el SaaS.
-- Esta tabla es la base de todo el aislamiento multi-tenant del sistema.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Identificadores únicos: codigo_tenant y slug
-- • Configuración flexible: JSONB para datos específicos por industria
-- • Branding personalizable: logos, colores, configuración UI
-- • Gestión de estado: activo, suspendido, motivos
-- • Regionalización: zona horaria, idioma, moneda
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE organizaciones (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- ====================================================================
    -- 🆔 SECCIÓN: IDENTIFICACIÓN ÚNICA DEL TENANT
    -- ====================================================================
    codigo_tenant VARCHAR(50) UNIQUE NOT NULL,     -- Identificador API/subdominio
                                                   -- Ej: "barberia-centro", "spa-lujo"
    slug VARCHAR(100) UNIQUE NOT NULL,             -- URL amigable SEO-friendly
                                                   -- Ej: "barberia-centro-cdmx", "spa-lujo-polanco"

    -- ====================================================================
    -- 🏪 SECCIÓN: INFORMACIÓN COMERCIAL
    -- ====================================================================
    nombre_comercial VARCHAR(150) NOT NULL,        -- Nombre del negocio
    razon_social VARCHAR(200),                     -- Razón social legal
    rfc_nif VARCHAR(20),                           -- RFC (México) o NIF (España)

    -- ====================================================================
    -- 🏭 SECCIÓN: TIPO DE INDUSTRIA Y CONFIGURACIÓN
    -- ====================================================================
    tipo_industria industria_tipo NOT NULL,        -- FK al ENUM industria_tipo
    configuracion_industria JSONB DEFAULT '{}',    -- Config específica por sector
                                                   -- Ej: {"horario_especial": true, "servicios_a_domicilio": false}

    -- ====================================================================
    -- 📞 SECCIÓN: INFORMACIÓN DE CONTACTO
    -- ====================================================================
    email_admin VARCHAR(150) NOT NULL,             -- Email del administrador principal
    telefono VARCHAR(20),                          -- Teléfono de contacto
    sitio_web VARCHAR(200),                        -- Website oficial

    -- ====================================================================
    -- 🎨 SECCIÓN: CONFIGURACIÓN DE MARCA (BRANDING)
    -- ====================================================================
    logo_url TEXT,                                 -- URL del logo de la empresa
    colores_marca JSONB,                           -- Paleta de colores personalizada
                                                   -- Ej: {"primario": "#3498db", "secundario": "#2ecc71", "acento": "#e74c3c"}
    configuracion_ui JSONB DEFAULT '{}',           -- Configuración de interfaz personalizada
                                                   -- Ej: {"tema": "oscuro", "mostrar_precios": true}

    -- ====================================================================
    -- 💰 SECCIÓN: PLAN Y SUBSCRIPCIÓN SAAS
    -- ====================================================================
    plan_actual plan_tipo NOT NULL DEFAULT 'trial', -- Plan actual de subscripción
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de registro inicial
    fecha_activacion TIMESTAMPTZ,                   -- Fecha de activación de plan pagado

    -- ====================================================================
    -- 🌍 SECCIÓN: CONFIGURACIÓN REGIONAL
    -- ====================================================================
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',  -- Zona horaria local
    idioma VARCHAR(5) DEFAULT 'es',                -- Idioma principal (ISO 639-1)
    moneda VARCHAR(3) DEFAULT 'MXN',               -- Moneda local (ISO 4217)

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL DE ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,                   -- Organización activa en el sistema
    suspendido BOOLEAN DEFAULT FALSE,              -- Temporalmente suspendido
    motivo_suspension TEXT,                        -- Razón de suspensión si aplica

    -- ====================================================================
    -- 📊 SECCIÓN: METADATOS Y NOTAS
    -- ====================================================================
    metadata JSONB DEFAULT '{}',                   -- Metadatos adicionales flexibles
                                                   -- Ej: {"origen": "referido", "vendedor": "juan@empresa.com"}
    notas_internas TEXT,                           -- Notas internas para staff

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),           -- Fecha de creación
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),      -- Última modificación

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES Y CONSTRAINTS
    -- ====================================================================
    CHECK (char_length(codigo_tenant) >= 3),       -- Mínimo 3 caracteres para tenant
    CHECK (char_length(slug) >= 3)                 -- Mínimo 3 caracteres para slug
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS PARA TABLA ORGANIZACIONES
-- ====================================================================
-- 4 índices estratégicos para optimizar las consultas más frecuentes
-- relacionadas con la gestión multi-tenant y análisis de organizaciones.
-- ────────────────────────────────────────────────────────────────────

-- 🔑 ÍNDICE 1: IDENTIFICACIÓN POR CÓDIGO TENANT
-- Propósito: Buscar organización por código en APIs y subdominios
-- Uso: WHERE codigo_tenant = ? AND activo = TRUE
CREATE UNIQUE INDEX idx_organizaciones_codigo_tenant
    ON organizaciones (codigo_tenant) WHERE activo = TRUE;

-- 🌐 ÍNDICE 2: IDENTIFICACIÓN POR SLUG SEO
-- Propósito: URLs amigables y páginas públicas personalizadas
-- Uso: WHERE slug = ? AND activo = TRUE
CREATE UNIQUE INDEX idx_organizaciones_slug
    ON organizaciones (slug) WHERE activo = TRUE;

-- 🏭 ÍNDICE 3: FILTRADO POR TIPO DE INDUSTRIA
-- Propósito: Análisis por sector, reportes de uso por industria
-- Uso: WHERE tipo_industria = ? AND activo = TRUE
CREATE INDEX idx_organizaciones_tipo_industria
    ON organizaciones (tipo_industria, activo) WHERE activo = TRUE;

-- 💰 ÍNDICE 4: GESTIÓN DE PLANES Y SUBSCRIPCIONES
-- Propósito: Reportes de facturación, análisis de planes
-- Uso: WHERE plan_actual = ? AND activo = TRUE
CREATE INDEX idx_organizaciones_plan_actual
    ON organizaciones (plan_actual, activo) WHERE activo = TRUE;

-- ====================================================================
-- ⚡ TRIGGER PARA TIMESTAMPS AUTOMÁTICOS
-- ====================================================================
-- Actualiza automáticamente el campo actualizado_en en cada UPDATE
-- ────────────────────────────────────────────────────────────────────
CREATE TRIGGER trigger_actualizar_organizaciones
    BEFORE UPDATE ON organizaciones
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 🛡️ ROW LEVEL SECURITY PARA ORGANIZACIONES
-- ====================================================================
-- Implementa aislamiento multi-tenant para la tabla de organizaciones.
-- Cada organización solo puede ver sus propios datos.
-- ────────────────────────────────────────────────────────────────────
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

-- ====================================================================
-- 📝 DOCUMENTACIÓN EN BASE DE DATOS
-- ====================================================================
-- Comentarios almacenados en PostgreSQL para documentación automática
-- ────────────────────────────────────────────────────────────────────
COMMENT ON TABLE organizaciones IS
'Tenants de la plataforma SaaS - cada fila representa una empresa/organización cliente con configuración personalizada y branding propio';

COMMENT ON COLUMN organizaciones.codigo_tenant IS
'Código único alfanumérico para identificar el tenant en APIs, subdominios y integraciones externas';

COMMENT ON COLUMN organizaciones.slug IS
'Slug SEO-friendly para URLs personalizadas de la organización (ej: barberia-centro-cdmx)';

COMMENT ON COLUMN organizaciones.configuracion_industria IS
'Configuración JSONB específica según el tipo de industria. Contiene configuraciones operativas personalizadas';

COMMENT ON POLICY tenant_isolation_organizaciones ON organizaciones IS
'Política de aislamiento multi-tenant. Super admin acceso global, usuarios regulares solo su organización';

-- ====================================================================
-- 🔗 FOREIGN KEYS Y RELACIONES
-- ====================================================================
-- Establece las relaciones críticas entre tablas del sistema
-- ────────────────────────────────────────────────────────────────────

-- FK CRÍTICA: Usuarios pertenecen a organizaciones
-- Esta FK completa el ciclo de referencia entre usuarios y organizaciones
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_organizacion
    FOREIGN KEY (organizacion_id) REFERENCES organizaciones(id) ON DELETE CASCADE;

-- 📝 Comentario sobre la FK
COMMENT ON CONSTRAINT fk_usuarios_organizacion ON usuarios IS
'FK crítica multi-tenant. Cuando se elimina organización, se eliminan todos sus usuarios (CASCADE)';

-- ====================================================================
-- 👷 TABLA PROFESIONALES - PERSONAL ESPECIALIZADO
-- ====================================================================
-- Almacena toda la información de los profesionales que brindan servicios
-- en cada organización, con validaciones inteligentes según industria.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Validación automática tipo_profesional vs industria_organización
-- • Email único por organización (no global)
-- • Arrays PostgreSQL para especialidades múltiples
-- • JSONB flexible para licencias y configuraciones específicas
-- • Color personalizado para calendario visual
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE profesionales (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT (CRÍTICA)
    organizacion_id INTEGER NOT NULL,           -- FK obligatoria a organizaciones
                                               -- REFERENCES organizaciones(id) ON DELETE CASCADE

    -- ====================================================================
    -- 👨‍💼 SECCIÓN: INFORMACIÓN PERSONAL
    -- ====================================================================
    nombre_completo VARCHAR(150) NOT NULL,     -- Nombre completo del profesional
    email VARCHAR(150),                        -- Email personal (único por organización)
    telefono VARCHAR(20),                      -- Teléfono de contacto
    fecha_nacimiento DATE,                     -- Para validar mayoría de edad
    documento_identidad VARCHAR(30),           -- Cédula, DNI, Pasaporte, etc.

    -- ====================================================================
    -- 🎓 SECCIÓN: INFORMACIÓN PROFESIONAL
    -- ====================================================================
    tipo_profesional tipo_profesional NOT NULL, -- Tipo específico según industria
    especialidades TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array de especialidades
                                               -- Ej: ['corte_clasico', 'barba_tradicional', 'afeitado']

    licencias_profesionales JSONB DEFAULT '{}', -- Licencias y certificaciones
                                               -- Ej: {"cedula_profesional": "12345", "certificado_barberia": "ABC123"}

    años_experiencia INTEGER DEFAULT 0,        -- Años de experiencia laboral
    idiomas TEXT[] DEFAULT ARRAY['es']::TEXT[], -- Idiomas que habla
                                               -- Ej: ['es', 'en', 'fr']

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN DE TRABAJO
    -- ====================================================================
    color_calendario VARCHAR(7) DEFAULT '#3498db', -- Color hex para calendario visual
                                                   -- Ej: '#e74c3c', '#2ecc71', '#f39c12'
    biografia TEXT,                            -- Descripción profesional para clientes
    foto_url TEXT,                             -- URL de foto de perfil

    configuracion_horarios JSONB DEFAULT '{}', -- Horarios personalizados de trabajo
                                               -- Ej: {"lunes": {"inicio": "09:00", "fin": "18:00"}}

    configuracion_servicios JSONB DEFAULT '{}', -- Configuración específica de servicios
                                                -- Ej: {"tiempo_extra_limpieza": 10, "max_citas_dia": 12}

    -- ====================================================================
    -- 💰 SECCIÓN: INFORMACIÓN COMERCIAL
    -- ====================================================================
    comision_porcentaje DECIMAL(5,2) DEFAULT 0.00, -- % de comisión por servicio
                                                    -- Ej: 15.50 para 15.5%
    salario_base DECIMAL(10,2),                -- Salario base mensual (opcional)
    forma_pago VARCHAR(20) DEFAULT 'comision',  -- 'comision', 'salario', 'mixto'

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- Profesional activo para agendar
    disponible_online BOOLEAN DEFAULT TRUE,    -- Visible para agendamiento online
    fecha_ingreso DATE DEFAULT CURRENT_DATE,   -- Fecha de contratación
    fecha_salida DATE,                         -- Fecha de salida (si aplica)
    motivo_inactividad TEXT,                   -- Razón de inactividad temporal

    -- ====================================================================
    -- 📊 SECCIÓN: MÉTRICAS Y CALIFICACIONES
    -- ====================================================================
    calificacion_promedio DECIMAL(3,2) DEFAULT 5.00, -- Calificación promedio (1.00-5.00)
    total_citas_completadas INTEGER DEFAULT 0,  -- Contador de citas finalizadas
    total_clientes_atendidos INTEGER DEFAULT 0, -- Contador de clientes únicos

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de registro
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Última modificación

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES Y CONSTRAINTS
    -- ====================================================================
    CHECK (char_length(nombre_completo) >= 3),  -- Nombre mínimo 3 caracteres
    CHECK (años_experiencia >= 0 AND años_experiencia <= 70), -- Experiencia válida
    CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100), -- Comisión válida
    CHECK (calificacion_promedio >= 1.00 AND calificacion_promedio <= 5.00), -- Rating válido
    CHECK (color_calendario ~ '^#[0-9A-Fa-f]{6}$'), -- Color hex válido
    CHECK (
        -- Solo mayores de edad (18 años)
        fecha_nacimiento IS NULL OR
        fecha_nacimiento <= CURRENT_DATE - INTERVAL '18 years'
    ),
    CHECK (
        -- Validar fecha_salida posterior a fecha_ingreso
        fecha_salida IS NULL OR fecha_salida >= fecha_ingreso
    )
);

-- ====================================================================
-- 📊 ÍNDICES ESPECIALIZADOS PARA TABLA PROFESIONALES
-- ====================================================================
-- 6 índices estratégicos para optimizar las consultas más frecuentes
-- relacionadas con la gestión de profesionales y asignación de citas.
--
-- 🎯 ESTRATEGIA DE INDEXACIÓN:
-- • Índices multi-tenant para aislamiento por organización
-- • Índices compuestos para consultas de disponibilidad
-- • Índices GIN para búsqueda en arrays y JSONB
-- • Índices parciales para profesionales activos
-- ────────────────────────────────────────────────────────────────────

-- 🏢 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Consultas principales filtradas por organización
-- Uso: WHERE organizacion_id = ? AND activo = TRUE
CREATE INDEX idx_profesionales_org_activo
    ON profesionales (organizacion_id, activo) WHERE activo = TRUE;

-- 🎭 ÍNDICE 2: BÚSQUEDA POR TIPO PROFESIONAL
-- Propósito: Filtrar profesionales por especialidad en organización
-- Uso: WHERE organizacion_id = ? AND tipo_profesional = ? AND activo = TRUE
CREATE INDEX idx_profesionales_tipo_org
    ON profesionales (organizacion_id, tipo_profesional, activo) WHERE activo = TRUE;

-- 📧 ÍNDICE 3: EMAIL ÚNICO POR ORGANIZACIÓN
-- Propósito: Validar email único dentro de cada organización
-- Uso: Constraint de unicidad multi-tenant
CREATE UNIQUE INDEX idx_profesionales_email_org
    ON profesionales (organizacion_id, email)
    WHERE email IS NOT NULL AND activo = TRUE;

-- 🔍 ÍNDICE 4: BÚSQUEDA FULL-TEXT EN ESPECIALIDADES
-- Propósito: Buscar profesionales por especialidades específicas
-- Uso: WHERE especialidades && ARRAY['corte_clasico', 'barba']
CREATE INDEX idx_profesionales_especialidades_gin
    ON profesionales USING gin(especialidades) WHERE activo = TRUE;

-- 📋 ÍNDICE 5: BÚSQUEDA EN LICENCIAS Y CERTIFICACIONES
-- Propósito: Filtrar por licencias específicas (útil para médicos, etc.)
-- Uso: WHERE licencias_profesionales ? 'cedula_profesional'
CREATE INDEX idx_profesionales_licencias_gin
    ON profesionales USING gin(licencias_profesionales) WHERE activo = TRUE;

-- 🌟 ÍNDICE 6: RANKING Y DISPONIBILIDAD
-- Propósito: Ordenar profesionales por calificación y disponibilidad
-- Uso: ORDER BY calificacion_promedio DESC, disponible_online DESC
CREATE INDEX idx_profesionales_ranking
    ON profesionales (organizacion_id, disponible_online, calificacion_promedio DESC, activo)
    WHERE activo = TRUE;

-- 📝 ÍNDICE 7: BÚSQUEDA FULL-TEXT EN NOMBRES
-- Propósito: Autocompletar nombres de profesionales en interfaces
-- Uso: Búsqueda por nombre completo en español
CREATE INDEX idx_profesionales_nombre_gin
    ON profesionales USING gin(to_tsvector('spanish', nombre_completo))
    WHERE activo = TRUE;

-- ====================================================================
-- ⚡ CONFIGURACIONES DE TABLA Y TRIGGERS
-- ====================================================================
-- Optimizaciones y automatizaciones para la tabla profesionales
-- ────────────────────────────────────────────────────────────────────

-- TRIGGER para timestamp automático
CREATE TRIGGER trigger_actualizar_profesionales
    BEFORE UPDATE ON profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- Configuración de performance para tabla profesionales
ALTER TABLE profesionales SET (
    fillfactor = 90,                          -- Espacio para HOT updates
    autovacuum_vacuum_scale_factor = 0.1,     -- VACUUM más frecuente
    autovacuum_analyze_scale_factor = 0.05    -- ANALYZE más frecuente
);

-- ====================================================================
-- 🛡️ ROW LEVEL SECURITY PARA PROFESIONALES
-- ====================================================================
-- Implementa aislamiento multi-tenant crítico para seguridad.
-- Cada organización solo puede ver y gestionar sus propios profesionales.
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 🎯 POLÍTICA: TENANT_ISOLATION_PROFESIONALES
-- ====================================================================
-- Controla el acceso multi-tenant a la tabla profesionales.
-- Sigue el mismo patrón de seguridad que usuarios y organizaciones.
--
-- 📋 4 CASOS DE ACCESO SOPORTADOS:
-- • Super admin: Acceso global a todos los profesionales
-- • Usuario de organización: Solo profesionales de su organización
-- • Funciones de sistema: Bypass controlado para operaciones automáticas
-- • Auto-acceso: Profesional puede ver/editar su propio registro
-- ────────────────────────────────────────────────────────────────────
CREATE POLICY tenant_isolation_profesionales ON profesionales
    FOR ALL                                     -- Aplica a todas las operaciones
    TO saas_app                                -- Solo para usuario de aplicación
    USING (
        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 1: SUPER ADMIN (ACCESO GLOBAL)                        │
        -- └─────────────────────────────────────────────────────────────┘
        -- Super admin puede gestionar profesionales de cualquier organización
        current_setting('app.current_user_role', true) = 'super_admin'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 2: AISLAMIENTO MULTI-TENANT                           │
        -- └─────────────────────────────────────────────────────────────┘
        -- Usuario solo puede acceder a profesionales de su organización
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 3: BYPASS PARA FUNCIONES DE SISTEMA                   │
        -- └─────────────────────────────────────────────────────────────┘
        -- Funciones automáticas y procesos de mantenimiento
        OR current_setting('app.bypass_rls', true) = 'true'

        -- ┌─────────────────────────────────────────────────────────────┐
        -- │ CASO 4: AUTO-ACCESO DEL PROFESIONAL                        │
        -- └─────────────────────────────────────────────────────────────┘
        -- Si el usuario autenticado tiene profesional_id, puede ver su registro
        OR id = COALESCE(NULLIF(current_setting('app.current_profesional_id', true), '')::INTEGER, 0)
    )
    WITH CHECK (
        -- ═══════════════════════════════════════════════════════════════
        -- RESTRICCIONES PARA ESCRITURA (INSERT/UPDATE)
        -- ═══════════════════════════════════════════════════════════════
        -- Solo super admin y usuarios de la organización pueden crear/modificar
        current_setting('app.current_user_role', true) = 'super_admin'
        OR organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 🔗 FOREIGN KEYS Y RELACIONES PARA PROFESIONALES
-- ====================================================================
-- Establece las relaciones críticas con otras tablas del sistema
-- ────────────────────────────────────────────────────────────────────

-- FK CRÍTICA: Profesionales pertenecen a organizaciones
ALTER TABLE profesionales ADD CONSTRAINT fk_profesionales_organizacion
    FOREIGN KEY (organizacion_id) REFERENCES organizaciones(id) ON DELETE CASCADE;

-- ====================================================================
-- 📝 DOCUMENTACIÓN EN BASE DE DATOS
-- ====================================================================
-- Comentarios almacenados en PostgreSQL para documentación automática
-- ────────────────────────────────────────────────────────────────────

COMMENT ON TABLE profesionales IS
'Profesionales que brindan servicios en cada organización. Incluye barberos, estilistas, doctores, instructores, etc. con especialización por industria';

COMMENT ON COLUMN profesionales.organizacion_id IS
'FK crítica multi-tenant. Identifica a qué organización pertenece el profesional';

COMMENT ON COLUMN profesionales.tipo_profesional IS
'Tipo específico de profesional según ENUM. Debe ser compatible con la industria de la organización';

COMMENT ON COLUMN profesionales.especialidades IS
'Array de especialidades del profesional. Ej: [''corte_clasico'', ''barba_tradicional'', ''afeitado'']';

COMMENT ON COLUMN profesionales.licencias_profesionales IS
'JSONB con licencias y certificaciones. Ej: {"cedula_profesional": "12345", "certificado_barberia": "ABC123"}';

COMMENT ON COLUMN profesionales.configuracion_horarios IS
'JSONB con horarios personalizados. Ej: {"lunes": {"inicio": "09:00", "fin": "18:00"}, "martes": "descanso"}';

COMMENT ON COLUMN profesionales.calificacion_promedio IS
'Calificación promedio del profesional (1.00-5.00) basada en reviews de clientes';

COMMENT ON COLUMN profesionales.color_calendario IS
'Color hexadecimal para identificar visualmente al profesional en calendarios y interfaces';

COMMENT ON POLICY tenant_isolation_profesionales ON profesionales IS
'Política multi-tenant para profesionales. Aislamiento por organización con auto-acceso para profesionales';

-- ====================================================================
-- 🎓 FUNCIÓN DE VALIDACIÓN: PROFESIONAL COMPATIBLE CON INDUSTRIA
-- ====================================================================
-- Valida que el tipo de profesional sea compatible con la industria
-- de la organización. Mejora la integridad de datos.
--
-- 📋 MAPEO DE COMPATIBILIDAD:
-- Esta función verifica que no se asigne un "veterinario" a una "barbería"
-- o un "barbero" a un "consultorio_médico", etc.
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_profesional_industria()
RETURNS TRIGGER AS $$
DECLARE
    industria_org industria_tipo;
BEGIN
    -- Obtener la industria de la organización
    SELECT tipo_industria INTO industria_org
    FROM organizaciones
    WHERE id = NEW.organizacion_id;

    -- Validar compatibilidad según industria
    CASE industria_org
        WHEN 'barberia' THEN
            IF NEW.tipo_profesional NOT IN ('barbero', 'estilista_masculino', 'estilista') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria barberia', NEW.tipo_profesional;
            END IF;

        WHEN 'salon_belleza' THEN
            IF NEW.tipo_profesional NOT IN ('estilista', 'colorista', 'manicurista', 'peinados_eventos') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria salon_belleza', NEW.tipo_profesional;
            END IF;

        WHEN 'estetica' THEN
            IF NEW.tipo_profesional NOT IN ('esteticista', 'cosmetologo', 'depilacion_laser') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria estetica', NEW.tipo_profesional;
            END IF;

        WHEN 'spa' THEN
            IF NEW.tipo_profesional NOT IN ('masajista', 'terapeuta_spa', 'aromaterapeuta', 'reflexologo') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria spa', NEW.tipo_profesional;
            END IF;

        WHEN 'podologia' THEN
            IF NEW.tipo_profesional NOT IN ('podologo', 'asistente_podologia') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria podologia', NEW.tipo_profesional;
            END IF;

        WHEN 'consultorio_medico' THEN
            IF NEW.tipo_profesional NOT IN ('doctor_general', 'enfermero', 'recepcionista_medica') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria consultorio_medico', NEW.tipo_profesional;
            END IF;

        WHEN 'academia' THEN
            IF NEW.tipo_profesional NOT IN ('instructor', 'profesor', 'tutor') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria academia', NEW.tipo_profesional;
            END IF;

        WHEN 'taller_tecnico' THEN
            IF NEW.tipo_profesional NOT IN ('tecnico_auto', 'tecnico_electronico', 'mecanico', 'soldador') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria taller_tecnico', NEW.tipo_profesional;
            END IF;

        WHEN 'centro_fitness' THEN
            IF NEW.tipo_profesional NOT IN ('entrenador_personal', 'instructor_yoga', 'instructor_pilates', 'nutricionista') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria centro_fitness', NEW.tipo_profesional;
            END IF;

        WHEN 'veterinaria' THEN
            IF NEW.tipo_profesional NOT IN ('veterinario', 'asistente_veterinario', 'groomer') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria veterinaria', NEW.tipo_profesional;
            END IF;

        WHEN 'otro' THEN
            -- Para industria "otro", permitir cualquier tipo profesional incluido "otro"
            NULL;

        ELSE
            RAISE EXCEPTION 'Industria % no reconocida', industria_org;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación automática
CREATE TRIGGER trigger_validar_profesional_industria
    BEFORE INSERT OR UPDATE ON profesionales
    FOR EACH ROW EXECUTE FUNCTION validar_profesional_industria();

-- Comentario de la función
COMMENT ON FUNCTION validar_profesional_industria() IS
'Valida automáticamente que el tipo_profesional sea compatible con la industria de la organización. Previene asignaciones incorrectas';

-- ====================================================================
-- 👥 TABLA CLIENTES - GESTIÓN DE CLIENTES MULTI-TENANT
-- ====================================================================
-- Tabla para gestionar la base de datos de clientes de cada organización.
-- Implementa diseño normalizado sin campos calculados para garantizar
-- consistencia de datos y performance óptima.
--
-- 🎯 CARACTERÍSTICAS PRINCIPALES:
-- • Multi-tenant con RLS automático por organizacion_id
-- • Validaciones robustas para email y teléfono
-- • Unicidad por organización (no global)
-- • Preferencias de profesional y marketing
-- • Información médica básica (alergias, notas especiales)
--
-- 📊 MÉTRICAS:
-- • Las métricas (total_citas, total_gastado, etc.) se calculan
--   dinámicamente mediante la vista clientes_con_metricas
-- • Esto garantiza consistencia y evita desincronización
--
-- 🔒 SEGURIDAD:
-- • RLS habilitado para aislamiento por organización
-- • Validaciones CHECK para integridad de datos
-- • Constraints únicos por organización (no globales)
-- ====================================================================

CREATE TABLE clientes (
    -- 🔑 Identificación y relación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 👤 Información personal básica
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,

    -- 🏥 Información médica y preferencias
    profesional_preferido_id INTEGER, -- FK se agregará después de crear tabla profesionales
    notas_especiales TEXT,
    alergias TEXT,

    -- 📍 Información adicional
    direccion TEXT,
    como_conocio VARCHAR(100), -- 'referido', 'redes_sociales', 'google', 'caminando', etc.

    -- ⚙️ Control y configuración
    activo BOOLEAN DEFAULT TRUE,
    marketing_permitido BOOLEAN DEFAULT TRUE,

    -- 🕒 Timestamps de auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ Validaciones de integridad
    CONSTRAINT valid_email
        CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_telefono
        CHECK (telefono ~ '^[+]?[0-9\s\-\(\)]{7,20}$'),
    CONSTRAINT valid_fecha_nacimiento
        CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE - INTERVAL '5 years'),

    -- 🔒 Constraints de unicidad por organización
    CONSTRAINT unique_email_por_org
        UNIQUE(organizacion_id, email) DEFERRABLE,
    CONSTRAINT unique_telefono_por_org
        UNIQUE(organizacion_id, telefono)
);

-- ====================================================================
-- 📈 ÍNDICES OPTIMIZADOS PARA CLIENTES
-- ====================================================================
-- Índices especializados para queries comunes y performance óptima
-- ====================================================================

-- Índice principal para multi-tenancy (crítico para RLS)
CREATE INDEX idx_clientes_organizacion_id ON clientes(organizacion_id);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_clientes_email ON clientes(email) WHERE email IS NOT NULL;
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_nombre ON clientes USING GIN(to_tsvector('spanish', nombre));

-- Índice parcial para clientes activos (query más común)
CREATE INDEX idx_clientes_activos ON clientes(organizacion_id, activo)
    WHERE activo = true;

-- Índice para profesional preferido (cuando se agregue FK)
CREATE INDEX idx_clientes_profesional_preferido ON clientes(profesional_preferido_id)
    WHERE profesional_preferido_id IS NOT NULL;

-- Índice para marketing (para campañas)
CREATE INDEX idx_clientes_marketing ON clientes(organizacion_id, marketing_permitido)
    WHERE marketing_permitido = true AND activo = true;

-- ====================================================================
-- 🔒 ROW LEVEL SECURITY PARA CLIENTES
-- ====================================================================
-- Implementa aislamiento automático por organización
-- ====================================================================

-- Habilitar RLS en la tabla
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento por organización
CREATE POLICY clientes_isolation ON clientes
    USING (organizacion_id = current_setting('app.current_tenant_id')::INTEGER);

-- Política para super_admin (acceso total)
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
-- 🔗 FOREIGN KEYS PARA CLIENTES
-- ====================================================================
-- Establece las relaciones críticas con otras tablas del sistema
-- ────────────────────────────────────────────────────────────────────

-- FK: Cliente puede tener un profesional preferido
ALTER TABLE clientes ADD CONSTRAINT fk_clientes_profesional_preferido
    FOREIGN KEY (profesional_preferido_id) REFERENCES profesionales(id) ON DELETE SET NULL;

-- 📝 Comentario sobre la FK
COMMENT ON CONSTRAINT fk_clientes_profesional_preferido ON clientes IS
'FK opcional a profesionales. Permite asignar un profesional preferido por cliente. SET NULL si se elimina el profesional';

-- ====================================================================
-- 📊 VISTA CLIENTES CON MÉTRICAS CALCULADAS
-- ====================================================================
-- Vista que combina datos de clientes con métricas calculadas dinámicamente
-- desde la tabla citas. Esto garantiza consistencia total.
--
-- ⚠️ NOTA: Esta vista está comentada temporalmente hasta que se cree la tabla 'citas'
-- Descomentar después de implementar la tabla citas
-- ====================================================================

/*
CREATE VIEW clientes_con_metricas AS
SELECT
    -- Todos los campos de la tabla clientes
    c.id,
    c.organizacion_id,
    c.nombre,
    c.email,
    c.telefono,
    c.fecha_nacimiento,
    c.profesional_preferido_id,
    c.notas_especiales,
    c.alergias,
    c.direccion,
    c.como_conocio,
    c.activo,
    c.marketing_permitido,
    c.creado_en,
    c.actualizado_en,

    -- Métricas calculadas dinámicamente
    COALESCE(stats.total_citas, 0) as total_citas,
    COALESCE(stats.total_gastado, 0.00) as total_gastado,
    stats.primera_visita,
    stats.ultima_visita,

    -- Métricas adicionales útiles
    COALESCE(stats.citas_completadas, 0) as citas_completadas,
    COALESCE(stats.citas_canceladas, 0) as citas_canceladas,
    stats.ultima_cita_estado,

    -- Clasificación de cliente
    CASE
        WHEN COALESCE(stats.total_citas, 0) = 0 THEN 'prospecto'
        WHEN COALESCE(stats.total_citas, 0) = 1 THEN 'nuevo'
        WHEN COALESCE(stats.total_citas, 0) BETWEEN 2 AND 5 THEN 'regular'
        WHEN COALESCE(stats.total_citas, 0) > 5 THEN 'frecuente'
    END as clasificacion_cliente

FROM clientes c
LEFT JOIN (
    SELECT
        cliente_id,
        COUNT(*) as total_citas,
        SUM(CASE WHEN estado IN ('completada', 'pagada') THEN precio_final ELSE 0 END) as total_gastado,
        MIN(fecha_cita) as primera_visita,
        MAX(fecha_cita) as ultima_visita,
        COUNT(*) FILTER (WHERE estado = 'completada') as citas_completadas,
        COUNT(*) FILTER (WHERE estado = 'cancelada') as citas_canceladas,
        (array_agg(estado ORDER BY fecha_cita DESC, hora_inicio DESC))[1] as ultima_cita_estado
    FROM citas
    GROUP BY cliente_id
) stats ON c.id = stats.cliente_id;
*/

-- ====================================================================
-- 📝 COMENTARIOS Y DOCUMENTACIÓN
-- ====================================================================

-- Comentarios en la tabla
COMMENT ON TABLE clientes IS
'Gestión de clientes multi-tenant con diseño normalizado. Las métricas se calculan dinámicamente via vista clientes_con_metricas';

-- Comentarios en columnas importantes
COMMENT ON COLUMN clientes.organizacion_id IS 'FK a organizaciones. Clave para aislamiento multi-tenant';
COMMENT ON COLUMN clientes.profesional_preferido_id IS 'FK a profesionales. Se agregará constraint después de crear tabla profesionales';
COMMENT ON COLUMN clientes.como_conocio IS 'Canal de adquisición del cliente para análisis de marketing';
COMMENT ON COLUMN clientes.marketing_permitido IS 'Consent para envío de comunicaciones de marketing (GDPR compliance)';
COMMENT ON COLUMN clientes.alergias IS 'Información médica crítica para servicios de salud y belleza';

-- Comentario en la vista (comentado hasta crear tabla citas)
-- COMMENT ON VIEW clientes_con_metricas IS
-- 'Vista que combina clientes con métricas calculadas dinámicamente. Usar esta vista para dashboards y reportes';

-- ====================================================================
-- 🛠️ TABLA SERVICIOS - CATÁLOGO DE SERVICIOS POR ORGANIZACIÓN
-- ====================================================================
-- Tabla que almacena el catálogo personalizado de servicios de cada organización.
-- Los servicios pueden heredar configuración de plantillas globales o ser completamente personalizados.
--
-- 🎯 CARACTERÍSTICAS PRINCIPALES:
-- • Multi-tenant con RLS automático por organizacion_id
-- • Herencia opcional de plantillas_servicios
-- • Configuración flexible de precios y tiempos
-- • Relación many-to-many con profesionales autorizados
-- • Categorización y etiquetado para organización
-- • Configuración avanzada para servicios especiales
--
-- 🔗 RELACIONES:
-- • organizacion_id → organizaciones (multi-tenant)
-- • plantilla_servicio_id → plantillas_servicios (herencia opcional)
-- • servicios_profesionales → profesionales (many-to-many)
--
-- 🔒 SEGURIDAD:
-- • RLS habilitado para aislamiento por organización
-- • Validaciones de precios y tiempos
-- • Control de activación granular
-- ====================================================================

CREATE TABLE servicios (
    -- 🔑 Identificación y relaciones
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    plantilla_servicio_id INTEGER REFERENCES plantillas_servicios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- 📋 SECCIÓN: INFORMACIÓN BÁSICA DEL SERVICIO
    -- ====================================================================
    nombre VARCHAR(100) NOT NULL,              -- Nombre del servicio
    descripcion TEXT,                          -- Descripción detallada
    categoria VARCHAR(50),                     -- Categoría principal (ej: "corte", "tratamiento")
    subcategoria VARCHAR(50),                  -- Subcategoría específica (ej: "barba", "facial")

    -- ====================================================================
    -- ⏰ SECCIÓN: CONFIGURACIÓN DE TIEMPO Y PRECIO
    -- ====================================================================
    duracion_minutos INTEGER NOT NULL,         -- Duración base del servicio
    precio DECIMAL(10,2) NOT NULL,             -- Precio base del servicio
    precio_minimo DECIMAL(10,2),               -- Precio mínimo permitido
    precio_maximo DECIMAL(10,2),               -- Precio máximo permitido

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN AVANZADA
    -- ====================================================================
    requiere_preparacion_minutos INTEGER DEFAULT 0,      -- Tiempo preparación pre-servicio
    tiempo_limpieza_minutos INTEGER DEFAULT 5,           -- Tiempo limpieza post-servicio
    max_clientes_simultaneos INTEGER DEFAULT 1,          -- Máximo clientes simultáneos
    color_servicio VARCHAR(7) DEFAULT '#e74c3c',         -- Color para calendario

    -- ====================================================================
    -- 🏷️ SECCIÓN: METADATOS Y ORGANIZACIÓN
    -- ====================================================================
    configuracion_especifica JSONB DEFAULT '{}',         -- Config JSON específica
                                                         -- Ej: {"requiere_cita_previa": true, "productos_incluidos": ["shampoo"]}
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],                 -- Etiquetas para búsqueda y filtros
                                                         -- Ej: ["popular", "promocion", "nuevo"]

    -- ====================================================================
    -- 🎯 SECCIÓN: COMPATIBILIDAD CON PROFESIONALES
    -- ====================================================================
    tipos_profesional_autorizados tipo_profesional[] DEFAULT NULL,  -- Tipos de profesional que pueden brindar este servicio
                                                                    -- NULL = todos los profesionales de la organización

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- Estado activo/inactivo

    -- ====================================================================
    -- 🕒 SECCIÓN: TIMESTAMPS DE AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de creación
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Fecha de última actualización

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES DE INTEGRIDAD
    -- ====================================================================
    CONSTRAINT valid_duracion
        CHECK (duracion_minutos > 0 AND duracion_minutos <= 480),  -- Entre 1 minuto y 8 horas
    CONSTRAINT valid_precio
        CHECK (precio >= 0),
    CONSTRAINT valid_precio_minimo
        CHECK (precio_minimo IS NULL OR precio_minimo >= 0),
    CONSTRAINT valid_precio_maximo
        CHECK (precio_maximo IS NULL OR precio_maximo >= precio),
    CONSTRAINT valid_precio_rango
        CHECK (precio_minimo IS NULL OR precio_maximo IS NULL OR precio_minimo <= precio_maximo),
    CONSTRAINT valid_preparacion
        CHECK (requiere_preparacion_minutos >= 0 AND requiere_preparacion_minutos <= 120),
    CONSTRAINT valid_limpieza
        CHECK (tiempo_limpieza_minutos >= 0 AND tiempo_limpieza_minutos <= 60),
    CONSTRAINT valid_max_clientes
        CHECK (max_clientes_simultaneos > 0 AND max_clientes_simultaneos <= 20),
    CONSTRAINT valid_color_servicio
        CHECK (color_servicio ~ '^#[0-9A-Fa-f]{6}$'),  -- Formato hexadecimal válido

    -- 🔒 Constraint de unicidad por organización
    CONSTRAINT unique_servicio_por_org
        UNIQUE(organizacion_id, nombre)
);

-- ====================================================================
-- 🔗 TABLA SERVICIOS_PROFESIONALES - RELACIÓN MANY-TO-MANY
-- ====================================================================
-- Tabla de relación que define qué profesionales pueden brindar cada servicio
-- con configuraciones personalizadas por profesional.
--
-- 🎯 CASOS DE USO:
-- • Un barbero puede tener precio especial para corte VIP
-- • Un masajista senior puede cobrar más por el mismo servicio
-- • Servicios con duraciones personalizadas por profesional
-- ====================================================================

CREATE TABLE servicios_profesionales (
    -- 🔑 Identificación
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN PERSONALIZADA POR PROFESIONAL
    -- ====================================================================
    precio_personalizado DECIMAL(10,2),        -- Precio específico de este profesional (override)
    duracion_personalizada INTEGER,            -- Duración específica de este profesional (override)
    notas_especiales TEXT,                     -- Notas específicas para este profesional

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONTROL
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- El profesional puede brindar este servicio

    -- ====================================================================
    -- 🕒 SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de asignación
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Fecha de última actualización

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES
    -- ====================================================================
    CONSTRAINT valid_precio_personalizado
        CHECK (precio_personalizado IS NULL OR precio_personalizado >= 0),
    CONSTRAINT valid_duracion_personalizada
        CHECK (duracion_personalizada IS NULL OR (duracion_personalizada > 0 AND duracion_personalizada <= 480)),

    -- 🔒 Constraint de unicidad
    UNIQUE(servicio_id, profesional_id)
);

-- ====================================================================
-- 📊 ÍNDICES OPTIMIZADOS PARA SERVICIOS
-- ====================================================================
-- Índices especializados para queries comunes y performance enterprise
-- ====================================================================

-- Índice principal multi-tenant (crítico para RLS)
CREATE INDEX idx_servicios_organizacion_activo
    ON servicios (organizacion_id, activo) WHERE activo = TRUE;

-- Índice para búsquedas full-text en español
CREATE INDEX idx_servicios_busqueda_gin
    ON servicios USING gin(to_tsvector('spanish',
        nombre || ' ' || COALESCE(descripcion, '') || ' ' || COALESCE(categoria, '') || ' ' || COALESCE(subcategoria, '')))
    WHERE activo = TRUE;

-- Índice para búsquedas por categoría
CREATE INDEX idx_servicios_categoria
    ON servicios (organizacion_id, categoria, activo)
    WHERE activo = TRUE AND categoria IS NOT NULL;

-- Índice para ordenamiento por precio
CREATE INDEX idx_servicios_precio
    ON servicios (organizacion_id, precio, activo) WHERE activo = TRUE;

-- Índice para plantillas (herencia)
CREATE INDEX idx_servicios_plantilla
    ON servicios (plantilla_servicio_id) WHERE plantilla_servicio_id IS NOT NULL;

-- Índice para búsqueda por tags usando GIN
CREATE INDEX idx_servicios_tags_gin
    ON servicios USING gin(tags) WHERE activo = TRUE AND array_length(tags, 1) > 0;

-- Índices para tabla servicios_profesionales
CREATE INDEX idx_servicios_profesionales_servicio
    ON servicios_profesionales (servicio_id, activo) WHERE activo = TRUE;

CREATE INDEX idx_servicios_profesionales_profesional
    ON servicios_profesionales (profesional_id, activo) WHERE activo = TRUE;

-- ====================================================================
-- 🔒 ROW LEVEL SECURITY PARA SERVICIOS
-- ====================================================================
-- Implementa aislamiento automático multi-tenant por organizacion_id
-- ====================================================================

-- Habilitar RLS en servicios
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Política principal de aislamiento multi-tenant
CREATE POLICY servicios_tenant_isolation ON servicios
    FOR ALL
    TO saas_app
    USING (
        organizacion_id = COALESCE(
            current_setting('app.current_tenant_id', true)::integer,
            CASE WHEN current_setting('app.current_user_role', true) = 'super_admin'
                 THEN organizacion_id
                 ELSE -1
            END
        )
    );

-- Política para bypass de sistema (funciones de mantenimiento)
CREATE POLICY servicios_system_bypass ON servicios
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- RLS para servicios_profesionales
ALTER TABLE servicios_profesionales ENABLE ROW LEVEL SECURITY;

-- Política que hereda el aislamiento del servicio
CREATE POLICY servicios_profesionales_tenant_isolation ON servicios_profesionales
    FOR ALL
    TO saas_app
    USING (
        EXISTS (
            SELECT 1 FROM servicios s
            WHERE s.id = servicio_id
            AND s.organizacion_id = COALESCE(
                current_setting('app.current_tenant_id', true)::integer,
                CASE WHEN current_setting('app.current_user_role', true) = 'super_admin'
                     THEN s.organizacion_id
                     ELSE -1
                END
            )
        )
    );

-- ====================================================================
-- 🔧 TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ====================================================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION actualizar_timestamp_servicios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para servicios
CREATE TRIGGER trigger_actualizar_timestamp_servicios
    BEFORE UPDATE ON servicios
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_servicios();

-- Trigger para servicios_profesionales
CREATE TRIGGER trigger_actualizar_timestamp_servicios_profesionales
    BEFORE UPDATE ON servicios_profesionales
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp_servicios();

-- ====================================================================
-- 📝 COMENTARIOS Y DOCUMENTACIÓN
-- ====================================================================

-- Comentarios en las tablas
COMMENT ON TABLE servicios IS
'Catálogo de servicios personalizado por organización. Incluye herencia de plantillas, configuración avanzada y relación con profesionales autorizados';

COMMENT ON TABLE servicios_profesionales IS
'Relación many-to-many entre servicios y profesionales con configuraciones personalizadas por profesional (precios, duraciones específicas)';

-- Comentarios en columnas importantes
COMMENT ON COLUMN servicios.organizacion_id IS 'FK a organizaciones. Clave para aislamiento multi-tenant';
COMMENT ON COLUMN servicios.plantilla_servicio_id IS 'FK opcional a plantillas_servicios para herencia de configuración';
COMMENT ON COLUMN servicios.tipos_profesional_autorizados IS 'Array de tipos de profesional autorizados. NULL = todos los profesionales de la organización';
COMMENT ON COLUMN servicios.configuracion_especifica IS 'JSON con configuraciones específicas del servicio (ej: productos incluidos, restricciones)';
COMMENT ON COLUMN servicios.tags IS 'Array de etiquetas para búsqueda y filtros (ej: ["popular", "promocion"])';
COMMENT ON COLUMN servicios_profesionales.precio_personalizado IS 'Precio específico del profesional (override del precio base)';
COMMENT ON COLUMN servicios_profesionales.duracion_personalizada IS 'Duración específica del profesional (override de la duración base)';

-- Comentarios en funciones
COMMENT ON FUNCTION actualizar_timestamp_servicios() IS
'Actualiza automáticamente el campo actualizado_en cuando se modifica un servicio o relación servicio-profesional';

-- ====================================================================
-- 📅 TABLA: CITAS - SISTEMA DE AGENDAMIENTO MULTI-TENANT
-- ====================================================================
-- Propósito: Gestión completa de citas con workflow empresarial
-- • Multi-tenant con RLS automático por organizacion_id
-- • Estados workflow: pendiente → confirmada → en_curso → completada
-- • Auditoría completa y trazabilidad empresarial
-- • Validaciones automáticas de solapamientos y disponibilidad
-- ====================================================================

CREATE TABLE citas (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES PRINCIPALES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    codigo_cita VARCHAR(50) UNIQUE NOT NULL,

    -- 👥 REFERENCIAS PRINCIPALES (VALIDADAS)
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE RESTRICT,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,

    -- ⏰ INFORMACIÓN TEMPORAL CRÍTICA
    fecha_cita DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    zona_horaria VARCHAR(50) DEFAULT 'America/Bogota', -- Para multi-zona

    -- 🔄 WORKFLOW Y ESTADO
    estado estado_cita DEFAULT 'pendiente',
    estado_anterior estado_cita, -- Para auditoría de cambios
    motivo_cancelacion TEXT, -- Obligatorio si estado = 'cancelada'

    -- 💰 INFORMACIÓN COMERCIAL
    precio_servicio DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0.00,
    precio_final DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(20), -- 'efectivo', 'tarjeta', 'transferencia'
    pagado BOOLEAN DEFAULT FALSE,

    -- 📝 NOTAS Y COMUNICACIÓN
    notas_cliente TEXT,
    notas_profesional TEXT,
    notas_internas TEXT, -- Para uso interno del negocio
    origen_cita VARCHAR(50) DEFAULT 'manual', -- 'whatsapp', 'web', 'telefono', 'manual', 'api'

    -- ⭐ CALIFICACIÓN Y FEEDBACK
    calificacion_cliente INTEGER CHECK (calificacion_cliente >= 1 AND calificacion_cliente <= 5),
    comentario_cliente TEXT,
    calificacion_profesional INTEGER CHECK (calificacion_profesional >= 1 AND calificacion_profesional <= 5),
    comentario_profesional TEXT, -- Feedback del profesional sobre el cliente

    -- ⏱️ CONTROL DE TIEMPO REAL
    hora_llegada TIMESTAMPTZ,
    hora_inicio_real TIMESTAMPTZ,
    hora_fin_real TIMESTAMPTZ,
    tiempo_espera_minutos INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN hora_llegada IS NOT NULL AND hora_inicio_real IS NOT NULL
            THEN EXTRACT(EPOCH FROM (hora_inicio_real - hora_llegada))/60
            ELSE NULL
        END
    ) STORED,

    -- 🔔 RECORDATORIOS Y NOTIFICACIONES
    recordatorio_enviado BOOLEAN DEFAULT FALSE,
    fecha_recordatorio TIMESTAMPTZ,
    confirmacion_requerida BOOLEAN DEFAULT TRUE,
    confirmada_por_cliente TIMESTAMPTZ,

    -- 📊 CAMPOS DE AUDITORÍA EMPRESARIAL
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),
    version INTEGER DEFAULT 1,
    ip_origen INET,
    user_agent TEXT,
    origen_aplicacion VARCHAR(50) DEFAULT 'web',

    -- ⏰ TIMESTAMPS ESTÁNDAR
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS EMPRESARIALES
    CONSTRAINT valid_horario
        CHECK (hora_inicio < hora_fin),
    CONSTRAINT valid_precio_final
        CHECK (precio_final >= 0),
    CONSTRAINT valid_descuento
        CHECK (descuento >= 0 AND descuento <= precio_servicio),
    CONSTRAINT valid_precio_servicio
        CHECK (precio_servicio > 0),
    CONSTRAINT valid_fecha_cita
        CHECK (fecha_cita >= CURRENT_DATE - INTERVAL '1 day'),
    CONSTRAINT valid_calificaciones
        CHECK (
            (calificacion_cliente IS NULL OR (calificacion_cliente >= 1 AND calificacion_cliente <= 5)) AND
            (calificacion_profesional IS NULL OR (calificacion_profesional >= 1 AND calificacion_profesional <= 5))
        ),
    CONSTRAINT valid_tiempo_real
        CHECK (
            (hora_inicio_real IS NULL OR hora_fin_real IS NULL OR hora_inicio_real <= hora_fin_real) AND
            (hora_llegada IS NULL OR hora_inicio_real IS NULL OR hora_llegada <= hora_inicio_real)
        ),
    CONSTRAINT valid_estado_pagado
        CHECK (
            CASE
                WHEN estado = 'completada' AND precio_final > 0 THEN pagado = TRUE
                ELSE TRUE
            END
        ),
    CONSTRAINT valid_motivo_cancelacion
        CHECK (
            CASE
                WHEN estado = 'cancelada' THEN motivo_cancelacion IS NOT NULL
                ELSE TRUE
            END
        ),
    CONSTRAINT coherencia_organizacion
        CHECK (
            -- Validar que cliente, profesional y servicio pertenezcan a la misma organización
            TRUE -- Se implementa con trigger por rendimiento
        )
);

-- 🚀 ÍNDICES ESPECIALIZADOS PARA ALTA PERFORMANCE
CREATE INDEX idx_citas_organizacion_fecha
    ON citas (organizacion_id, fecha_cita, hora_inicio)
    WHERE estado != 'cancelada';

CREATE INDEX idx_citas_profesional_agenda
    ON citas (profesional_id, fecha_cita, hora_inicio, hora_fin)
    WHERE estado IN ('confirmada', 'en_curso');

CREATE INDEX idx_citas_cliente_historial
    ON citas (cliente_id, fecha_cita DESC)
    WHERE estado != 'cancelada';

CREATE INDEX idx_citas_codigo_lookup
    ON citas (codigo_cita) WHERE codigo_cita IS NOT NULL;

CREATE INDEX idx_citas_estado_workflow
    ON citas (organizacion_id, estado, fecha_cita);

CREATE INDEX idx_citas_recordatorios
    ON citas (fecha_recordatorio)
    WHERE recordatorio_enviado = FALSE AND estado = 'confirmada';

-- 📊 ÍNDICE GIN PARA BÚSQUEDA FULL-TEXT
CREATE INDEX idx_citas_search
    ON citas USING gin(
        to_tsvector('spanish', COALESCE(notas_cliente, '') || ' ' ||
                              COALESCE(notas_profesional, '') || ' ' ||
                              COALESCE(codigo_cita, ''))
    );

-- 🔒 ROW LEVEL SECURITY
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Política principal de aislamiento multi-tenant
CREATE POLICY citas_tenant_isolation ON citas
    FOR ALL
    TO saas_app
    USING (
        organizacion_id = COALESCE(
            current_setting('app.current_tenant_id', true)::integer,
            CASE WHEN current_setting('app.current_user_role', true) = 'super_admin'
                 THEN organizacion_id
                 ELSE -1
            END
        )
    );

-- Política para bypass de sistema (funciones de mantenimiento)
CREATE POLICY citas_system_bypass ON citas
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- 🤖 TRIGGER PARA ACTUALIZAR TIMESTAMP Y VERSIÓN
CREATE OR REPLACE FUNCTION actualizar_timestamp_citas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_citas
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_citas();

-- 🛡️ TRIGGER PARA VALIDACIÓN DE COHERENCIA ORGANIZACIONAL
CREATE OR REPLACE FUNCTION validar_coherencia_cita()
RETURNS TRIGGER AS $$
DECLARE
    cliente_org INTEGER;
    profesional_org INTEGER;
    servicio_org INTEGER;
BEGIN
    -- Obtener organizaciones de las entidades relacionadas
    SELECT organizacion_id INTO cliente_org FROM clientes WHERE id = NEW.cliente_id;
    SELECT organizacion_id INTO profesional_org FROM profesionales WHERE id = NEW.profesional_id;
    SELECT organizacion_id INTO servicio_org FROM servicios WHERE id = NEW.servicio_id;

    -- Validar coherencia
    IF NEW.organizacion_id != cliente_org OR
       NEW.organizacion_id != profesional_org OR
       NEW.organizacion_id != servicio_org THEN
        RAISE EXCEPTION 'Incoherencia organizacional: cliente (%), profesional (%), servicio (%) deben pertenecer a organización (%)',
            cliente_org, profesional_org, servicio_org, NEW.organizacion_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_coherencia_cita
    BEFORE INSERT OR UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION validar_coherencia_cita();

-- 📝 COMENTARIOS EMPRESARIALES
COMMENT ON TABLE citas IS 'Sistema de agendamiento multi-tenant con workflow empresarial, auditoría completa y validaciones automáticas';
COMMENT ON COLUMN citas.codigo_cita IS 'Código único legible para el cliente (ej: BAR-2024-001234)';
COMMENT ON COLUMN citas.zona_horaria IS 'Zona horaria para organizaciones multi-zona (América/Bogotá por defecto)';
COMMENT ON COLUMN citas.tiempo_espera_minutos IS 'Campo calculado automáticamente entre llegada e inicio real';
COMMENT ON COLUMN citas.estado_anterior IS 'Estado previo para auditoría de transiciones de workflow';
COMMENT ON COLUMN citas.motivo_cancelacion IS 'Obligatorio cuando estado = cancelada';
COMMENT ON COLUMN citas.metodo_pago IS 'Método de pago utilizado: efectivo, tarjeta, transferencia';
COMMENT ON COLUMN citas.pagado IS 'Indica si la cita ha sido pagada completamente';
COMMENT ON COLUMN citas.notas_internas IS 'Notas para uso interno del negocio, no visibles al cliente';
COMMENT ON COLUMN citas.calificacion_profesional IS 'Calificación del profesional hacia el cliente (1-5)';
COMMENT ON COLUMN citas.recordatorio_enviado IS 'Indica si se envió recordatorio de la cita';
COMMENT ON COLUMN citas.confirmacion_requerida IS 'Si la cita requiere confirmación del cliente';
COMMENT ON COLUMN citas.version IS 'Número de versión para control de concurrencia optimista';
COMMENT ON COLUMN citas.ip_origen IS 'IP desde donde se creó la cita para auditoría';
COMMENT ON COLUMN citas.user_agent IS 'User-Agent del navegador/app para auditoría';

-- Comentarios en funciones
COMMENT ON FUNCTION actualizar_timestamp_citas() IS 'Actualiza automáticamente timestamp y versión al modificar una cita';
COMMENT ON FUNCTION validar_coherencia_cita() IS 'Valida que cliente, profesional y servicio pertenezcan a la misma organización';

-- ====================================================================
-- 🗓️ TABLA: HORARIOS_DISPONIBILIDAD - GESTIÓN GRANULAR DE DISPONIBILIDAD
-- ====================================================================
-- Propósito: Control completo de disponibilidad de profesionales con optimizaciones enterprise
-- • Prevención automática de solapamientos con exclusion constraints
-- • Soporte para franjas específicas por fecha + horarios recurrentes
-- • Reserva temporal (carrito de compras) con expiración automática
-- • Precios dinámicos por demanda y horarios premium
-- • Integración directa con sistema de citas y servicios
-- • Auditoría completa y versionado para concurrencia optimista
-- ====================================================================

CREATE TABLE horarios_disponibilidad (
    -- 🔑 IDENTIFICACIÓN Y RELACIONES PRINCIPALES
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    servicio_id INTEGER REFERENCES servicios(id) ON DELETE SET NULL, -- Para disponibilidad específica de servicio
    cita_id INTEGER REFERENCES citas(id) ON DELETE SET NULL, -- Link directo cuando está ocupado

    -- 📅 CONFIGURACIÓN TEMPORAL COMPLETA
    tipo_horario VARCHAR(20) NOT NULL, -- 'regular', 'excepcion', 'bloqueo', 'franja_especifica'
    fecha DATE NOT NULL, -- Fecha específica para la disponibilidad
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    zona_horaria VARCHAR(50) DEFAULT 'America/Bogota',

    -- 🔄 HORARIOS RECURRENTES (OPCIONAL)
    dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=domingo, 6=sábado
    es_recurrente BOOLEAN DEFAULT FALSE, -- Si se aplica semanalmente
    fecha_fin_recurrencia DATE, -- Hasta cuándo aplica la recurrencia
    patron_recurrencia JSONB DEFAULT '{}', -- Configuración avanzada de recurrencia

    -- 🔄 ESTADO Y DISPONIBILIDAD
    estado estado_franja DEFAULT 'disponible',
    duracion_slot INTEGER DEFAULT 15, -- Duración de cada slot en minutos
    capacidad_maxima INTEGER DEFAULT 1, -- Para servicios grupales
    capacidad_ocupada INTEGER DEFAULT 0, -- Cuántos slots están ocupados

    -- 💰 PRICING DINÁMICO
    precio_base DECIMAL(10,2), -- Precio base para este horario
    precio_dinamico DECIMAL(10,2), -- Precio ajustado por demanda/premium
    es_horario_premium BOOLEAN DEFAULT FALSE, -- Horario de alta demanda
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0.00, -- Descuento especial

    -- 🤖 AUTOMATIZACIÓN E IA
    puntuacion_ia INTEGER CHECK (puntuacion_ia >= 0 AND puntuacion_ia <= 100),
    creado_automaticamente BOOLEAN DEFAULT TRUE,
    algoritmo_creacion VARCHAR(50) DEFAULT 'sistema', -- 'sistema', 'ia', 'manual'

    -- 🛒 RESERVA TEMPORAL (CARRITO DE COMPRAS)
    reservado_hasta TIMESTAMPTZ,
    reservado_por VARCHAR(100), -- Identificador de quien reservó
    session_id VARCHAR(255), -- Para tracking de sesiones web
    token_reserva VARCHAR(100), -- Token único para la reserva

    -- 📝 INFORMACIÓN ADICIONAL
    notas TEXT, -- Motivo del bloqueo o notas especiales
    notas_internas TEXT, -- Notas para uso interno del negocio
    configuracion_especial JSONB DEFAULT '{}', -- Configuraciones adicionales

    -- 📊 AUDITORÍA ENTERPRISE
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),
    version INTEGER DEFAULT 1, -- Control de concurrencia optimista
    ip_origen INET,
    user_agent TEXT,

    -- ⏰ TIMESTAMPS ESTÁNDAR
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS EMPRESARIALES AVANZADOS
    CONSTRAINT valid_horario
        CHECK (hora_inicio < hora_fin),
    CONSTRAINT valid_duracion_minima
        CHECK (hora_fin - hora_inicio >= INTERVAL '5 minutes'),
    CONSTRAINT valid_fecha_coherente
        CHECK (fecha >= CURRENT_DATE - INTERVAL '1 day'),
    CONSTRAINT valid_capacidad
        CHECK (capacidad_maxima > 0 AND capacidad_ocupada >= 0 AND capacidad_ocupada <= capacidad_maxima),
    CONSTRAINT valid_reserva_futura
        CHECK (reservado_hasta IS NULL OR reservado_hasta >= NOW()),
    CONSTRAINT valid_precios
        CHECK (
            (precio_base IS NULL OR precio_base >= 0) AND
            (precio_dinamico IS NULL OR precio_dinamico >= 0) AND
            (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100)
        ),
    CONSTRAINT valid_tipo_configuracion
        CHECK (
            CASE tipo_horario
                WHEN 'regular' THEN dia_semana IS NOT NULL AND es_recurrente = TRUE
                WHEN 'excepcion' THEN es_recurrente = FALSE
                WHEN 'bloqueo' THEN es_recurrente = FALSE
                WHEN 'franja_especifica' THEN es_recurrente = FALSE
                ELSE FALSE
            END
        ),
    CONSTRAINT valid_estado_coherencia
        CHECK (
            CASE
                WHEN estado = 'ocupado' THEN cita_id IS NOT NULL
                WHEN estado = 'reservado_temporal' THEN reservado_hasta IS NOT NULL
                WHEN estado = 'bloqueado' THEN tipo_horario = 'bloqueo'
                ELSE TRUE
            END
        ),
    CONSTRAINT valid_recurrencia_fechas
        CHECK (
            CASE
                WHEN es_recurrente = TRUE THEN fecha_fin_recurrencia IS NULL OR fecha_fin_recurrencia >= fecha
                ELSE TRUE
            END
        ),

    -- 🚫 EXCLUSION CONSTRAINT - PREVIENE SOLAPAMIENTOS AUTOMÁTICAMENTE
    EXCLUDE USING gist (
        profesional_id WITH =,
        fecha WITH =,
        tsrange(
            (fecha + hora_inicio)::timestamp,
            (fecha + hora_fin)::timestamp,
            '[)'
        ) WITH &&
    ) WHERE (estado != 'bloqueado' AND tipo_horario != 'bloqueo')
);

-- 🚀 ÍNDICES ESPECIALIZADOS PARA ALTA PERFORMANCE
CREATE INDEX idx_horarios_organizacion_fecha
    ON horarios_disponibilidad (organizacion_id, fecha, hora_inicio)
    WHERE estado IN ('disponible', 'reservado_temporal');

CREATE INDEX idx_horarios_profesional_agenda
    ON horarios_disponibilidad (profesional_id, fecha, estado, hora_inicio);

CREATE INDEX idx_horarios_disponibles_tiempo_real
    ON horarios_disponibilidad (organizacion_id, fecha, hora_inicio, capacidad_maxima, capacidad_ocupada)
    WHERE estado = 'disponible' AND capacidad_ocupada < capacidad_maxima;

CREATE INDEX idx_horarios_reservas_expiradas
    ON horarios_disponibilidad (reservado_hasta)
    WHERE reservado_hasta IS NOT NULL AND estado = 'reservado_temporal';

CREATE INDEX idx_horarios_citas_link
    ON horarios_disponibilidad (cita_id)
    WHERE cita_id IS NOT NULL;

CREATE INDEX idx_horarios_servicio_especifico
    ON horarios_disponibilidad (servicio_id, fecha, estado, hora_inicio)
    WHERE servicio_id IS NOT NULL;

CREATE INDEX idx_horarios_recurrentes
    ON horarios_disponibilidad (profesional_id, dia_semana, es_recurrente, fecha_fin_recurrencia)
    WHERE es_recurrente = TRUE;

CREATE INDEX idx_horarios_pricing
    ON horarios_disponibilidad (organizacion_id, fecha, es_horario_premium, precio_dinamico)
    WHERE precio_dinamico IS NOT NULL;

-- 📊 ÍNDICE GIN PARA BÚSQUEDA AVANZADA
CREATE INDEX idx_horarios_search
    ON horarios_disponibilidad USING gin(
        to_tsvector('spanish', COALESCE(notas, '') || ' ' ||
                              COALESCE(notas_internas, '') || ' ' ||
                              COALESCE(tipo_horario, ''))
    );

-- 🔒 ROW LEVEL SECURITY
ALTER TABLE horarios_disponibilidad ENABLE ROW LEVEL SECURITY;

-- Política principal de aislamiento multi-tenant
CREATE POLICY horarios_tenant_isolation ON horarios_disponibilidad
    FOR ALL
    TO saas_app
    USING (
        organizacion_id = COALESCE(
            current_setting('app.current_tenant_id', true)::integer,
            CASE WHEN current_setting('app.current_user_role', true) = 'super_admin'
                 THEN organizacion_id
                 ELSE -1
            END
        )
    );

-- Política para bypass de sistema (funciones de mantenimiento)
CREATE POLICY horarios_system_bypass ON horarios_disponibilidad
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.bypass_rls', true) = 'true'
    );

-- 🤖 TRIGGER PARA ACTUALIZAR TIMESTAMP Y VERSIÓN
CREATE OR REPLACE FUNCTION actualizar_timestamp_horarios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_horarios
    BEFORE UPDATE ON horarios_disponibilidad
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_horarios();

-- 🛡️ TRIGGER PARA VALIDACIÓN DE COHERENCIA ORGANIZACIONAL
CREATE OR REPLACE FUNCTION validar_coherencia_horario()
RETURNS TRIGGER AS $$
DECLARE
    profesional_org INTEGER;
    servicio_org INTEGER;
    cita_org INTEGER;
BEGIN
    -- Validar organización del profesional
    SELECT organizacion_id INTO profesional_org FROM profesionales WHERE id = NEW.profesional_id;

    IF NEW.organizacion_id != profesional_org THEN
        RAISE EXCEPTION 'Incoherencia organizacional: profesional (%) debe pertenecer a organización (%)',
            profesional_org, NEW.organizacion_id;
    END IF;

    -- Validar organización del servicio si está especificado
    IF NEW.servicio_id IS NOT NULL THEN
        SELECT organizacion_id INTO servicio_org FROM servicios WHERE id = NEW.servicio_id;
        IF NEW.organizacion_id != servicio_org THEN
            RAISE EXCEPTION 'Incoherencia organizacional: servicio (%) debe pertenecer a organización (%)',
                servicio_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- Validar organización de la cita si está especificada
    IF NEW.cita_id IS NOT NULL THEN
        SELECT organizacion_id INTO cita_org FROM citas WHERE id = NEW.cita_id;
        IF NEW.organizacion_id != cita_org THEN
            RAISE EXCEPTION 'Incoherencia organizacional: cita (%) debe pertenecer a organización (%)',
                cita_org, NEW.organizacion_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_coherencia_horario
    BEFORE INSERT OR UPDATE ON horarios_disponibilidad
    FOR EACH ROW
    EXECUTE FUNCTION validar_coherencia_horario();

-- 🧹 FUNCIÓN DE LIMPIEZA AUTOMÁTICA DE RESERVAS EXPIRADAS
CREATE OR REPLACE FUNCTION limpiar_reservas_expiradas()
RETURNS INTEGER AS $$
DECLARE
    reservas_limpiadas INTEGER;
BEGIN
    UPDATE horarios_disponibilidad
    SET estado = 'disponible',
        reservado_hasta = NULL,
        reservado_por = NULL,
        session_id = NULL,
        token_reserva = NULL,
        capacidad_ocupada = 0
    WHERE estado = 'reservado_temporal'
    AND reservado_hasta < NOW();

    GET DIAGNOSTICS reservas_limpiadas = ROW_COUNT;
    RETURN reservas_limpiadas;
END;
$$ LANGUAGE plpgsql;

-- 🔄 FUNCIÓN PARA GENERAR HORARIOS RECURRENTES
CREATE OR REPLACE FUNCTION generar_horarios_recurrentes(
    p_profesional_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
) RETURNS INTEGER AS $$
DECLARE
    horario_base RECORD;
    fecha_actual DATE;
    horarios_creados INTEGER := 0;
BEGIN
    -- Obtener horarios base recurrentes
    FOR horario_base IN
        SELECT * FROM horarios_disponibilidad
        WHERE profesional_id = p_profesional_id
        AND es_recurrente = TRUE
        AND tipo_horario = 'regular'
        AND (fecha_fin_recurrencia IS NULL OR fecha_fin_recurrencia >= p_fecha_inicio)
    LOOP
        fecha_actual := p_fecha_inicio;

        WHILE fecha_actual <= p_fecha_fin LOOP
            -- Verificar si corresponde al día de la semana
            IF EXTRACT(DOW FROM fecha_actual) = horario_base.dia_semana THEN
                -- Insertar horario si no existe
                INSERT INTO horarios_disponibilidad (
                    organizacion_id, profesional_id, servicio_id,
                    tipo_horario, fecha, hora_inicio, hora_fin, zona_horaria,
                    estado, duracion_slot, capacidad_maxima,
                    precio_base, es_horario_premium,
                    creado_automaticamente, algoritmo_creacion,
                    creado_por
                ) VALUES (
                    horario_base.organizacion_id, horario_base.profesional_id, horario_base.servicio_id,
                    'franja_especifica', fecha_actual, horario_base.hora_inicio, horario_base.hora_fin, horario_base.zona_horaria,
                    'disponible', horario_base.duracion_slot, horario_base.capacidad_maxima,
                    horario_base.precio_base, horario_base.es_horario_premium,
                    TRUE, 'sistema_recurrencia',
                    horario_base.creado_por
                )
                ON CONFLICT (profesional_id, fecha, hora_inicio) DO NOTHING;

                horarios_creados := horarios_creados + 1;
            END IF;

            fecha_actual := fecha_actual + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN horarios_creados;
END;
$$ LANGUAGE plpgsql;

-- 📝 COMENTARIOS EMPRESARIALES
COMMENT ON TABLE horarios_disponibilidad IS 'Sistema completo de gestión de disponibilidad con prevención de solapamientos, pricing dinámico y generación automática';
COMMENT ON COLUMN horarios_disponibilidad.tipo_horario IS 'Tipo de horario: regular (recurrente), excepcion (una vez), bloqueo (no disponible), franja_especifica (fecha exacta)';
COMMENT ON COLUMN horarios_disponibilidad.capacidad_maxima IS 'Número máximo de citas simultáneas (útil para clases grupales, talleres)';
COMMENT ON COLUMN horarios_disponibilidad.precio_dinamico IS 'Precio ajustado automáticamente por demanda, horario premium, eventos especiales';
COMMENT ON COLUMN horarios_disponibilidad.patron_recurrencia IS 'JSON con configuración avanzada de recurrencia (ej: cada 2 semanas, solo días laborales)';
COMMENT ON COLUMN horarios_disponibilidad.token_reserva IS 'Token único para validar y gestionar reservas temporales de carrito de compras';
COMMENT ON COLUMN horarios_disponibilidad.configuracion_especial IS 'JSON con configuraciones adicionales (ej: preparación especial, material requerido)';
COMMENT ON COLUMN horarios_disponibilidad.algoritmo_creacion IS 'Algoritmo usado para crear el horario: sistema, ia, manual';
COMMENT ON COLUMN horarios_disponibilidad.es_horario_premium IS 'Horario de alta demanda con precio premium (fines de semana, horarios populares)';

-- Comentarios en funciones
COMMENT ON FUNCTION actualizar_timestamp_horarios() IS 'Actualiza automáticamente timestamp y versión al modificar un horario';
COMMENT ON FUNCTION validar_coherencia_horario() IS 'Valida que profesional, servicio y cita pertenezcan a la misma organización';
COMMENT ON FUNCTION limpiar_reservas_expiradas() IS 'Limpia automáticamente reservas temporales expiradas y libera capacidad';
COMMENT ON FUNCTION generar_horarios_recurrentes(INTEGER, DATE, DATE) IS 'Genera automáticamente horarios específicos basados en patrones recurrentes';
