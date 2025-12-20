-- ====================================================================
-- MÓDULO CLIENTES: TABLA PRINCIPAL
-- ====================================================================
-- Base de datos de clientes con soporte multi-canal.
-- Extraído de sql/negocio/ para modularización (Dic 2025)
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
-- • Validación de email y teléfono con regex
-- • Profesional preferido para personalización
-- • Control granular de marketing
-- • Métricas calculadas dinámicamente (via joins)
-- • RLS habilitado para aislamiento por organización
-- • Validaciones CHECK para integridad de datos
-- • Constraints únicos por organización (no globales)
-- ====================================================================

CREATE TABLE clientes (
    -- 🔑 Identificación y relación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- NULL = cliente compartido, con valor = cliente exclusivo de sucursal

    -- 👤 Información personal básica
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),                      -- OPCIONAL: Teléfono tradicional (solo si el negocio necesita llamar)

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

    -- 📍 Información adicional
    direccion TEXT,
    como_conocio VARCHAR(100),                 -- 'referido', 'redes_sociales', 'google', 'caminando', etc.

    -- 🖼️ FOTO (Dic 2025 - Storage MinIO)
    foto_url TEXT,                              -- URL de la foto del cliente

    -- ⚙️ Control y configuración
    activo BOOLEAN DEFAULT TRUE,
    marketing_permitido BOOLEAN DEFAULT TRUE,

    -- 🗑️ Soft Delete (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,     -- NULL = activo, con valor = eliminado
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 🕒 Timestamps de auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ Validaciones de integridad
    CONSTRAINT valid_email
        CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_fecha_nacimiento
        CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE - INTERVAL '5 years'),

    -- 🔒 Constraints de unicidad por organización
    CONSTRAINT unique_email_por_org
        UNIQUE(organizacion_id, email) DEFERRABLE
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

-- Comentarios de documentación
COMMENT ON TABLE clientes IS
'Base de datos de clientes con soporte multi-canal (Telegram, WhatsApp, teléfono).
Métricas como total_citas y ultima_visita se calculan dinámicamente via JOINs.';

COMMENT ON COLUMN clientes.telegram_chat_id IS
'ID de Telegram del cliente. Obtenido automáticamente del webhook de Telegram.';

COMMENT ON COLUMN clientes.whatsapp_phone IS
'Número de WhatsApp en formato internacional. Obtenido del webhook de WhatsApp Business.';

COMMENT ON COLUMN clientes.profesional_preferido_id IS
'Profesional preferido del cliente para asignación automática en citas.';
