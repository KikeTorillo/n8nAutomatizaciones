-- ====================================================================
-- 💳 MÓDULO: PAGOS - INTEGRACIÓN MERCADO PAGO
-- ====================================================================
--
-- PROPÓSITO:
-- Sistema completo de pagos a través de Mercado Pago con soporte
-- para suscripciones recurrentes y pagos únicos.
--
-- COMPONENTES:
-- • Tabla pagos: Registro de todas las transacciones procesadas
-- • Tabla metodos_pago: Métodos de pago guardados (PCI Compliant)
--
-- CARACTERÍSTICAS:
-- ✅ Idempotencia garantizada (UNIQUE en payment_id_mp)
-- ✅ RLS completo para multi-tenancy
-- ✅ PCI Compliance: Solo últimos 4 dígitos de tarjeta
-- ✅ Integración con tabla subscripciones
-- ✅ Soporte para múltiples tipos de pago
-- ✅ Conciliación y auditoría financiera
--
-- ORDEN DE CARGA: #10 (después de suscripciones)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TABLA 1: PAGOS - REGISTRO DE TRANSACCIONES MERCADO PAGO
-- ====================================================================
-- Registra todos los pagos procesados por Mercado Pago.
-- Fuente de verdad para conciliación y auditoría financiera.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE pagos (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- ====================================================================
    -- 💳 SECCIÓN: IDENTIFICADORES MERCADO PAGO
    -- ====================================================================
    payment_id_mp VARCHAR(100) UNIQUE NOT NULL,          -- ID único del pago en MP (idempotencia)
    subscription_id_mp VARCHAR(100),                     -- ID de suscripción en MP (si aplica)

    -- ====================================================================
    -- 💰 SECCIÓN: DETALLES DEL PAGO
    -- ====================================================================
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Estados: 'approved', 'rejected', 'pending', 'refunded', 'cancelled', 'in_process'
    estado VARCHAR(20) NOT NULL,

    -- Tipos: 'subscription', 'upgrade', 'downgrade', 'manual', 'one_time'
    tipo_pago VARCHAR(30),

    -- ====================================================================
    -- 🎴 SECCIÓN: MÉTODO DE PAGO
    -- ====================================================================
    payment_method_id VARCHAR(50),                       -- 'visa', 'mastercard', 'oxxo', 'spei', etc.
    payment_type_id VARCHAR(30),                         -- 'credit_card', 'debit_card', 'ticket', 'bank_transfer'

    -- Motivo de rechazo (si aplica)
    status_detail VARCHAR(100),                          -- 'cc_rejected_bad_filled_card_number', etc.

    -- ====================================================================
    -- 📋 SECCIÓN: METADATA Y REFERENCIAS
    -- ====================================================================
    external_reference VARCHAR(100),                     -- Formato: org_{organizacion_id}_{timestamp}
    metadata JSONB DEFAULT '{}',                         -- Datos adicionales de MP

    -- ====================================================================
    -- 📅 SECCIÓN: FECHAS
    -- ====================================================================
    fecha_pago TIMESTAMPTZ,                              -- Fecha de creación del pago en MP
    fecha_aprobacion TIMESTAMPTZ,                        -- Fecha de aprobación (si fue aprobado)

    -- ====================================================================
    -- ⏰ SECCIÓN: AUDITORÍA
    -- ====================================================================
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES
    -- ====================================================================
    CONSTRAINT valid_monto_pago
        CHECK (monto >= 0),
    CONSTRAINT valid_estado_pago
        CHECK (estado IN ('approved', 'rejected', 'pending', 'refunded', 'cancelled', 'in_process', 'charged_back')),
    CONSTRAINT valid_tipo_pago
        CHECK (tipo_pago IS NULL OR tipo_pago IN ('subscription', 'upgrade', 'downgrade', 'manual', 'one_time'))
);

-- ====================================================================
-- TABLA 2: METODOS_PAGO - INFORMACIÓN DE TARJETAS (PCI COMPLIANT)
-- ====================================================================
-- Almacena solo información segura de métodos de pago.
-- NUNCA guarda números de tarjeta completos, CVV o datos sensibles.
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE metodos_pago (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- ====================================================================
    -- 💳 SECCIÓN: INFO MERCADO PAGO
    -- ====================================================================
    customer_id_mp VARCHAR(100),                         -- ID del customer en Mercado Pago
    payment_method_id_mp VARCHAR(100),                   -- ID del método de pago en MP
    card_id_mp VARCHAR(100),                             -- ID de la tarjeta en MP

    -- ====================================================================
    -- 🎴 SECCIÓN: INFO DE LA TARJETA (SOLO DATOS SEGUROS)
    -- ====================================================================
    -- ⚠️ PCI COMPLIANCE: Solo últimos 4 dígitos
    card_last_digits VARCHAR(4),                         -- Últimos 4 dígitos (ej: "4242")
    card_brand VARCHAR(30),                              -- 'visa', 'mastercard', 'amex', 'carnet'
    card_holder_name VARCHAR(100),                       -- Nombre del titular

    -- Vencimiento
    expiration_month INTEGER CHECK (expiration_month >= 1 AND expiration_month <= 12),
    expiration_year INTEGER CHECK (expiration_year >= 2025),

    -- ====================================================================
    -- 🎛️ SECCIÓN: ESTADO Y CONTROL
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,
    es_principal BOOLEAN DEFAULT FALSE,                  -- Solo un método puede ser principal

    -- 🗑️ SOFT DELETE (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- ⏰ SECCIÓN: AUDITORÍA
    -- ====================================================================
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- ====================================================================
    -- ✅ SECCIÓN: CONSTRAINTS
    -- ====================================================================
    -- Solo un método principal por organización
    CONSTRAINT unique_principal_per_org
        EXCLUDE (organizacion_id WITH =, es_principal WITH =)
        WHERE (es_principal = TRUE)
);

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

-- Tabla pagos
COMMENT ON TABLE pagos IS 'Registro de todos los pagos procesados por Mercado Pago';
COMMENT ON COLUMN pagos.payment_id_mp IS 'ID único del pago en Mercado Pago (garantiza idempotencia)';
COMMENT ON COLUMN pagos.subscription_id_mp IS 'ID de la suscripción en Mercado Pago (si el pago es recurrente)';
COMMENT ON COLUMN pagos.external_reference IS 'Formato: org_{organizacion_id}_{timestamp} - Permite vincular pago con organización en webhooks';
COMMENT ON COLUMN pagos.estado IS 'Estados posibles: approved, rejected, pending, refunded, cancelled, in_process, charged_back';
COMMENT ON COLUMN pagos.tipo_pago IS 'Tipo de pago: subscription (recurrente), upgrade, downgrade, manual, one_time';
COMMENT ON COLUMN pagos.metadata IS 'Datos adicionales retornados por Mercado Pago (JSON completo del pago)';

-- Tabla metodos_pago
COMMENT ON TABLE metodos_pago IS 'Métodos de pago de organizaciones (PCI Compliant - solo últimos 4 dígitos)';
COMMENT ON COLUMN metodos_pago.card_last_digits IS 'Últimos 4 dígitos de la tarjeta (PCI Safe)';
COMMENT ON COLUMN metodos_pago.customer_id_mp IS 'ID del customer en Mercado Pago';
COMMENT ON COLUMN metodos_pago.card_id_mp IS 'ID de la tarjeta guardada en Mercado Pago';
COMMENT ON COLUMN metodos_pago.es_principal IS 'Solo un método puede ser principal por organización (EXCLUDE constraint)';
