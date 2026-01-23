-- ============================================================================
-- CONECTORES DE PAGO MULTI-TENANT
-- ============================================================================
-- Permite que cada organización configure sus propias credenciales de gateways
-- de pago (Stripe, MercadoPago) en lugar de usar credenciales globales.
--
-- Fecha: Enero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: conectores_pago_org
-- ============================================================================
-- Almacena credenciales encriptadas de gateways de pago por organización

CREATE TABLE IF NOT EXISTS conectores_pago_org (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación del gateway
    gateway VARCHAR(30) NOT NULL,               -- 'stripe', 'mercadopago', 'paypal', 'conekta'
    entorno VARCHAR(20) DEFAULT 'sandbox',      -- 'sandbox', 'production'
    nombre_display VARCHAR(100),                -- Nombre amigable: "MercadoPago Principal"

    -- Credenciales encriptadas (AES-256-GCM)
    -- IMPORTANTE: Usar servicio credentialEncryption.service.js para encriptar/desencriptar
    credenciales_encrypted BYTEA NOT NULL,
    credenciales_iv BYTEA NOT NULL,
    credenciales_tag BYTEA NOT NULL,
    api_key_hint VARCHAR(10),                   -- Últimos 4 chars para UI: "...sk_abc"

    -- Webhook configuration
    webhook_url TEXT,
    webhook_secret_encrypted BYTEA,
    webhook_secret_iv BYTEA,
    webhook_secret_tag BYTEA,

    -- Estado y configuración
    activo BOOLEAN DEFAULT TRUE,
    es_principal BOOLEAN DEFAULT FALSE,         -- Solo 1 principal por gateway/entorno
    verificado BOOLEAN DEFAULT FALSE,           -- true si pasó test de conectividad
    ultima_verificacion TIMESTAMP,
    errores_consecutivos INTEGER DEFAULT 0,     -- Para circuit breaker

    -- Metadata
    metadata JSONB DEFAULT '{}',                -- Datos adicionales del gateway

    -- Auditoría
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- Constraints
    CONSTRAINT uq_conector_org_gateway_entorno UNIQUE (organizacion_id, gateway, entorno),
    CONSTRAINT chk_gateway_valido CHECK (gateway IN ('stripe', 'mercadopago', 'paypal', 'conekta')),
    CONSTRAINT chk_entorno_valido CHECK (entorno IN ('sandbox', 'production'))
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_conectores_org_id ON conectores_pago_org(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_conectores_gateway ON conectores_pago_org(gateway, entorno);
CREATE INDEX IF NOT EXISTS idx_conectores_activo ON conectores_pago_org(organizacion_id, activo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_conectores_principal ON conectores_pago_org(organizacion_id, gateway, es_principal) WHERE es_principal = true;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE conectores_pago_org ENABLE ROW LEVEL SECURITY;

-- Política: Solo ver conectores de la propia organización
CREATE POLICY conectores_org_select ON conectores_pago_org
    FOR SELECT
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::integer
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política: Solo insertar en la propia organización
CREATE POLICY conectores_org_insert ON conectores_pago_org
    FOR INSERT
    WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::integer
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política: Solo actualizar conectores de la propia organización
CREATE POLICY conectores_org_update ON conectores_pago_org
    FOR UPDATE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::integer
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política: Solo eliminar conectores de la propia organización
CREATE POLICY conectores_org_delete ON conectores_pago_org
    FOR DELETE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::integer
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conectores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conectores_timestamp ON conectores_pago_org;
CREATE TRIGGER trg_conectores_timestamp
    BEFORE UPDATE ON conectores_pago_org
    FOR EACH ROW
    EXECUTE FUNCTION update_conectores_timestamp();

-- ============================================================================
-- TRIGGER: Asegurar solo 1 conector principal por gateway/entorno
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_principal_conector()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está marcando como principal, quitar principal de otros
    IF NEW.es_principal = TRUE THEN
        UPDATE conectores_pago_org
        SET es_principal = FALSE
        WHERE organizacion_id = NEW.organizacion_id
          AND gateway = NEW.gateway
          AND entorno = NEW.entorno
          AND id != NEW.id
          AND es_principal = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_principal_conector ON conectores_pago_org;
CREATE TRIGGER trg_single_principal_conector
    BEFORE INSERT OR UPDATE OF es_principal ON conectores_pago_org
    FOR EACH ROW
    WHEN (NEW.es_principal = TRUE)
    EXECUTE FUNCTION ensure_single_principal_conector();

-- ============================================================================
-- FUNCIÓN: Obtener conector activo para gateway
-- ============================================================================

CREATE OR REPLACE FUNCTION get_conector_activo(
    p_organizacion_id INTEGER,
    p_gateway VARCHAR(30),
    p_entorno VARCHAR(20) DEFAULT 'production'
)
RETURNS TABLE (
    id INTEGER,
    gateway VARCHAR(30),
    entorno VARCHAR(20),
    credenciales_encrypted BYTEA,
    credenciales_iv BYTEA,
    credenciales_tag BYTEA,
    webhook_secret_encrypted BYTEA,
    webhook_secret_iv BYTEA,
    webhook_secret_tag BYTEA,
    verificado BOOLEAN
) AS $$
BEGIN
    -- Primero buscar conector principal
    RETURN QUERY
    SELECT
        c.id,
        c.gateway,
        c.entorno,
        c.credenciales_encrypted,
        c.credenciales_iv,
        c.credenciales_tag,
        c.webhook_secret_encrypted,
        c.webhook_secret_iv,
        c.webhook_secret_tag,
        c.verificado
    FROM conectores_pago_org c
    WHERE c.organizacion_id = p_organizacion_id
      AND c.gateway = p_gateway
      AND c.entorno = p_entorno
      AND c.activo = TRUE
    ORDER BY c.es_principal DESC, c.verificado DESC, c.creado_en ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE conectores_pago_org IS 'Conectores de pago multi-tenant con credenciales encriptadas';
COMMENT ON COLUMN conectores_pago_org.credenciales_encrypted IS 'Credenciales encriptadas con AES-256-GCM. Contiene JSON: {access_token, public_key, ...}';
COMMENT ON COLUMN conectores_pago_org.api_key_hint IS 'Últimos 4 caracteres de la API key para identificación en UI';
COMMENT ON COLUMN conectores_pago_org.es_principal IS 'Si es el conector principal para este gateway/entorno. Solo 1 por combinación.';
COMMENT ON COLUMN conectores_pago_org.errores_consecutivos IS 'Contador de errores para implementar circuit breaker pattern';
