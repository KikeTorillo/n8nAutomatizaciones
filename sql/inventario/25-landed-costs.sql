-- ============================================================================
-- LANDED COSTS - Costos en Destino
-- Permite agregar costos adicionales (flete, arancel, seguro) a recepciones de OC
-- y distribuirlos al costo unitario de los productos
-- Fecha: 30 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLAS
-- ============================================================================

-- Costos adicionales por Orden de Compra
CREATE TABLE IF NOT EXISTS ordenes_compra_costos_adicionales (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    orden_compra_id INTEGER NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,

    -- Tipo y descripcion
    tipo_costo VARCHAR(30) NOT NULL CHECK (tipo_costo IN ('flete', 'arancel', 'seguro', 'manipulacion', 'almacenaje', 'otro')),
    descripcion TEXT,
    referencia_externa VARCHAR(100), -- Numero de factura del proveedor de servicio

    -- Montos
    monto_total DECIMAL(12, 2) NOT NULL CHECK (monto_total > 0),
    moneda VARCHAR(3) DEFAULT 'MXN',
    tipo_cambio DECIMAL(10, 4) DEFAULT 1,
    monto_moneda_local DECIMAL(12, 2), -- monto_total * tipo_cambio

    -- Metodo de distribucion
    metodo_distribucion VARCHAR(20) NOT NULL DEFAULT 'valor'
        CHECK (metodo_distribucion IN ('valor', 'cantidad', 'peso', 'volumen')),

    -- Estado
    distribuido BOOLEAN DEFAULT false,
    fecha_distribucion TIMESTAMPTZ,

    -- Proveedor del servicio (opcional)
    proveedor_servicio_id INTEGER REFERENCES proveedores(id),
    proveedor_servicio_nombre VARCHAR(200),

    -- Auditoria
    usuario_id INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_costo_referencia UNIQUE (organizacion_id, orden_compra_id, tipo_costo, referencia_externa)
);

-- Distribucion de costos por item (historial detallado)
CREATE TABLE IF NOT EXISTS ordenes_compra_costos_distribuidos (
    id SERIAL PRIMARY KEY,
    costo_adicional_id INTEGER NOT NULL REFERENCES ordenes_compra_costos_adicionales(id) ON DELETE CASCADE,
    orden_compra_item_id INTEGER NOT NULL REFERENCES ordenes_compra_items(id) ON DELETE CASCADE,

    -- Producto (desnormalizado para reportes)
    producto_id INTEGER REFERENCES productos(id),
    producto_nombre VARCHAR(200),

    -- Datos de distribucion
    base_calculo DECIMAL(12, 4), -- valor, cantidad, peso o volumen usado para calcular
    porcentaje_distribucion DECIMAL(8, 4), -- Porcentaje del total que corresponde a este item

    -- Resultado
    monto_distribuido DECIMAL(12, 2) NOT NULL,
    costo_unitario_distribuido DECIMAL(10, 4) NOT NULL, -- monto_distribuido / cantidad_recibida

    -- Referencia al movimiento de inventario afectado
    movimiento_inventario_id INTEGER,

    -- Auditoria
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_costos_adicionales_oc ON ordenes_compra_costos_adicionales(orden_compra_id);
CREATE INDEX IF NOT EXISTS idx_costos_adicionales_org ON ordenes_compra_costos_adicionales(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_costos_adicionales_tipo ON ordenes_compra_costos_adicionales(tipo_costo);
CREATE INDEX IF NOT EXISTS idx_costos_adicionales_distribuido ON ordenes_compra_costos_adicionales(distribuido);

CREATE INDEX IF NOT EXISTS idx_costos_distribuidos_costo ON ordenes_compra_costos_distribuidos(costo_adicional_id);
CREATE INDEX IF NOT EXISTS idx_costos_distribuidos_item ON ordenes_compra_costos_distribuidos(orden_compra_item_id);
CREATE INDEX IF NOT EXISTS idx_costos_distribuidos_producto ON ordenes_compra_costos_distribuidos(producto_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE ordenes_compra_costos_adicionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_costos_distribuidos ENABLE ROW LEVEL SECURITY;

-- Politicas para costos adicionales
CREATE POLICY "costos_adicionales_select_org" ON ordenes_compra_costos_adicionales
    FOR SELECT USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

CREATE POLICY "costos_adicionales_insert_org" ON ordenes_compra_costos_adicionales
    FOR INSERT WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

CREATE POLICY "costos_adicionales_update_org" ON ordenes_compra_costos_adicionales
    FOR UPDATE USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

CREATE POLICY "costos_adicionales_delete_org" ON ordenes_compra_costos_adicionales
    FOR DELETE USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Politicas para costos distribuidos (via JOIN con costos_adicionales)
CREATE POLICY "costos_distribuidos_select_org" ON ordenes_compra_costos_distribuidos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ordenes_compra_costos_adicionales ca
            WHERE ca.id = costo_adicional_id
            AND ca.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
    );

CREATE POLICY "costos_distribuidos_insert_org" ON ordenes_compra_costos_distribuidos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ordenes_compra_costos_adicionales ca
            WHERE ca.id = costo_adicional_id
            AND ca.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
    );

CREATE POLICY "costos_distribuidos_delete_org" ON ordenes_compra_costos_distribuidos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM ordenes_compra_costos_adicionales ca
            WHERE ca.id = costo_adicional_id
            AND ca.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
    );

