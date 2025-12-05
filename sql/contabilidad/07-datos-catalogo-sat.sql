-- ====================================================================
-- 📋 MÓDULO CONTABILIDAD - CATÁLOGO DE CUENTAS SAT MÉXICO
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: contabilidad
--
-- DESCRIPCIÓN:
-- Función para crear el catálogo de cuentas básico alineado al
-- Código Agrupador del SAT (Anexo 24) para organizaciones mexicanas.
--
-- CUENTAS INCLUIDAS:
-- • Activo (100): Caja, Bancos, Clientes, IVA Acreditable, Inventarios
-- • Pasivo (200): Proveedores, IVA Trasladado
-- • Capital (300): Capital Social, Resultado del Ejercicio
-- • Ingresos (400): Ventas
-- • Costos (500): Costo de Ventas
-- • Gastos (600): Comisiones, Descuentos, Gastos Generales
--
-- USO:
-- SELECT crear_catalogo_cuentas_sat(organizacion_id, usuario_id);
--
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: crear_catalogo_cuentas_sat
-- ====================================================================
-- Crea el catálogo de cuentas básico para una organización.
-- Incluye todas las cuentas necesarias para POS e Inventario.
-- Configura automáticamente las cuentas del sistema en config_contabilidad.
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_catalogo_cuentas_sat(
    p_organizacion_id INTEGER,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Variables para IDs de cuentas de nivel 1 (grupos principales)
    v_activo_id INTEGER;
    v_pasivo_id INTEGER;
    v_capital_id INTEGER;
    v_ingresos_id INTEGER;
    v_costos_id INTEGER;
    v_gastos_id INTEGER;

    -- Variables para IDs de cuentas de nivel 2 (subgrupos)
    v_activo_circulante_id INTEGER;
    v_pasivo_corto_id INTEGER;
    v_capital_contable_id INTEGER;
    v_gastos_operacion_id INTEGER;

    -- Variables para IDs de cuentas del sistema (nivel 3)
    v_caja_id INTEGER;
    v_bancos_id INTEGER;
    v_clientes_id INTEGER;
    v_iva_acreditable_id INTEGER;
    v_inventario_id INTEGER;
    v_proveedores_id INTEGER;
    v_iva_trasladado_id INTEGER;
    v_capital_social_id INTEGER;
    v_resultado_ejercicio_id INTEGER;
    v_ventas_id INTEGER;
    v_costo_ventas_id INTEGER;
    v_comisiones_gasto_id INTEGER;
    v_descuentos_id INTEGER;
    v_gastos_generales_id INTEGER;
BEGIN
    -- Verificar que no existan cuentas para esta organización
    IF EXISTS (SELECT 1 FROM cuentas_contables WHERE organizacion_id = p_organizacion_id) THEN
        RAISE EXCEPTION 'Ya existen cuentas contables para la organización %', p_organizacion_id;
    END IF;

    -- =====================================================
    -- NIVEL 1: GRUPOS PRINCIPALES
    -- =====================================================

    -- 1. ACTIVO (100)
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '1', '100', 'Activo', 'activo', 'deudora',
        1, false, p_usuario_id
    ) RETURNING id INTO v_activo_id;

    -- 2. PASIVO (200)
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '2', '200', 'Pasivo', 'pasivo', 'acreedora',
        1, false, p_usuario_id
    ) RETURNING id INTO v_pasivo_id;

    -- 3. CAPITAL (300)
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '3', '300', 'Capital contable', 'capital', 'acreedora',
        1, false, p_usuario_id
    ) RETURNING id INTO v_capital_id;

    -- 4. INGRESOS (400)
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '4', '400', 'Ingresos', 'ingreso', 'acreedora',
        1, false, p_usuario_id
    ) RETURNING id INTO v_ingresos_id;

    -- 5. COSTOS (500)
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '5', '500', 'Costos', 'costo', 'deudora',
        1, false, p_usuario_id
    ) RETURNING id INTO v_costos_id;

    -- 6. GASTOS (600)
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '6', '600', 'Gastos', 'gasto', 'deudora',
        1, false, p_usuario_id
    ) RETURNING id INTO v_gastos_id;

    -- =====================================================
    -- NIVEL 2: SUBGRUPOS
    -- =====================================================

    -- 101 - Activo Circulante
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '1.1', '101', 'Activo circulante', 'activo', 'deudora',
        2, v_activo_id, false, p_usuario_id
    ) RETURNING id INTO v_activo_circulante_id;

    -- 201 - Pasivo a corto plazo
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '2.1', '201', 'Pasivo a corto plazo', 'pasivo', 'acreedora',
        2, v_pasivo_id, false, p_usuario_id
    ) RETURNING id INTO v_pasivo_corto_id;

    -- 301 - Capital contable
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '3.1', '301', 'Capital contribuido', 'capital', 'acreedora',
        2, v_capital_id, false, p_usuario_id
    ) RETURNING id INTO v_capital_contable_id;

    -- 601 - Gastos de operación
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '6.1', '601', 'Gastos de operación', 'gasto', 'deudora',
        2, v_gastos_id, false, p_usuario_id
    ) RETURNING id INTO v_gastos_operacion_id;

    -- =====================================================
    -- NIVEL 3: CUENTAS DEL SISTEMA (AFECTABLES)
    -- =====================================================

    -- 101.01 - Caja
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '1.1.01', '101.01', 'Caja', 'activo', 'deudora',
        3, v_activo_circulante_id, true, true, 'caja', p_usuario_id
    ) RETURNING id INTO v_caja_id;

    -- 102.01 - Bancos nacionales
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '1.1.02', '102.01', 'Bancos nacionales', 'activo', 'deudora',
        3, v_activo_circulante_id, true, true, 'bancos', p_usuario_id
    ) RETURNING id INTO v_bancos_id;

    -- 105.01 - Clientes nacionales
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '1.1.03', '105.01', 'Clientes nacionales', 'activo', 'deudora',
        3, v_activo_circulante_id, true, true, 'clientes', p_usuario_id
    ) RETURNING id INTO v_clientes_id;

    -- 118.01 - IVA acreditable pagado
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '1.1.04', '118.01', 'IVA acreditable pagado', 'activo', 'deudora',
        3, v_activo_circulante_id, true, true, 'iva_acreditable', p_usuario_id
    ) RETURNING id INTO v_iva_acreditable_id;

    -- 115.01 - Inventarios
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '1.1.05', '115.01', 'Inventarios', 'activo', 'deudora',
        3, v_activo_circulante_id, true, true, 'inventario', p_usuario_id
    ) RETURNING id INTO v_inventario_id;

    -- 201.01 - Proveedores nacionales
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '2.1.01', '201.01', 'Proveedores nacionales', 'pasivo', 'acreedora',
        3, v_pasivo_corto_id, true, true, 'proveedores', p_usuario_id
    ) RETURNING id INTO v_proveedores_id;

    -- 216.01 - IVA trasladado cobrado
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '2.1.02', '216.01', 'IVA trasladado cobrado', 'pasivo', 'acreedora',
        3, v_pasivo_corto_id, true, true, 'iva_trasladado', p_usuario_id
    ) RETURNING id INTO v_iva_trasladado_id;

    -- 301.01 - Capital social
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '3.1.01', '301.01', 'Capital social', 'capital', 'acreedora',
        3, v_capital_contable_id, true, p_usuario_id
    ) RETURNING id INTO v_capital_social_id;

    -- 304.01 - Resultado del ejercicio
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '3.1.02', '304.01', 'Resultado del ejercicio', 'capital', 'acreedora',
        3, v_capital_contable_id, true, p_usuario_id
    ) RETURNING id INTO v_resultado_ejercicio_id;

    -- 401.01 - Ventas y/o servicios gravados a la tasa general
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '4.1', '401.01', 'Ingresos por ventas y/o servicios', 'ingreso', 'acreedora',
        2, v_ingresos_id, true, true, 'ventas', p_usuario_id
    ) RETURNING id INTO v_ventas_id;

    -- 501.01 - Costo de ventas
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '5.1', '501.01', 'Costo de ventas y/o servicios', 'costo', 'deudora',
        2, v_costos_id, true, true, 'costo_ventas', p_usuario_id
    ) RETURNING id INTO v_costo_ventas_id;

    -- 601.01 - Comisiones
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '6.1.01', '601.84', 'Comisiones', 'gasto', 'deudora',
        3, v_gastos_operacion_id, true, true, 'comisiones_gasto', p_usuario_id
    ) RETURNING id INTO v_comisiones_gasto_id;

    -- 601.10 - Descuentos sobre ventas
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, es_cuenta_sistema, tipo_cuenta_sistema, creado_por
    ) VALUES (
        p_organizacion_id, '6.1.02', '601.01', 'Descuentos sobre ventas', 'gasto', 'deudora',
        3, v_gastos_operacion_id, true, true, 'descuentos', p_usuario_id
    ) RETURNING id INTO v_descuentos_id;

    -- 601.99 - Gastos generales
    INSERT INTO cuentas_contables (
        organizacion_id, codigo, codigo_agrupador, nombre, tipo, naturaleza,
        nivel, cuenta_padre_id, afectable, creado_por
    ) VALUES (
        p_organizacion_id, '6.1.99', '602.01', 'Gastos generales', 'gasto', 'deudora',
        3, v_gastos_operacion_id, true, p_usuario_id
    ) RETURNING id INTO v_gastos_generales_id;

    -- =====================================================
    -- CREAR CONFIGURACIÓN CONTABLE
    -- =====================================================

    INSERT INTO config_contabilidad (
        organizacion_id,
        pais,
        moneda,
        plan_cuentas,
        usa_codigo_agrupador_sat,
        tasa_iva,
        metodo_costeo,
        cuenta_ventas_id,
        cuenta_costo_ventas_id,
        cuenta_inventario_id,
        cuenta_clientes_id,
        cuenta_proveedores_id,
        cuenta_iva_trasladado_id,
        cuenta_iva_acreditable_id,
        cuenta_bancos_id,
        cuenta_caja_id,
        cuenta_comisiones_gasto_id,
        cuenta_descuentos_id,
        generar_asientos_automaticos,
        configurado_por
    ) VALUES (
        p_organizacion_id,
        'MX',
        'MXN',
        'sat_mexico',
        true,
        16.00,
        'promedio',
        v_ventas_id,
        v_costo_ventas_id,
        v_inventario_id,
        v_clientes_id,
        v_proveedores_id,
        v_iva_trasladado_id,
        v_iva_acreditable_id,
        v_bancos_id,
        v_caja_id,
        v_comisiones_gasto_id,
        v_descuentos_id,
        true,
        p_usuario_id
    )
    ON CONFLICT (organizacion_id) DO UPDATE SET
        cuenta_ventas_id = v_ventas_id,
        cuenta_costo_ventas_id = v_costo_ventas_id,
        cuenta_inventario_id = v_inventario_id,
        cuenta_clientes_id = v_clientes_id,
        cuenta_proveedores_id = v_proveedores_id,
        cuenta_iva_trasladado_id = v_iva_trasladado_id,
        cuenta_iva_acreditable_id = v_iva_acreditable_id,
        cuenta_bancos_id = v_bancos_id,
        cuenta_caja_id = v_caja_id,
        cuenta_comisiones_gasto_id = v_comisiones_gasto_id,
        cuenta_descuentos_id = v_descuentos_id,
        actualizado_en = NOW();

    -- =====================================================
    -- CREAR PERIODO CONTABLE ACTUAL
    -- =====================================================

    PERFORM crear_periodo_contable_si_no_existe(p_organizacion_id, CURRENT_DATE);

    RAISE NOTICE 'Catálogo de cuentas SAT creado exitosamente para organización %', p_organizacion_id;
