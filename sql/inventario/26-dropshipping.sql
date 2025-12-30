-- ============================================================================
-- DROPSHIPPING - Flujo de venta directa del proveedor al cliente
-- Permite generar OC automatica o manual cuando se vende un producto dropship
-- Fecha: 30 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- MIGRACION - Agregar columnas a tablas existentes
-- Solo ejecutar si las columnas no existen
-- ============================================================================

-- Agregar columnas a ordenes_compra (para migraciones de BD existentes)
DO $$
BEGIN
    -- es_dropship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ordenes_compra' AND column_name = 'es_dropship') THEN
        ALTER TABLE ordenes_compra ADD COLUMN es_dropship BOOLEAN DEFAULT false;
    END IF;

    -- venta_pos_id (columna sin FK, se agrega abajo)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ordenes_compra' AND column_name = 'venta_pos_id') THEN
        ALTER TABLE ordenes_compra ADD COLUMN venta_pos_id INTEGER;
    END IF;

    -- cliente_id para dropship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ordenes_compra' AND column_name = 'cliente_id') THEN
        ALTER TABLE ordenes_compra ADD COLUMN cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL;
    END IF;

    -- cliente_nombre
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ordenes_compra' AND column_name = 'cliente_nombre') THEN
        ALTER TABLE ordenes_compra ADD COLUMN cliente_nombre VARCHAR(150);
    END IF;

    -- cliente_telefono
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ordenes_compra' AND column_name = 'cliente_telefono') THEN
        ALTER TABLE ordenes_compra ADD COLUMN cliente_telefono VARCHAR(20);
    END IF;

    -- direccion_envio_cliente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ordenes_compra' AND column_name = 'direccion_envio_cliente') THEN
        ALTER TABLE ordenes_compra ADD COLUMN direccion_envio_cliente TEXT;
    END IF;
END $$;

-- Agregar columnas a ventas_pos
DO $$
BEGIN
    -- es_dropship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ventas_pos' AND column_name = 'es_dropship') THEN
        ALTER TABLE ventas_pos ADD COLUMN es_dropship BOOLEAN DEFAULT false;
    END IF;

    -- direccion_envio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ventas_pos' AND column_name = 'direccion_envio') THEN
        ALTER TABLE ventas_pos ADD COLUMN direccion_envio TEXT;
    END IF;

    -- requiere_oc_dropship
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ventas_pos' AND column_name = 'requiere_oc_dropship') THEN
        ALTER TABLE ventas_pos ADD COLUMN requiere_oc_dropship BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Agregar configuracion dropship a configuracion_inventario (si existe la tabla)
DO $$
BEGIN
    -- Solo si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracion_inventario') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'configuracion_inventario' AND column_name = 'dropship_auto_generar_oc') THEN
            ALTER TABLE configuracion_inventario ADD COLUMN dropship_auto_generar_oc BOOLEAN DEFAULT true;
        END IF;
    END IF;
END $$;

