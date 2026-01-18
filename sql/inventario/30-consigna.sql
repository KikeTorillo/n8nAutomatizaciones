-- =====================================================
-- CONSIGNA (Inventario en Consignación)
-- =====================================================
-- Inventario de terceros almacenado físicamente en nuestro almacén,
-- pero que sigue siendo propiedad del proveedor hasta que se vende.
-- Solo se paga al proveedor por unidades vendidas mediante liquidación.
-- =====================================================

-- =====================================================
-- TABLA: acuerdos_consigna
-- =====================================================
-- Acuerdos/contratos de consignación con proveedores
CREATE TABLE IF NOT EXISTS acuerdos_consigna (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    folio VARCHAR(20) NOT NULL,  -- CONS-2025-0001
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),

    -- Términos del acuerdo
    porcentaje_comision DECIMAL(5,2) NOT NULL DEFAULT 0,  -- Tu comisión por venta (0-100%)
    dias_liquidacion INTEGER NOT NULL DEFAULT 30,          -- Frecuencia de pago al proveedor
    dias_devolucion INTEGER NOT NULL DEFAULT 90,           -- Máximo tiempo para devolver no vendido

    -- Sucursal/Almacén destino
    sucursal_id INTEGER REFERENCES sucursales(id),
    ubicacion_consigna_id INTEGER REFERENCES ubicaciones_almacen(id),

    -- Estado del acuerdo
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'activo', 'pausado', 'terminado')),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,

    -- Auditoría
    notas TEXT,
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activado_por INTEGER REFERENCES usuarios(id),
    activado_en TIMESTAMPTZ,

    UNIQUE(organizacion_id, folio)
);

COMMENT ON TABLE acuerdos_consigna IS 'Acuerdos de consignación con proveedores';
COMMENT ON COLUMN acuerdos_consigna.porcentaje_comision IS 'Porcentaje de comisión que te quedas por cada venta';
COMMENT ON COLUMN acuerdos_consigna.dias_liquidacion IS 'Cada cuántos días se liquida al proveedor';

-- =====================================================
-- TABLA: acuerdos_consigna_productos
-- =====================================================
-- Productos incluidos en cada acuerdo de consignación
CREATE TABLE IF NOT EXISTS acuerdos_consigna_productos (
    id SERIAL PRIMARY KEY,
    acuerdo_id INTEGER NOT NULL REFERENCES acuerdos_consigna(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    variante_id INTEGER REFERENCES variantes_producto(id),

    -- Precios específicos del acuerdo
    precio_consigna DECIMAL(12,2) NOT NULL,  -- Lo que pagas al proveedor por unidad vendida
    precio_venta_sugerido DECIMAL(12,2),     -- PVP sugerido por el proveedor

    -- Límites opcionales
    cantidad_minima INTEGER DEFAULT 0,
    cantidad_maxima INTEGER,

    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice unico funcional para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_acp_unique
    ON acuerdos_consigna_productos(acuerdo_id, producto_id, COALESCE(variante_id, 0));

COMMENT ON TABLE acuerdos_consigna_productos IS 'Productos incluidos en acuerdos de consignación';
COMMENT ON COLUMN acuerdos_consigna_productos.precio_consigna IS 'Precio que se paga al proveedor por unidad vendida';

-- =====================================================
-- TABLA: liquidaciones_consigna
-- =====================================================
-- Liquidaciones periódicas a proveedores (se crea antes para FK)
CREATE TABLE IF NOT EXISTS liquidaciones_consigna (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    folio VARCHAR(20) NOT NULL,  -- LIQ-2025-0001
    acuerdo_id INTEGER NOT NULL REFERENCES acuerdos_consigna(id),
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),

    -- Período de liquidación
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,

    -- Totales calculados
    total_unidades_vendidas INTEGER NOT NULL DEFAULT 0,
    subtotal_ventas DECIMAL(12,2) NOT NULL DEFAULT 0,        -- Total a precio consigna
    comision DECIMAL(12,2) NOT NULL DEFAULT 0,               -- Tu comisión
    total_pagar_proveedor DECIMAL(12,2) NOT NULL DEFAULT 0,  -- subtotal - comisión

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'confirmada', 'pagada', 'cancelada')),

    -- Información de pago
    fecha_pago DATE,
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(100),

    -- Auditoría
    notas TEXT,
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmado_por INTEGER REFERENCES usuarios(id),
    confirmado_en TIMESTAMPTZ,
    pagado_por INTEGER REFERENCES usuarios(id),
    pagado_en TIMESTAMPTZ,

    UNIQUE(organizacion_id, folio)
);