END;
$$;

COMMENT ON FUNCTION crear_catalogo_cuentas_sat IS
'Crea el catálogo de cuentas básico alineado al Código Agrupador del SAT (México).
Incluye cuentas necesarias para POS e Inventario.
Configura automáticamente config_contabilidad con las cuentas del sistema.
Uso: SELECT crear_catalogo_cuentas_sat(1, 1);';


-- ====================================================================
-- FUNCIÓN: verificar_catalogo_contable
-- ====================================================================
-- Verifica si una organización tiene catálogo de cuentas configurado.
-- ====================================================================

CREATE OR REPLACE FUNCTION verificar_catalogo_contable(p_organizacion_id INTEGER)
RETURNS TABLE (
    tiene_catalogo BOOLEAN,
    total_cuentas INTEGER,
    tiene_config BOOLEAN,
    cuentas_sistema_configuradas BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total INTEGER;
    v_tiene_config BOOLEAN;
    v_cuentas_sistema INTEGER;
BEGIN
    -- Contar cuentas
    SELECT COUNT(*) INTO v_total
    FROM cuentas_contables
    WHERE organizacion_id = p_organizacion_id;

    -- Verificar config
    SELECT EXISTS(
        SELECT 1 FROM config_contabilidad
        WHERE organizacion_id = p_organizacion_id
    ) INTO v_tiene_config;

    -- Verificar cuentas del sistema configuradas
    SELECT COUNT(*) INTO v_cuentas_sistema
    FROM config_contabilidad
    WHERE organizacion_id = p_organizacion_id
    AND cuenta_caja_id IS NOT NULL
    AND cuenta_ventas_id IS NOT NULL
    AND cuenta_proveedores_id IS NOT NULL;

    RETURN QUERY SELECT
        v_total > 0,
        v_total,
        v_tiene_config,
        v_cuentas_sistema > 0;
END;
$$;

COMMENT ON FUNCTION verificar_catalogo_contable IS
'Verifica si una organización tiene catálogo de cuentas configurado.
Retorna: tiene_catalogo, total_cuentas, tiene_config, cuentas_sistema_configuradas';


-- ====================================================================
-- ✅ CATÁLOGO SAT MÉXICO CONFIGURADO
-- ====================================================================
-- Total cuentas creadas por organización: 20
-- Cuentas del sistema (para asientos automáticos): 11
-- ====================================================================
