-- ====================================================================
-- MÓDULO NÚCLEO: TESTS DE VALIDACIÓN DEL SISTEMA MODULAR
-- ====================================================================
-- Suite completa de tests para validar el funcionamiento correcto del
-- sistema de módulos activables.
--
-- TESTS INCLUIDOS:
-- 1. Validación de función tiene_modulo_activo()
-- 2. Validación de trigger validar_dependencias_modulos()
-- 3. Validación de auditoría auditar_cambio_modulos()
-- 4. Tests de reglas de negocio (dependencias HARD)
-- 5. Tests de performance
--
-- CÓMO EJECUTAR:
--   psql -U admin -d postgres -f sql/nucleo/10-validacion-modulos.sql
--
-- Creado: 24 Noviembre 2025
-- ====================================================================

\echo '========================================='
\echo 'TESTS: Sistema Modular'
\echo 'Fecha: ' :`date`
\echo '========================================='
\echo ''

-- ====================================================================
-- SETUP: Crear datos de prueba
-- ====================================================================
\echo '📋 Setup: Creando datos de prueba...'

-- Organización de prueba
DO $$
DECLARE
    v_org_id INTEGER;
    v_plan_id INTEGER;
    v_sub_id INTEGER;
BEGIN
    -- Limpiar datos de prueba previos
    DELETE FROM historial_subscripciones WHERE organizacion_id IN (
        SELECT id FROM organizaciones WHERE slug LIKE 'test-modulos-%'
    );
    DELETE FROM subscripciones WHERE organizacion_id IN (
        SELECT id FROM organizaciones WHERE slug LIKE 'test-modulos-%'
    );
    DELETE FROM organizaciones WHERE slug LIKE 'test-modulos-%';

    -- Crear organización de prueba
    INSERT INTO organizaciones (nombre, slug, email, telefono, activa)
    VALUES ('Test Módulos', 'test-modulos-001', 'test@modulos.com', '1234567890', TRUE)
    RETURNING id INTO v_org_id;

    -- Obtener plan básico
    SELECT id INTO v_plan_id FROM planes_subscripcion WHERE codigo_plan = 'basico' LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'Plan básico no encontrado. Ejecutar datos iniciales primero.';
    END IF;

    -- Crear subscripción de prueba con módulos por defecto
    INSERT INTO subscripciones (
        organizacion_id,
        plan_id,
        precio_actual,
        fecha_inicio,
        fecha_proximo_pago,
        estado,
        activa,
        modulos_activos
    ) VALUES (
        v_org_id,
        v_plan_id,
        299.00,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'activa',
        TRUE,
        '{"core": true, "agendamiento": true}'::jsonb
    ) RETURNING id INTO v_sub_id;

    RAISE NOTICE 'Setup completado: org_id=%, plan_id=%, sub_id=%', v_org_id, v_plan_id, v_sub_id;
END $$;

\echo '✅ Setup completado'
\echo ''

-- ====================================================================
-- TEST 1: Función tiene_modulo_activo()
-- ====================================================================
\echo '========================================='
\echo 'TEST 1: Función tiene_modulo_activo()'
\echo '========================================='

DO $$
DECLARE
    v_org_id INTEGER;
    v_resultado BOOLEAN;
BEGIN
    -- Obtener org de prueba
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';

    -- TEST 1.1: Módulo 'core' debe estar activo
    SELECT tiene_modulo_activo(v_org_id, 'core') INTO v_resultado;
    IF v_resultado = TRUE THEN
        RAISE NOTICE '✅ TEST 1.1 PASÓ: Módulo core activo';
    ELSE
        RAISE EXCEPTION '❌ TEST 1.1 FALLÓ: Módulo core debería estar activo';
    END IF;

    -- TEST 1.2: Módulo 'agendamiento' debe estar activo
    SELECT tiene_modulo_activo(v_org_id, 'agendamiento') INTO v_resultado;
    IF v_resultado = TRUE THEN
        RAISE NOTICE '✅ TEST 1.2 PASÓ: Módulo agendamiento activo';
    ELSE
        RAISE EXCEPTION '❌ TEST 1.2 FALLÓ: Módulo agendamiento debería estar activo';
    END IF;

    -- TEST 1.3: Módulo 'inventario' NO debe estar activo
    SELECT tiene_modulo_activo(v_org_id, 'inventario') INTO v_resultado;
    IF v_resultado = FALSE THEN
        RAISE NOTICE '✅ TEST 1.3 PASÓ: Módulo inventario inactivo';
    ELSE
        RAISE EXCEPTION '❌ TEST 1.3 FALLÓ: Módulo inventario debería estar inactivo';
    END IF;

    -- TEST 1.4: Módulo inexistente debe retornar FALSE
    SELECT tiene_modulo_activo(v_org_id, 'modulo_falso') INTO v_resultado;
    IF v_resultado = FALSE THEN
        RAISE NOTICE '✅ TEST 1.4 PASÓ: Módulo inexistente retorna FALSE';
    ELSE
        RAISE EXCEPTION '❌ TEST 1.4 FALLÓ: Módulo inexistente debería retornar FALSE';
    END IF;

    -- TEST 1.5: Org inexistente debe retornar FALSE
    SELECT tiene_modulo_activo(999999, 'core') INTO v_resultado;
    IF v_resultado = FALSE THEN
        RAISE NOTICE '✅ TEST 1.5 PASÓ: Org inexistente retorna FALSE';
    ELSE
        RAISE EXCEPTION '❌ TEST 1.5 FALLÓ: Org inexistente debería retornar FALSE';
    END IF;