COMMENT ON TABLE liquidaciones_consigna IS 'Liquidaciones periódicas de ventas en consignación';

-- =====================================================
-- TABLA: stock_consigna
-- =====================================================
-- Stock actual en consignación por producto/ubicación
CREATE TABLE IF NOT EXISTS stock_consigna (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    acuerdo_id INTEGER NOT NULL REFERENCES acuerdos_consigna(id),
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    variante_id INTEGER REFERENCES variantes_producto(id),
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id),
    ubicacion_id INTEGER REFERENCES ubicaciones_almacen(id),

    -- Cantidades
    cantidad_disponible INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
    cantidad_reservada INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_reservada >= 0),

    -- Tracking
    ultima_entrada TIMESTAMPTZ,
    ultima_salida TIMESTAMPTZ,

    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice unico funcional para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_consigna_unique
    ON stock_consigna(acuerdo_id, producto_id, COALESCE(variante_id, 0), sucursal_id, COALESCE(ubicacion_id, 0));

COMMENT ON TABLE stock_consigna IS 'Stock actual en consignación separado del stock propio';

-- =====================================================
-- TABLA: movimientos_consigna
-- =====================================================
-- Historial de movimientos del stock en consignación
CREATE TABLE IF NOT EXISTS movimientos_consigna (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    acuerdo_id INTEGER NOT NULL REFERENCES acuerdos_consigna(id),
    stock_consigna_id INTEGER NOT NULL REFERENCES stock_consigna(id),

    -- Tipo de movimiento
    tipo VARCHAR(20) NOT NULL
        CHECK (tipo IN ('entrada', 'venta', 'devolucion', 'ajuste', 'merma')),

    -- Producto
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    variante_id INTEGER REFERENCES variantes_producto(id),
    numero_serie_id INTEGER REFERENCES numeros_serie(id),
    lote VARCHAR(50),  -- Código de lote (no FK, igual que en stock_ubicaciones)

    -- Cantidades y valores
    cantidad INTEGER NOT NULL,  -- Positivo para entrada, negativo para salida
    precio_unitario DECIMAL(12,2) NOT NULL,  -- Precio consigna del acuerdo
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (ABS(cantidad) * precio_unitario) STORED,

    -- Referencias a documentos
    venta_pos_id INTEGER REFERENCES ventas_pos(id),
    venta_pos_item_id INTEGER REFERENCES ventas_pos_items(id),

    -- Liquidación
    liquidacion_id INTEGER REFERENCES liquidaciones_consigna(id),
    liquidado BOOLEAN NOT NULL DEFAULT false,
    liquidado_en TIMESTAMPTZ,

    -- Auditoría
    notas TEXT,
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE movimientos_consigna IS 'Historial de entradas, ventas y devoluciones de stock consigna';
COMMENT ON COLUMN movimientos_consigna.liquidado IS 'Indica si este movimiento ya fue incluido en una liquidación';

-- =====================================================
-- FUNCIÓN: Generar folio de acuerdo consigna
-- =====================================================
CREATE OR REPLACE FUNCTION generar_folio_acuerdo_consigna(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_year TEXT;
    v_seq INTEGER;
    v_folio VARCHAR(20);
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CAST(NULLIF(SUBSTRING(folio FROM 'CONS-\d{4}-(\d+)'), '') AS INTEGER)
    ), 0) + 1
    INTO v_seq
    FROM acuerdos_consigna
    WHERE organizacion_id = p_organizacion_id
      AND folio LIKE 'CONS-' || v_year || '-%';

    v_folio := 'CONS-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
    RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Generar folio de liquidación
-- =====================================================
CREATE OR REPLACE FUNCTION generar_folio_liquidacion_consigna(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_year TEXT;
    v_seq INTEGER;
    v_folio VARCHAR(20);
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CAST(NULLIF(SUBSTRING(folio FROM 'LIQ-\d{4}-(\d+)'), '') AS INTEGER)
    ), 0) + 1
    INTO v_seq
    FROM liquidaciones_consigna
    WHERE organizacion_id = p_organizacion_id
      AND folio LIKE 'LIQ-' || v_year || '-%';

    v_folio := 'LIQ-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
    RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Registrar movimiento de consigna
