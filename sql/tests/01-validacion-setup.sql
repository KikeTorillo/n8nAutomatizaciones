-- ====================================================================
-- 🔍 TEST 01: VALIDACIÓN DE CONFIGURACIÓN INICIAL
-- ====================================================================
-- Archivo: sql/tests/01-validacion-setup.sql
-- Descripción: Valida que el setup inicial se ejecutó correctamente
-- Ejecución: psql -U admin -d postgres -f sql/tests/01-validacion-setup.sql
-- ====================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔍 TEST 01: VALIDACIÓN DE CONFIGURACIÓN INICIAL'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ====================================================================
-- SECCIÓN 1: VALIDAR BASES DE DATOS
-- ====================================================================

\echo '📊 1. Verificando bases de datos...'

SELECT
    CASE
        WHEN COUNT(*) = 4 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    '4 bases de datos especializadas' as test,
    COUNT(*)::TEXT || '/4' as resultado
FROM pg_database
WHERE datname IN ('postgres', 'n8n_db', 'evolution_db', 'chat_memories_db');

-- Listar bases de datos encontradas
SELECT
    '   → ' || datname as base_datos,
    pg_size_pretty(pg_database_size(datname)) as tamano
FROM pg_database
WHERE datname IN ('postgres', 'n8n_db', 'evolution_db', 'chat_memories_db')
ORDER BY datname;

\echo ''

-- ====================================================================
-- SECCIÓN 2: VALIDAR USUARIOS POSTGRESQL
-- ====================================================================

\echo '👥 2. Verificando usuarios PostgreSQL...'

SELECT
    CASE
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    'Usuarios especializados' as test,
    COUNT(*)::TEXT || '/5' as resultado
FROM pg_roles
WHERE rolname IN ('saas_app', 'n8n_app', 'evolution_app', 'readonly_user', 'integration_user');

-- Listar usuarios con sus privilegios
SELECT
    '   → ' || rolname as usuario,
    CASE WHEN rolsuper THEN 'Superuser' ELSE 'Regular' END as tipo,
    CASE WHEN rolcanlogin THEN 'Sí' ELSE 'No' END as puede_login
FROM pg_roles
WHERE rolname IN ('saas_app', 'n8n_app', 'evolution_app', 'readonly_user', 'integration_user')
ORDER BY rolname;

\echo ''

-- ====================================================================
-- SECCIÓN 3: VALIDAR TABLAS
-- ====================================================================

\echo '📋 3. Verificando tablas operativas...'

SELECT
    CASE
        WHEN COUNT(*) >= 15 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    'Tablas operativas creadas' as test,
    COUNT(*)::TEXT || '/15' as resultado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
      'usuarios', 'organizaciones', 'profesionales', 'clientes',
      'servicios', 'servicios_profesionales', 'citas',
      'horarios_profesionales',
      'plantillas_servicios', 'planes_subscripcion', 'subscripciones',
      'historial_subscripciones', 'metricas_uso_organizacion',
      'eventos_sistema', 'bloqueos_horarios'
  );

-- Listar tablas con conteo de registros
SELECT
    '   → ' || schemaname || '.' || tablename as tabla,
    n_live_tup as registros,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as tamano
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''

-- ====================================================================
-- SECCIÓN 4: VALIDAR ENUMS
-- ====================================================================

\echo '🎨 4. Verificando ENUMs...'

SELECT
    CASE
        WHEN COUNT(*) >= 7 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    'ENUMs definidos' as test,
    COUNT(*)::TEXT || '/7' as resultado
FROM pg_type
WHERE typname IN (
    'rol_usuario', 'industria_tipo', 'tipo_profesional',
    'estado_cita', 'estado_subscripcion', 'tipo_evento_sistema',
    'tipo_bloqueo'
);

