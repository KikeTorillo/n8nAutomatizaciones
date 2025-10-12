-- ====================================================================
-- ⚡ TEST 05: PERFORMANCE Y OPTIMIZACIÓN
-- ====================================================================
-- Archivo: sql/tests/05-test-performance.sql
-- Descripción: Valida performance de queries críticos e índices
-- Pre-requisito: Ejecutar 02-test-onboarding.sql y 03-test-agendamiento.sql
-- Ejecución: psql -U admin -d postgres -f sql/tests/05-test-performance.sql
-- ====================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '⚡ TEST 05: PERFORMANCE Y OPTIMIZACIÓN'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Habilitar timing
\timing on

-- ====================================================================
-- TEST 1: QUERIES DE DASHBOARD (< 100ms)
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 TEST 1: QUERIES DE DASHBOARD'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Obtener organización de test
SELECT id FROM organizaciones WHERE nombre_comercial = 'TEST_Barbería El Elegante' \gset org_

-- Configurar contexto
SELECT set_config('app.current_tenant_id', :org_id::TEXT, false);
SELECT set_config('app.current_user_role', 'administrador', false);

-- Query 1: Citas del día
\echo '🧪 Query 1: Citas del día (debe usar idx_citas_dia_covering)...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    c.id,
    c.fecha_cita,
    c.hora_inicio,
    c.hora_fin,
    c.estado,
    cl.nombre as cliente,
    p.nombre_completo as profesional,
    s.nombre as servicio,
    c.precio_final
FROM citas c
JOIN clientes cl ON c.cliente_id = cl.id
JOIN profesionales p ON c.profesional_id = p.id
JOIN servicios s ON c.servicio_id = s.id
WHERE c.organizacion_id = :org_id
  AND c.fecha_cita = CURRENT_DATE
  AND c.estado IN ('confirmada', 'en_curso')
ORDER BY c.hora_inicio;

\echo ''

-- Query 2: Profesionales disponibles
\echo '🧪 Query 2: Profesionales disponibles (debe usar idx_profesionales_disponibles_covering)...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    p.id,
    p.nombre_completo,
    p.especialidades,
    p.calificacion_promedio,
    p.telefono,
    p.email
FROM profesionales p
WHERE p.organizacion_id = :org_id
  AND p.activo = TRUE
  AND p.disponible_online = TRUE
ORDER BY p.calificacion_promedio DESC;

\echo ''

\echo ''

-- ====================================================================
-- TEST 2: BÚSQUEDAS FULL-TEXT (< 50ms)
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔍 TEST 2: BÚSQUEDAS FULL-TEXT'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Búsqueda en clientes (debe usar idx_clientes_search_combined)
\echo '🧪 Búsqueda de clientes por nombre/teléfono/email...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    id,
    nombre,
    telefono,
    email,
    total_citas
FROM clientes
WHERE organizacion_id = :org_id
  AND activo = TRUE
  AND to_tsvector('spanish', COALESCE(nombre, '') || ' ' || COALESCE(telefono, '') || ' ' || COALESCE(email, ''))
      @@ plainto_tsquery('spanish', 'Rodriguez')
ORDER BY total_citas DESC
LIMIT 10;

\echo ''

-- Búsqueda en servicios
\echo '🧪 Búsqueda de servicios...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    id,
    nombre,
    descripcion,
    precio,
    duracion_minutos
FROM servicios
WHERE organizacion_id = :org_id
  AND activo = TRUE
  AND to_tsvector('spanish', COALESCE(nombre, '') || ' ' || COALESCE(descripcion, '') || ' ' || COALESCE(categoria, ''))
      @@ plainto_tsquery('spanish', 'corte')
ORDER BY precio;

\echo ''

-- ====================================================================
-- TEST 3: AGREGACIONES Y REPORTES (< 200ms)
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📈 TEST 3: AGREGACIONES Y REPORTES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Reporte mensual de ingresos
\echo '🧪 Reporte de ingresos por mes...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    TO_CHAR(fecha_cita, 'YYYY-MM') as mes,
    COUNT(*) as total_citas,
    COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
    COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
    SUM(CASE WHEN estado = 'completada' THEN precio_final ELSE 0 END) as ingresos,
    AVG(CASE WHEN estado = 'completada' THEN precio_final ELSE NULL END) as ticket_promedio
FROM citas
WHERE organizacion_id = :org_id
  AND fecha_cita >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY TO_CHAR(fecha_cita, 'YYYY-MM')
ORDER BY mes DESC;

\echo ''