-- =====================================================
CREATE OR REPLACE FUNCTION registrar_movimiento_consigna(
    p_organizacion_id INTEGER,
    p_acuerdo_id INTEGER,
    p_producto_id INTEGER,
    p_variante_id INTEGER,
    p_sucursal_id INTEGER,
    p_ubicacion_id INTEGER,
    p_tipo VARCHAR(20),
    p_cantidad INTEGER,
    p_precio_unitario DECIMAL(12,2),
    p_venta_pos_id INTEGER DEFAULT NULL,
    p_venta_pos_item_id INTEGER DEFAULT NULL,
    p_numero_serie_id INTEGER DEFAULT NULL,
    p_lote VARCHAR(50) DEFAULT NULL,
    p_notas TEXT DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_stock_id INTEGER;
    v_movimiento_id INTEGER;
BEGIN
    -- Buscar o crear registro de stock
    SELECT id INTO v_stock_id
    FROM stock_consigna
    WHERE acuerdo_id = p_acuerdo_id
      AND producto_id = p_producto_id
      AND COALESCE(variante_id, 0) = COALESCE(p_variante_id, 0)
      AND sucursal_id = p_sucursal_id
      AND COALESCE(ubicacion_id, 0) = COALESCE(p_ubicacion_id, 0);

    IF v_stock_id IS NULL THEN
        INSERT INTO stock_consigna (
            organizacion_id, acuerdo_id, producto_id, variante_id,
            sucursal_id, ubicacion_id, cantidad_disponible
        ) VALUES (
            p_organizacion_id, p_acuerdo_id, p_producto_id, p_variante_id,
            p_sucursal_id, p_ubicacion_id, 0
        )
        RETURNING id INTO v_stock_id;
    END IF;

    -- Actualizar stock según tipo de movimiento
    IF p_tipo = 'entrada' THEN
        UPDATE stock_consigna
        SET cantidad_disponible = cantidad_disponible + p_cantidad,
            ultima_entrada = NOW(),
            actualizado_en = NOW()
        WHERE id = v_stock_id;
    ELSIF p_tipo IN ('venta', 'devolucion', 'merma') THEN
        UPDATE stock_consigna
        SET cantidad_disponible = cantidad_disponible - ABS(p_cantidad),
            ultima_salida = NOW(),
            actualizado_en = NOW()
        WHERE id = v_stock_id;
    ELSIF p_tipo = 'ajuste' THEN
        UPDATE stock_consigna
        SET cantidad_disponible = cantidad_disponible + p_cantidad,
            actualizado_en = NOW()
        WHERE id = v_stock_id;
    END IF;

    -- Registrar movimiento
    INSERT INTO movimientos_consigna (
        organizacion_id, acuerdo_id, stock_consigna_id, tipo,
        producto_id, variante_id, numero_serie_id, lote,
        cantidad, precio_unitario, venta_pos_id, venta_pos_item_id,
        notas, creado_por
    ) VALUES (
        p_organizacion_id, p_acuerdo_id, v_stock_id, p_tipo,
        p_producto_id, p_variante_id, p_numero_serie_id, p_lote,
        CASE WHEN p_tipo IN ('venta', 'devolucion', 'merma') THEN -ABS(p_cantidad) ELSE p_cantidad END,
        p_precio_unitario, p_venta_pos_id, p_venta_pos_item_id,
        p_notas, p_usuario_id
    )
    RETURNING id INTO v_movimiento_id;

    RETURN v_movimiento_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Verificar stock consigna disponible
-- =====================================================
CREATE OR REPLACE FUNCTION verificar_stock_consigna(
    p_organizacion_id INTEGER,
    p_producto_id INTEGER,
    p_variante_id INTEGER,
    p_cantidad INTEGER,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    stock_consigna_id INTEGER,
    acuerdo_id INTEGER,
    cantidad_disponible INTEGER,
    precio_consigna DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.acuerdo_id,
        sc.cantidad_disponible,
        acp.precio_consigna
    FROM stock_consigna sc
    JOIN acuerdos_consigna ac ON sc.acuerdo_id = ac.id
    JOIN acuerdos_consigna_productos acp
        ON acp.acuerdo_id = ac.id
        AND acp.producto_id = sc.producto_id
        AND COALESCE(acp.variante_id, 0) = COALESCE(sc.variante_id, 0)
    WHERE sc.organizacion_id = p_organizacion_id
      AND sc.producto_id = p_producto_id
      AND COALESCE(sc.variante_id, 0) = COALESCE(p_variante_id, 0)
      AND (p_sucursal_id IS NULL OR sc.sucursal_id = p_sucursal_id)
      AND sc.cantidad_disponible >= p_cantidad
      AND ac.estado = 'activo'
      AND acp.activo = true
    ORDER BY sc.cantidad_disponible DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Calcular totales de liquidación
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_totales_liquidacion(
    p_acuerdo_id INTEGER,
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE (
    total_unidades INTEGER,
    subtotal DECIMAL(12,2),
    porcentaje_comision DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(ABS(mc.cantidad)), 0)::INTEGER,
        COALESCE(SUM(mc.subtotal), 0.00),
        ac.porcentaje_comision
    FROM acuerdos_consigna ac
    LEFT JOIN movimientos_consigna mc
        ON mc.acuerdo_id = ac.id
        AND mc.tipo = 'venta'
        AND mc.liquidado = false
        AND mc.creado_en::DATE BETWEEN p_fecha_desde AND p_fecha_hasta
    WHERE ac.id = p_acuerdo_id
    GROUP BY ac.porcentaje_comision;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA: Resumen de stock en consignación
-- =====================================================
CREATE OR REPLACE VIEW v_resumen_stock_consigna AS
SELECT
    sc.organizacion_id,
    sc.acuerdo_id,
    ac.folio AS acuerdo_folio,
    ac.proveedor_id,
    pr.nombre AS proveedor_nombre,
    sc.producto_id,
    p.nombre AS producto_nombre,
    p.sku,
    sc.variante_id,
    pv.nombre_variante AS variante_nombre,
    sc.sucursal_id,
    su.nombre AS sucursal_nombre,
    sc.cantidad_disponible,
    sc.cantidad_reservada,
    acp.precio_consigna,
    (sc.cantidad_disponible * acp.precio_consigna) AS valor_consigna,
    sc.ultima_entrada,
    sc.ultima_salida,
    ac.estado AS estado_acuerdo
FROM stock_consigna sc
JOIN acuerdos_consigna ac ON sc.acuerdo_id = ac.id
JOIN proveedores pr ON ac.proveedor_id = pr.id
JOIN productos p ON sc.producto_id = p.id
JOIN sucursales su ON sc.sucursal_id = su.id
LEFT JOIN variantes_producto pv ON sc.variante_id = pv.id
LEFT JOIN acuerdos_consigna_productos acp
    ON acp.acuerdo_id = ac.id
    AND acp.producto_id = sc.producto_id
    AND COALESCE(acp.variante_id, 0) = COALESCE(sc.variante_id, 0)
WHERE sc.cantidad_disponible > 0 OR sc.cantidad_reservada > 0;

COMMENT ON VIEW v_resumen_stock_consigna IS 'Vista resumen del stock en consignación con valores';

-- =====================================================
-- VISTA: Pendiente de liquidar por acuerdo
-- =====================================================
CREATE OR REPLACE VIEW v_pendiente_liquidar_consigna AS
SELECT
    mc.organizacion_id,
    mc.acuerdo_id,
    ac.folio AS acuerdo_folio,
    ac.proveedor_id,
    pr.nombre AS proveedor_nombre,
    ac.porcentaje_comision,
    COUNT(DISTINCT mc.id) AS total_movimientos,
    SUM(ABS(mc.cantidad)) AS total_unidades,
    SUM(mc.subtotal) AS subtotal_ventas,
    ROUND(SUM(mc.subtotal) * (ac.porcentaje_comision / 100), 2) AS comision_estimada,
    ROUND(SUM(mc.subtotal) * (1 - ac.porcentaje_comision / 100), 2) AS pagar_proveedor_estimado,
    MIN(mc.creado_en) AS primera_venta,
    MAX(mc.creado_en) AS ultima_venta
FROM movimientos_consigna mc
JOIN acuerdos_consigna ac ON mc.acuerdo_id = ac.id
JOIN proveedores pr ON ac.proveedor_id = pr.id
WHERE mc.tipo = 'venta'
  AND mc.liquidado = false
GROUP BY mc.organizacion_id, mc.acuerdo_id, ac.folio, ac.proveedor_id,
         pr.nombre, ac.porcentaje_comision;

COMMENT ON VIEW v_pendiente_liquidar_consigna IS 'Vista de ventas pendientes de liquidar por acuerdo';

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_acuerdos_consigna_org_estado
    ON acuerdos_consigna(organizacion_id, estado);
CREATE INDEX IF NOT EXISTS idx_acuerdos_consigna_proveedor
    ON acuerdos_consigna(proveedor_id);

CREATE INDEX IF NOT EXISTS idx_acuerdos_consigna_productos_acuerdo
    ON acuerdos_consigna_productos(acuerdo_id);
CREATE INDEX IF NOT EXISTS idx_acuerdos_consigna_productos_producto
    ON acuerdos_consigna_productos(producto_id);

CREATE INDEX IF NOT EXISTS idx_stock_consigna_acuerdo
    ON stock_consigna(acuerdo_id);
CREATE INDEX IF NOT EXISTS idx_stock_consigna_producto
    ON stock_consigna(producto_id, variante_id);
CREATE INDEX IF NOT EXISTS idx_stock_consigna_sucursal
    ON stock_consigna(sucursal_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_consigna_acuerdo
    ON movimientos_consigna(acuerdo_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_consigna_venta
    ON movimientos_consigna(venta_pos_id) WHERE venta_pos_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimientos_consigna_liquidacion
    ON movimientos_consigna(liquidacion_id) WHERE liquidacion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimientos_consigna_pendientes
    ON movimientos_consigna(acuerdo_id, tipo, creado_en)
    WHERE tipo = 'venta' AND liquidado = false;

CREATE INDEX IF NOT EXISTS idx_liquidaciones_consigna_acuerdo
    ON liquidaciones_consigna(acuerdo_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_consigna_estado
    ON liquidaciones_consigna(organizacion_id, estado);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Acuerdos Consigna
ALTER TABLE acuerdos_consigna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS acuerdos_consigna_tenant_isolation ON acuerdos_consigna;
CREATE POLICY acuerdos_consigna_tenant_isolation ON acuerdos_consigna
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS acuerdos_consigna_tenant_insert ON acuerdos_consigna;
CREATE POLICY acuerdos_consigna_tenant_insert ON acuerdos_consigna
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Productos del Acuerdo
ALTER TABLE acuerdos_consigna_productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS acp_tenant_isolation ON acuerdos_consigna_productos;
CREATE POLICY acp_tenant_isolation ON acuerdos_consigna_productos
    USING (acuerdo_id IN (
        SELECT id FROM acuerdos_consigna
        WHERE organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
    ));

DROP POLICY IF EXISTS acp_tenant_insert ON acuerdos_consigna_productos;
CREATE POLICY acp_tenant_insert ON acuerdos_consigna_productos
    FOR INSERT WITH CHECK (acuerdo_id IN (
        SELECT id FROM acuerdos_consigna
        WHERE organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
    ));

-- Stock Consigna
ALTER TABLE stock_consigna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_consigna_tenant_isolation ON stock_consigna;
CREATE POLICY stock_consigna_tenant_isolation ON stock_consigna
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS stock_consigna_tenant_insert ON stock_consigna;
CREATE POLICY stock_consigna_tenant_insert ON stock_consigna
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Movimientos Consigna
ALTER TABLE movimientos_consigna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS movimientos_consigna_tenant_isolation ON movimientos_consigna;
CREATE POLICY movimientos_consigna_tenant_isolation ON movimientos_consigna
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS movimientos_consigna_tenant_insert ON movimientos_consigna;
CREATE POLICY movimientos_consigna_tenant_insert ON movimientos_consigna
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Liquidaciones Consigna
ALTER TABLE liquidaciones_consigna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS liquidaciones_consigna_tenant_isolation ON liquidaciones_consigna;
CREATE POLICY liquidaciones_consigna_tenant_isolation ON liquidaciones_consigna
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS liquidaciones_consigna_tenant_insert ON liquidaciones_consigna;
CREATE POLICY liquidaciones_consigna_tenant_insert ON liquidaciones_consigna
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- =====================================================
-- TRIGGER: Actualizar timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_consigna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acuerdos_consigna_updated_at ON acuerdos_consigna;
CREATE TRIGGER trg_acuerdos_consigna_updated_at
    BEFORE UPDATE ON acuerdos_consigna
    FOR EACH ROW
    EXECUTE FUNCTION update_consigna_updated_at();

DROP TRIGGER IF EXISTS trg_stock_consigna_updated_at ON stock_consigna;
CREATE TRIGGER trg_stock_consigna_updated_at
    BEFORE UPDATE ON stock_consigna
    FOR EACH ROW
    EXECUTE FUNCTION update_consigna_updated_at();

-- =====================================================
-- ÍNDICES ADICIONALES (Auditoría Ene 2026)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_movimientos_consigna_organizacion_id
    ON movimientos_consigna(organizacion_id);

CREATE INDEX IF NOT EXISTS idx_stock_consigna_organizacion_id
    ON stock_consigna(organizacion_id);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
