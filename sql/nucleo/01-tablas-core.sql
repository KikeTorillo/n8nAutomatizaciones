-- ====================================================================
-- MÓDULO NÚCLEO: TABLAS CORE
-- ====================================================================
-- Tablas fundamentales del sistema multi-tenant:
-- • organizaciones: Base del multi-tenancy (primera tabla del sistema)
-- • usuarios: Autenticación y autorización
--
-- Orden de creación: CRÍTICO (organizaciones → usuarios)
-- Migrado de: sql/schema/03-core-tables.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA: organizaciones
-- ====================================================================
-- ORDEN: 1/2 - Debe crearse ANTES de usuarios para permitir FK
-- ====================================================================
CREATE TABLE organizaciones (
    id SERIAL PRIMARY KEY,

    -- Identificación
    codigo_tenant VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Información comercial
    nombre_comercial VARCHAR(150) NOT NULL,
    razon_social VARCHAR(200),
    rfc_nif VARCHAR(20),

    -- Categoría de la organización (tabla dinámica - Nov 2025)
    -- Nullable: se configura después del onboarding en Configuración > Mi Negocio
    categoria_id INTEGER REFERENCES categorias(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    configuracion_categoria JSONB DEFAULT '{}',

    -- Contacto
    email_admin VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    sitio_web VARCHAR(200),

    -- Branding
    logo_url TEXT,
    colores_marca JSONB,
    configuracion_ui JSONB DEFAULT '{}',

    -- Fechas de registro
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_activacion TIMESTAMPTZ,

    -- 🤖 Chatbots IA (Integración n8n)
    -- Credential MCP compartida por todos los chatbots de la organización
    -- Se crea al crear el primer chatbot y se elimina al eliminar el último
    mcp_credential_id VARCHAR(50) NULL,

    -- Ubicación geográfica (Nov 2025 - Catálogo normalizado)
    -- FKs a tablas en sql/catalogos/07-tablas-ubicaciones.sql
    pais_id INTEGER DEFAULT 1,              -- Default: México (id=1)
    estado_id INTEGER,                      -- Estado del catálogo
    ciudad_id INTEGER,                      -- Ciudad del catálogo

    -- Configuración regional
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',
    idioma VARCHAR(5) DEFAULT 'es',
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    suspendido BOOLEAN DEFAULT FALSE,
    motivo_suspension TEXT,

    -- 🗑️ Soft Delete (Dic 2025)
    -- NULL = registro activo, con valor = registro eliminado
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER,  -- FK a usuarios se agrega después (dependencia circular)

    -- Metadatos
    metadata JSONB DEFAULT '{}',
    notas_internas TEXT,

    -- 🛍️ Marketplace (Nov 2025)
    tiene_perfil_marketplace BOOLEAN DEFAULT FALSE,
    fecha_activacion_marketplace TIMESTAMPTZ,

    -- 🎯 Modelo de Negocio Free/Pro (Nov 2025)
    -- App elegida en Plan Free (1 app gratis). NULL si plan Pro (todas las apps)
    -- Valores: 'agendamiento', 'inventario', 'pos'
    app_seleccionada VARCHAR(50) DEFAULT NULL,

    -- 💰 Configuración POS (Dic 2025)
    -- Si TRUE, solo usuarios con profesional vinculado pueden crear ventas
    pos_requiere_profesional BOOLEAN DEFAULT FALSE,

    -- 📦 Módulos Activos (Ene 2026)
    -- JSONB con los módulos habilitados para la organización
    -- Formato: {"core": true, "agendamiento": true, "inventario": false, ...}
    -- Migrado de tabla subscripciones (eliminada en Fase 0)
    modulos_activos JSONB DEFAULT '{"core": true}'::jsonb,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (char_length(codigo_tenant) >= 3),
    CHECK (char_length(slug) >= 3),
    CHECK (app_seleccionada IS NULL OR app_seleccionada IN ('agendamiento', 'inventario', 'pos'))
);

-- ====================================================================
-- TABLA: usuarios
-- ====================================================================
-- ORDEN: 2/2 - Depende de organizaciones y profesionales
-- NOTA: profesional_id se agregará DESPUÉS de crear tabla profesionales
-- ====================================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,

    -- FK a organizaciones (ON DELETE CASCADE - si se elimina org, se eliminan usuarios)
    organizacion_id INTEGER REFERENCES organizaciones(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Autenticación
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),                    -- Nullable: usuarios OAuth no tienen password
    rol_id INTEGER NOT NULL,                       -- FK a tabla roles (sistema dinámico activo)

    -- OAuth Google (Dic 2025)
    google_id VARCHAR(255) UNIQUE,                 -- ID único del usuario en Google
    avatar_url TEXT,                               -- URL del avatar (de Google o subido)

    -- Estado de onboarding (Dic 2025)
    onboarding_completado BOOLEAN DEFAULT FALSE,   -- TRUE después de completar wizard inicial

    -- Información personal
    nombre VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150),
    telefono VARCHAR(20),

    -- Relación con profesionales (se agregará FK después de crear tabla profesionales)
    -- NOTA: Esta FK se agrega en 05-business-tables.sql después de CREATE TABLE profesionales
    profesional_id INTEGER,

    -- Control de acceso
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    ultimo_login TIMESTAMPTZ,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,

    -- 🗑️ Soft Delete (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Recuperación de contraseña
    token_reset_password VARCHAR(255),
    token_reset_expira TIMESTAMPTZ,
    token_reset_usado_en TIMESTAMPTZ, -- Timestamp cuando se usó el token (NULL si nunca usado)

    -- Verificación de email
    token_verificacion_email VARCHAR(255),
    token_verificacion_expira TIMESTAMPTZ,
    token_verificacion_usado_en TIMESTAMPTZ, -- Timestamp cuando se usó el token (NULL si nunca usado)

    -- Configuración
    configuracion_ui JSONB DEFAULT '{}',
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',
    idioma VARCHAR(5) DEFAULT 'es',
    -- NOTA: La moneda se determina por sucursal (si tiene override) o por organización (fallback)
    -- Ver: sucursales.moneda y organizaciones.moneda

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (char_length(email) >= 5),
    CHECK (char_length(nombre) >= 2),
    CHECK (intentos_fallidos >= 0 AND intentos_fallidos <= 10)
    -- La validación de organización se hace via rol_id + tabla roles
    -- Roles de sistema (super_admin, bot) tienen es_rol_sistema=TRUE y no requieren organizacion_id
    -- Ver: sql/nucleo/16-tabla-roles.sql y backend/app/utils/helpers/RolHelper.js
);

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON TABLE organizaciones IS 'Base del sistema multi-tenant. Cada organización es un tenant independiente con aislamiento completo de datos';
COMMENT ON TABLE usuarios IS 'Autenticación y autorización. Super_admin es usuario de plataforma (sin organización). Resto de roles requieren organizacion_id obligatorio';

