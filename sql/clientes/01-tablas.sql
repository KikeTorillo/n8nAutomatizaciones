-- ====================================================================
-- MÓDULO CLIENTES: TABLA PRINCIPAL
-- ====================================================================
-- Base de datos de clientes con soporte multi-canal.
-- Extraído de sql/servicios/ para modularización (Dic 2025)
--
-- CONTENIDO:
-- • clientes - Base de datos de clientes
--
-- Dependencias: nucleo (organizaciones), profesionales
-- ====================================================================

-- ====================================================================
-- 🧑‍💼 TABLA CLIENTES - BASE DE DATOS DE CLIENTES
-- ====================================================================
-- Almacena información completa de clientes con validaciones inteligentes
-- y soporte para métricas calculadas dinámicamente.
--
-- 🔧 CARACTERÍSTICAS DESTACADAS:
-- • Tipo persona/empresa para distinguir B2B vs B2C
-- • RFC y razón social para empresas (facturación)
-- • Dirección estructurada (calle, colonia, ciudad, estado, CP)
-- • Validación de email y teléfono con regex
-- • Profesional preferido para personalización
-- • Control granular de marketing
-- • Métricas calculadas dinámicamente (via joins)
-- • RLS habilitado para aislamiento por organización
-- • Validaciones CHECK para integridad de datos
-- • Constraints únicos por organización (no globales)
--
-- Actualizado: Ene 2026 - Campos tipo, RFC, dirección estructurada
-- ====================================================================

CREATE TABLE clientes (
    -- 🔑 Identificación y relación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- NULL = cliente compartido, con valor = cliente exclusivo de sucursal

    -- 🏢 Tipo de cliente (Ene 2026)
    tipo VARCHAR(10) DEFAULT 'persona',        -- 'persona' = persona física, 'empresa' = B2B

    -- 👤 Información personal básica
    nombre VARCHAR(150) NOT NULL,              -- Nombre completo (persona) o nombre comercial (empresa)
    email VARCHAR(150),
    telefono VARCHAR(20),                      -- OPCIONAL: Teléfono tradicional (solo si el negocio necesita llamar)

    -- 📄 Datos fiscales - Solo empresas B2B (Ene 2026)
    rfc VARCHAR(13),                           -- RFC mexicano (12-13 caracteres)
    razon_social VARCHAR(200),                 -- Razón social para facturación

    -- 📱 Identificadores de plataformas de mensajería
    telegram_chat_id VARCHAR(50),              -- ID de Telegram (ej: "1700200086")
                                               -- Obtenido automáticamente del webhook, NO se pide al usuario
    whatsapp_phone VARCHAR(50),                -- Número WhatsApp internacional (ej: "5215512345678")
                                               -- Obtenido automáticamente del webhook de WhatsApp Business

    fecha_nacimiento DATE,

    -- 🏥 Información médica y preferencias
    profesional_preferido_id INTEGER,          -- FK se agregará después
    notas_especiales TEXT,
    alergias TEXT,

    -- 📍 Dirección estructurada (Ene 2026 - antes era campo TEXT único)
    calle VARCHAR(200),                        -- Calle y número exterior/interior
    colonia VARCHAR(100),                      -- Colonia o fraccionamiento
    ciudad VARCHAR(100),                       -- Ciudad o municipio (texto libre)
    estado_id INTEGER,                         -- FK a catálogo de estados (INEGI)
    codigo_postal VARCHAR(10),                 -- Código postal (5 dígitos México)
    pais_id INTEGER DEFAULT 1,                 -- FK a catálogo de países (default: México=1)

    -- 📋 Información adicional
    como_conocio VARCHAR(100),                 -- 'referido', 'redes_sociales', 'google', 'caminando', etc.

    -- 🖼️ FOTO (Dic 2025 - Storage MinIO)
    foto_url TEXT,                              -- URL de la foto del cliente

    -- ⚙️ Control y configuración
    activo BOOLEAN DEFAULT TRUE,
    marketing_permitido BOOLEAN DEFAULT TRUE,

    -- 💳 CRÉDITO (FIADO) - Ene 2026
    permite_credito BOOLEAN DEFAULT FALSE,         -- Si el cliente puede comprar a crédito
    limite_credito DECIMAL(12, 2) DEFAULT 0,       -- Límite máximo de crédito
    saldo_credito DECIMAL(12, 2) DEFAULT 0,        -- Saldo actual pendiente (calculado por triggers)
    dias_credito INTEGER DEFAULT 30,               -- Días de plazo para pagar
    credito_suspendido BOOLEAN DEFAULT FALSE,      -- Crédito suspendido manualmente
    credito_suspendido_en TIMESTAMPTZ,             -- Fecha de suspensión
    credito_suspendido_motivo TEXT,                -- Motivo de suspensión

    -- 🗑️ Soft Delete (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,     -- NULL = activo, con valor = eliminado
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 🔗 Vinculación con Organizaciones (Dogfooding Ene 2026)
    organizacion_vinculada_id INTEGER REFERENCES organizaciones(id) ON DELETE SET NULL,

    -- 🕒 Timestamps de auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ Validaciones de integridad
    CONSTRAINT valid_tipo
        CHECK (tipo IN ('persona', 'empresa')),
    CONSTRAINT valid_email
        CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_fecha_nacimiento
        CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE - INTERVAL '5 years'),
    CONSTRAINT valid_rfc
        CHECK (rfc IS NULL OR rfc ~* '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'),

    -- 🔒 Constraints de unicidad por organización
    CONSTRAINT unique_email_por_org
        UNIQUE(organizacion_id, email) DEFERRABLE,
    CONSTRAINT unique_rfc_por_org
        UNIQUE(organizacion_id, rfc)
    -- NOTA: unique_telefono_por_org se implementa como índice único parcial
    -- para permitir múltiples clientes con telefono=NULL en la misma organización
);

