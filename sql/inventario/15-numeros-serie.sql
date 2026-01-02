-- ============================================================================
-- MODULO: INVENTARIO - NUMEROS DE SERIE Y LOTES
-- Descripcion: Tracking individual de productos con trazabilidad completa
-- Version: 1.0
-- Fecha: 26 Diciembre 2025
-- Gap: Numeros de Serie/Lotes (Media Prioridad)
-- ============================================================================

-- ============================================================================
-- TABLA: numeros_serie
-- Descripcion: Registro de numeros de serie individuales por producto
-- ============================================================================
CREATE TABLE IF NOT EXISTS numeros_serie (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- Identificacion
    numero_serie VARCHAR(100) NOT NULL,
    lote VARCHAR(50),
    fecha_vencimiento DATE,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible'
        CHECK (estado IN ('disponible', 'reservado', 'vendido', 'defectuoso', 'devuelto', 'transferido')),

    -- Ubicacion actual
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,
    ubicacion_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,

    -- Costos
    costo_unitario NUMERIC(12,2),

    -- Trazabilidad de entrada
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
    orden_compra_id INTEGER REFERENCES ordenes_compra(id) ON DELETE SET NULL,
    fecha_entrada TIMESTAMPTZ DEFAULT NOW(),

    -- Trazabilidad de salida
    venta_id INTEGER, -- FK a ventas_pos (sin constraint por particionamiento)
    fecha_salida TIMESTAMPTZ,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,

    -- Garantia
    fecha_inicio_garantia DATE,
    fecha_fin_garantia DATE,
    tiene_garantia BOOLEAN DEFAULT false,

    -- Notas
    notas TEXT,

    -- Auditoria
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(organizacion_id, producto_id, numero_serie)
);

COMMENT ON TABLE numeros_serie IS 'Tracking individual de productos por numero de serie con trazabilidad completa';
COMMENT ON COLUMN numeros_serie.estado IS 'disponible=en stock, reservado=apartado, vendido=salida, defectuoso=dañado, devuelto=regresado, transferido=movido';
COMMENT ON COLUMN numeros_serie.lote IS 'Numero de lote para productos que se agrupan por lote';

-- RLS
ALTER TABLE numeros_serie ENABLE ROW LEVEL SECURITY;

-- Políticas RLS consistentes con el resto del sistema (app.current_tenant_id)
CREATE POLICY numeros_serie_select_policy ON numeros_serie
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY numeros_serie_update_policy ON numeros_serie
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY numeros_serie_delete_policy ON numeros_serie
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY numeros_serie_insert_policy ON numeros_serie
    FOR INSERT
    WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ns_producto ON numeros_serie(producto_id);
CREATE INDEX IF NOT EXISTS idx_ns_estado ON numeros_serie(estado);
CREATE INDEX IF NOT EXISTS idx_ns_lote ON numeros_serie(lote) WHERE lote IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ns_vencimiento ON numeros_serie(fecha_vencimiento) WHERE fecha_vencimiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ns_sucursal ON numeros_serie(sucursal_id);
-- Índice FEFO: Optimizado para despacho por vencimiento (First Expired First Out)
CREATE INDEX IF NOT EXISTS idx_ns_fefo_despacho ON numeros_serie(producto_id, sucursal_id, fecha_vencimiento ASC NULLS LAST)
    WHERE estado = 'disponible';
CREATE INDEX IF NOT EXISTS idx_ns_ubicacion ON numeros_serie(ubicacion_id) WHERE ubicacion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ns_orden_compra ON numeros_serie(orden_compra_id) WHERE orden_compra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ns_numero ON numeros_serie(numero_serie);
CREATE INDEX IF NOT EXISTS idx_ns_busqueda ON numeros_serie(organizacion_id, numero_serie);