-- Listar ENUMs con cantidad de valores
SELECT
    '   → ' || t.typname as enum_type,
    COUNT(e.enumlabel)::TEXT || ' valores' as cantidad
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
    'rol_usuario', 'industria_tipo', 'tipo_profesional',
    'estado_cita', 'estado_subscripcion', 'tipo_evento_sistema',
    'tipo_bloqueo'
)
GROUP BY t.typname
ORDER BY t.typname;

\echo ''

-- ====================================================================
-- SECCIÓN 5: VALIDAR FUNCIONES
-- ====================================================================

\echo '⚙️ 5. Verificando funciones PL/pgSQL...'

SELECT
    CASE
        WHEN COUNT(*) >= 20 THEN '✅ PASS'
        ELSE '⚠️  WARN'
    END as status,
    'Funciones PL/pgSQL' as test,
    COUNT(*)::TEXT || ' funciones' as resultado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql');

-- Listar funciones principales
SELECT
    '   → ' || proname as funcion,
    pronargs::TEXT || ' parámetros' as params
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
  AND proname IN (
      'registrar_intento_login',
      'validar_coherencia_cita',
      'archivar_eventos_antiguos',
      'archivar_citas_antiguas'
  )
ORDER BY proname;

\echo ''

-- ====================================================================
-- SECCIÓN 6: VALIDAR ÍNDICES
-- ====================================================================

\echo '📊 6. Verificando índices...'

SELECT
    CASE
        WHEN COUNT(*) >= 80 THEN '✅ PASS'
        ELSE '⚠️  WARN'
    END as status,
    'Índices creados' as test,
    COUNT(*)::TEXT || ' índices' as resultado
FROM pg_indexes
WHERE schemaname = 'public';

-- Estadísticas de índices por tipo
SELECT
    '   → ' ||
    CASE
        WHEN indexdef LIKE '%USING gin%' THEN 'GIN (full-text)'
        WHEN indexdef LIKE '%USING gist%' THEN 'GIST (exclusion)'
        WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
        WHEN indexdef LIKE '%INCLUDE%' THEN 'Covering (INCLUDE)'
        ELSE 'B-tree estándar'
    END as tipo_indice,
    COUNT(*)::TEXT || ' índices' as cantidad
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY
    CASE
        WHEN indexdef LIKE '%USING gin%' THEN 'GIN (full-text)'
        WHEN indexdef LIKE '%USING gist%' THEN 'GIST (exclusion)'
        WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
        WHEN indexdef LIKE '%INCLUDE%' THEN 'Covering (INCLUDE)'
        ELSE 'B-tree estándar'
    END
ORDER BY cantidad DESC;

\echo ''

-- ====================================================================
-- SECCIÓN 7: VALIDAR ROW LEVEL SECURITY (RLS)
-- ====================================================================

\echo '🔒 7. Verificando Row Level Security...'

SELECT
    CASE
        WHEN COUNT(*) >= 15 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    'Tablas con RLS habilitado' as test,
    COUNT(*)::TEXT || '/16 tablas' as resultado
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Listar tablas con RLS y cantidad de políticas
SELECT
    '   → ' || t.tablename as tabla,
    COUNT(p.policyname)::TEXT || ' políticas' as politicas
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
ORDER BY t.tablename;

\echo ''

-- ====================================================================
-- SECCIÓN 8: VALIDAR POLÍTICAS RLS
-- ====================================================================

\echo '📜 8. Verificando políticas RLS...'

SELECT
    CASE
        WHEN COUNT(*) >= 20 THEN '✅ PASS'
        ELSE '⚠️  WARN'
    END as status,
    'Políticas RLS definidas' as test,
    COUNT(*)::TEXT || ' políticas' as resultado
FROM pg_policies
WHERE schemaname = 'public';

\echo ''

-- ====================================================================
-- SECCIÓN 9: VALIDAR TRIGGERS
-- ====================================================================

\echo '⚡ 9. Verificando triggers...'

SELECT
    CASE
        WHEN COUNT(*) >= 15 THEN '✅ PASS'
        ELSE '⚠️  WARN'
    END as status,
    'Triggers activos' as test,
    COUNT(*)::TEXT || ' triggers' as resultado