-- ====================================================================
-- 🔗 FOREIGN KEYS DIFERIDAS
-- ====================================================================

-- FK: clientes.profesional_preferido_id → profesionales.id
ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_profesional_preferido
FOREIGN KEY (profesional_preferido_id) REFERENCES profesionales(id)
    ON DELETE SET NULL    -- Si se elimina profesional, SET NULL en cliente
    ON UPDATE CASCADE;    -- Si se actualiza ID, actualizar cascada

-- FK: clientes.estado_id → estados.id (Ene 2026)
ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_estado
FOREIGN KEY (estado_id) REFERENCES estados(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- FK: clientes.pais_id → paises.id (Ene 2026)
ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_pais
FOREIGN KEY (pais_id) REFERENCES paises(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ====================================================================
-- 📱 CONSTRAINTS ÚNICOS PARA IDENTIFICADORES DE PLATAFORMAS
-- ====================================================================
-- Garantizan que un mismo telegram_chat_id o whatsapp_phone no pueda
-- registrarse múltiples veces en la misma organización.
--
-- IMPORTANTE: Los índices únicos son parciales (WHERE ... IS NOT NULL)
-- para permitir múltiples clientes con valores NULL (walk-in sin plataforma).
-- ====================================================================

ALTER TABLE clientes
ADD CONSTRAINT unique_telegram_por_org
    UNIQUE (organizacion_id, telegram_chat_id);

ALTER TABLE clientes
ADD CONSTRAINT unique_whatsapp_por_org
    UNIQUE (organizacion_id, whatsapp_phone);

-- ====================================================================
-- 📊 ÍNDICES PARA BÚSQUEDAS EFICIENTES (Ene 2026)
-- ====================================================================

CREATE INDEX idx_clientes_tipo ON clientes(tipo);
CREATE INDEX idx_clientes_rfc ON clientes(rfc) WHERE rfc IS NOT NULL;
CREATE INDEX idx_clientes_estado ON clientes(estado_id) WHERE estado_id IS NOT NULL;
CREATE INDEX idx_clientes_ciudad ON clientes(ciudad) WHERE ciudad IS NOT NULL;

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE clientes IS
'Base de datos de clientes con soporte multi-canal (Telegram, WhatsApp, teléfono).
Soporta tipo persona/empresa para distinguir B2B vs B2C.
Dirección estructurada con FK a catálogos de estados/países.
Métricas como total_citas y ultima_visita se calculan dinámicamente via JOINs.
Actualizado: Ene 2026 - Campos tipo, RFC, dirección estructurada.';

COMMENT ON COLUMN clientes.tipo IS
'Tipo de cliente: persona (física) o empresa (B2B). Default: persona.';

COMMENT ON COLUMN clientes.rfc IS
'RFC mexicano para facturación. Solo para clientes tipo empresa. 12-13 caracteres.';

COMMENT ON COLUMN clientes.razon_social IS
'Razón social para facturación. Solo para clientes tipo empresa.';

COMMENT ON COLUMN clientes.calle IS
'Calle y número exterior/interior de la dirección.';

COMMENT ON COLUMN clientes.colonia IS
'Colonia o fraccionamiento de la dirección.';

COMMENT ON COLUMN clientes.ciudad IS
'Ciudad o municipio de la dirección (texto libre para flexibilidad).';

COMMENT ON COLUMN clientes.estado_id IS
'FK a catálogo de estados de México (INEGI). Dropdown normalizado.';

COMMENT ON COLUMN clientes.codigo_postal IS
'Código postal mexicano (5 dígitos).';

COMMENT ON COLUMN clientes.pais_id IS
'FK a catálogo de países. Default: 1 (México).';

COMMENT ON COLUMN clientes.telegram_chat_id IS
'ID de Telegram del cliente. Obtenido automáticamente del webhook de Telegram.';

COMMENT ON COLUMN clientes.whatsapp_phone IS
'Número de WhatsApp en formato internacional. Obtenido del webhook de WhatsApp Business.';

COMMENT ON COLUMN clientes.profesional_preferido_id IS
'Profesional preferido del cliente para asignación automática en citas.';

-- ====================================================================
-- 💳 CAMPOS DE CRÉDITO (Ene 2026)
-- ====================================================================

COMMENT ON COLUMN clientes.permite_credito IS
'Si el cliente puede comprar a crédito (fiado). Default: false.';

COMMENT ON COLUMN clientes.limite_credito IS
'Límite máximo de crédito permitido. Default: 0 (sin crédito).';

COMMENT ON COLUMN clientes.saldo_credito IS
'Saldo actual pendiente de pago. Calculado automáticamente por triggers.';

COMMENT ON COLUMN clientes.dias_credito IS
'Días de plazo para pagar el crédito. Default: 30 días.';

COMMENT ON COLUMN clientes.credito_suspendido IS
'Si el crédito está suspendido manualmente (independiente del límite).';

COMMENT ON COLUMN clientes.credito_suspendido_en IS
'Fecha de suspensión del crédito.';

COMMENT ON COLUMN clientes.credito_suspendido_motivo IS
'Motivo de suspensión del crédito (ej: morosidad, verificación).';

-- Índice para clientes con saldo pendiente (para cobranza)
CREATE INDEX idx_clientes_saldo_credito
    ON clientes(saldo_credito)
    WHERE saldo_credito > 0 AND eliminado_en IS NULL;

-- Índice para clientes con crédito habilitado
CREATE INDEX idx_clientes_permite_credito
    ON clientes(permite_credito)
    WHERE permite_credito = TRUE AND eliminado_en IS NULL;

-- ====================================================================
-- 🔗 VINCULACIÓN DOGFOODING (Ene 2026)
-- ====================================================================
-- Para el modelo dogfooding de Nexo Team: cada organización de la
-- plataforma es un cliente en el CRM de Nexo Team (org_id = 4)
-- ====================================================================

-- Índice único parcial: solo un cliente puede vincular a una org
CREATE UNIQUE INDEX idx_clientes_org_vinculada
ON clientes(organizacion_vinculada_id)
WHERE organizacion_vinculada_id IS NOT NULL;

COMMENT ON COLUMN clientes.organizacion_vinculada_id IS
'ID de la organización de la plataforma vinculada (para dogfooding Nexo Team). NULL para clientes normales.';
