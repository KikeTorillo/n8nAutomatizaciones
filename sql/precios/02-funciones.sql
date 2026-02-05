-- ====================================================================
-- MÓDULO PRECIOS: FUNCIONES
-- ====================================================================
-- Función principal para resolver el precio de un producto según
-- cliente, cantidad, moneda y listas de precios.
--
-- Fase 5 - Diciembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: obtener_precio_producto
-- ====================================================================
-- Resuelve el precio final de un producto considerando:
-- 1. Lista de precios del cliente (si tiene asignada)
-- 2. Lista de precios default de la organización
-- 3. Precio específico en la moneda solicitada
-- 4. Precio base del producto (fallback)
--
-- JERARQUÍA DE RESOLUCIÓN:
-- Cliente tiene lista → Buscar regla en lista del cliente
--     ↓ (si no hay regla)
-- Organización tiene lista default → Buscar regla en lista default
--     ↓ (si no hay regla)
-- Existe precio en moneda solicitada → Usar precio_producto_moneda
--     ↓ (si no existe)
-- Usar precio base del producto
--
-- REGLA CRÍTICA DE RESOLUCIÓN:
-- Las reglas de precio NO se acumulan. Se selecciona UNA sola regla:
-- - Si hay item específico (producto/categoría) → usar SOLO ese item
-- - Si NO hay item → aplicar descuento_global de la lista
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_precio_producto(
    p_producto_id INTEGER,
    p_cliente_id INTEGER DEFAULT NULL,
    p_cantidad INTEGER DEFAULT 1,
    p_moneda VARCHAR(3) DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    precio DECIMAL(12,2),
    moneda VARCHAR(3),
    fuente VARCHAR(50),
    fuente_detalle VARCHAR(100),
    descuento_aplicado DECIMAL(5,2),
    lista_codigo VARCHAR(20)
) AS $$
DECLARE
    v_lista_id INTEGER;
    v_lista_codigo VARCHAR(20);
    v_org_id INTEGER;
    v_moneda_efectiva VARCHAR(3);
    v_precio_base DECIMAL(12,2);
    v_precio_encontrado DECIMAL(12,2);
    v_descuento DECIMAL(5,2) := 0;
    v_descuento_global DECIMAL(5,2) := 0;
    v_fuente VARCHAR(50);
    v_fuente_detalle VARCHAR(100);