COMMENT ON COLUMN organizaciones.codigo_tenant IS 'Código único inmutable para identificación técnica del tenant (e.g., org-001)';
COMMENT ON COLUMN organizaciones.slug IS 'URL-friendly identifier para subdominios y URLs personalizadas';
COMMENT ON COLUMN organizaciones.mcp_credential_id IS 'ID de credencial MCP en n8n compartida por todos los chatbots. NULL si no hay chatbots activos';
COMMENT ON COLUMN organizaciones.tiene_perfil_marketplace IS 'True si la organización tiene perfil activo en marketplace público (directorio SEO)';
COMMENT ON COLUMN organizaciones.fecha_activacion_marketplace IS 'Timestamp de primera publicación en marketplace';
COMMENT ON COLUMN organizaciones.app_seleccionada IS 'App elegida en Plan Free (1 app gratis). NULL si plan Pro (todas las apps). Valores: agendamiento, inventario, pos';
COMMENT ON COLUMN usuarios.profesional_id IS 'Relación con tabla profesionales. FK se agrega después de crear la tabla';
COMMENT ON COLUMN usuarios.rol_id IS 'FK a tabla roles. Sistema dinámico de roles por organización. Ver sql/nucleo/16-tabla-roles.sql';
COMMENT ON COLUMN usuarios.google_id IS 'ID único del usuario en Google OAuth. NULL si no se registró con Google';
COMMENT ON COLUMN usuarios.avatar_url IS 'URL del avatar del usuario (de Google OAuth o subido manualmente)';
COMMENT ON COLUMN usuarios.onboarding_completado IS 'TRUE después de completar el wizard de onboarding inicial. Usuarios legacy se marcan TRUE automáticamente';

-- Comentarios Soft Delete
COMMENT ON COLUMN organizaciones.eliminado_en IS 'Timestamp de eliminación lógica. NULL = registro activo. Con valor = registro eliminado (soft delete)';
COMMENT ON COLUMN organizaciones.eliminado_por IS 'ID del usuario que eliminó el registro. FK diferida por dependencia circular con usuarios';
COMMENT ON COLUMN usuarios.eliminado_en IS 'Timestamp de eliminación lógica. NULL = registro activo. Con valor = registro eliminado (soft delete)';
COMMENT ON COLUMN usuarios.eliminado_por IS 'ID del usuario que realizó la eliminación lógica';
