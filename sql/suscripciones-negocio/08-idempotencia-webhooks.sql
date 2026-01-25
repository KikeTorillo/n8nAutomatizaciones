-- ====================================================================
-- MIGRACIÓN: Idempotencia de Webhooks
-- ====================================================================
-- Fecha: 24 Enero 2026
-- Descripción: Tabla para deduplicación de webhooks y prevención de
--              pagos duplicados por reintentos.
-- ====================================================================

-- 1. Tabla para deduplicación de webhooks
CREATE TABLE IF NOT EXISTS webhooks_procesados (
    id SERIAL PRIMARY KEY,
    gateway VARCHAR(30) NOT NULL,           -- 'mercadopago', 'stripe'
    request_id VARCHAR(255) NOT NULL,       -- x-request-id del header
    event_type VARCHAR(100) NOT NULL,       -- 'payment', 'subscription_preapproval', etc.
    data_id VARCHAR(150),                   -- ID del recurso (pago, suscripción)
    organizacion_id INTEGER,                -- Org que recibió el webhook (del URL)
    resultado VARCHAR(20) NOT NULL,         -- 'success', 'error', 'skipped'
    mensaje TEXT,                           -- Mensaje adicional o error
    procesado_en TIMESTAMP DEFAULT NOW(),
    ip_origen INET,                         -- IP del request

    -- Constraint único para deduplicación
    CONSTRAINT uq_webhook_request UNIQUE (gateway, request_id)
);

-- Índice para consultas por fecha (limpieza)
CREATE INDEX IF NOT EXISTS idx_webhooks_procesados_fecha
    ON webhooks_procesados(procesado_en);

-- Índice para consultas por gateway y data_id
CREATE INDEX IF NOT EXISTS idx_webhooks_procesados_gateway_data
    ON webhooks_procesados(gateway, data_id);

-- 2. Índice único en pagos para prevenir duplicados por transaction_id
-- Solo aplica cuando transaction_id no es NULL y estado es 'completado'
CREATE UNIQUE INDEX IF NOT EXISTS idx_pagos_transaction_unique
    ON pagos_suscripcion(gateway, transaction_id)
    WHERE transaction_id IS NOT NULL AND estado = 'completado';

-- 3. Comentarios
COMMENT ON TABLE webhooks_procesados IS 'Registro de webhooks procesados para idempotencia';
COMMENT ON COLUMN webhooks_procesados.gateway IS 'Proveedor de pago: mercadopago, stripe';
COMMENT ON COLUMN webhooks_procesados.request_id IS 'ID único del request (header x-request-id)';
COMMENT ON COLUMN webhooks_procesados.resultado IS 'Resultado: success, error, skipped';

-- 4. Función para limpiar webhooks antiguos (> 30 días)
CREATE OR REPLACE FUNCTION limpiar_webhooks_antiguos()
RETURNS INTEGER AS $$
DECLARE
    filas_eliminadas INTEGER;
BEGIN
    DELETE FROM webhooks_procesados
    WHERE procesado_en < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS filas_eliminadas = ROW_COUNT;

    RETURN filas_eliminadas;
END;
$$ LANGUAGE plpgsql;

-- 5. Job pg_cron para limpieza automática (ejecutar una vez al día a las 4am)
-- NOTA: Descomentar después de verificar que pg_cron está instalado
-- SELECT cron.schedule(
--     'webhooks-limpieza-diaria',
--     '0 4 * * *',
--     $$SELECT limpiar_webhooks_antiguos()$$
-- );

-- ====================================================================
-- VERIFICACIÓN
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks_procesados') THEN
        RAISE NOTICE '✅ Tabla webhooks_procesados creada correctamente';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_pagos_transaction_unique'
    ) THEN
        RAISE NOTICE '✅ Índice único de transacciones creado correctamente';
    END IF;
END $$;