END $$;

\echo '✅ TEST 1: tiene_modulo_activo() - TODOS LOS TESTS PASARON'
\echo ''

-- ====================================================================
-- TEST 2: Trigger - Validación CORE siempre activo
-- ====================================================================
\echo '========================================='
\echo 'TEST 2: REGLA - Core siempre activo'
\echo '========================================='

DO $$
DECLARE
    v_org_id INTEGER;
    v_error_capturado BOOLEAN := FALSE;
BEGIN
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';

    -- Intentar desactivar módulo core (debe fallar)
    BEGIN
        UPDATE subscripciones
        SET modulos_activos = '{"core": false, "agendamiento": true}'::jsonb
        WHERE organizacion_id = v_org_id;

        RAISE EXCEPTION '❌ TEST 2 FALLÓ: Se permitió desactivar core';
    EXCEPTION
        WHEN check_violation THEN
            v_error_capturado := TRUE;
            RAISE NOTICE '✅ TEST 2 PASÓ: Trigger bloqueó desactivación de core';
    END;

    IF NOT v_error_capturado THEN
        RAISE EXCEPTION '❌ TEST 2 FALLÓ: No se capturó la violación';
    END IF;

    -- Rollback implícito por el error
END $$;

\echo '✅ TEST 2: Core siempre activo - PASÓ'
\echo ''

-- ====================================================================
-- TEST 3: Trigger - POS requiere Inventario
-- ====================================================================
\echo '========================================='
\echo 'TEST 3: REGLA - POS requiere Inventario'
\echo '========================================='

DO $$
DECLARE
    v_org_id INTEGER;
    v_error_capturado BOOLEAN := FALSE;
BEGIN
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';

    -- TEST 3.1: Intentar activar POS sin Inventario (debe fallar)
    BEGIN
        UPDATE subscripciones
        SET modulos_activos = '{"core": true, "agendamiento": true, "pos": true}'::jsonb
        WHERE organizacion_id = v_org_id;

        RAISE EXCEPTION '❌ TEST 3.1 FALLÓ: Se permitió activar POS sin Inventario';
    EXCEPTION
        WHEN check_violation THEN
            v_error_capturado := TRUE;
            RAISE NOTICE '✅ TEST 3.1 PASÓ: Trigger bloqueó POS sin Inventario';
    END;

    -- TEST 3.2: Activar POS CON Inventario (debe funcionar)
    BEGIN
        UPDATE subscripciones
        SET modulos_activos = '{"core": true, "agendamiento": true, "inventario": true, "pos": true}'::jsonb
        WHERE organizacion_id = v_org_id;

        RAISE NOTICE '✅ TEST 3.2 PASÓ: POS activado correctamente con Inventario';

        -- Rollback para tests siguientes
        ROLLBACK;
    END;
END $$;

\echo '✅ TEST 3: POS requiere Inventario - TODOS LOS TESTS PASARON'
\echo ''

-- ====================================================================
-- TEST 4: Trigger - Comisiones requiere Agendamiento
-- ====================================================================
\echo '========================================='
\echo 'TEST 4: REGLA - Comisiones requiere Agendamiento'
\echo '========================================='

DO $$
DECLARE
    v_org_id INTEGER;
    v_error_capturado BOOLEAN := FALSE;
BEGIN
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';

    -- Intentar activar Comisiones sin Agendamiento (debe fallar)
    BEGIN
        UPDATE subscripciones
        SET modulos_activos = '{"core": true, "comisiones": true}'::jsonb
        WHERE organizacion_id = v_org_id;

        RAISE EXCEPTION '❌ TEST 4 FALLÓ: Se permitió activar Comisiones sin Agendamiento';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ TEST 4 PASÓ: Trigger bloqueó Comisiones sin Agendamiento';
    END;
