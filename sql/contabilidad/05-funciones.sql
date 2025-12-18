-- ====================================================================
-- ⚡ MÓDULO CONTABILIDAD - FUNCIONES PL/pgSQL
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: contabilidad
--
-- DESCRIPCIÓN:
-- Funciones para gestión de asientos contables, reportes y
-- generación automática de asientos desde POS e Inventario.
--
-- TOTAL: 12 funciones
--
-- FUNCIONES PRINCIPALES:
-- • obtener_siguiente_numero_asiento: Secuencial por organización
-- • validar_asiento_cuadrado: Verifica debe = haber
-- • crear_asiento_venta_pos: Asiento automático desde POS
-- • crear_asiento_compra: Asiento automático desde orden compra
-- • obtener_balanza_comprobacion: Reporte balanza
-- • obtener_libro_mayor: Movimientos por cuenta
-- • obtener_estado_resultados: Reporte PyG
-- • crear_periodo_contable_si_no_existe: Auto-crear periodos
--
-- ====================================================================

-- ====================================================================
-- FUNCIÓN 1: obtener_siguiente_numero_asiento
-- ====================================================================
-- Genera número secuencial de asiento por organización.
-- Usa UPDATE con RETURNING para atomicidad.
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_siguiente_numero_asiento(p_organizacion_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_numero INTEGER;
BEGIN
    -- Intentar actualizar secuencia existente
    UPDATE config_contabilidad
    SET secuencia_asiento = secuencia_asiento + 1,
        actualizado_en = NOW()
    WHERE organizacion_id = p_organizacion_id
    RETURNING secuencia_asiento INTO v_numero;

    -- Si no existe config, crear con secuencia 1
    IF v_numero IS NULL THEN
        INSERT INTO config_contabilidad (organizacion_id, secuencia_asiento)
        VALUES (p_organizacion_id, 1)
        ON CONFLICT (organizacion_id) DO UPDATE
        SET secuencia_asiento = config_contabilidad.secuencia_asiento + 1
        RETURNING secuencia_asiento INTO v_numero;
    END IF;

    RETURN v_numero;
END;
$$;

COMMENT ON FUNCTION obtener_siguiente_numero_asiento IS
'Genera número secuencial de asiento por organización.
Atómico y seguro para concurrencia.
Uso: SELECT obtener_siguiente_numero_asiento(1);';


-- ====================================================================
-- FUNCIÓN 2: validar_asiento_cuadrado
-- ====================================================================
-- Verifica que el asiento cuadre (suma debe = suma haber).
-- ====================================================================

CREATE OR REPLACE FUNCTION validar_asiento_cuadrado(
    p_asiento_id INTEGER,
    p_fecha DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_debe DECIMAL(15, 2);
    v_total_haber DECIMAL(15, 2);
BEGIN
    SELECT
        COALESCE(SUM(debe), 0),
        COALESCE(SUM(haber), 0)
    INTO v_total_debe, v_total_haber
    FROM movimientos_contables
    WHERE asiento_id = p_asiento_id
    AND asiento_fecha = p_fecha;

    RETURN v_total_debe = v_total_haber AND v_total_debe > 0;
END;
$$;

COMMENT ON FUNCTION validar_asiento_cuadrado IS
'Verifica que un asiento cuadre (debe = haber) y tenga movimientos.
Retorna true si cuadra, false si no.';


-- ====================================================================
-- FUNCIÓN 3: crear_periodo_contable_si_no_existe
-- ====================================================================
-- Crea periodo contable automáticamente si no existe para una fecha.
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_periodo_contable_si_no_existe(
    p_organizacion_id INTEGER,
    p_fecha DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_periodo_id INTEGER;
    v_anio INTEGER;
    v_mes INTEGER;
BEGIN
    v_anio := EXTRACT(YEAR FROM p_fecha);
    v_mes := EXTRACT(MONTH FROM p_fecha);

    -- Buscar periodo existente
    SELECT id INTO v_periodo_id
    FROM periodos_contables
    WHERE organizacion_id = p_organizacion_id
    AND anio = v_anio
    AND mes = v_mes;

    -- Si no existe, crear
    IF NOT FOUND THEN
        INSERT INTO periodos_contables (
            organizacion_id,
            anio,
            mes,
            fecha_inicio,
            fecha_fin,
            estado
        ) VALUES (
            p_organizacion_id,
            v_anio,
            v_mes,
            DATE_TRUNC('month', p_fecha)::DATE,
            (DATE_TRUNC('month', p_fecha) + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
            'abierto'
        )
        RETURNING id INTO v_periodo_id;
    END IF;

    RETURN v_periodo_id;
END;
$$;

COMMENT ON FUNCTION crear_periodo_contable_si_no_existe IS
'Crea periodo contable automáticamente si no existe para la fecha dada.
Retorna el ID del periodo (existente o nuevo).';


-- ====================================================================
-- FUNCIÓN 4: obtener_cuenta_sistema
-- ====================================================================
-- Obtiene el ID de una cuenta del sistema por su tipo.
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_cuenta_sistema(
    p_organizacion_id INTEGER,
    p_tipo_cuenta_sistema VARCHAR
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_cuenta_id INTEGER;
BEGIN
    SELECT id INTO v_cuenta_id
    FROM cuentas_contables
    WHERE organizacion_id = p_organizacion_id
    AND tipo_cuenta_sistema = p_tipo_cuenta_sistema
    AND es_cuenta_sistema = true
    AND activo = true
    LIMIT 1;

    RETURN v_cuenta_id;
END;
$$;

COMMENT ON FUNCTION obtener_cuenta_sistema IS
'Obtiene el ID de una cuenta del sistema por su tipo.
Tipos: ventas, costo_ventas, inventario, clientes, proveedores,
       iva_trasladado, iva_acreditable, bancos, caja, comisiones_gasto';


-- ====================================================================
-- FUNCIÓN 5: crear_asiento_venta_pos
-- ====================================================================
-- Genera asiento contable automático desde venta POS.
--
-- ASIENTO GENERADO:
-- DEBE:
--   - Caja (si efectivo) o Bancos (otros métodos) = total
-- HABER:
--   - Ventas = subtotal sin IVA
--   - IVA Trasladado = impuestos
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_asiento_venta_pos(p_venta_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta RECORD;
    v_config RECORD;
    v_asiento_id INTEGER;
    v_numero_asiento INTEGER;
    v_fecha DATE;
    v_iva DECIMAL(15, 2);
    v_subtotal_sin_iva DECIMAL(15, 2);
    v_cuenta_cargo_id INTEGER;
BEGIN
    -- Obtener datos de la venta
    SELECT
        v.*,
        o.nombre_comercial as org_nombre
    INTO v_venta
    FROM ventas_pos v
    JOIN organizaciones o ON o.id = v.organizacion_id
    WHERE v.id = p_venta_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta POS no encontrada: %', p_venta_id;
    END IF;

    -- Verificar que la venta esté completada
    IF v_venta.estado != 'completada' THEN
        RETURN NULL; -- No generar asiento si no está completada
    END IF;

    -- Obtener configuración contable
    SELECT * INTO v_config
    FROM config_contabilidad
    WHERE organizacion_id = v_venta.organizacion_id;

    -- Si no hay config o no genera asientos automáticos, salir
    IF NOT FOUND OR NOT v_config.generar_asientos_automaticos THEN
        RETURN NULL;
    END IF;

    -- Verificar que existan las cuentas necesarias
    IF v_config.cuenta_caja_id IS NULL OR v_config.cuenta_ventas_id IS NULL THEN
        RAISE WARNING 'Configuración contable incompleta para org %', v_venta.organizacion_id;
        RETURN NULL;
    END IF;

    -- Calcular valores
    v_fecha := v_venta.fecha_venta::DATE;
    v_iva := COALESCE(v_venta.impuestos, 0);
    v_subtotal_sin_iva := v_venta.subtotal - COALESCE(v_venta.descuento_monto, 0);

    -- Determinar cuenta de cargo según método de pago
    IF v_venta.metodo_pago = 'efectivo' THEN
        v_cuenta_cargo_id := v_config.cuenta_caja_id;
    ELSE
        v_cuenta_cargo_id := COALESCE(v_config.cuenta_bancos_id, v_config.cuenta_caja_id);
    END IF;

    -- Crear periodo si no existe
    PERFORM crear_periodo_contable_si_no_existe(v_venta.organizacion_id, v_fecha);

    -- Obtener siguiente número de asiento
    v_numero_asiento := obtener_siguiente_numero_asiento(v_venta.organizacion_id);

    -- Crear asiento como BORRADOR (se publicará después de insertar movimientos)
    INSERT INTO asientos_contables (
        organizacion_id,
        sucursal_id,
        numero_asiento,
        fecha,
        tipo,
        concepto,
        referencia,
        documento_tipo,
        documento_id,
        total_debe,
        total_haber,
        estado,
        creado_por
    ) VALUES (
        v_venta.organizacion_id,
        v_venta.sucursal_id,  -- Heredar sucursal de la venta
        v_numero_asiento,
        v_fecha,
        'venta_pos',
        'Venta POS ' || v_venta.folio,
        v_venta.folio,
        'venta_pos',
        p_venta_id,
        0,
        0,
        'borrador',
        v_venta.usuario_id
    )
    RETURNING id INTO v_asiento_id;

    -- LÍNEA DEBE: Caja o Bancos
    INSERT INTO movimientos_contables (
        organizacion_id,
        asiento_id,
        asiento_fecha,
        cuenta_id,
        debe,
        concepto,
        tercero_tipo,
        tercero_id
    ) VALUES (
        v_venta.organizacion_id,
        v_asiento_id,
        v_fecha,
        v_cuenta_cargo_id,
        v_venta.total,
        'Cobro venta ' || v_venta.folio,
        CASE WHEN v_venta.cliente_id IS NOT NULL THEN 'cliente' END,
        v_venta.cliente_id
    );

    -- LÍNEA HABER: Ventas
    INSERT INTO movimientos_contables (
        organizacion_id,
        asiento_id,
        asiento_fecha,
        cuenta_id,
        haber,
        concepto
    ) VALUES (
        v_venta.organizacion_id,
        v_asiento_id,
        v_fecha,
        v_config.cuenta_ventas_id,
        v_subtotal_sin_iva,
        'Ingreso venta ' || v_venta.folio
    );

    -- LÍNEA HABER: IVA Trasladado (si aplica)
    IF v_iva > 0 AND v_config.cuenta_iva_trasladado_id IS NOT NULL THEN
        INSERT INTO movimientos_contables (
            organizacion_id,
            asiento_id,
            asiento_fecha,
            cuenta_id,
            haber,
            concepto
        ) VALUES (
            v_venta.organizacion_id,
            v_asiento_id,
            v_fecha,
            v_config.cuenta_iva_trasladado_id,
            v_iva,
            'IVA trasladado ' || v_venta.folio
        );
    END IF;

    -- Publicar el asiento (ahora los totales ya están correctos por el trigger)
    UPDATE asientos_contables
    SET estado = 'publicado',
        publicado_en = NOW(),
        publicado_por = v_venta.usuario_id
    WHERE id = v_asiento_id AND fecha = v_fecha;

    RETURN v_asiento_id;
END;
$$;

COMMENT ON FUNCTION crear_asiento_venta_pos IS
'Genera asiento contable automático desde venta POS completada.
DEBE: Caja/Bancos (total)
HABER: Ventas (subtotal), IVA Trasladado (impuestos)
Retorna ID del asiento creado o NULL si no se genera.';


-- ====================================================================
-- FUNCIÓN 6: crear_asiento_compra
-- ====================================================================
-- Genera asiento contable desde orden de compra recibida.
--
-- ASIENTO GENERADO:
-- DEBE:
--   - Inventario = subtotal
--   - IVA Acreditable = impuestos
-- HABER:
--   - Proveedores = total
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_asiento_compra(p_orden_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_orden RECORD;
    v_config RECORD;
    v_asiento_id INTEGER;
    v_numero_asiento INTEGER;
    v_fecha DATE;
BEGIN
    -- Obtener datos de la orden
    SELECT
        oc.*,
        p.nombre as proveedor_nombre
    INTO v_orden
    FROM ordenes_compra oc
    LEFT JOIN proveedores p ON p.id = oc.proveedor_id
    WHERE oc.id = p_orden_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden de compra no encontrada: %', p_orden_id;
    END IF;

    -- Verificar que la orden esté recibida
    IF v_orden.estado != 'recibida' THEN
        RETURN NULL;
    END IF;

    -- Obtener configuración contable
    SELECT * INTO v_config
    FROM config_contabilidad
    WHERE organizacion_id = v_orden.organizacion_id;

    IF NOT FOUND OR NOT v_config.generar_asientos_automaticos THEN
        RETURN NULL;
    END IF;

    -- Verificar cuentas necesarias
    IF v_config.cuenta_inventario_id IS NULL OR v_config.cuenta_proveedores_id IS NULL THEN
        RAISE WARNING 'Configuración contable incompleta para compras en org %', v_orden.organizacion_id;
        RETURN NULL;
    END IF;

    v_fecha := COALESCE(v_orden.fecha_recepcion, NOW())::DATE;

    -- Crear periodo si no existe
    PERFORM crear_periodo_contable_si_no_existe(v_orden.organizacion_id, v_fecha);

    -- Obtener siguiente número
    v_numero_asiento := obtener_siguiente_numero_asiento(v_orden.organizacion_id);

    -- Crear asiento como BORRADOR (se publicará después de insertar movimientos)
    INSERT INTO asientos_contables (
        organizacion_id,
        sucursal_id,
        numero_asiento,
        fecha,
        tipo,
        concepto,
        referencia,
        documento_tipo,
        documento_id,
        total_debe,
        total_haber,
        estado
    ) VALUES (
        v_orden.organizacion_id,
        v_orden.sucursal_id,  -- Heredar sucursal de la orden de compra
        v_numero_asiento,
        v_fecha,
        'compra',
        'Compra ' || v_orden.numero_orden || ' - ' || COALESCE(v_orden.proveedor_nombre, 'Sin proveedor'),
        v_orden.numero_orden,
        'orden_compra',
        p_orden_id,
        0,
        0,
        'borrador'
    )
    RETURNING id INTO v_asiento_id;

    -- DEBE: Inventario
    INSERT INTO movimientos_contables (
        organizacion_id,
        asiento_id,
        asiento_fecha,
        cuenta_id,
        debe,
        concepto,
        tercero_tipo,
        tercero_id
    ) VALUES (
        v_orden.organizacion_id,
        v_asiento_id,
        v_fecha,
        v_config.cuenta_inventario_id,
        v_orden.subtotal,
        'Entrada inventario ' || v_orden.numero_orden,
        'proveedor',
        v_orden.proveedor_id
    );

    -- DEBE: IVA Acreditable (si aplica)
    IF COALESCE(v_orden.impuestos, 0) > 0 AND v_config.cuenta_iva_acreditable_id IS NOT NULL THEN
        INSERT INTO movimientos_contables (
            organizacion_id,
            asiento_id,
            asiento_fecha,
            cuenta_id,
            debe,
            concepto
        ) VALUES (
            v_orden.organizacion_id,
            v_asiento_id,
            v_fecha,
            v_config.cuenta_iva_acreditable_id,
            v_orden.impuestos,
            'IVA acreditable ' || v_orden.numero_orden
        );
    END IF;

    -- HABER: Proveedores
    INSERT INTO movimientos_contables (
        organizacion_id,
        asiento_id,
        asiento_fecha,
        cuenta_id,
        haber,
        concepto,
        tercero_tipo,
        tercero_id
    ) VALUES (
        v_orden.organizacion_id,
        v_asiento_id,
        v_fecha,
        v_config.cuenta_proveedores_id,
        v_orden.total,
        'Por pagar ' || v_orden.numero_orden,
        'proveedor',
        v_orden.proveedor_id
    );

    -- Publicar el asiento (ahora los totales ya están correctos por el trigger)
    UPDATE asientos_contables
    SET estado = 'publicado',
        publicado_en = NOW()
    WHERE id = v_asiento_id AND fecha = v_fecha;

    RETURN v_asiento_id;
END;
$$;

COMMENT ON FUNCTION crear_asiento_compra IS
'Genera asiento contable desde orden de compra recibida.
DEBE: Inventario (subtotal), IVA Acreditable (impuestos)
HABER: Proveedores (total)
Retorna ID del asiento creado o NULL.';


-- ====================================================================
-- FUNCIÓN 7: obtener_balanza_comprobacion
-- ====================================================================
-- Genera balanza de comprobación para un rango de fechas.
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_balanza_comprobacion(
    p_organizacion_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    cuenta_id INTEGER,
    codigo VARCHAR(30),
    codigo_agrupador VARCHAR(20),
    nombre VARCHAR(200),
    tipo VARCHAR(20),
    naturaleza VARCHAR(10),
    nivel INTEGER,
    saldo_inicial DECIMAL(15, 2),
    debe DECIMAL(15, 2),
    haber DECIMAL(15, 2),
    saldo_final DECIMAL(15, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH movimientos_periodo AS (
        -- Movimientos dentro del periodo
        SELECT
            mc.cuenta_id,
            COALESCE(SUM(mc.debe), 0) as total_debe,
            COALESCE(SUM(mc.haber), 0) as total_haber
        FROM movimientos_contables mc
        JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
        WHERE mc.organizacion_id = p_organizacion_id
        AND ac.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
        AND ac.estado = 'publicado'
        GROUP BY mc.cuenta_id
    ),
    saldos_anteriores AS (
        -- Saldos antes del periodo
        SELECT
            mc.cuenta_id,
            SUM(mc.debe) - SUM(mc.haber) as saldo_anterior
        FROM movimientos_contables mc
        JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
        WHERE mc.organizacion_id = p_organizacion_id
        AND ac.fecha < p_fecha_inicio
        AND ac.estado = 'publicado'
        GROUP BY mc.cuenta_id
    )
    SELECT
        cc.id as cuenta_id,
        cc.codigo,
        cc.codigo_agrupador,
        cc.nombre,
        cc.tipo,
        cc.naturaleza,
        cc.nivel,
        COALESCE(sa.saldo_anterior, 0)::DECIMAL(15,2) as saldo_inicial,
        COALESCE(mp.total_debe, 0)::DECIMAL(15,2) as debe,
        COALESCE(mp.total_haber, 0)::DECIMAL(15,2) as haber,
        (COALESCE(sa.saldo_anterior, 0) + COALESCE(mp.total_debe, 0) - COALESCE(mp.total_haber, 0))::DECIMAL(15,2) as saldo_final
    FROM cuentas_contables cc
    LEFT JOIN movimientos_periodo mp ON mp.cuenta_id = cc.id
    LEFT JOIN saldos_anteriores sa ON sa.cuenta_id = cc.id
    WHERE cc.organizacion_id = p_organizacion_id
    AND cc.activo = true
    AND (mp.total_debe > 0 OR mp.total_haber > 0 OR COALESCE(sa.saldo_anterior, 0) != 0)
    ORDER BY cc.codigo;
END;
$$;

COMMENT ON FUNCTION obtener_balanza_comprobacion IS
'Genera balanza de comprobación para un rango de fechas.
Incluye saldo inicial, movimientos del periodo y saldo final.
Solo incluye cuentas con movimientos o saldo.';


-- ====================================================================
-- FUNCIÓN 8: obtener_libro_mayor
-- ====================================================================
-- Obtiene movimientos de una cuenta específica (libro mayor).
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_libro_mayor(
    p_organizacion_id INTEGER,
    p_cuenta_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    fecha DATE,
    numero_asiento INTEGER,
    tipo VARCHAR(30),
    concepto TEXT,
    referencia VARCHAR(100),
    debe DECIMAL(15, 2),
    haber DECIMAL(15, 2),
    saldo DECIMAL(15, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo_anterior DECIMAL(15, 2);
BEGIN
    -- Calcular saldo anterior
    SELECT COALESCE(SUM(mc.debe), 0) - COALESCE(SUM(mc.haber), 0)
    INTO v_saldo_anterior
    FROM movimientos_contables mc
    JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
    WHERE mc.organizacion_id = p_organizacion_id
    AND mc.cuenta_id = p_cuenta_id
    AND ac.fecha < p_fecha_inicio
    AND ac.estado = 'publicado';

    v_saldo_anterior := COALESCE(v_saldo_anterior, 0);

    RETURN QUERY
    SELECT
        ac.fecha,
        ac.numero_asiento,
        ac.tipo,
        ac.concepto,
        mc.referencia,
        mc.debe,
        mc.haber,
        (v_saldo_anterior + SUM(mc.debe - mc.haber) OVER (ORDER BY ac.fecha, ac.numero_asiento))::DECIMAL(15,2) as saldo
    FROM movimientos_contables mc
    JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
    WHERE mc.organizacion_id = p_organizacion_id
    AND mc.cuenta_id = p_cuenta_id
    AND ac.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    AND ac.estado = 'publicado'
    ORDER BY ac.fecha, ac.numero_asiento;
END;
$$;

COMMENT ON FUNCTION obtener_libro_mayor IS
'Obtiene movimientos de una cuenta específica (libro mayor).
Incluye saldo acumulado por movimiento.';


-- ====================================================================
-- FUNCIÓN 9: obtener_estado_resultados
-- ====================================================================
-- Genera estado de resultados (Pérdidas y Ganancias) para un periodo.
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_estado_resultados(
    p_organizacion_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    seccion VARCHAR(50),
    orden INTEGER,
    cuenta_id INTEGER,
    codigo VARCHAR(30),
    nombre VARCHAR(200),
    monto DECIMAL(15, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE cc.tipo
            WHEN 'ingreso' THEN '1_ingresos'
            WHEN 'costo' THEN '2_costos'
            WHEN 'gasto' THEN '3_gastos'
        END as seccion,
        CASE cc.tipo
            WHEN 'ingreso' THEN 1
            WHEN 'costo' THEN 2
            WHEN 'gasto' THEN 3
        END as orden,
        cc.id as cuenta_id,
        cc.codigo,
        cc.nombre,
        CASE cc.tipo
            WHEN 'ingreso' THEN (COALESCE(SUM(mc.haber), 0) - COALESCE(SUM(mc.debe), 0))::DECIMAL(15,2)
            ELSE (COALESCE(SUM(mc.debe), 0) - COALESCE(SUM(mc.haber), 0))::DECIMAL(15,2)
        END as monto
    FROM cuentas_contables cc
    LEFT JOIN movimientos_contables mc ON mc.cuenta_id = cc.id
    LEFT JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
        AND ac.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
        AND ac.estado = 'publicado'
    WHERE cc.organizacion_id = p_organizacion_id
    AND cc.tipo IN ('ingreso', 'costo', 'gasto')
    AND cc.activo = true
    AND cc.afectable = true
    GROUP BY cc.id, cc.codigo, cc.nombre, cc.tipo
    HAVING COALESCE(SUM(mc.debe), 0) > 0 OR COALESCE(SUM(mc.haber), 0) > 0
    ORDER BY orden, cc.codigo;
END;
$$;

COMMENT ON FUNCTION obtener_estado_resultados IS
'Genera estado de resultados (PyG) para un rango de fechas.
Agrupa por: Ingresos, Costos, Gastos.
Solo incluye cuentas con movimientos en el periodo.';


-- ====================================================================
-- FUNCIÓN 10: obtener_balance_general
-- ====================================================================
-- Genera balance general a una fecha específica.
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_balance_general(
    p_organizacion_id INTEGER,
    p_fecha DATE
)
RETURNS TABLE (
    seccion VARCHAR(50),
    orden INTEGER,
    cuenta_id INTEGER,
    codigo VARCHAR(30),
    nombre VARCHAR(200),
    saldo DECIMAL(15, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE cc.tipo
            WHEN 'activo' THEN '1_activo'
            WHEN 'pasivo' THEN '2_pasivo'
            WHEN 'capital' THEN '3_capital'
        END as seccion,
        CASE cc.tipo
            WHEN 'activo' THEN 1
            WHEN 'pasivo' THEN 2
            WHEN 'capital' THEN 3
        END as orden,
        cc.id as cuenta_id,
        cc.codigo,
        cc.nombre,
        CASE cc.naturaleza
            WHEN 'deudora' THEN (COALESCE(SUM(mc.debe), 0) - COALESCE(SUM(mc.haber), 0))::DECIMAL(15,2)
            ELSE (COALESCE(SUM(mc.haber), 0) - COALESCE(SUM(mc.debe), 0))::DECIMAL(15,2)
        END as saldo
    FROM cuentas_contables cc
    LEFT JOIN movimientos_contables mc ON mc.cuenta_id = cc.id
    LEFT JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
        AND ac.fecha <= p_fecha
        AND ac.estado = 'publicado'
    WHERE cc.organizacion_id = p_organizacion_id
    AND cc.tipo IN ('activo', 'pasivo', 'capital')
    AND cc.activo = true
    AND cc.afectable = true
    GROUP BY cc.id, cc.codigo, cc.nombre, cc.tipo, cc.naturaleza
    HAVING COALESCE(SUM(mc.debe), 0) > 0 OR COALESCE(SUM(mc.haber), 0) > 0
    ORDER BY orden, cc.codigo;
END;
$$;

COMMENT ON FUNCTION obtener_balance_general IS
'Genera balance general a una fecha específica.
Agrupa por: Activo, Pasivo, Capital.
Solo incluye cuentas con saldo.';


-- ====================================================================
-- FUNCIÓN 11: calcular_utilidad_periodo
-- ====================================================================
-- Calcula la utilidad o pérdida de un periodo.
-- ====================================================================

CREATE OR REPLACE FUNCTION calcular_utilidad_periodo(
    p_organizacion_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS DECIMAL(15, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ingresos DECIMAL(15, 2);
    v_costos DECIMAL(15, 2);
    v_gastos DECIMAL(15, 2);
BEGIN
    -- Calcular ingresos
    SELECT COALESCE(SUM(mc.haber), 0) - COALESCE(SUM(mc.debe), 0)
    INTO v_ingresos
    FROM movimientos_contables mc
    JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
    JOIN cuentas_contables cc ON cc.id = mc.cuenta_id
    WHERE mc.organizacion_id = p_organizacion_id
    AND ac.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    AND ac.estado = 'publicado'
    AND cc.tipo = 'ingreso';

    -- Calcular costos
    SELECT COALESCE(SUM(mc.debe), 0) - COALESCE(SUM(mc.haber), 0)
    INTO v_costos
    FROM movimientos_contables mc
    JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
    JOIN cuentas_contables cc ON cc.id = mc.cuenta_id
    WHERE mc.organizacion_id = p_organizacion_id
    AND ac.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    AND ac.estado = 'publicado'
    AND cc.tipo = 'costo';

    -- Calcular gastos
    SELECT COALESCE(SUM(mc.debe), 0) - COALESCE(SUM(mc.haber), 0)
    INTO v_gastos
    FROM movimientos_contables mc
    JOIN asientos_contables ac ON ac.id = mc.asiento_id AND ac.fecha = mc.asiento_fecha
    JOIN cuentas_contables cc ON cc.id = mc.cuenta_id
    WHERE mc.organizacion_id = p_organizacion_id
    AND ac.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    AND ac.estado = 'publicado'
    AND cc.tipo = 'gasto';

    -- Utilidad = Ingresos - Costos - Gastos
    RETURN COALESCE(v_ingresos, 0) - COALESCE(v_costos, 0) - COALESCE(v_gastos, 0);
END;
$$;

COMMENT ON FUNCTION calcular_utilidad_periodo IS
'Calcula la utilidad o pérdida de un periodo.
Utilidad = Ingresos - Costos - Gastos.
Valor positivo = utilidad, negativo = pérdida.';


-- ====================================================================
-- FUNCIÓN 12: verificar_periodo_abierto
-- ====================================================================
-- Verifica si un periodo está abierto para una fecha dada.
-- ====================================================================

CREATE OR REPLACE FUNCTION verificar_periodo_abierto(
    p_organizacion_id INTEGER,
    p_fecha DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado VARCHAR(20);
BEGIN
    SELECT estado INTO v_estado
    FROM periodos_contables
    WHERE organizacion_id = p_organizacion_id
    AND p_fecha BETWEEN fecha_inicio AND fecha_fin;

    -- Si no existe periodo o está abierto/reabierto, permitir
    RETURN NOT FOUND OR v_estado IN ('abierto', 'reabierto');
END;
$$;

COMMENT ON FUNCTION verificar_periodo_abierto IS
'Verifica si un periodo está abierto para una fecha dada.
Retorna true si está abierto o no existe, false si está cerrado.';


-- ====================================================================
-- ✅ TOTAL: 12 funciones PL/pgSQL
-- ====================================================================