-- Agregar FK de venta_pos_id a ventas_pos (ahora que ventas_pos existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'ordenes_compra_venta_pos_id_fkey'
          AND table_name = 'ordenes_compra'
    ) THEN
        ALTER TABLE ordenes_compra
        ADD CONSTRAINT ordenes_compra_venta_pos_id_fkey
        FOREIGN KEY (venta_pos_id) REFERENCES ventas_pos(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_dropship ON ordenes_compra(es_dropship) WHERE es_dropship = true;
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_venta_pos ON ordenes_compra(venta_pos_id) WHERE venta_pos_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ventas_pos_dropship ON ventas_pos(es_dropship) WHERE es_dropship = true;
CREATE INDEX IF NOT EXISTS idx_ventas_pos_requiere_oc ON ventas_pos(requiere_oc_dropship) WHERE requiere_oc_dropship = true;

-- ============================================================================
-- FUNCIONES
-- ============================================================================

/**
 * Verificar si una venta tiene productos dropship
 * @param p_venta_id - ID de la venta
 * @returns BOOLEAN
 */
CREATE OR REPLACE FUNCTION tiene_productos_dropship(p_venta_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM ventas_pos_items vpi
        JOIN productos p ON p.id = vpi.producto_id
        WHERE vpi.venta_pos_id = p_venta_id
          AND p.ruta_preferida = 'dropship'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Crear OC dropship desde una venta
 * Genera una OC por cada proveedor con productos dropship
 * @param p_venta_id - ID de la venta
 * @param p_usuario_id - ID del usuario que genera
 * @returns JSONB con resultado
 */
CREATE OR REPLACE FUNCTION crear_oc_dropship_desde_venta(
    p_venta_id INTEGER,
    p_usuario_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_venta RECORD;
    v_cliente RECORD;
    v_proveedor RECORD;
    v_item RECORD;
    v_oc_id INTEGER;
    v_folio VARCHAR(20);
    v_subtotal DECIMAL(12,2);
    v_total DECIMAL(12,2);
    v_ocs_creadas INTEGER := 0;
    v_items_procesados INTEGER := 0;
    v_resultado JSONB := '[]'::JSONB;
    v_organizacion_id INTEGER;
BEGIN
    -- Obtener datos de la venta
    SELECT * INTO v_venta
    FROM ventas_pos
    WHERE id = p_venta_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Venta no encontrada');
    END IF;

    v_organizacion_id := v_venta.organizacion_id;

    -- Obtener datos del cliente
    IF v_venta.cliente_id IS NOT NULL THEN
        SELECT * INTO v_cliente
        FROM clientes
        WHERE id = v_venta.cliente_id;
    END IF;

    -- Verificar que hay productos dropship
    IF NOT tiene_productos_dropship(p_venta_id) THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'No hay productos dropship en esta venta');
    END IF;

    -- Crear una OC por cada proveedor con productos dropship
    FOR v_proveedor IN
        SELECT DISTINCT p.proveedor_id, prov.razon_social as proveedor_nombre
        FROM ventas_pos_items vpi
        JOIN productos p ON p.id = vpi.producto_id
        JOIN proveedores prov ON prov.id = p.proveedor_id
        WHERE vpi.venta_pos_id = p_venta_id
          AND p.ruta_preferida = 'dropship'
          AND p.proveedor_id IS NOT NULL
    LOOP
        -- Generar folio
        SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 9) AS INTEGER)), 0) + 1
        INTO v_folio
        FROM ordenes_compra
        WHERE organizacion_id = v_organizacion_id
          AND folio LIKE 'OC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';

        v_folio := 'OC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(v_folio::TEXT, 4, '0');

        -- Calcular totales para este proveedor
        SELECT
            COALESCE(SUM(vpi.cantidad * vpi.precio_unitario), 0) as subtotal
        INTO v_subtotal
        FROM ventas_pos_items vpi
        JOIN productos p ON p.id = vpi.producto_id
        WHERE vpi.venta_pos_id = p_venta_id
          AND p.proveedor_id = v_proveedor.proveedor_id
          AND p.ruta_preferida = 'dropship';

        v_total := v_subtotal; -- Sin impuestos por ahora

        -- Crear la OC
        INSERT INTO ordenes_compra (
            organizacion_id,
            folio,
            proveedor_id,
            estado,
            fecha_orden,
            subtotal,
            total,
            usuario_id,
            notas,
            -- Campos dropship
            es_dropship,
            venta_pos_id,
            cliente_id,
            cliente_nombre,
            cliente_telefono,
            direccion_envio_cliente
        ) VALUES (
            v_organizacion_id,
            v_folio,
            v_proveedor.proveedor_id,
            'borrador',
            CURRENT_DATE,
            v_subtotal,
            v_total,
            p_usuario_id,
            format('OC Dropship generada desde venta %s', v_venta.folio),
            -- Campos dropship
            true,
            p_venta_id,
            v_venta.cliente_id,
            COALESCE(v_cliente.nombre, ''),
            v_cliente.telefono,
            COALESCE(v_venta.direccion_envio, v_cliente.direccion)
        )
        RETURNING id INTO v_oc_id;

        -- Agregar items a la OC
        FOR v_item IN
            SELECT
                vpi.producto_id,
                p.nombre as producto_nombre,
                p.sku,
                p.unidad_medida,
                vpi.cantidad,
                p.precio_compra as precio_unitario
            FROM ventas_pos_items vpi
            JOIN productos p ON p.id = vpi.producto_id
            WHERE vpi.venta_pos_id = p_venta_id
              AND p.proveedor_id = v_proveedor.proveedor_id
              AND p.ruta_preferida = 'dropship'
        LOOP
            INSERT INTO ordenes_compra_items (
                orden_compra_id,
                producto_id,
                nombre_producto,
                sku,
                unidad_medida,
                cantidad,
                precio_unitario,
                subtotal
            ) VALUES (
                v_oc_id,
                v_item.producto_id,
                v_item.producto_nombre,
                v_item.sku,
                v_item.unidad_medida,
                v_item.cantidad,
                COALESCE(v_item.precio_unitario, 0),
                v_item.cantidad * COALESCE(v_item.precio_unitario, 0)
            );

            v_items_procesados := v_items_procesados + 1;
        END LOOP;

        v_ocs_creadas := v_ocs_creadas + 1;

        -- Agregar OC al resultado
        v_resultado := v_resultado || jsonb_build_object(
            'oc_id', v_oc_id,
            'folio', v_folio,
            'proveedor', v_proveedor.proveedor_nombre,
            'total', v_total
        );
    END LOOP;

    -- Marcar venta como procesada
    UPDATE ventas_pos
    SET requiere_oc_dropship = false
    WHERE id = p_venta_id;

    RETURN jsonb_build_object(
        'exito', true,
        'mensaje', format('%s OC(s) creada(s) con %s items', v_ocs_creadas, v_items_procesados),
        'ordenes_compra', v_resultado,
        'ocs_creadas', v_ocs_creadas,
        'items_procesados', v_items_procesados
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'exito', false,
        'mensaje', format('Error: %s', SQLERRM)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Obtener ventas pendientes de generar OC dropship
 */
CREATE OR REPLACE FUNCTION obtener_ventas_dropship_pendientes(
    p_organizacion_id INTEGER
) RETURNS TABLE (
    venta_id INTEGER,
    folio VARCHAR(50),
    cliente_nombre TEXT,
    direccion_envio TEXT,
    total DECIMAL(10,2),
    fecha_venta TIMESTAMPTZ,
    items_dropship INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id as venta_id,
        v.folio,
        COALESCE(c.nombre, 'Sin cliente') as cliente_nombre,
        COALESCE(v.direccion_envio, c.direccion, 'Sin direccion') as direccion_envio,
        v.total,
        v.fecha_venta,
        (SELECT COUNT(*)::INTEGER
         FROM ventas_pos_items vpi
         JOIN productos p ON p.id = vpi.producto_id
         WHERE vpi.venta_pos_id = v.id AND p.ruta_preferida = 'dropship') as items_dropship
    FROM ventas_pos v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    WHERE v.organizacion_id = p_organizacion_id
      AND v.requiere_oc_dropship = true
      AND v.estado = 'completada'
    ORDER BY v.fecha_venta DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Vista de OC dropship con info de venta y cliente
 */
CREATE OR REPLACE VIEW v_ordenes_compra_dropship AS
SELECT
    oc.id,
    oc.organizacion_id,
    oc.folio,
    oc.estado,
    oc.total,
    oc.fecha_orden,
    oc.proveedor_id,
    prov.razon_social as proveedor_nombre,
    oc.venta_pos_id,
    v.folio as venta_folio,
    oc.cliente_id,
    oc.cliente_nombre,
    oc.cliente_telefono,
    oc.direccion_envio_cliente,
    oc.creado_en
FROM ordenes_compra oc
JOIN proveedores prov ON prov.id = oc.proveedor_id
LEFT JOIN ventas_pos v ON v.id = oc.venta_pos_id
WHERE oc.es_dropship = true;

-- ============================================================================
-- TRIGGER para marcar venta como dropship al agregar items
-- ============================================================================

CREATE OR REPLACE FUNCTION actualizar_venta_dropship()
RETURNS TRIGGER AS $$
DECLARE
    v_es_dropship BOOLEAN;
    v_auto_generar BOOLEAN;
BEGIN
    -- Verificar si la venta tiene productos dropship
    v_es_dropship := tiene_productos_dropship(NEW.venta_pos_id);

    -- Obtener configuracion
    SELECT COALESCE(dropship_auto_generar_oc, true) INTO v_auto_generar
    FROM configuracion_inventario ci
    JOIN ventas_pos v ON v.organizacion_id = ci.organizacion_id
    WHERE v.id = NEW.venta_pos_id;

    -- Actualizar venta
    UPDATE ventas_pos
    SET es_dropship = v_es_dropship,
        requiere_oc_dropship = CASE
            WHEN v_es_dropship AND NOT COALESCE(v_auto_generar, true) THEN true
            ELSE false
        END
    WHERE id = NEW.venta_pos_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_venta_item_dropship') THEN
        CREATE TRIGGER trg_venta_item_dropship
            AFTER INSERT ON ventas_pos_items
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_venta_dropship();
    END IF;
END $$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION tiene_productos_dropship(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION crear_oc_dropship_desde_venta(INTEGER, INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION obtener_ventas_dropship_pendientes(INTEGER) TO saas_app;
GRANT SELECT ON v_ordenes_compra_dropship TO saas_app;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON FUNCTION crear_oc_dropship_desde_venta IS 'Crea OC(s) dropship desde una venta, una por cada proveedor con productos dropship';
COMMENT ON FUNCTION obtener_ventas_dropship_pendientes IS 'Lista ventas que requieren generacion manual de OC dropship';
COMMENT ON VIEW v_ordenes_compra_dropship IS 'Vista de ordenes de compra dropship con datos de venta y cliente';