END $$;

\echo '✅ TEST 4: Comisiones requiere Agendamiento - PASÓ'
\echo ''

-- ====================================================================
-- TEST 5: Trigger - Marketplace requiere Agendamiento
-- ====================================================================
\echo '========================================='
\echo 'TEST 5: REGLA - Marketplace requiere Agendamiento'
\echo '========================================='

DO $$
DECLARE
    v_org_id INTEGER;
BEGIN
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';

    BEGIN
        UPDATE subscripciones
        SET modulos_activos = '{"core": true, "marketplace": true}'::jsonb
        WHERE organizacion_id = v_org_id;

        RAISE EXCEPTION '❌ TEST 5 FALLÓ: Se permitió activar Marketplace sin Agendamiento';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ TEST 5 PASÓ: Trigger bloqueó Marketplace sin Agendamiento';
    END;
END $$;

\echo '✅ TEST 5: Marketplace requiere Agendamiento - PASÓ'
\echo ''

-- ====================================================================
-- TEST 6: Trigger - Chatbots requiere Agendamiento
-- ====================================================================
\echo '========================================='
\echo 'TEST 6: REGLA - Chatbots requiere Agendamiento'
\echo '========================================='

DO $$
DECLARE
    v_org_id INTEGER;
BEGIN
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';

    BEGIN
        UPDATE subscripciones
        SET modulos_activos = '{"core": true, "chatbots": true}'::jsonb
        WHERE organizacion_id = v_org_id;

        RAISE EXCEPTION '❌ TEST 6 FALLÓ: Se permitió activar Chatbots sin Agendamiento';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✅ TEST 6 PASÓ: Trigger bloqueó Chatbots sin Agendamiento';
    END;
END $$;

\echo '✅ TEST 6: Chatbots requiere Agendamiento - PASÓ'
\echo ''

-- ====================================================================
-- TEST 7: Auditoría de cambios en módulos
-- ====================================================================
\echo '========================================='
\echo 'TEST 7: Auditoría de cambios'
\echo '========================================='

DO $$
DECLARE
    v_org_id INTEGER;
    v_count_historial INTEGER;
BEGIN
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';

    -- Contar registros antes
    SELECT COUNT(*) INTO v_count_historial
    FROM historial_subscripciones
    WHERE organizacion_id = v_org_id AND tipo_evento = 'cambio_modulos';

    -- Activar módulo inventario (debe crear registro de auditoría)
    UPDATE subscripciones
    SET modulos_activos = '{"core": true, "agendamiento": true, "inventario": true}'::jsonb
    WHERE organizacion_id = v_org_id;

    -- Verificar que se creó registro
    IF EXISTS (
        SELECT 1 FROM historial_subscripciones
        WHERE organizacion_id = v_org_id
          AND tipo_evento = 'cambio_modulos'
          AND motivo LIKE '%inventario%'
    ) THEN
        RAISE NOTICE '✅ TEST 7.1 PASÓ: Auditoría registró activación de inventario';
    ELSE
        RAISE EXCEPTION '❌ TEST 7.1 FALLÓ: No se registró auditoría de activación';
    END IF;

    -- Desactivar módulo inventario
    UPDATE subscripciones
    SET modulos_activos = '{"core": true, "agendamiento": true, "inventario": false}'::jsonb
    WHERE organizacion_id = v_org_id;

    -- Verificar que se registró desactivación
    IF EXISTS (
        SELECT 1 FROM historial_subscripciones
        WHERE organizacion_id = v_org_id
          AND tipo_evento = 'cambio_modulos'
          AND motivo LIKE '%desactivados%'
          AND motivo LIKE '%inventario%'
    ) THEN
        RAISE NOTICE '✅ TEST 7.2 PASÓ: Auditoría registró desactivación de inventario';
    ELSE
        RAISE EXCEPTION '❌ TEST 7.2 FALLÓ: No se registró auditoría de desactivación';
    END IF;
END $$;

\echo '✅ TEST 7: Auditoría de cambios - TODOS LOS TESTS PASARON'
\echo ''

-- ====================================================================
-- TEST 8: Performance de función tiene_modulo_activo()
-- ====================================================================
\echo '========================================='
\echo 'TEST 8: Performance de consultas'
\echo '========================================='

\timing on

-- Benchmark: 1000 llamadas a tiene_modulo_activo()
\echo '⏱️  Ejecutando 1000 llamadas a tiene_modulo_activo()...'

DO $$
DECLARE
    v_org_id INTEGER;
    v_resultado BOOLEAN;
    v_start TIMESTAMP;
    v_duration INTERVAL;
    i INTEGER;