-- ============================================================================
-- FUNCIONES
-- ============================================================================

/**
 * Calcular monto en moneda local
 */
CREATE OR REPLACE FUNCTION calcular_monto_moneda_local()
RETURNS TRIGGER AS $$
BEGIN
    NEW.monto_moneda_local := NEW.monto_total * COALESCE(NEW.tipo_cambio, 1);
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_monto_local
    BEFORE INSERT OR UPDATE ON ordenes_compra_costos_adicionales
    FOR EACH ROW
    EXECUTE FUNCTION calcular_monto_moneda_local();

/**
 * Distribuir costos adicionales a los items de una OC
 * @param p_costo_adicional_id - ID del costo adicional a distribuir
 * @returns JSON con resultado de la distribucion
 */
CREATE OR REPLACE FUNCTION distribuir_costo_adicional(
    p_costo_adicional_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_costo RECORD;
    v_item RECORD;
    v_total_base DECIMAL(12, 4);
    v_porcentaje DECIMAL(8, 4);
    v_monto_distribuido DECIMAL(12, 2);
    v_costo_unitario DECIMAL(10, 4);
    v_items_procesados INTEGER := 0;
    v_resultado JSONB;
BEGIN
    -- Obtener datos del costo adicional
    SELECT * INTO v_costo
    FROM ordenes_compra_costos_adicionales
    WHERE id = p_costo_adicional_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Costo adicional no encontrado');
    END IF;

    IF v_costo.distribuido THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'El costo ya fue distribuido');
    END IF;

    -- Calcular total de la base de distribucion
    -- Nota: Si cantidad_recibida = 0, usar cantidad_ordenada
    -- Peso/Volumen tomados de tabla productos (Dic 2025)
    SELECT COALESCE(SUM(
        CASE v_costo.metodo_distribucion
            WHEN 'valor' THEN oci.precio_unitario * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
            WHEN 'cantidad' THEN CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
            WHEN 'peso' THEN COALESCE(p.peso, 1) * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
            WHEN 'volumen' THEN COALESCE(p.volumen, 1) * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
            ELSE oci.precio_unitario * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
        END
    ), 0)
    INTO v_total_base
    FROM ordenes_compra_items oci
    JOIN productos p ON p.id = oci.producto_id
    WHERE oci.orden_compra_id = v_costo.orden_compra_id;

    IF v_total_base = 0 THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'No hay items con cantidad para distribuir');
    END IF;

    -- Distribuir a cada item
    FOR v_item IN
        SELECT
            oci.id as item_id,
            oci.producto_id,
            p.nombre as producto_nombre,
            CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END as cantidad,
            oci.precio_unitario,
            CASE v_costo.metodo_distribucion
                WHEN 'valor' THEN oci.precio_unitario * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
                WHEN 'cantidad' THEN CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
                WHEN 'peso' THEN COALESCE(p.peso, 1) * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
                WHEN 'volumen' THEN COALESCE(p.volumen, 1) * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
                ELSE oci.precio_unitario * CASE WHEN oci.cantidad_recibida > 0 THEN oci.cantidad_recibida ELSE oci.cantidad_ordenada END
            END as base_calculo
        FROM ordenes_compra_items oci
        JOIN productos p ON p.id = oci.producto_id
        WHERE oci.orden_compra_id = v_costo.orden_compra_id
    LOOP
        -- Calcular porcentaje y monto
        v_porcentaje := (v_item.base_calculo / v_total_base) * 100;
        v_monto_distribuido := ROUND((v_item.base_calculo / v_total_base) * v_costo.monto_moneda_local, 2);
        v_costo_unitario := ROUND(v_monto_distribuido / v_item.cantidad, 4);

        -- Insertar distribucion
        INSERT INTO ordenes_compra_costos_distribuidos (
            costo_adicional_id,
            orden_compra_item_id,
            producto_id,
            producto_nombre,
            base_calculo,
            porcentaje_distribucion,
            monto_distribuido,
            costo_unitario_distribuido
        ) VALUES (
            p_costo_adicional_id,
            v_item.item_id,
            v_item.producto_id,
            v_item.producto_nombre,
            v_item.base_calculo,
            v_porcentaje,
            v_monto_distribuido,
            v_costo_unitario
        );

        v_items_procesados := v_items_procesados + 1;
    END LOOP;

    -- Marcar costo como distribuido
    UPDATE ordenes_compra_costos_adicionales
    SET distribuido = true,
        fecha_distribucion = NOW()
    WHERE id = p_costo_adicional_id;

    RETURN jsonb_build_object(
        'exito', true,
        'mensaje', format('Costo distribuido a %s items', v_items_procesados),
        'items_procesados', v_items_procesados,
        'total_base', v_total_base,
        'monto_distribuido', v_costo.monto_moneda_local
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Obtener resumen de costos adicionales por OC
 */
CREATE OR REPLACE FUNCTION obtener_resumen_costos_oc(
    p_orden_compra_id INTEGER
) RETURNS TABLE (
    tipo_costo VARCHAR(30),
    cantidad_costos INTEGER,
    monto_total DECIMAL(12, 2),
    monto_distribuido DECIMAL(12, 2),
    monto_pendiente DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ca.tipo_costo,
        COUNT(*)::INTEGER as cantidad_costos,
        COALESCE(SUM(ca.monto_moneda_local), 0) as monto_total,
        COALESCE(SUM(CASE WHEN ca.distribuido THEN ca.monto_moneda_local ELSE 0 END), 0) as monto_distribuido,
        COALESCE(SUM(CASE WHEN NOT ca.distribuido THEN ca.monto_moneda_local ELSE 0 END), 0) as monto_pendiente
    FROM ordenes_compra_costos_adicionales ca
    WHERE ca.orden_compra_id = p_orden_compra_id
    GROUP BY ca.tipo_costo
    ORDER BY ca.tipo_costo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Obtener costo total (unitario original + landed costs) por producto/item
 */
CREATE OR REPLACE FUNCTION obtener_costo_total_item(
    p_orden_compra_item_id INTEGER
) RETURNS TABLE (
    producto_id INTEGER,
    precio_unitario_original DECIMAL(10, 4),
    landed_costs_unitario DECIMAL(10, 4),
    costo_total_unitario DECIMAL(10, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oci.producto_id,
        oci.precio_unitario as precio_unitario_original,
        COALESCE(SUM(cd.costo_unitario_distribuido), 0) as landed_costs_unitario,
        oci.precio_unitario + COALESCE(SUM(cd.costo_unitario_distribuido), 0) as costo_total_unitario
    FROM ordenes_compra_items oci
    LEFT JOIN ordenes_compra_costos_distribuidos cd ON cd.orden_compra_item_id = oci.id
    WHERE oci.id = p_orden_compra_item_id
    GROUP BY oci.id, oci.producto_id, oci.precio_unitario;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Vista para resumen de costos por OC
 */
CREATE OR REPLACE VIEW v_ordenes_compra_con_costos AS
SELECT
    oc.id,
    oc.organizacion_id,
    oc.folio,
    oc.estado,
    oc.total,
    COALESCE(costos.total_costos_adicionales, 0) as total_costos_adicionales,
    COALESCE(costos.costos_distribuidos, 0) as costos_distribuidos,
    COALESCE(costos.costos_pendientes, 0) as costos_pendientes,
    oc.total + COALESCE(costos.total_costos_adicionales, 0) as total_con_landed_costs
FROM ordenes_compra oc
LEFT JOIN (
    SELECT
        orden_compra_id,
        SUM(monto_moneda_local) as total_costos_adicionales,
        SUM(CASE WHEN distribuido THEN monto_moneda_local ELSE 0 END) as costos_distribuidos,
        SUM(CASE WHEN NOT distribuido THEN monto_moneda_local ELSE 0 END) as costos_pendientes
    FROM ordenes_compra_costos_adicionales
    GROUP BY orden_compra_id
) costos ON costos.orden_compra_id = oc.id;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ordenes_compra_costos_adicionales TO saas_app;
GRANT SELECT, INSERT, DELETE ON ordenes_compra_costos_distribuidos TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE ordenes_compra_costos_adicionales_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE ordenes_compra_costos_distribuidos_id_seq TO saas_app;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE ordenes_compra_costos_adicionales IS 'Costos adicionales (flete, arancel, seguro, etc.) asociados a ordenes de compra para Landed Costs';
COMMENT ON TABLE ordenes_compra_costos_distribuidos IS 'Historial de distribucion de costos adicionales a items de OC';
COMMENT ON FUNCTION distribuir_costo_adicional IS 'Distribuye un costo adicional a los items de la OC segun el metodo de distribucion configurado';
COMMENT ON FUNCTION obtener_resumen_costos_oc IS 'Obtiene resumen de costos adicionales agrupados por tipo para una OC';
COMMENT ON FUNCTION obtener_costo_total_item IS 'Calcula el costo total unitario (precio + landed costs) de un item de OC';
