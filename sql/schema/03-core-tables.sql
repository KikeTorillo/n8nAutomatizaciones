-- ====================================================================
-- TABLAS CORE DEL SISTEMA SAAS
-- ====================================================================
-- organizaciones: Multi-tenancy (PRIMERO - sin dependencias)
-- usuarios: Autenticación y autorización (SEGUNDO - depende de organizaciones)
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

    -- Industria
    tipo_industria industria_tipo NOT NULL,
    configuracion_industria JSONB DEFAULT '{}',

    -- Contacto
    email_admin VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    sitio_web VARCHAR(200),

    -- Branding
    logo_url TEXT,
    colores_marca JSONB,
    configuracion_ui JSONB DEFAULT '{}',

    -- Plan y subscripción
    plan_actual plan_tipo NOT NULL DEFAULT 'trial',
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    fecha_activacion TIMESTAMPTZ,

    -- 🤖 Chatbots IA (Integración n8n)
    -- Credential MCP compartida por todos los chatbots de la organización
    -- Se crea al crear el primer chatbot y se elimina al eliminar el último
    mcp_credential_id VARCHAR(50) NULL,

    -- Configuración regional
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',
    idioma VARCHAR(5) DEFAULT 'es',
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    suspendido BOOLEAN DEFAULT FALSE,
    motivo_suspension TEXT,

    -- Metadatos
    metadata JSONB DEFAULT '{}',
    notas_internas TEXT,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (char_length(codigo_tenant) >= 3),
    CHECK (char_length(slug) >= 3)
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
    password_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL DEFAULT 'empleado',

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

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CHECK (char_length(email) >= 5),
    CHECK (char_length(nombre) >= 2),
    CHECK (intentos_fallidos >= 0 AND intentos_fallidos <= 10),
    CHECK (
        (rol = 'super_admin') OR
        (rol != 'super_admin' AND organizacion_id IS NOT NULL)
    )
);