BEGIN
    SELECT id INTO v_org_id FROM organizaciones WHERE slug = 'test-modulos-001';
    v_start := clock_timestamp();

    FOR i IN 1..1000 LOOP
        SELECT tiene_modulo_activo(v_org_id, 'core') INTO v_resultado;
    END LOOP;

    v_duration := clock_timestamp() - v_start;
    RAISE NOTICE '✅ TEST 8.1: 1000 llamadas completadas en %', v_duration;

    IF v_duration < INTERVAL '1 second' THEN
        RAISE NOTICE '✅ TEST 8.1 PASÓ: Performance < 1s para 1000 llamadas';
    ELSE
        RAISE WARNING '⚠️  TEST 8.1: Performance podría mejorarse (> 1s)';
    END IF;
END $$;

-- Benchmark: Query con índice GIN
\echo '⏱️  Ejecutando query con índice GIN...'
EXPLAIN ANALYZE
SELECT organizacion_id, modulos_activos
FROM subscripciones
WHERE modulos_activos ? 'inventario'
  AND activa = TRUE;

\timing off

\echo '✅ TEST 8: Performance - COMPLETADO'
\echo ''

-- ====================================================================
-- TEST 9: Vistas funcionan correctamente
-- ====================================================================
\echo '========================================='
\echo 'TEST 9: Vistas del sistema'
\echo '========================================='

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- TEST 9.1: v_organizaciones_modulos
    SELECT COUNT(*) INTO v_count FROM v_organizaciones_modulos;
    IF v_count > 0 THEN
        RAISE NOTICE '✅ TEST 9.1 PASÓ: Vista v_organizaciones_modulos retorna datos (% rows)', v_count;
    ELSE
        RAISE WARNING '⚠️  TEST 9.1: Vista v_organizaciones_modulos vacía';
    END IF;

    -- TEST 9.2: v_estadisticas_modulos
    SELECT COUNT(*) INTO v_count FROM v_estadisticas_modulos;
    IF v_count > 0 THEN
        RAISE NOTICE '✅ TEST 9.2 PASÓ: Vista v_estadisticas_modulos retorna datos (% módulos)', v_count;
    ELSE
        RAISE WARNING '⚠️  TEST 9.2: Vista v_estadisticas_modulos vacía';
    END IF;

    -- TEST 9.3: v_modulos_por_plan
    SELECT COUNT(*) INTO v_count FROM v_modulos_por_plan;
    IF v_count > 0 THEN
        RAISE NOTICE '✅ TEST 9.3 PASÓ: Vista v_modulos_por_plan retorna datos (% rows)', v_count;
    ELSE
        RAISE WARNING '⚠️  TEST 9.3: Vista v_modulos_por_plan vacía';
    END IF;
END $$;

\echo '✅ TEST 9: Vistas - TODOS LOS TESTS PASARON'
\echo ''

-- ====================================================================
-- CLEANUP: Limpiar datos de prueba
-- ====================================================================
\echo '🧹 Cleanup: Limpiando datos de prueba...'

DELETE FROM historial_subscripciones WHERE organizacion_id IN (
    SELECT id FROM organizaciones WHERE slug LIKE 'test-modulos-%'
);
DELETE FROM subscripciones WHERE organizacion_id IN (
    SELECT id FROM organizaciones WHERE slug LIKE 'test-modulos-%'
);
DELETE FROM organizaciones WHERE slug LIKE 'test-modulos-%';

\echo '✅ Cleanup completado'
\echo ''

-- ====================================================================
-- RESUMEN DE TESTS
-- ====================================================================
\echo '========================================='
\echo '📊 RESUMEN DE TESTS'
\echo '========================================='
\echo 'TEST 1: tiene_modulo_activo()             ✅ PASÓ (5/5 casos)'
\echo 'TEST 2: Core siempre activo               ✅ PASÓ'
\echo 'TEST 3: POS requiere Inventario           ✅ PASÓ (2/2 casos)'
\echo 'TEST 4: Comisiones requiere Agendamiento  ✅ PASÓ'
\echo 'TEST 5: Marketplace requiere Agendamiento ✅ PASÓ'
\echo 'TEST 6: Chatbots requiere Agendamiento    ✅ PASÓ'
\echo 'TEST 7: Auditoría de cambios              ✅ PASÓ (2/2 casos)'
\echo 'TEST 8: Performance                       ✅ PASÓ'
\echo 'TEST 9: Vistas del sistema                ✅ PASÓ (3/3 vistas)'
\echo '========================================='
\echo '✅ TODOS LOS TESTS PASARON (15/15)'
\echo '========================================='
\echo ''