FROM pg_trigger
WHERE NOT tgisinternal;

-- Listar triggers principales
SELECT
    '   → ' || tgname as trigger_name,
    relname as tabla
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE NOT t.tgisinternal
  AND relname IN (
      'citas', 'eventos_sistema',
      'horarios_profesionales', 'bloqueos_horarios'
  )
ORDER BY relname, tgname;

\echo ''

-- ====================================================================
-- SECCIÓN 10: VALIDAR FOREIGN KEYS
-- ====================================================================

\echo '🔗 10. Verificando Foreign Keys...'

SELECT
    CASE
        WHEN COUNT(*) >= 30 THEN '✅ PASS'
        ELSE '⚠️  WARN'
    END as status,
    'Foreign Keys definidas' as test,
    COUNT(*)::TEXT || ' FKs' as resultado
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';

-- Validar FKs con ON UPDATE CASCADE
SELECT
    CASE
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '⚠️  WARN'
    END as status,
    'FKs con ON UPDATE CASCADE' as test,
    COUNT(*)::TEXT || ' FKs estandarizadas' as resultado
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public'
  AND update_rule = 'CASCADE';

\echo ''

-- ====================================================================
-- SECCIÓN 11: VALIDAR DATOS INICIALES
-- ====================================================================

\echo '📦 11. Verificando datos iniciales...'

-- Planes de suscripción
SELECT
    CASE
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    'Planes de suscripción' as test,
    COUNT(*)::TEXT || '/4 planes' as resultado
FROM planes_subscripcion;

SELECT
    '   → Plan: ' || nombre_plan as plan,
    precio_mensual::TEXT || ' ' || moneda as precio,
    CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END as estado
FROM planes_subscripcion
ORDER BY orden_display;

\echo ''

-- Plantillas de servicios
SELECT
    CASE
        WHEN COUNT(*) >= 50 THEN '✅ PASS'
        ELSE '⚠️  WARN'
    END as status,
    'Plantillas de servicios' as test,
    COUNT(*)::TEXT || ' plantillas' as resultado
FROM plantillas_servicios;

-- Estadísticas por industria
SELECT
    '   → ' || tipo_industria as industria,
    COUNT(*)::TEXT || ' servicios' as cantidad,
    STRING_AGG(DISTINCT categoria, ', ' ORDER BY categoria) as categorias
FROM plantillas_servicios
GROUP BY tipo_industria
ORDER BY COUNT(*) DESC
LIMIT 5;

\echo ''

-- ====================================================================
-- SECCIÓN 12: VALIDAR MEJORAS DE OCTUBRE 2025
-- ====================================================================

\echo '🔧 12. Verificando mejoras de Octubre 2025...'

-- Ejecutar función de validación de mejoras
SELECT
    componente,
    CASE
        WHEN estado LIKE '%CORRECTO%' THEN '✅ ' || componente
        ELSE '⚠️  ' || componente
    END as componente_estado,
    detalle
FROM validar_mejoras_auditoria();

\echo ''

-- ====================================================================
-- SECCIÓN 13: VALIDAR EXTENSIONES
-- ====================================================================

\echo '🧩 13. Verificando extensiones PostgreSQL...'

SELECT
    '   → ' || extname as extension,
    extversion as version,
    CASE WHEN extname = 'vector' THEN 'Opcional (IA)' ELSE 'Requerida' END as tipo
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm', 'btree_gist', 'vector')
ORDER BY extname;

\echo ''

-- ====================================================================
-- SECCIÓN 14: RESUMEN FINAL
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 RESUMEN DE VALIDACIÓN'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

DO $$
DECLARE
    v_bases INTEGER;
    v_usuarios INTEGER;
    v_tablas INTEGER;
    v_enums INTEGER;
    v_funciones INTEGER;
    v_indices INTEGER;
    v_rls INTEGER;
    v_politicas INTEGER;
    v_triggers INTEGER;
    v_fks INTEGER;
    v_planes INTEGER;
    v_plantillas INTEGER;
    v_total_checks INTEGER := 0;
    v_passed_checks INTEGER := 0;
