-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - FUNCIONES PL/pgSQL
-- Descripción: Funciones para gestión de ventas, tickets y operaciones POS
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- FUNCIÓN 1: generar_folio_venta
-- Descripción: Genera folio único para venta POS (formato: POS-2025-0001)
-- Uso: Llamada automáticamente por trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_venta()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_folio VARCHAR(50);
    contador INTEGER;
BEGIN
    -- Si ya tiene folio, no hacer nada (permite folios manuales)
    IF NEW.folio IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener el último número de folio del año actual para la organización
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(folio FROM 'POS-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO contador
    FROM ventas_pos
    WHERE organizacion_id = NEW.organizacion_id
    AND folio ~ ('^POS-' || EXTRACT(YEAR FROM NOW())::TEXT || '-\d{4}$');

    -- Generar folio: POS-2025-0001
    nuevo_folio := 'POS-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(contador::TEXT, 4, '0');

    NEW.folio := nuevo_folio;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generar_folio_venta IS 'Genera folio único auto-incremental formato POS-YYYY-####';

-- ============================================================================
-- FUNCIÓN 2: calcular_totales_venta_pos
-- Descripción: Calcula subtotal, total y monto_pendiente automáticamente
--              ADEMÁS descuenta stock si la venta está completada
-- Uso: Llamada por trigger al modificar ventas_pos_items
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_totales_venta_pos()
RETURNS TRIGGER AS $$
DECLARE
    suma_subtotales DECIMAL(10, 2);
    v_venta_pos_id INTEGER;
    v_estado_venta VARCHAR(20);
    v_organizacion_id INTEGER;
    v_usuario_id INTEGER;
    item RECORD;
    v_stock_actual INTEGER;
    v_ruta_preferida VARCHAR(20);  -- Dic 2025: Soporte dropship
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Determinar ID de venta (funciona con INSERT, UPDATE y DELETE)
    v_venta_pos_id := COALESCE(NEW.venta_pos_id, OLD.venta_pos_id);

    -- Calcular suma de subtotales de items
    SELECT COALESCE(SUM(subtotal), 0)
    INTO suma_subtotales
    FROM ventas_pos_items
    WHERE venta_pos_id = v_venta_pos_id;

    -- Actualizar totales de la venta
    -- Ene 2026: Incluir descuento_puntos en el cálculo del total
    UPDATE ventas_pos
    SET subtotal = suma_subtotales,
        total = suma_subtotales - COALESCE(descuento_monto, 0) - COALESCE(descuento_puntos, 0) + COALESCE(impuestos, 0),
        monto_pendiente = (suma_subtotales - COALESCE(descuento_monto, 0) - COALESCE(descuento_puntos, 0) + COALESCE(impuestos, 0)) - COALESCE(monto_pagado, 0),
        actualizado_en = NOW()
    WHERE id = v_venta_pos_id;

    -- ✨ NUEVO: Descontar stock si la venta está completada
    -- Solo se ejecuta en INSERT de items (cuando se agregan productos a la venta)
    IF TG_OP = 'INSERT' THEN
        -- Obtener estado de la venta
        SELECT estado, organizacion_id, usuario_id
        INTO v_estado_venta, v_organizacion_id, v_usuario_id
        FROM ventas_pos
        WHERE id = v_venta_pos_id;

        -- Si la venta está completada Y no tiene movimientos previos
        IF v_estado_venta = 'completada' THEN
            -- ✅ Anti-duplicados: Validar que no existan movimientos previos para esta venta
            IF NOT EXISTS (
                SELECT 1 FROM movimientos_inventario
                WHERE venta_pos_id = v_venta_pos_id
                AND tipo_movimiento = 'salida_venta'
            ) THEN
                -- Por cada item de la venta
                FOR item IN
                    SELECT * FROM ventas_pos_items WHERE venta_pos_id = v_venta_pos_id
                LOOP
                    -- Dic 2025: Soporte para variantes de producto
                    IF item.variante_id IS NOT NULL THEN
                        -- ✅ Lock optimista para VARIANTE
                        SELECT stock_actual INTO v_stock_actual
                        FROM variantes_producto
                        WHERE id = item.variante_id
                        FOR UPDATE;

                        -- Validar stock de variante
                        IF v_stock_actual < item.cantidad THEN
                            PERFORM set_config('app.bypass_rls', 'false', true);
                            RAISE EXCEPTION 'Stock insuficiente para variante ID %: disponible %, requerido %',
                                item.variante_id, v_stock_actual, item.cantidad;
                        END IF;

                        -- Actualizar stock de la variante
                        UPDATE variantes_producto
                        SET stock_actual = stock_actual - item.cantidad,
                            actualizado_en = NOW()
                        WHERE id = item.variante_id;
                    ELSE
                        -- ✅ Lock optimista: Evitar race conditions (producto normal)
                        SELECT stock_actual, COALESCE(ruta_preferida, 'normal')
                        INTO v_stock_actual, v_ruta_preferida
                        FROM productos
                        WHERE id = item.producto_id
                        FOR UPDATE;

                        -- Dic 2025: Dropship no requiere stock ni descuento
                        -- El proveedor envía directo al cliente, no hay movimiento de inventario
                        IF v_ruta_preferida = 'dropship' THEN
                            CONTINUE; -- Skip: no descontar stock ni crear movimiento
                        END IF;

                        -- Validar stock suficiente (solo productos normales)
                        IF v_stock_actual < item.cantidad THEN
                            PERFORM set_config('app.bypass_rls', 'false', true);
                            RAISE EXCEPTION 'Stock insuficiente para producto ID %: disponible %, requerido %',
                                item.producto_id, v_stock_actual, item.cantidad;
                        END IF;

                        -- Actualizar stock del producto
                        UPDATE productos
                        SET stock_actual = stock_actual - item.cantidad,
                            actualizado_en = NOW()
                        WHERE id = item.producto_id;
                    END IF;

                    -- Registrar movimiento de inventario
                    INSERT INTO movimientos_inventario (
                        organizacion_id,
                        producto_id,
                        variante_id,
                        tipo_movimiento,
                        cantidad,
                        stock_antes,
                        stock_despues,
                        costo_unitario,
                        valor_total,
                        venta_pos_id,
                        usuario_id,
                        creado_en
                    )
                    SELECT
                        v_organizacion_id,
                        item.producto_id,
                        item.variante_id,
                        'salida_venta',
                        -item.cantidad, -- Negativo porque es salida
                        v_stock_actual, -- Stock antes (con lock)
                        v_stock_actual - item.cantidad, -- Stock después
                        p.precio_compra,
                        p.precio_compra * item.cantidad,
                        v_venta_pos_id,
                        v_usuario_id,
                        NOW()
                    FROM productos p
                    WHERE p.id = item.producto_id;

                    -- Ene 2026: Si el producto es combo, descontar stock de componentes
                    IF EXISTS (
                        SELECT 1 FROM productos_combo
                        WHERE producto_id = item.producto_id
                        AND activo = true
                        AND manejo_stock = 'descontar_componentes'
                    ) THEN
                        -- Obtener sucursal_id de la venta
                        PERFORM descontar_stock_combo(
                            item.producto_id,
                            item.cantidad,
                            (SELECT sucursal_id FROM ventas_pos WHERE id = v_venta_pos_id),
                            v_venta_pos_id
                        );
                    END IF;

                END LOOP;
            END IF;
        END IF;
    END IF;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_totales_venta_pos IS 'Calcula totales Y descuenta stock automáticamente si venta está completada (se ejecuta al insertar items)';

-- ============================================================================
-- FUNCIÓN 3: actualizar_stock_venta_pos
-- Descripción: Descuenta stock cuando se actualiza el estado de una venta existente
--              (Solo para casos de UPDATE, no INSERT - esos los maneja calcular_totales_venta_pos)
-- Uso: Llamada por trigger al cambiar estado a 'completada' en ventas existentes
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_stock_venta_pos()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    v_stock_actual INTEGER;
    v_ruta_preferida VARCHAR(20);
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Solo procesar si:
    -- 1. Es un UPDATE (no INSERT, porque esos los maneja calcular_totales_venta_pos)
    -- 2. La venta cambió a estado 'completada'
    -- 3. El estado anterior NO era 'completada'
    IF TG_OP = 'UPDATE' AND NEW.estado = 'completada' AND OLD.estado != 'completada' THEN

        -- ✅ Anti-duplicados: Validar que no existan movimientos previos
        IF EXISTS (
            SELECT 1 FROM movimientos_inventario
            WHERE venta_pos_id = NEW.id
            AND tipo_movimiento = 'salida_venta'
        ) THEN
            PERFORM set_config('app.bypass_rls', 'false', true);
            RETURN NEW;
        END IF;

        -- Por cada item de la venta
        FOR item IN
            SELECT * FROM ventas_pos_items WHERE venta_pos_id = NEW.id
        LOOP
            -- Dic 2025: Soporte para variantes de producto
            IF item.variante_id IS NOT NULL THEN
                -- ✅ Lock optimista para VARIANTE
                SELECT stock_actual INTO v_stock_actual
                FROM variantes_producto
                WHERE id = item.variante_id
                FOR UPDATE;

                -- Validar stock de variante
                IF v_stock_actual < item.cantidad THEN
                    PERFORM set_config('app.bypass_rls', 'false', true);
                    RAISE EXCEPTION 'Stock insuficiente para variante ID %: disponible %, requerido %',
                        item.variante_id, v_stock_actual, item.cantidad;
                END IF;

                -- Actualizar stock de la variante
                UPDATE variantes_producto
                SET stock_actual = stock_actual - item.cantidad,
                    actualizado_en = NOW()
                WHERE id = item.variante_id;
            ELSE
                -- ✅ Lock optimista: Evitar race conditions (producto normal)
                SELECT stock_actual, COALESCE(ruta_preferida, 'normal')
                INTO v_stock_actual, v_ruta_preferida
                FROM productos
                WHERE id = item.producto_id
                FOR UPDATE;

                -- Dic 2025: Dropship no requiere stock ni descuento
                IF v_ruta_preferida = 'dropship' THEN
                    INSERT INTO movimientos_inventario (
                        organizacion_id, producto_id, variante_id,
                        tipo_movimiento, cantidad, stock_antes, stock_despues,
                        costo_unitario, valor_total, venta_pos_id, usuario_id, creado_en
                    )
                    SELECT NEW.organizacion_id, item.producto_id, item.variante_id,
                        'salida_venta', -item.cantidad, v_stock_actual, v_stock_actual,
                        p.precio_compra, p.precio_compra * item.cantidad,
                        NEW.id, NEW.usuario_id, NOW()
                    FROM productos p WHERE p.id = item.producto_id;

                    CONTINUE;
                END IF;

                -- Validar stock suficiente
                IF v_stock_actual < item.cantidad THEN
                    PERFORM set_config('app.bypass_rls', 'false', true);
                    RAISE EXCEPTION 'Stock insuficiente para producto ID %: disponible %, requerido %',
                        item.producto_id, v_stock_actual, item.cantidad;
                END IF;

                -- Actualizar stock del producto
                UPDATE productos
                SET stock_actual = stock_actual - item.cantidad,
                    actualizado_en = NOW()
                WHERE id = item.producto_id;
            END IF;

            -- Registrar movimiento de inventario
            INSERT INTO movimientos_inventario (
                organizacion_id,
                producto_id,
                variante_id,
                tipo_movimiento,
                cantidad,
                stock_antes,
                stock_despues,
                costo_unitario,
                valor_total,
                venta_pos_id,
                usuario_id,
                creado_en
            )
            SELECT
                NEW.organizacion_id,
                item.producto_id,
                item.variante_id,
                'salida_venta',
                -item.cantidad, -- Negativo porque es salida
                v_stock_actual, -- Stock antes (con lock)
                v_stock_actual - item.cantidad, -- Stock después
                p.precio_compra,
                p.precio_compra * item.cantidad,
                NEW.id,
                NEW.usuario_id,
                NOW()
            FROM productos p
            WHERE p.id = item.producto_id;

            -- Ene 2026: Si el producto es combo, descontar stock de componentes
            IF EXISTS (
                SELECT 1 FROM productos_combo
                WHERE producto_id = item.producto_id
                AND activo = true
                AND manejo_stock = 'descontar_componentes'
            ) THEN
                PERFORM descontar_stock_combo(
                    item.producto_id,
                    item.cantidad,
                    NEW.sucursal_id,
                    NEW.id
                );
            END IF;

        END LOOP;

    END IF;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Limpiar bypass en caso de error
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION actualizar_stock_venta_pos IS 'Descuenta stock al cambiar estado a completada en UPDATE (ventas que cambian de cotizacion→completada)';

-- ============================================================================
-- FUNCIÓN 4: actualizar_timestamp_venta
-- Descripción: Actualiza campo actualizado_en automáticamente
-- Uso: Llamada por trigger BEFORE UPDATE
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp_venta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_timestamp_venta IS 'Actualiza actualizado_en automáticamente en cada UPDATE';

-- ============================================================================
-- FUNCIÓN 5: obtener_resumen_ventas_dia
-- Descripción: Resumen de ventas del día para corte de caja
-- Uso: SELECT * FROM obtener_resumen_ventas_dia(1, '2025-11-20');
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_resumen_ventas_dia(
    org_id INTEGER,
    fecha DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_ventas BIGINT,
    total_efectivo DECIMAL(10, 2),
    total_tarjeta DECIMAL(10, 2),
    total_transferencia DECIMAL(10, 2),
    total_qr DECIMAL(10, 2),
    total_mixto DECIMAL(10, 2),
    total_general DECIMAL(10, 2),
    ventas_completadas BIGINT,
    ventas_canceladas BIGINT,
    ticket_promedio DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_ventas,
        COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS total_efectivo,
        COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) AS total_tarjeta,
        COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS total_transferencia,
        COALESCE(SUM(CASE WHEN metodo_pago = 'qr' THEN total ELSE 0 END), 0) AS total_qr,
        COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN total ELSE 0 END), 0) AS total_mixto,
        COALESCE(SUM(total), 0) AS total_general,
        COUNT(*) FILTER (WHERE estado = 'completada')::BIGINT AS ventas_completadas,
        COUNT(*) FILTER (WHERE estado = 'cancelada')::BIGINT AS ventas_canceladas,
        CASE
            WHEN COUNT(*) FILTER (WHERE estado = 'completada') > 0 THEN
                (COALESCE(SUM(total) FILTER (WHERE estado = 'completada'), 0) /
                 COUNT(*) FILTER (WHERE estado = 'completada'))::DECIMAL(10, 2)
            ELSE 0
        END AS ticket_promedio
    FROM ventas_pos
    WHERE organizacion_id = org_id
    AND fecha_venta::DATE = fecha;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_resumen_ventas_dia IS 'Resumen de ventas del día agrupado por método de pago (para corte de caja)';

