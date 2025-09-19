-- =====================================================================
-- DISEÑO DE BASE DE DATOS SAAS MULTI-TENANT
-- Versión: 1.0
-- Fecha: 2025-01-16
-- Descripción: Estructura completa para sistema SaaS multi-industria
-- =====================================================================

-- ====================================================================
-- ⭐ TABLA USUARIOS - AUTENTICACIÓN Y AUTORIZACIÓN (PRIORITARIA)
-- ====================================================================
-- Esta tabla es crítica para el funcionamiento del sistema SaaS
-- Se coloca al inicio para facilitar debugging y mantenimiento
-- ====================================================================

-- ENUM para roles de usuario (jerárquico)
CREATE TYPE rol_usuario AS ENUM (
    'super_admin',    -- Acceso completo al sistema
    'admin',          -- Administrador de organización
    'propietario',    -- Dueño del negocio
    'empleado',       -- Empleado con permisos limitados
    'cliente'         -- Cliente final (solo lectura)
);

-- TABLA PRINCIPAL DE USUARIOS
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER, -- REFERENCES organizaciones(id), se agregará FK después

    -- ===== CAMPOS DE AUTENTICACIÓN =====
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'empleado',

    -- ===== INFORMACIÓN PERSONAL =====
    nombre VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150),
    telefono VARCHAR(20),

    -- ===== RELACIÓN CON PROFESIONAL (OPCIONAL) =====
    -- NOTA: FK pendiente hasta crear tabla profesionales en fase posterior
    profesional_id INTEGER, -- REFERENCES profesionales(id) - FK se agregará cuando exista la tabla

    -- ===== CONTROL DE ACCESO Y SEGURIDAD =====
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    ultimo_login TIMESTAMPTZ,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,

    -- ===== RECUPERACIÓN DE CONTRASEÑA =====
    token_reset_password VARCHAR(255),
    token_reset_expira TIMESTAMPTZ,

    -- ===== CONFIGURACIÓN DE USUARIO =====
    configuracion_ui JSONB DEFAULT '{}',
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',
    idioma VARCHAR(5) DEFAULT 'es',

    -- ===== TIMESTAMPS =====
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ===== VALIDACIONES =====
    CHECK (char_length(email) >= 5),
    CHECK (char_length(nombre) >= 2),
    CHECK (intentos_fallidos >= 0 AND intentos_fallidos <= 10),
    CHECK (
        -- Super admin no necesita organizacion_id
        (rol = 'super_admin') OR
        -- Otros roles sí necesitan organizacion_id
        (rol != 'super_admin' AND organizacion_id IS NOT NULL)
    )
);

-- ===== ÍNDICES CRÍTICOS PARA USUARIOS =====

-- Índice único para login por email (CRÍTICO para autenticación)
CREATE UNIQUE INDEX idx_usuarios_email_unique
    ON usuarios (email) WHERE activo = TRUE;

-- Índice para búsquedas por organización y rol
CREATE INDEX idx_usuarios_org_rol_activo
    ON usuarios (organizacion_id, rol, activo) WHERE activo = TRUE;

-- Índice para usuarios profesionales
CREATE INDEX idx_usuarios_profesional_id
    ON usuarios (profesional_id) WHERE profesional_id IS NOT NULL;

-- Índice para control de seguridad
CREATE INDEX idx_usuarios_seguridad
    ON usuarios (intentos_fallidos, bloqueado_hasta)
    WHERE intentos_fallidos > 0 OR bloqueado_hasta IS NOT NULL;

-- Índice para tokens de reset
CREATE INDEX idx_usuarios_reset_token
    ON usuarios (token_reset_password, token_reset_expira)
    WHERE token_reset_password IS NOT NULL;

-- Índice compuesto para consultas de dashboard de usuarios
CREATE INDEX idx_usuarios_dashboard
    ON usuarios (organizacion_id, ultimo_login, activo)
    WHERE activo = TRUE;

