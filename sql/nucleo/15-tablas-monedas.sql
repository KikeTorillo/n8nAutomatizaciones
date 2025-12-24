-- =====================================================================
-- TABLAS DE MONEDAS Y TASAS DE CAMBIO
-- Módulo: Multi-Moneda (Fase 4)
-- Fecha: Diciembre 2025
-- =====================================================================

-- =====================================================================
-- CATÁLOGO DE MONEDAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS monedas (
    codigo VARCHAR(3) PRIMARY KEY,           -- 'MXN', 'COP', 'USD'
    nombre VARCHAR(50) NOT NULL,             -- 'Peso Mexicano'
    simbolo VARCHAR(5) NOT NULL,             -- '$'
    decimales INTEGER DEFAULT 2,             -- Cantidad de decimales
    locale VARCHAR(10) NOT NULL,             -- 'es-MX' para Intl.NumberFormat
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE monedas IS 'Catálogo de monedas soportadas por el sistema';
COMMENT ON COLUMN monedas.locale IS 'Locale para formateo con Intl.NumberFormat (ej: es-MX, es-CO)';

-- =====================================================================
-- TASAS DE CAMBIO HISTÓRICAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS tasas_cambio (
    id SERIAL PRIMARY KEY,
    moneda_origen VARCHAR(3) NOT NULL REFERENCES monedas(codigo),
    moneda_destino VARCHAR(3) NOT NULL REFERENCES monedas(codigo),
    tasa DECIMAL(12,6) NOT NULL,             -- Ej: 1 USD = 17.50 MXN → tasa = 17.500000
    fecha DATE NOT NULL,
    fuente VARCHAR(50) DEFAULT 'manual',     -- 'manual', 'banxico', 'openexchange', 'sistema'
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(moneda_origen, moneda_destino, fecha)
);

COMMENT ON TABLE tasas_cambio IS 'Historial de tasas de cambio entre monedas';
COMMENT ON COLUMN tasas_cambio.tasa IS 'Cantidad de moneda_destino por 1 unidad de moneda_origen';
COMMENT ON COLUMN tasas_cambio.fuente IS 'Origen de la tasa: manual, banxico, openexchange, sistema';

-- Índices para tasas de cambio
CREATE INDEX IF NOT EXISTS idx_tasas_cambio_fecha ON tasas_cambio(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_tasas_cambio_monedas ON tasas_cambio(moneda_origen, moneda_destino);
CREATE INDEX IF NOT EXISTS idx_tasas_cambio_lookup ON tasas_cambio(moneda_origen, moneda_destino, fecha DESC);

-- =====================================================================
-- PRECIOS DE SERVICIOS EN MÚLTIPLES MONEDAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS precios_servicio_moneda (
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    moneda VARCHAR(3) NOT NULL REFERENCES monedas(codigo),
    precio DECIMAL(10,2) NOT NULL,
    precio_minimo DECIMAL(10,2),
    precio_maximo DECIMAL(10,2),
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(servicio_id, moneda)
);

COMMENT ON TABLE precios_servicio_moneda IS 'Precios de servicios en diferentes monedas (multi-moneda)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_precios_servicio_org ON precios_servicio_moneda(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_precios_servicio_moneda ON precios_servicio_moneda(servicio_id, moneda);

-- =====================================================================
-- PRECIOS DE PRODUCTOS EN MÚLTIPLES MONEDAS
-- =====================================================================

CREATE TABLE IF NOT EXISTS precios_producto_moneda (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    moneda VARCHAR(3) NOT NULL REFERENCES monedas(codigo),
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2) NOT NULL,
    -- Dic 2025: precio_mayoreo eliminado, usar listas_precios
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(producto_id, moneda)
);

COMMENT ON TABLE precios_producto_moneda IS 'Precios de productos en diferentes monedas (multi-moneda)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_precios_producto_org ON precios_producto_moneda(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_precios_producto_moneda ON precios_producto_moneda(producto_id, moneda);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- RLS para precios de servicios
ALTER TABLE precios_servicio_moneda ENABLE ROW LEVEL SECURITY;

CREATE POLICY precios_servicio_tenant ON precios_servicio_moneda
    FOR ALL
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- RLS para precios de productos
ALTER TABLE precios_producto_moneda ENABLE ROW LEVEL SECURITY;

CREATE POLICY precios_producto_tenant ON precios_producto_moneda
    FOR ALL
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    )
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =====================================================================
-- FUNCIÓN: Obtener tasa de cambio más reciente
-- =====================================================================