BEGIN
    -- ================================================================
    -- PASO 1: Obtener información base del producto
    -- ================================================================
    SELECT
        p.organizacion_id,
        p.precio_venta,
        COALESCE(p_moneda, s.moneda, o.moneda, 'MXN')
    INTO v_org_id, v_precio_base, v_moneda_efectiva
    FROM productos p
    JOIN organizaciones o ON o.id = p.organizacion_id
    LEFT JOIN sucursales s ON s.id = p_sucursal_id
    WHERE p.id = p_producto_id;

    -- Si no existe el producto, retornar NULL
    IF v_org_id IS NULL THEN
        RETURN;
    END IF;

    -- ================================================================
    -- PASO 2: Buscar lista de precios del cliente
    -- ================================================================
    IF p_cliente_id IS NOT NULL THEN
        SELECT c.lista_precios_id
        INTO v_lista_id
        FROM clientes c
        WHERE c.id = p_cliente_id
          AND c.eliminado_en IS NULL;

        IF v_lista_id IS NOT NULL THEN
            SELECT lp.codigo, lp.descuento_global_pct
            INTO v_lista_codigo, v_descuento_global
            FROM listas_precios lp
            WHERE lp.id = v_lista_id
              AND lp.activo = TRUE
              AND lp.eliminado_en IS NULL;
        END IF;
    END IF;

    -- ================================================================
    -- PASO 3: Si no hay lista de cliente, buscar lista default
    -- ================================================================
    IF v_lista_id IS NULL THEN
        SELECT lp.id, lp.codigo, lp.descuento_global_pct
        INTO v_lista_id, v_lista_codigo, v_descuento_global
        FROM listas_precios lp
        WHERE lp.organizacion_id = v_org_id
          AND lp.es_default = TRUE
          AND lp.activo = TRUE
          AND lp.eliminado_en IS NULL
          AND lp.moneda = v_moneda_efectiva;
    END IF;

    -- ================================================================
    -- PASO 4: Buscar regla en la lista de precios
    -- ================================================================
    IF v_lista_id IS NOT NULL THEN
        SELECT
            CASE
                WHEN lpi.precio_fijo IS NOT NULL THEN lpi.precio_fijo
                ELSE v_precio_base * (1 - COALESCE(lpi.descuento_pct, 0) / 100)
            END,
            COALESCE(lpi.descuento_pct, 0),
            CASE
                WHEN p_cliente_id IS NOT NULL AND c.lista_precios_id IS NOT NULL
                THEN 'lista_cliente'
                ELSE 'lista_default'
            END,
            CASE
                WHEN lpi.producto_id IS NOT NULL THEN 'Producto específico'
                WHEN lpi.categoria_id IS NOT NULL THEN 'Por categoría'
                ELSE 'Regla global'
            END ||
            CASE
                WHEN lpi.cantidad_minima > 1 THEN ' (desde ' || lpi.cantidad_minima || ' uds)'
                ELSE ''
            END
        INTO v_precio_encontrado, v_descuento, v_fuente, v_fuente_detalle
        FROM listas_precios_items lpi
        LEFT JOIN clientes c ON c.id = p_cliente_id
        WHERE lpi.lista_precio_id = v_lista_id
          AND (lpi.producto_id = p_producto_id OR lpi.producto_id IS NULL)
          AND (
              lpi.categoria_id IS NULL
              OR lpi.categoria_id = (SELECT categoria_id FROM productos WHERE id = p_producto_id)
          )
          AND lpi.cantidad_minima <= p_cantidad
          AND (lpi.cantidad_maxima IS NULL OR lpi.cantidad_maxima >= p_cantidad)
        ORDER BY
            -- Prioridad: producto específico > categoría > global
            CASE WHEN lpi.producto_id IS NOT NULL THEN 1
                 WHEN lpi.categoria_id IS NOT NULL THEN 2
                 ELSE 3 END,
            -- Luego por prioridad configurada
            lpi.prioridad DESC,
            -- Luego por cantidad mínima más alta
            lpi.cantidad_minima DESC
        LIMIT 1;

        -- Las reglas NO se acumulan:
        -- Si se encontró un item específico → usar SOLO ese precio (ignorar descuento_global)
        -- Si NO hay item específico pero hay descuento_global → aplicar descuento_global al precio base

        IF v_precio_encontrado IS NULL AND v_descuento_global > 0 THEN
            v_precio_encontrado := v_precio_base * (1 - v_descuento_global / 100);
            v_descuento := v_descuento_global;
            v_fuente := 'lista_descuento_global';
            v_fuente_detalle := 'Descuento global de lista ' || v_lista_codigo;
        END IF;
    END IF;

    -- ================================================================
    -- PASO 5: Si no hay regla, buscar en precios_producto_moneda
    -- ================================================================
    IF v_precio_encontrado IS NULL AND v_moneda_efectiva != 'MXN' THEN
        SELECT ppm.precio_venta
        INTO v_precio_encontrado
        FROM precios_producto_moneda ppm
        WHERE ppm.producto_id = p_producto_id
          AND ppm.moneda = v_moneda_efectiva
          AND ppm.activo = TRUE;

        IF v_precio_encontrado IS NOT NULL THEN
            v_fuente := 'precio_moneda';
            v_fuente_detalle := 'Precio en ' || v_moneda_efectiva;
            v_lista_codigo := NULL;
        END IF;
    END IF;

    -- ================================================================
    -- PASO 6: Fallback - precio base del producto
    -- ================================================================
    IF v_precio_encontrado IS NULL THEN
        v_precio_encontrado := v_precio_base;
        v_fuente := 'precio_base';
        v_fuente_detalle := 'Precio base del producto';
        v_lista_codigo := NULL;

        -- Si la moneda es diferente, convertir
        IF v_moneda_efectiva != 'MXN' THEN
            v_precio_encontrado := convertir_moneda(v_precio_base, 'MXN', v_moneda_efectiva);
            v_fuente_detalle := 'Precio base convertido a ' || v_moneda_efectiva;
        END IF;
    END IF;

    -- ================================================================
    -- RETORNAR RESULTADO
    -- ================================================================
    RETURN QUERY SELECT
        ROUND(v_precio_encontrado, 2),
        v_moneda_efectiva,
        v_fuente,
        v_fuente_detalle,
        ROUND(v_descuento, 2),
        v_lista_codigo;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_precio_producto IS
'Resuelve el precio final de un producto según cliente, cantidad, moneda y listas de precios.
Jerarquía: lista_cliente → lista_default → precio_moneda → precio_base';

-- ====================================================================
-- FUNCIÓN: obtener_precios_carrito
-- ====================================================================
-- Versión bulk para obtener precios de múltiples productos
-- Optimizada para el POS
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_precios_carrito(
    p_items JSONB,  -- Array de {producto_id, cantidad}
    p_cliente_id INTEGER DEFAULT NULL,
    p_moneda VARCHAR(3) DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    producto_id INTEGER,
    cantidad INTEGER,
    precio_unitario DECIMAL(12,2),
    precio_total DECIMAL(12,2),
    moneda VARCHAR(3),
    fuente VARCHAR(50),
    descuento_pct DECIMAL(5,2),
    lista_codigo VARCHAR(20)
) AS $$
DECLARE
    v_item JSONB;
    v_prod_id INTEGER;
    v_cantidad INTEGER;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_prod_id := (v_item->>'producto_id')::INTEGER;
        v_cantidad := COALESCE((v_item->>'cantidad')::INTEGER, 1);

        RETURN QUERY
        SELECT
            v_prod_id,
            v_cantidad,
            opp.precio,
            ROUND(opp.precio * v_cantidad, 2),
            opp.moneda,
            opp.fuente,
            opp.descuento_aplicado,
            opp.lista_codigo
        FROM obtener_precio_producto(
            v_prod_id,
            p_cliente_id,
            v_cantidad,
            p_moneda,
            p_sucursal_id
        ) opp;
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_precios_carrito IS
'Obtiene precios para múltiples productos del carrito en una sola llamada.
Input: JSONB array de {producto_id, cantidad}';

-- ====================================================================
-- FIN: FUNCIONES DE PRECIOS
-- ====================================================================