-- Índice para búsqueda de usuarios por nombre (autocompletar)
CREATE INDEX idx_usuarios_nombre_gin
    ON usuarios USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(apellidos, '')))
    WHERE activo = TRUE;

-- ===== DATOS INICIALES - USUARIO SUPER ADMIN =====
INSERT INTO usuarios (
    email,
    password_hash,
    rol,
    nombre,
    apellidos,
    activo,
    email_verificado
) VALUES (
    'admin@saas-agendamiento.com',
    '$2a$12$kAuGwcN1vynDKfFzQ3g2N.bQZnDfrYB4BRRLoiDVijGlcSb6hi/Xy', -- hash de 'admin123'
    'super_admin',
    'Administrador',
    'del Sistema',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ===== OPTIMIZACIONES PARA TABLA USUARIOS =====
ALTER TABLE usuarios SET (
    fillfactor = 90,                          -- Espacio para HOT updates
    autovacuum_vacuum_scale_factor = 0.1,     -- VACUUM más frecuente
    autovacuum_analyze_scale_factor = 0.05    -- ANALYZE más frecuente
);

-- ===== COMENTARIOS PARA DOCUMENTACIÓN =====
COMMENT ON TABLE usuarios IS 'Usuarios del sistema SaaS con autenticación multi-tenant';
COMMENT ON COLUMN usuarios.organizacion_id IS 'NULL solo para super_admin, obligatorio para otros roles';
COMMENT ON COLUMN usuarios.profesional_id IS 'Vinculación opcional con tabla profesionales';
COMMENT ON COLUMN usuarios.intentos_fallidos IS 'Contador de intentos de login fallidos (máx 10)';
COMMENT ON COLUMN usuarios.bloqueado_hasta IS 'Fecha hasta la cual el usuario está bloqueado';

-- ===== FUNCIONES DE UTILIDAD PARA USUARIOS =====

-- Función para registrar intento de login
CREATE OR REPLACE FUNCTION registrar_intento_login(
    p_email VARCHAR(150),
    p_exitoso BOOLEAN DEFAULT FALSE,
    p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    usuario_id INTEGER;
    org_id INTEGER;
BEGIN
    -- Configurar bypass RLS para función de autenticación
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Obtener información del usuario
    SELECT u.id, u.organizacion_id INTO usuario_id, org_id
    FROM usuarios u
    WHERE u.email = p_email AND u.activo = TRUE;

    IF usuario_id IS NOT NULL THEN
        IF p_exitoso THEN
            -- Login exitoso: actualizar ultimo_login y resetear intentos fallidos
            UPDATE usuarios
            SET ultimo_login = NOW(),
                intentos_fallidos = 0,
                bloqueado_hasta = NULL,
                actualizado_en = NOW()
            WHERE id = usuario_id;
        ELSE
            -- Login fallido: incrementar intentos fallidos
            UPDATE usuarios
            SET intentos_fallidos = intentos_fallidos + 1,
                -- Bloquear por 30 minutos después de 5 intentos fallidos
                bloqueado_hasta = CASE
                    WHEN intentos_fallidos >= 4 THEN NOW() + INTERVAL '30 minutes'
                    ELSE bloqueado_hasta
                END,
                actualizado_en = NOW()
            WHERE id = usuario_id;
        END IF;

        -- Log básico (auditoría se agregará en fase posterior)
        -- TODO: Implementar eventos_sistema en fase de producción
    END IF;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar tokens de reset expirados
CREATE OR REPLACE FUNCTION limpiar_tokens_reset_expirados()
RETURNS INTEGER AS $$
DECLARE
    tokens_limpiados INTEGER;
BEGIN
    -- Configurar bypass RLS para función de mantenimiento
    PERFORM set_config('app.bypass_rls', 'true', true);

    UPDATE usuarios
    SET token_reset_password = NULL,
        token_reset_expira = NULL,
        actualizado_en = NOW()
    WHERE token_reset_expira < NOW()
    AND token_reset_password IS NOT NULL;

    GET DIAGNOSTICS tokens_limpiados = ROW_COUNT;

    -- Log del mantenimiento (se agregará eventos_sistema en fase posterior)
    -- TODO: Implementar log de mantenimiento cuando eventos_sistema esté disponible

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN tokens_limpiados;
END;
$$ LANGUAGE plpgsql;

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

-- ===== RLS PARA USUARIOS =====

-- Habilitar RLS en tabla usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- POLÍTICA UNIFICADA: Maneja todos los casos de acceso sin conflictos
-- Elimina problemas de múltiples políticas activas simultáneamente
CREATE POLICY usuarios_unified_access ON usuarios
    FOR ALL
    TO saas_app
    USING (
        -- CASO 1: Contexto de login (autenticación inicial)
        -- Permite buscar usuario por email para verificar credenciales
        current_setting('app.current_user_role', true) = 'login_context'

        -- CASO 2: Super admin (acceso total al sistema)
        -- Super admins pueden gestionar cualquier usuario
        OR current_setting('app.current_user_role', true) = 'super_admin'

        -- CASO 3: Bypass para funciones de sistema
        -- Funciones como registrar_intento_login() necesitan acceso directo
        OR current_setting('app.bypass_rls', true) = 'true'

        -- CASO 4: Acceso propio (self-access)
        -- Usuario puede ver/editar su propio registro
        OR id = COALESCE(NULLIF(current_setting('app.current_user_id', true), '')::INTEGER, 0)

        -- CASO 5: Tenant isolation (aislamiento por organización)
        -- Usuarios pueden ver otros usuarios de su misma organización
        -- Manejo seguro de NULL para super_admin y conversión de tipos
        OR (
            organizacion_id IS NOT NULL
            AND current_setting('app.current_tenant_id', true) ~ '^[0-9]+$'
            AND organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );


-- ====================================================================
-- FIN SECCIÓN USUARIOS - CONTINÚA CON RESTO DE TABLAS
-- ====================================================================

-- =====================================================================
-- TIPOS ENUM Y ESTRUCTURAS BASE
-- =====================================================================

-- Tipos para la plataforma SaaS
CREATE TYPE industria_tipo AS ENUM (
    'barberia',
    'salon_belleza',
    'estetica',
    'spa',
    'podologia',
    'consultorio_medico',
    'academia',
    'taller_tecnico',
    'centro_fitness',
    'veterinaria',
    'otro'
);

CREATE TYPE plan_tipo AS ENUM (
    'trial',
    'basico',
    'profesional',
    'empresarial',
    'custom'
);

CREATE TYPE estado_subscripcion AS ENUM (
    'activa',
    'suspendida',
    'cancelada',
    'trial',
    'morosa'
);

CREATE TYPE estado_cita AS ENUM (
    'pendiente',
    'confirmada',
    'en_curso',
    'completada',
    'cancelada',
    'no_asistio'
);

CREATE TYPE estado_franja AS ENUM (
    'disponible',
    'reservado_temporal',
    'ocupado',
    'bloqueado'
);

-- =====================================================================
-- PLANTILLAS DE SERVICIOS
-- =====================================================================

CREATE TABLE plantillas_servicios (
    id SERIAL PRIMARY KEY,
    tipo_industria industria_tipo NOT NULL,

    -- Información del servicio
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50),
    subcategoria VARCHAR(50),

    -- Configuración de tiempo y precio
    duracion_minutos INTEGER NOT NULL,
    precio_sugerido DECIMAL(10,2),
    precio_minimo DECIMAL(10,2),
    precio_maximo DECIMAL(10,2),

    -- Configuración avanzada
    requiere_preparacion_minutos INTEGER DEFAULT 0,
    tiempo_limpieza_minutos INTEGER DEFAULT 5,
    max_clientes_simultaneos INTEGER DEFAULT 1,

    -- Metadatos
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    popularidad INTEGER DEFAULT 0, -- 0-100
    configuracion_especifica JSONB DEFAULT '{}',

    -- Control
    activo BOOLEAN DEFAULT TRUE,
    es_template_oficial BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMPTZ DEFAULT NOW()
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

-- =====================================================================
-- TABLA ORGANIZACIONES (TENANTS)
-- =====================================================================

CREATE TABLE organizaciones (
    id SERIAL PRIMARY KEY,

    -- Identificación única del tenant
    codigo_tenant VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- Para URLs amigables

    -- Información comercial
    nombre_comercial VARCHAR(150) NOT NULL,
    razon_social VARCHAR(200),
    rfc_nif VARCHAR(20),

    -- Tipo de industria y configuración
    tipo_industria industria_tipo NOT NULL,
    configuracion_industria JSONB DEFAULT '{}',

    -- Información de contacto
    email_admin VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    sitio_web VARCHAR(200),

    -- Configuración de marca
    logo_url TEXT,
    colores_marca JSONB, -- {"primario": "#3498db", "secundario": "#2ecc71"}
    configuracion_ui JSONB DEFAULT '{}',

    -- Plan y subscripción
    plan_actual plan_tipo NOT NULL DEFAULT 'trial',
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_activacion TIMESTAMPTZ,

    -- Configuración regional
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',
    idioma VARCHAR(5) DEFAULT 'es',
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Control de estado
    activo BOOLEAN DEFAULT TRUE,
    suspendido BOOLEAN DEFAULT FALSE,
    motivo_suspension TEXT,

    -- Metadatos
    metadata JSONB DEFAULT '{}',
    notas_internas TEXT,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Validaciones
    CHECK (char_length(codigo_tenant) >= 3),
    CHECK (char_length(slug) >= 3)
);

-- Índices para organizaciones
CREATE UNIQUE INDEX idx_organizaciones_codigo_tenant
    ON organizaciones (codigo_tenant) WHERE activo = TRUE;

CREATE UNIQUE INDEX idx_organizaciones_slug
    ON organizaciones (slug) WHERE activo = TRUE;

CREATE INDEX idx_organizaciones_tipo_industria
    ON organizaciones (tipo_industria, activo) WHERE activo = TRUE;

CREATE INDEX idx_organizaciones_plan_actual
    ON organizaciones (plan_actual, activo) WHERE activo = TRUE;

-- Trigger para actualizar timestamp en organizaciones
CREATE TRIGGER trigger_actualizar_organizaciones
    BEFORE UPDATE ON organizaciones
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- RLS para organizaciones
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_organizaciones ON organizaciones
    FOR ALL
    TO saas_app
    USING (
        -- Super admin puede ver todas las organizaciones
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O el usuario pertenece a esta organización
        OR id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        -- O bypass RLS está activado (para operaciones de sistema)
        OR current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        -- Super admin puede crear/modificar cualquier organización
        current_setting('app.current_user_role', true) = 'super_admin'
        -- O bypass RLS está activado (para operaciones de sistema como registro)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Comentarios para organizaciones
COMMENT ON TABLE organizaciones IS 'Tenants de la plataforma SaaS - cada fila representa una empresa/organización';
COMMENT ON COLUMN organizaciones.codigo_tenant IS 'Código único para identificar el tenant en APIs y subdominios';
COMMENT ON COLUMN organizaciones.slug IS 'Slug amigable para URLs personalizadas de la organización';
COMMENT ON COLUMN organizaciones.configuracion_industria IS 'Configuración específica según el tipo de industria';

-- Agregar Foreign Key que faltaba en usuarios
ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_organizacion
    FOREIGN KEY (organizacion_id) REFERENCES organizaciones(id) ON DELETE CASCADE;

