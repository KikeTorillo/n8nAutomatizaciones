-- ============================================================================
-- MÓDULO: CHECKOUT TOKENS (CUSTOMER BILLING)
-- ============================================================================
-- Descripción: Tokens para checkout público sin autenticación.
--              Permite que clientes de organizaciones paguen sin login.
-- Versión: 1.0.0
-- Fecha: 24 Enero 2026
-- Dependencias: suscripciones-negocio/01-tablas.sql
--
-- Caso de uso:
--   1. Admin del gimnasio crea suscripción para cliente Juan
--   2. Sistema genera token único y URL: nexo.com/checkout/abc123...
--   3. Juan abre link (sin login), ve resumen, paga
--   4. Token se marca como usado
-- ============================================================================

-- ============================================================================
-- TABLA: checkout_tokens
-- ============================================================================
-- Tokens de checkout para Customer Billing.
-- Permite pagos públicos sin autenticación.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS checkout_tokens (
    -- Identificación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES planes_suscripcion_org(id) ON DELETE CASCADE,

    -- Token único (64 caracteres hex = 32 bytes)
    token VARCHAR(64) NOT NULL UNIQUE,

    -- Detalles del checkout
    periodo VARCHAR(20) DEFAULT 'mensual',      -- mensual, trimestral, semestral, anual
    cupon_codigo VARCHAR(50),                   -- Cupón aplicado (si hay)
    precio_calculado NUMERIC(10,2) NOT NULL,    -- Precio final con descuento
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Estado del token
    estado VARCHAR(20) DEFAULT 'pendiente',     -- pendiente, usado, expirado, cancelado

    -- Control de expiración
    expira_en TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    -- Trazabilidad
    suscripcion_id INTEGER REFERENCES suscripciones_org(id) ON DELETE SET NULL,  -- Suscripción creada (si se completó)

    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    usado_en TIMESTAMP,
    creado_por INTEGER REFERENCES usuarios(id),

    -- Constraints
    CONSTRAINT chk_checkout_token_estado CHECK (
        estado IN ('pendiente', 'usado', 'expirado', 'cancelado')
    ),
    CONSTRAINT chk_checkout_token_periodo CHECK (
        periodo IN ('mensual', 'trimestral', 'semestral', 'anual')
    ),
    CONSTRAINT chk_checkout_token_precio CHECK (precio_calculado >= 0)
);

COMMENT ON TABLE checkout_tokens IS
'Tokens de checkout para Customer Billing. Permite pagos públicos sin autenticación de usuario.';

COMMENT ON COLUMN checkout_tokens.token IS
'Token único de 64 caracteres (32 bytes en hex). Generado con crypto.randomBytes(32).toString("hex")';

COMMENT ON COLUMN checkout_tokens.estado IS
'Estados: pendiente (no usado), usado (pago iniciado), expirado (pasó fecha), cancelado (anulado manualmente)';

-- ============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================================

-- Índice principal para búsqueda por token (acceso público)
CREATE INDEX IF NOT EXISTS idx_checkout_tokens_token
    ON checkout_tokens(token);

-- Índice para listar tokens por organización
CREATE INDEX IF NOT EXISTS idx_checkout_tokens_org
    ON checkout_tokens(organizacion_id);

-- Índice para tokens pendientes (limpiar expirados)
CREATE INDEX IF NOT EXISTS idx_checkout_tokens_pendientes
    ON checkout_tokens(estado, expira_en)
    WHERE estado = 'pendiente';

-- Índice para tokens por cliente
CREATE INDEX IF NOT EXISTS idx_checkout_tokens_cliente
    ON checkout_tokens(cliente_id);

-- ============================================================================
-- POLÍTICAS RLS
-- ============================================================================
-- RLS con bypass para lectura pública por token.
-- El checkout público necesita leer sin contexto de organización.
-- ----------------------------------------------------------------------------

ALTER TABLE checkout_tokens ENABLE ROW LEVEL SECURITY;

-- SELECT: Bypass para lectura pública (necesario para checkout sin auth)
-- También permite lectura normal con contexto de org
CREATE POLICY checkout_tokens_select ON checkout_tokens
    FOR SELECT TO saas_app
    USING (
        current_setting('app.bypass_rls', true)::boolean = true
        OR organizacion_id = current_setting('app.current_tenant_id', true)::integer
    );

-- INSERT/UPDATE/DELETE: Solo con contexto de organización
CREATE POLICY checkout_tokens_insert ON checkout_tokens
    FOR INSERT TO saas_app
    WITH CHECK (organizacion_id = current_setting('app.current_tenant_id')::integer);

CREATE POLICY checkout_tokens_update ON checkout_tokens
    FOR UPDATE TO saas_app
    USING (
        current_setting('app.bypass_rls', true)::boolean = true
        OR organizacion_id = current_setting('app.current_tenant_id', true)::integer
    );

CREATE POLICY checkout_tokens_delete ON checkout_tokens
    FOR DELETE TO saas_app
    USING (organizacion_id = current_setting('app.current_tenant_id')::integer);

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================
-- Tabla creada: checkout_tokens
-- Índices: 4
-- Políticas RLS: 4
-- ============================================================================