-- ============================================================================
-- FUNCIÓN 6: productos_mas_vendidos
-- Descripción: Top N productos más vendidos en un período
-- Uso: SELECT * FROM productos_mas_vendidos(1, '2025-01-01', '2025-12-31', 10);
-- ============================================================================
CREATE OR REPLACE FUNCTION productos_mas_vendidos(
    org_id INTEGER,
    fecha_desde DATE,
    fecha_hasta DATE,
    limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre_producto VARCHAR(200),
    categoria VARCHAR(100),
    total_unidades BIGINT,
    total_ingresos DECIMAL(10, 2),
    numero_ventas BIGINT,
    precio_promedio DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS producto_id,
        p.nombre AS nombre_producto,
        cp.nombre::VARCHAR(100) AS categoria,
        SUM(vpi.cantidad)::BIGINT AS total_unidades,
        SUM(vpi.subtotal) AS total_ingresos,
        COUNT(DISTINCT vpi.venta_pos_id)::BIGINT AS numero_ventas,
        (SUM(vpi.subtotal) / NULLIF(SUM(vpi.cantidad), 0))::DECIMAL(10, 2) AS precio_promedio
    FROM ventas_pos_items vpi
    JOIN productos p ON p.id = vpi.producto_id
    LEFT JOIN categorias_productos cp ON cp.id = p.categoria_id
    JOIN ventas_pos vp ON vp.id = vpi.venta_pos_id
    WHERE vp.organizacion_id = org_id
    AND vp.fecha_venta BETWEEN fecha_desde AND fecha_hasta
    AND vp.estado = 'completada'
    GROUP BY p.id, p.nombre, cp.nombre
    ORDER BY total_ingresos DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION productos_mas_vendidos IS 'Top N productos más vendidos por ingresos en un período';

-- ============================================================================
-- FUNCIÓN: Marcar número de serie como vendido (trigger)
-- Dic 2025 - INV-5: Trazabilidad NS en ventas POS
-- ============================================================================

CREATE OR REPLACE FUNCTION marcar_ns_vendido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Si el item tiene numero_serie_id, marcar como vendido
    IF NEW.numero_serie_id IS NOT NULL THEN
        UPDATE numeros_serie
        SET estado = 'vendido',
            venta_id = NEW.venta_pos_id,
            fecha_salida = NOW(),
            actualizado_en = NOW()
        WHERE id = NEW.numero_serie_id;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION marcar_ns_vendido IS 'Marca número de serie como vendido al insertar item en venta POS';

-- ============================================================================
-- FIN: FUNCIONES DE PUNTO DE VENTA
-- ============================================================================