BEGIN
    -- Contar componentes
    SELECT COUNT(*) INTO v_bases FROM pg_database
    WHERE datname IN ('postgres', 'n8n_db', 'evolution_db', 'chat_memories_db');

    SELECT COUNT(*) INTO v_usuarios FROM pg_roles
    WHERE rolname IN ('saas_app', 'n8n_app', 'evolution_app', 'readonly_user', 'integration_user');

    SELECT COUNT(*) INTO v_tablas FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    SELECT COUNT(*) INTO v_enums FROM pg_type
    WHERE typname IN ('rol_usuario', 'industria_tipo', 'tipo_profesional', 'estado_cita', 'estado_subscripcion', 'tipo_evento_sistema', 'tipo_bloqueo');

    SELECT COUNT(*) INTO v_funciones FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql');

    SELECT COUNT(*) INTO v_indices FROM pg_indexes WHERE schemaname = 'public';

    SELECT COUNT(*) INTO v_rls FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

    SELECT COUNT(*) INTO v_politicas FROM pg_policies WHERE schemaname = 'public';

    SELECT COUNT(*) INTO v_triggers FROM pg_trigger WHERE NOT tgisinternal;

    SELECT COUNT(*) INTO v_fks FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY';

    SELECT COUNT(*) INTO v_planes FROM planes_subscripcion;

    SELECT COUNT(*) INTO v_plantillas FROM plantillas_servicios;

    -- Evaluar checks
    v_total_checks := 12;

    IF v_bases >= 4 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_usuarios >= 5 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_tablas >= 15 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_enums >= 7 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_funciones >= 20 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_indices >= 80 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_rls >= 15 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_politicas >= 20 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_triggers >= 15 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_fks >= 30 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_planes >= 4 THEN v_passed_checks := v_passed_checks + 1; END IF;
    IF v_plantillas >= 50 THEN v_passed_checks := v_passed_checks + 1; END IF;

    RAISE NOTICE '✅ Checks pasados: %/%', v_passed_checks, v_total_checks;
    RAISE NOTICE '';
    RAISE NOTICE 'Bases de datos: %', v_bases;
    RAISE NOTICE 'Usuarios PostgreSQL: %', v_usuarios;
    RAISE NOTICE 'Tablas: %', v_tablas;
    RAISE NOTICE 'ENUMs: %', v_enums;
    RAISE NOTICE 'Funciones PL/pgSQL: %', v_funciones;
    RAISE NOTICE 'Índices: %', v_indices;
    RAISE NOTICE 'Tablas con RLS: %', v_rls;
    RAISE NOTICE 'Políticas RLS: %', v_politicas;
    RAISE NOTICE 'Triggers: %', v_triggers;
    RAISE NOTICE 'Foreign Keys: %', v_fks;
    RAISE NOTICE 'Planes de suscripción: %', v_planes;
    RAISE NOTICE 'Plantillas de servicios: %', v_plantillas;
    RAISE NOTICE '';

    IF v_passed_checks = v_total_checks THEN
        RAISE NOTICE '🎉 CONFIGURACIÓN INICIAL: PERFECTO';
        RAISE NOTICE '✅ Sistema 100%% listo para pruebas de integración';
    ELSIF v_passed_checks >= v_total_checks * 0.9 THEN
        RAISE NOTICE '✅ CONFIGURACIÓN INICIAL: EXCELENTE';
        RAISE NOTICE '⚠️  Revisar componentes con WARN';
    ELSE
        RAISE NOTICE '⚠️  CONFIGURACIÓN INICIAL: INCOMPLETA';
        RAISE NOTICE '❌ Revisar componentes faltantes';
    END IF;
END $$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ TEST 01 COMPLETADO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