-- ============================================================================
-- TABLA: numeros_serie_historial
-- Descripcion: Historial de movimientos de cada numero de serie
-- ============================================================================
CREATE TABLE IF NOT EXISTS numeros_serie_historial (
    id SERIAL PRIMARY KEY,
    numero_serie_id INTEGER NOT NULL REFERENCES numeros_serie(id) ON DELETE CASCADE,

    -- Accion realizada
    accion VARCHAR(50) NOT NULL CHECK (accion IN (
        'entrada',           -- Recepcion de OC
        'venta',             -- Venta en POS
        'devolucion_cliente', -- Cliente devuelve
        'devolucion_proveedor', -- Devolucion a proveedor
        'transferencia',     -- Movimiento entre sucursales/ubicaciones
        'ajuste',            -- Ajuste de inventario
        'reserva',           -- Reservado para venta
        'liberacion',        -- Liberado de reserva
        'defectuoso',        -- Marcado como defectuoso
        'reparacion',        -- Enviado a reparacion
        'garantia'           -- Reclamacion de garantia
    )),

    -- Estado anterior y nuevo
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),

    -- Ubicaciones
    sucursal_anterior_id INTEGER REFERENCES sucursales(id),
    sucursal_nueva_id INTEGER REFERENCES sucursales(id),
    ubicacion_anterior_id INTEGER REFERENCES ubicaciones_almacen(id),
    ubicacion_nueva_id INTEGER REFERENCES ubicaciones_almacen(id),

    -- Referencias
    referencia_tipo VARCHAR(50), -- orden_compra, venta_pos, transferencia, ajuste
    referencia_id INTEGER,

    -- Detalles
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    notas TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE numeros_serie_historial IS 'Historial completo de movimientos de numeros de serie';