CREATE OR REPLACE FUNCTION obtener_tasa_cambio(
    p_moneda_origen VARCHAR(3),
    p_moneda_destino VARCHAR(3),
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(12,6) AS $$
DECLARE
    v_tasa DECIMAL(12,6);
BEGIN
    -- Si son la misma moneda, retornar 1
    IF p_moneda_origen = p_moneda_destino THEN
        RETURN 1.000000;
    END IF;

    -- Buscar tasa más reciente hasta la fecha indicada
    SELECT tasa INTO v_tasa
    FROM tasas_cambio
    WHERE moneda_origen = p_moneda_origen
      AND moneda_destino = p_moneda_destino
      AND fecha <= p_fecha
    ORDER BY fecha DESC
    LIMIT 1;

    -- Si no hay tasa directa, intentar inversa
    IF v_tasa IS NULL THEN
        SELECT 1.0 / tasa INTO v_tasa
        FROM tasas_cambio
        WHERE moneda_origen = p_moneda_destino
          AND moneda_destino = p_moneda_origen
          AND fecha <= p_fecha
        ORDER BY fecha DESC
        LIMIT 1;
    END IF;

    RETURN COALESCE(v_tasa, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_tasa_cambio IS 'Obtiene la tasa de cambio más reciente entre dos monedas';

-- =====================================================================
-- FUNCIÓN: Convertir monto entre monedas
-- =====================================================================

CREATE OR REPLACE FUNCTION convertir_moneda(
    p_monto DECIMAL(12,2),
    p_moneda_origen VARCHAR(3),
    p_moneda_destino VARCHAR(3),
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    v_tasa DECIMAL(12,6);
BEGIN
    v_tasa := obtener_tasa_cambio(p_moneda_origen, p_moneda_destino, p_fecha);

    IF v_tasa = 0 THEN
        RAISE EXCEPTION 'No hay tasa de cambio disponible de % a %', p_moneda_origen, p_moneda_destino;
    END IF;

    RETURN ROUND(p_monto * v_tasa, 2);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION convertir_moneda IS 'Convierte un monto de una moneda a otra usando la tasa más reciente';

-- =====================================================================
-- DATOS SEMILLA - MONEDAS
-- =====================================================================

INSERT INTO monedas (codigo, nombre, simbolo, decimales, locale, activo, orden) VALUES
    ('MXN', 'Peso Mexicano', '$', 2, 'es-MX', true, 1),
    ('COP', 'Peso Colombiano', '$', 0, 'es-CO', true, 2),
    ('USD', 'Dólar Estadounidense', '$', 2, 'en-US', true, 3),
    ('ARS', 'Peso Argentino', '$', 2, 'es-AR', false, 4),
    ('CLP', 'Peso Chileno', '$', 0, 'es-CL', false, 5),
    ('PEN', 'Sol Peruano', 'S/', 2, 'es-PE', false, 6),
    ('EUR', 'Euro', '€', 2, 'es-ES', false, 7)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    simbolo = EXCLUDED.simbolo,
    decimales = EXCLUDED.decimales,
    locale = EXCLUDED.locale,
    orden = EXCLUDED.orden;

-- =====================================================================
-- DATOS SEMILLA - TASAS DE CAMBIO BASE
-- =====================================================================

-- Tasas base (MXN como referencia para LATAM)
INSERT INTO tasas_cambio (moneda_origen, moneda_destino, tasa, fecha, fuente) VALUES
    ('MXN', 'MXN', 1.000000, CURRENT_DATE, 'sistema'),
    ('USD', 'MXN', 17.500000, CURRENT_DATE, 'manual'),
    ('MXN', 'USD', 0.057143, CURRENT_DATE, 'manual'),
    ('COP', 'MXN', 0.004375, CURRENT_DATE, 'manual'),
    ('MXN', 'COP', 228.571429, CURRENT_DATE, 'manual')
ON CONFLICT (moneda_origen, moneda_destino, fecha) DO UPDATE SET
    tasa = EXCLUDED.tasa,
    fuente = EXCLUDED.fuente,
    actualizado_en = NOW();

-- =====================================================================
-- TRIGGER: Actualizar timestamp en tasas_cambio
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_tasas_cambio_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasas_cambio_updated ON tasas_cambio;
CREATE TRIGGER trg_tasas_cambio_updated
    BEFORE UPDATE ON tasas_cambio
    FOR EACH ROW
    EXECUTE FUNCTION trigger_tasas_cambio_updated();

-- =====================================================================
-- TRIGGER: Actualizar timestamp en precios_servicio_moneda
-- =====================================================================

DROP TRIGGER IF EXISTS trg_precios_servicio_updated ON precios_servicio_moneda;
CREATE TRIGGER trg_precios_servicio_updated
    BEFORE UPDATE ON precios_servicio_moneda
    FOR EACH ROW
    EXECUTE FUNCTION trigger_tasas_cambio_updated();

-- =====================================================================
-- TRIGGER: Actualizar timestamp en precios_producto_moneda
-- =====================================================================

DROP TRIGGER IF EXISTS trg_precios_producto_updated ON precios_producto_moneda;
CREATE TRIGGER trg_precios_producto_updated
    BEFORE UPDATE ON precios_producto_moneda
    FOR EACH ROW
    EXECUTE FUNCTION trigger_tasas_cambio_updated();