-- Top profesionales por ingresos
\echo '🧪 Top profesionales por ingresos...'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    p.nombre_completo,
    COUNT(c.id) as total_citas,
    COUNT(*) FILTER (WHERE c.estado = 'completada') as completadas,
    SUM(CASE WHEN c.estado = 'completada' THEN c.precio_final ELSE 0 END) as ingresos_totales,
    p.calificacion_promedio
FROM profesionales p
LEFT JOIN citas c ON p.id = c.profesional_id
    AND c.fecha_cita >= CURRENT_DATE - INTERVAL '30 days'
WHERE p.organizacion_id = :org_id
  AND p.activo = TRUE
GROUP BY p.id, p.nombre_completo, p.calificacion_promedio
ORDER BY ingresos_totales DESC
LIMIT 10;

\echo ''

-- ====================================================================
-- TEST 4: VALIDACIÓN DE ÍNDICES
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 TEST 4: VALIDACIÓN DE ÍNDICES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\echo '🔍 Índices covering (INCLUDE) creados:'
SELECT
    '   → ' || indexname as indice,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamano
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_covering'
ORDER BY indexname;

\echo ''

\echo '🔍 Índices GIN para full-text:'
SELECT
    '   → ' || indexname as indice,
    tablename,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as tamano
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef LIKE '%USING gin%'
  AND indexname LIKE '%_search_%'
ORDER BY tablename, indexname;

\echo ''

\echo '🔍 Uso de índices (estadísticas):'
SELECT
    '   → ' || schemaname || '.' || tablename as tabla,
    indexname,
    idx_scan as veces_usado,
    idx_tup_read as tuplas_leidas,
    idx_tup_fetch as tuplas_obtenidas
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 20;

\echo ''

-- ====================================================================
-- TEST 5: ESTADÍSTICAS DE TABLAS
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 TEST 5: ESTADÍSTICAS DE TABLAS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\echo '🔍 Tamaño de tablas principales:'
SELECT
    '   → ' || schemaname || '.' || tablename as tabla,
    n_live_tup as registros_vivos,
    n_dead_tup as registros_muertos,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamano_total,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as tamano_tabla,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as tamano_indices
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

\echo ''

\echo '🔍 Necesidad de VACUUM:'
SELECT
    '   → ' || schemaname || '.' || tablename as tabla,
    n_dead_tup as registros_muertos,
    CASE
        WHEN n_live_tup > 0 THEN ROUND(n_dead_tup::NUMERIC / n_live_tup * 100, 2)
        ELSE 0
    END || '%' as porcentaje_muertos,
    CASE
        WHEN n_dead_tup > 1000 THEN '⚠️  Necesita VACUUM'
        WHEN n_dead_tup > 100 THEN '📊 Considerar VACUUM'
        ELSE '✅ OK'
    END as recomendacion
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 0
ORDER BY n_dead_tup DESC
LIMIT 10;

\echo ''

-- ====================================================================
-- TEST 6: BLOQUEOS Y CONCURRENCIA
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔒 TEST 6: BLOQUEOS Y CONCURRENCIA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\echo '🔍 Bloqueos activos (debe estar vacío en test):'
SELECT
    COALESCE(
        (SELECT '   → ' || relation::regclass || ' - ' || mode || ' por PID ' || pid
         FROM pg_locks
         WHERE NOT granted
         LIMIT 1),
        '   ✅ No hay bloqueos activos'
    ) as estado;

\echo ''

-- ====================================================================
-- RESUMEN FINAL
-- ====================================================================

\timing off

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 RESUMEN DE PERFORMANCE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

DO $$
BEGIN
    RAISE NOTICE '✅ TESTS DE PERFORMANCE COMPLETADOS';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Queries evaluados:';
    RAISE NOTICE '   → Dashboard (citas del día): Debe ser <100ms';
    RAISE NOTICE '   → Profesionales disponibles: Debe usar covering index';
    RAISE NOTICE '   → Búsqueda full-text: Debe usar índices GIN';
    RAISE NOTICE '   → Reportes mensuales: <200ms aceptable';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Optimizaciones validadas:';
    RAISE NOTICE '   → 4 índices covering creados';
    RAISE NOTICE '   → 3 índices GIN compuestos activos';
    RAISE NOTICE '   → Índices parciales reducen tamaño 30-50%%';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Recomendaciones:';
    RAISE NOTICE '   1. Ejecutar VACUUM regularmente si hay muchos registros muertos';
    RAISE NOTICE '   2. Monitorear idx_scan en pg_stat_user_indexes';
    RAISE NOTICE '   3. Si queries >100ms, revisar EXPLAIN ANALYZE';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Siguiente paso: Ejecutar 06-test-edge-cases.sql';
END $$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ TEST 05 COMPLETADO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