-- RLS via join con numeros_serie
ALTER TABLE numeros_serie_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY ns_historial_select_policy ON numeros_serie_historial
    FOR SELECT
    USING (
        numero_serie_id IN (
            SELECT id FROM numeros_serie
            WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY ns_historial_insert_policy ON numeros_serie_historial
    FOR INSERT
    WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_nsh_numero_serie ON numeros_serie_historial(numero_serie_id);
CREATE INDEX IF NOT EXISTS idx_nsh_accion ON numeros_serie_historial(accion);
CREATE INDEX IF NOT EXISTS idx_nsh_fecha ON numeros_serie_historial(creado_en);
CREATE INDEX IF NOT EXISTS idx_nsh_referencia ON numeros_serie_historial(referencia_tipo, referencia_id);

-- ============================================================================
-- FUNCION: registrar_numero_serie
-- Descripcion: Registra un nuevo numero de serie con historial
-- ============================================================================
CREATE OR REPLACE FUNCTION registrar_numero_serie(
    p_organizacion_id INTEGER,
    p_producto_id INTEGER,
    p_numero_serie VARCHAR(100),
    p_lote VARCHAR(50) DEFAULT NULL,
    p_fecha_vencimiento DATE DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL,
    p_ubicacion_id INTEGER DEFAULT NULL,
    p_costo_unitario NUMERIC DEFAULT NULL,
    p_proveedor_id INTEGER DEFAULT NULL,
    p_orden_compra_id INTEGER DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL,
    p_notas TEXT DEFAULT NULL,
    p_acuerdo_consigna_id INTEGER DEFAULT NULL  -- Soporte para consigna
)
RETURNS INTEGER AS $$
DECLARE
    v_ns_id INTEGER;
    v_referencia_tipo VARCHAR(50);
    v_referencia_id INTEGER;
BEGIN
    -- Verificar que el producto requiere numero de serie
    IF NOT EXISTS (
        SELECT 1 FROM productos
        WHERE id = p_producto_id
        AND organizacion_id = p_organizacion_id
        AND requiere_numero_serie = true
    ) THEN
        RAISE EXCEPTION 'El producto no requiere numero de serie o no existe';
    END IF;

    -- Verificar que el numero de serie no existe
    IF EXISTS (
        SELECT 1 FROM numeros_serie
        WHERE organizacion_id = p_organizacion_id
        AND producto_id = p_producto_id
        AND numero_serie = p_numero_serie
    ) THEN
        RAISE EXCEPTION 'El numero de serie % ya existe para este producto', p_numero_serie;
    END IF;

    -- Insertar numero de serie (con soporte para consigna)
    INSERT INTO numeros_serie (
        organizacion_id, producto_id, numero_serie, lote, fecha_vencimiento,
        sucursal_id, ubicacion_id, costo_unitario, proveedor_id, orden_compra_id,
        acuerdo_consigna_id, creado_por, notas
    ) VALUES (
        p_organizacion_id, p_producto_id, p_numero_serie, p_lote, p_fecha_vencimiento,
        p_sucursal_id, p_ubicacion_id, p_costo_unitario, p_proveedor_id, p_orden_compra_id,
        p_acuerdo_consigna_id, p_usuario_id, p_notas
    ) RETURNING id INTO v_ns_id;

    -- Determinar tipo de referencia para historial
    IF p_acuerdo_consigna_id IS NOT NULL THEN
        v_referencia_tipo := 'consigna';
        v_referencia_id := p_acuerdo_consigna_id;
    ELSIF p_orden_compra_id IS NOT NULL THEN
        v_referencia_tipo := 'orden_compra';
        v_referencia_id := p_orden_compra_id;
    ELSE
        v_referencia_tipo := NULL;
        v_referencia_id := NULL;
    END IF;

    -- Registrar en historial
    INSERT INTO numeros_serie_historial (
        numero_serie_id, accion, estado_anterior, estado_nuevo,
        sucursal_nueva_id, ubicacion_nueva_id,
        referencia_tipo, referencia_id, usuario_id, notas
    ) VALUES (
        v_ns_id, 'entrada', NULL, 'disponible',
        p_sucursal_id, p_ubicacion_id,
        v_referencia_tipo, v_referencia_id, p_usuario_id, 'Entrada inicial'
    );

    RETURN v_ns_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION registrar_numero_serie IS 'Registra un nuevo numero de serie con validaciones y historial';

-- ============================================================================
-- FUNCION: vender_numero_serie
-- Descripcion: Marca un numero de serie como vendido
-- ============================================================================
CREATE OR REPLACE FUNCTION vender_numero_serie(
    p_numero_serie_id INTEGER,
    p_venta_id INTEGER,
    p_cliente_id INTEGER DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_estado_actual VARCHAR(20);
    v_sucursal_id INTEGER;
BEGIN
    -- Obtener estado actual
    SELECT estado, sucursal_id INTO v_estado_actual, v_sucursal_id
    FROM numeros_serie
    WHERE id = p_numero_serie_id;

    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'Numero de serie no encontrado';
    END IF;

    IF v_estado_actual NOT IN ('disponible', 'reservado') THEN
        RAISE EXCEPTION 'Numero de serie no disponible para venta. Estado actual: %', v_estado_actual;
    END IF;

    -- Actualizar numero de serie
    UPDATE numeros_serie
    SET estado = 'vendido',
        venta_id = p_venta_id,
        cliente_id = p_cliente_id,
        fecha_salida = NOW(),
        actualizado_en = NOW()
    WHERE id = p_numero_serie_id;

    -- Registrar en historial
    INSERT INTO numeros_serie_historial (
        numero_serie_id, accion, estado_anterior, estado_nuevo,
        sucursal_anterior_id, referencia_tipo, referencia_id, usuario_id
    ) VALUES (
        p_numero_serie_id, 'venta', v_estado_actual, 'vendido',
        v_sucursal_id, 'venta_pos', p_venta_id, p_usuario_id
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION vender_numero_serie IS 'Marca un numero de serie como vendido y registra historial';

-- ============================================================================
-- FUNCION: transferir_numero_serie
-- Descripcion: Transfiere numero de serie entre sucursales/ubicaciones
-- ============================================================================
CREATE OR REPLACE FUNCTION transferir_numero_serie(
    p_numero_serie_id INTEGER,
    p_sucursal_destino_id INTEGER,
    p_ubicacion_destino_id INTEGER DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL,
    p_notas TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_estado_actual VARCHAR(20);
    v_sucursal_anterior INTEGER;
    v_ubicacion_anterior INTEGER;
BEGIN
    -- Obtener datos actuales
    SELECT estado, sucursal_id, ubicacion_id
    INTO v_estado_actual, v_sucursal_anterior, v_ubicacion_anterior
    FROM numeros_serie
    WHERE id = p_numero_serie_id;

    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'Numero de serie no encontrado';
    END IF;

    IF v_estado_actual != 'disponible' THEN
        RAISE EXCEPTION 'Solo se pueden transferir numeros de serie disponibles. Estado actual: %', v_estado_actual;
    END IF;

    -- Actualizar ubicacion
    UPDATE numeros_serie
    SET sucursal_id = p_sucursal_destino_id,
        ubicacion_id = p_ubicacion_destino_id,
        actualizado_en = NOW()
    WHERE id = p_numero_serie_id;

    -- Registrar en historial
    INSERT INTO numeros_serie_historial (
        numero_serie_id, accion, estado_anterior, estado_nuevo,
        sucursal_anterior_id, sucursal_nueva_id,
        ubicacion_anterior_id, ubicacion_nueva_id,
        referencia_tipo, usuario_id, notas
    ) VALUES (
        p_numero_serie_id, 'transferencia', v_estado_actual, v_estado_actual,
        v_sucursal_anterior, p_sucursal_destino_id,
        v_ubicacion_anterior, p_ubicacion_destino_id,
        'transferencia', p_usuario_id, p_notas
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION transferir_numero_serie IS 'Transfiere numero de serie entre sucursales/ubicaciones';

-- ============================================================================
-- FUNCION: devolver_numero_serie
-- Descripcion: Procesa devolucion de un numero de serie vendido
-- ============================================================================
CREATE OR REPLACE FUNCTION devolver_numero_serie(
    p_numero_serie_id INTEGER,
    p_sucursal_id INTEGER,
    p_ubicacion_id INTEGER DEFAULT NULL,
    p_motivo TEXT DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_estado_actual VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado_actual
    FROM numeros_serie
    WHERE id = p_numero_serie_id;

    IF v_estado_actual != 'vendido' THEN
        RAISE EXCEPTION 'Solo se pueden devolver numeros de serie vendidos. Estado actual: %', v_estado_actual;
    END IF;

    -- Actualizar estado
    UPDATE numeros_serie
    SET estado = 'devuelto',
        sucursal_id = p_sucursal_id,
        ubicacion_id = p_ubicacion_id,
        actualizado_en = NOW()
    WHERE id = p_numero_serie_id;

    -- Registrar en historial
    INSERT INTO numeros_serie_historial (
        numero_serie_id, accion, estado_anterior, estado_nuevo,
        sucursal_nueva_id, ubicacion_nueva_id,
        usuario_id, notas
    ) VALUES (
        p_numero_serie_id, 'devolucion_cliente', v_estado_actual, 'devuelto',
        p_sucursal_id, p_ubicacion_id,
        p_usuario_id, p_motivo
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION devolver_numero_serie IS 'Procesa devolucion de cliente y actualiza estado';

-- ============================================================================
-- FUNCION: marcar_defectuoso
-- Descripcion: Marca un numero de serie como defectuoso
-- ============================================================================
CREATE OR REPLACE FUNCTION marcar_defectuoso(
    p_numero_serie_id INTEGER,
    p_motivo TEXT,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_estado_actual VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado_actual
    FROM numeros_serie
    WHERE id = p_numero_serie_id;

    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'Numero de serie no encontrado';
    END IF;

    -- Actualizar estado
    UPDATE numeros_serie
    SET estado = 'defectuoso',
        actualizado_en = NOW(),
        notas = COALESCE(notas || E'\n', '') || 'DEFECTUOSO: ' || p_motivo
    WHERE id = p_numero_serie_id;

    -- Registrar en historial
    INSERT INTO numeros_serie_historial (
        numero_serie_id, accion, estado_anterior, estado_nuevo,
        usuario_id, notas
    ) VALUES (
        p_numero_serie_id, 'defectuoso', v_estado_actual, 'defectuoso',
        p_usuario_id, p_motivo
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION marcar_defectuoso IS 'Marca numero de serie como defectuoso con motivo';

-- ============================================================================
-- FUNCION: obtener_proximos_vencer
-- Descripcion: Obtiene numeros de serie proximos a vencer
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_proximos_vencer(
    p_organizacion_id INTEGER,
    p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
    id INTEGER,
    numero_serie VARCHAR(100),
    producto_id INTEGER,
    producto_nombre VARCHAR(200),
    lote VARCHAR(50),
    fecha_vencimiento DATE,
    dias_restantes INTEGER,
    sucursal_nombre VARCHAR(200),
    ubicacion_codigo VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ns.id,
        ns.numero_serie,
        ns.producto_id,
        p.nombre AS producto_nombre,
        ns.lote,
        ns.fecha_vencimiento,
        (ns.fecha_vencimiento - CURRENT_DATE)::INTEGER AS dias_restantes,
        s.nombre AS sucursal_nombre,
        ua.codigo AS ubicacion_codigo
    FROM numeros_serie ns
    JOIN productos p ON p.id = ns.producto_id
    LEFT JOIN sucursales s ON s.id = ns.sucursal_id
    LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
    WHERE ns.organizacion_id = p_organizacion_id
    AND ns.estado = 'disponible'
    AND ns.fecha_vencimiento IS NOT NULL
    AND ns.fecha_vencimiento <= CURRENT_DATE + p_dias
    ORDER BY ns.fecha_vencimiento ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_proximos_vencer IS 'Lista numeros de serie proximos a vencer en X dias';

-- ============================================================================
-- FUNCION: buscar_numero_serie
-- Descripcion: Busqueda rapida de numero de serie
-- ============================================================================
CREATE OR REPLACE FUNCTION buscar_numero_serie(
    p_organizacion_id INTEGER,
    p_busqueda VARCHAR(100)
)
RETURNS TABLE (
    id INTEGER,
    numero_serie VARCHAR(100),
    producto_id INTEGER,
    producto_nombre VARCHAR(200),
    producto_sku VARCHAR(50),
    lote VARCHAR(50),
    estado VARCHAR(20),
    fecha_vencimiento DATE,
    sucursal_nombre VARCHAR(200),
    cliente_nombre VARCHAR(200)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ns.id,
        ns.numero_serie,
        ns.producto_id,
        p.nombre AS producto_nombre,
        p.sku AS producto_sku,
        ns.lote,
        ns.estado,
        ns.fecha_vencimiento,
        s.nombre AS sucursal_nombre,
        c.nombre AS cliente_nombre
    FROM numeros_serie ns
    JOIN productos p ON p.id = ns.producto_id
    LEFT JOIN sucursales s ON s.id = ns.sucursal_id
    LEFT JOIN clientes c ON c.id = ns.cliente_id
    WHERE ns.organizacion_id = p_organizacion_id
    AND (
        ns.numero_serie ILIKE '%' || p_busqueda || '%'
        OR ns.lote ILIKE '%' || p_busqueda || '%'
        OR p.nombre ILIKE '%' || p_busqueda || '%'
        OR p.sku ILIKE '%' || p_busqueda || '%'
    )
    ORDER BY ns.creado_en DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION buscar_numero_serie IS 'Busqueda rapida por numero de serie, lote, producto o SKU';

-- ============================================================================
-- FUNCION: estadisticas_numeros_serie
-- Descripcion: Estadisticas de numeros de serie por organizacion
-- ============================================================================
CREATE OR REPLACE FUNCTION estadisticas_numeros_serie(
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    total_registrados BIGINT,
    disponibles BIGINT,
    reservados BIGINT,
    vendidos BIGINT,
    defectuosos BIGINT,
    devueltos BIGINT,
    proximos_vencer_30d BIGINT,
    vencidos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_registrados,
        COUNT(*) FILTER (WHERE estado = 'disponible')::BIGINT AS disponibles,
        COUNT(*) FILTER (WHERE estado = 'reservado')::BIGINT AS reservados,
        COUNT(*) FILTER (WHERE estado = 'vendido')::BIGINT AS vendidos,
        COUNT(*) FILTER (WHERE estado = 'defectuoso')::BIGINT AS defectuosos,
        COUNT(*) FILTER (WHERE estado = 'devuelto')::BIGINT AS devueltos,
        COUNT(*) FILTER (
            WHERE estado = 'disponible'
            AND fecha_vencimiento IS NOT NULL
            AND fecha_vencimiento <= CURRENT_DATE + 30
            AND fecha_vencimiento > CURRENT_DATE
        )::BIGINT AS proximos_vencer_30d,
        COUNT(*) FILTER (
            WHERE fecha_vencimiento IS NOT NULL
            AND fecha_vencimiento < CURRENT_DATE
        )::BIGINT AS vencidos
    FROM numeros_serie
    WHERE organizacion_id = p_organizacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION estadisticas_numeros_serie IS 'Estadisticas generales de numeros de serie';

-- ============================================================================
-- TRIGGER: actualizar_timestamp_numeros_serie
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_timestamp_ns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_ns ON numeros_serie;
CREATE TRIGGER trg_actualizar_ns
    BEFORE UPDATE ON numeros_serie
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_ns();

-- ============================================================================
-- FUNCION: obtener_trazabilidad_completa
-- Descripcion: Trazabilidad upstream/downstream de un numero de serie
-- Retorna: Origen (proveedor/OC), movimientos, destino (cliente/venta)
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_trazabilidad_completa(
    p_numero_serie_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    -- Info del NS
    ns_id INTEGER,
    numero_serie VARCHAR(100),
    lote VARCHAR(50),
    estado VARCHAR(20),
    fecha_vencimiento DATE,
    -- Producto
    producto_id INTEGER,
    producto_nombre VARCHAR(200),
    producto_sku VARCHAR(50),
    -- Origen (upstream)
    origen_tipo VARCHAR(50),
    origen_proveedor_id INTEGER,
    origen_proveedor_nombre VARCHAR(200),
    origen_oc_id INTEGER,
    origen_oc_folio VARCHAR(50),
    origen_fecha TIMESTAMPTZ,
    -- Ubicacion actual
    sucursal_id INTEGER,
    sucursal_nombre VARCHAR(200),
    ubicacion_id INTEGER,
    ubicacion_codigo VARCHAR(50),
    -- Destino (downstream) - si fue vendido/transferido
    destino_tipo VARCHAR(50),
    destino_cliente_id INTEGER,
    destino_cliente_nombre VARCHAR(200),
    destino_venta_id INTEGER,
    destino_fecha TIMESTAMPTZ,
    -- Garantia
    tiene_garantia BOOLEAN,
    fecha_fin_garantia DATE,
    -- Costos
    costo_unitario NUMERIC(12,2),
    -- Metadata
    dias_en_inventario INTEGER,
    total_movimientos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ns.id AS ns_id,
        ns.numero_serie,
        ns.lote,
        ns.estado,
        ns.fecha_vencimiento,
        -- Producto
        p.id AS producto_id,
        p.nombre AS producto_nombre,
        p.sku AS producto_sku,
        -- Origen
        CASE
            WHEN ns.orden_compra_id IS NOT NULL THEN 'orden_compra'
            WHEN ns.proveedor_id IS NOT NULL THEN 'proveedor_directo'
            ELSE 'manual'
        END AS origen_tipo,
        ns.proveedor_id AS origen_proveedor_id,
        prov.nombre AS origen_proveedor_nombre,
        ns.orden_compra_id AS origen_oc_id,
        oc.folio AS origen_oc_folio,
        ns.fecha_entrada AS origen_fecha,
        -- Ubicacion actual
        ns.sucursal_id,
        s.nombre AS sucursal_nombre,
        ns.ubicacion_id,
        ua.codigo AS ubicacion_codigo,
        -- Destino
        CASE
            WHEN ns.estado = 'vendido' THEN 'venta'
            WHEN ns.estado = 'transferido' THEN 'transferencia'
            WHEN ns.estado = 'devuelto' THEN 'devolucion'
            WHEN ns.estado = 'defectuoso' THEN 'baja'
            ELSE NULL
        END AS destino_tipo,
        ns.cliente_id AS destino_cliente_id,
        c.nombre AS destino_cliente_nombre,
        ns.venta_id AS destino_venta_id,
        ns.fecha_salida AS destino_fecha,
        -- Garantia
        ns.tiene_garantia,
        ns.fecha_fin_garantia,
        -- Costos
        ns.costo_unitario,
        -- Metadata
        EXTRACT(DAY FROM (COALESCE(ns.fecha_salida, NOW()) - ns.fecha_entrada))::INTEGER AS dias_en_inventario,
        (SELECT COUNT(*) FROM numeros_serie_historial WHERE numero_serie_id = ns.id) AS total_movimientos
    FROM numeros_serie ns
    JOIN productos p ON p.id = ns.producto_id
    LEFT JOIN proveedores prov ON prov.id = ns.proveedor_id
    LEFT JOIN ordenes_compra oc ON oc.id = ns.orden_compra_id
    LEFT JOIN sucursales s ON s.id = ns.sucursal_id
    LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
    LEFT JOIN clientes c ON c.id = ns.cliente_id
    WHERE ns.id = p_numero_serie_id
      AND ns.organizacion_id = p_organizacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_trazabilidad_completa IS 'Obtiene trazabilidad completa upstream/downstream de un numero de serie';

-- ============================================================================
-- FUNCION: obtener_timeline_ns
-- Descripcion: Timeline cronologico de todos los movimientos de un NS
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_timeline_ns(
    p_numero_serie_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    evento_id INTEGER,
    fecha TIMESTAMPTZ,
    accion VARCHAR(50),
    descripcion TEXT,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    sucursal_origen VARCHAR(200),
    sucursal_destino VARCHAR(200),
    ubicacion_origen VARCHAR(50),
    ubicacion_destino VARCHAR(50),
    referencia_tipo VARCHAR(50),
    referencia_id INTEGER,
    usuario_nombre VARCHAR(200),
    notas TEXT,
    icono VARCHAR(50),
    color VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    -- Evento inicial: entrada al sistema
    SELECT
        0 AS evento_id,
        ns.fecha_entrada AS fecha,
        'entrada'::VARCHAR(50) AS accion,
        CASE
            WHEN ns.orden_compra_id IS NOT NULL THEN
                'Recepción de OC ' || COALESCE(oc.folio, '#' || ns.orden_compra_id::TEXT)
            WHEN ns.proveedor_id IS NOT NULL THEN
                'Ingreso directo de ' || COALESCE(prov.nombre, 'proveedor')
            ELSE
                'Registro manual'
        END AS descripcion,
        NULL::VARCHAR(20) AS estado_anterior,
        'disponible'::VARCHAR(20) AS estado_nuevo,
        NULL::VARCHAR(200) AS sucursal_origen,
        s.nombre AS sucursal_destino,
        NULL::VARCHAR(50) AS ubicacion_origen,
        ua.codigo AS ubicacion_destino,
        CASE WHEN ns.orden_compra_id IS NOT NULL THEN 'orden_compra' ELSE NULL END AS referencia_tipo,
        ns.orden_compra_id AS referencia_id,
        u.nombre AS usuario_nombre,
        NULL::TEXT AS notas,
        'package'::VARCHAR(50) AS icono,
        'green'::VARCHAR(20) AS color
    FROM numeros_serie ns
    LEFT JOIN ordenes_compra oc ON oc.id = ns.orden_compra_id
    LEFT JOIN proveedores prov ON prov.id = ns.proveedor_id
    LEFT JOIN sucursales s ON s.id = ns.sucursal_id
    LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
    LEFT JOIN usuarios u ON u.id = ns.creado_por
    WHERE ns.id = p_numero_serie_id
      AND ns.organizacion_id = p_organizacion_id

    UNION ALL

    -- Eventos del historial
    SELECT
        h.id AS evento_id,
        h.creado_en AS fecha,
        h.accion,
        CASE h.accion
            WHEN 'venta' THEN 'Vendido en POS'
            WHEN 'transferencia' THEN 'Transferido a ' || COALESCE(sn.nombre, 'otra sucursal')
            WHEN 'devolucion_cliente' THEN 'Devolución de cliente'
            WHEN 'devolucion_proveedor' THEN 'Devuelto a proveedor'
            WHEN 'reserva' THEN 'Reservado para venta'
            WHEN 'liberacion' THEN 'Liberado de reserva'
            WHEN 'defectuoso' THEN 'Marcado como defectuoso'
            WHEN 'ajuste' THEN 'Ajuste de inventario'
            WHEN 'reparacion' THEN 'Enviado a reparación'
            WHEN 'garantia' THEN 'Reclamación de garantía'
            ELSE h.accion
        END AS descripcion,
        h.estado_anterior,
        h.estado_nuevo,
        sa.nombre AS sucursal_origen,
        sn.nombre AS sucursal_destino,
        uba.codigo AS ubicacion_origen,
        ubn.codigo AS ubicacion_destino,
        h.referencia_tipo,
        h.referencia_id,
        uh.nombre AS usuario_nombre,
        h.notas,
        CASE h.accion
            WHEN 'venta' THEN 'shopping-cart'
            WHEN 'transferencia' THEN 'truck'
            WHEN 'devolucion_cliente' THEN 'rotate-ccw'
            WHEN 'devolucion_proveedor' THEN 'package-x'
            WHEN 'reserva' THEN 'lock'
            WHEN 'liberacion' THEN 'unlock'
            WHEN 'defectuoso' THEN 'alert-triangle'
            WHEN 'ajuste' THEN 'edit'
            WHEN 'reparacion' THEN 'tool'
            WHEN 'garantia' THEN 'shield'
            ELSE 'circle'
        END AS icono,
        CASE h.accion
            WHEN 'venta' THEN 'blue'
            WHEN 'transferencia' THEN 'purple'
            WHEN 'devolucion_cliente' THEN 'orange'
            WHEN 'devolucion_proveedor' THEN 'red'
            WHEN 'reserva' THEN 'yellow'
            WHEN 'liberacion' THEN 'gray'
            WHEN 'defectuoso' THEN 'red'
            WHEN 'ajuste' THEN 'gray'
            ELSE 'gray'
        END AS color
    FROM numeros_serie_historial h
    JOIN numeros_serie ns ON ns.id = h.numero_serie_id
    LEFT JOIN sucursales sa ON sa.id = h.sucursal_anterior_id
    LEFT JOIN sucursales sn ON sn.id = h.sucursal_nueva_id
    LEFT JOIN ubicaciones_almacen uba ON uba.id = h.ubicacion_anterior_id
    LEFT JOIN ubicaciones_almacen ubn ON ubn.id = h.ubicacion_nueva_id
    LEFT JOIN usuarios uh ON uh.id = h.usuario_id
    WHERE h.numero_serie_id = p_numero_serie_id
      AND ns.organizacion_id = p_organizacion_id

    ORDER BY fecha ASC, evento_id ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_timeline_ns IS 'Timeline cronologico de todos los movimientos de un numero de serie';

-- ============================================================================
-- FIN: NUMEROS DE SERIE Y LOTES
-- ============================================================================
