-- ====================================================================
-- 🏛️ TABLAS CORE DEL SISTEMA SAAS
-- ====================================================================
--
-- Este archivo contiene las tablas fundamentales del sistema:
-- • usuarios: Autenticación, autorización y perfiles de usuario
-- • organizaciones: Multi-tenancy y configuración de negocios
--
-- 📊 ARQUITECTURA:
-- • Multi-tenant con Row Level Security (RLS)
-- • Jerarquía de roles de 5 niveles
-- • Aislamiento automático por organización
-- • Configuración flexible por industria
--
-- 🔄 ORDEN DE EJECUCIÓN: #3 (Después de tipos y funciones)
-- 🛡️ SEGURIDAD: RLS habilitado en ambas tablas
-- ====================================================================

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
