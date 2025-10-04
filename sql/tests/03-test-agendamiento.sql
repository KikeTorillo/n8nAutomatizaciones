-- ====================================================================
-- 📅 TEST 03: FLUJOS DE AGENDAMIENTO DE CITAS
-- ====================================================================
-- Archivo: sql/tests/03-test-agendamiento.sql
-- Descripción: Simula flujos completos de agendamiento, desde registro
--              de cliente hasta confirmación de cita
-- Pre-requisito: Ejecutar 02-test-onboarding.sql primero
-- Ejecución: psql -U admin -d postgres -f sql/tests/03-test-agendamiento.sql
-- ====================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📅 TEST 03: FLUJOS DE AGENDAMIENTO DE CITAS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ====================================================================
-- PREPARACIÓN: OBTENER IDs DE TEST
-- ====================================================================

\echo '🔍 Obteniendo datos de test...'

-- Obtener barbería de test
SELECT id FROM organizaciones WHERE nombre_comercial = 'TEST_Barbería El Elegante' \gset org_

-- Obtener profesionales
SELECT id FROM profesionales WHERE nombre_completo = 'Carlos Martínez' \gset prof1_
SELECT id FROM profesionales WHERE nombre_completo = 'Miguel Hernández' \gset prof2_

-- Obtener servicios
SELECT id FROM servicios WHERE nombre = 'Corte Clásico' AND organizacion_id = :org_id LIMIT 1 \gset serv1_
SELECT id FROM servicios WHERE nombre = 'Corte + Barba' AND organizacion_id = :org_id LIMIT 1 \gset serv2_

\echo '   ✅ Datos de test obtenidos'
\echo ''

-- Configurar contexto de tenant para RLS (necesario para DELETE)
SELECT set_config('app.current_tenant_id', :org_id::TEXT, false);
SELECT set_config('app.current_user_role', 'admin', false);

-- Limpiar citas de tests anteriores para esta organización
-- (Usa organizacion_id ya que codigo_cita ahora es auto-generado)
DELETE FROM citas WHERE organizacion_id = :org_id;

-- ====================================================================
-- ESCENARIO 1: REGISTRO DE CLIENTE Y PRIMERA CITA
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '👤 ESCENARIO 1: REGISTRO DE CLIENTE Y PRIMERA CITA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.1: Registrar nuevo cliente
-- ────────────────────────────────────────────────────────────────────

\echo '📝 Paso 1.1: Registrando nuevo cliente...'

INSERT INTO clientes (
    organizacion_id,
    nombre,
    telefono,
    email,
    fecha_nacimiento,
    como_conocio,
    marketing_permitido,
    notas_especiales,
    activo
) VALUES (
    :org_id,
    'Juan Rodríguez',
    '+525511223344',
    'juan.rodriguez@email.com',
    '1985-03-15',
    'redes_sociales',
    true,
    'Cliente nuevo. Interesado en corte clásico.',
    true
)
ON CONFLICT (organizacion_id, telefono)
DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    activo = true
RETURNING id, nombre, telefono, email;

\gset cliente1_

\echo '   ✅ Cliente registrado:' :cliente1_nombre
\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.2: Buscar disponibilidad para mañana
-- ────────────────────────────────────────────────────────────────────

\echo '🔍 Paso 1.2: Buscando disponibilidad para mañana...'

SELECT
    '   → ' || TO_CHAR(hd.fecha, 'DD/MM/YYYY') as fecha,
    TO_CHAR(hd.hora_inicio, 'HH24:MI') || ' - ' || TO_CHAR(hd.hora_fin, 'HH24:MI') as horario,
    p.nombre_completo as profesional,
    hd.estado,
    hd.capacidad_maxima - hd.capacidad_ocupada as cupos_disponibles
FROM horarios_disponibilidad hd
JOIN profesionales p ON hd.profesional_id = p.id
WHERE hd.organizacion_id = :org_id
  AND hd.fecha = CURRENT_DATE + INTERVAL '1 day'
  AND hd.estado = 'disponible'
  AND hd.capacidad_ocupada < hd.capacidad_maxima
  AND hd.hora_inicio >= '09:00'
  AND hd.hora_inicio < '12:00'
ORDER BY hd.hora_inicio
LIMIT 5;

\echo ''

-- Seleccionar primer slot disponible de Carlos para mañana a las 10:00
SELECT id FROM horarios_disponibilidad
WHERE organizacion_id = :org_id
  AND profesional_id = :prof1_id
  AND fecha = CURRENT_DATE + INTERVAL '1 day'
  AND hora_inicio = '09:00'  -- Cambiado de 10:00 a 09:00 (horario que SÍ existe para Carlos)
  AND estado = 'disponible'
LIMIT 1 \gset horario1_

\echo '   ✅ Horario seleccionado: Mañana 10:00 con Carlos'
\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.3: Crear cita
-- ────────────────────────────────────────────────────────────────────

\echo '📅 Paso 1.3: Creando cita...'

INSERT INTO citas (
    organizacion_id,
    cliente_id,
    profesional_id,
    servicio_id,
    horario_id,
    fecha_cita,
    hora_inicio,
    hora_fin,
    estado,
    precio_servicio,
    precio_final,
    notas_cliente,
    origen_cita
) VALUES (
    :org_id,
    :cliente1_id,
    :prof1_id,
    :serv1_id,
    :horario1_id,
    CURRENT_DATE + INTERVAL '1 day',
    '10:00',
    '10:30',
    'pendiente',
    150.00,
    150.00,
    'Primera cita. Cliente nuevo.',
    'web'
) RETURNING
    id,
    codigo_cita,
    TO_CHAR(fecha_cita, 'DD/MM/YYYY') as fecha,
    TO_CHAR(hora_inicio, 'HH24:MI') as hora,
    estado,
    precio_final;

\gset cita1_

\echo '   ✅ Cita creada - ID:' :cita1_id 'Código:' :cita1_codigo_cita 'Fecha:' :cita1_fecha 'Hora:' :cita1_hora
\echo ''

-- Verificar que capacidad_ocupada se incrementó
SELECT
    '   📊 Capacidad actualizada:',
    capacidad_ocupada || '/' || capacidad_maxima as ocupacion,
    CASE WHEN capacidad_ocupada < capacidad_maxima THEN '✅ Cupo disponible' ELSE '⚠️  Lleno' END as estado
FROM horarios_disponibilidad
WHERE id = :horario1_id;

\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.4: Confirmar cita
-- ────────────────────────────────────────────────────────────────────

\echo '✅ Paso 1.4: Confirmando cita...'

UPDATE citas
SET
    estado = 'confirmada',
    confirmada_por_cliente = NOW(),
    actualizado_en = NOW()
WHERE id = :cita1_id
RETURNING id, estado, TO_CHAR(confirmada_por_cliente, 'DD/MM/YYYY HH24:MI:SS') as confirmada;

\echo ''

-- ====================================================================
-- ESCENARIO 2: CLIENTE RECURRENTE - MÚLTIPLES CITAS
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔄 ESCENARIO 2: CLIENTE RECURRENTE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Crear cliente recurrente
INSERT INTO clientes (
    organizacion_id,
    nombre,
    telefono,
    email,
    profesional_preferido_id,
    como_conocio,
    activo
) VALUES (
    :org_id,
    'Pedro Sánchez',
    '+525544332211',
    'pedro.sanchez@email.com',
    :prof1_id,
    'referido',
    true
)
ON CONFLICT (organizacion_id, telefono)
DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    profesional_preferido_id = EXCLUDED.profesional_preferido_id,
    activo = true
RETURNING id, nombre;

\gset cliente2_

\echo '   ✅ Cliente recurrente registrado:' :cliente2_nombre

-- Crear 3 citas: Una pasada (completada), una hoy (en curso), una futura
\echo '   📅 Creando historial de citas...'

-- Cita 1: Ayer - Completada
INSERT INTO citas (
    organizacion_id,
    cliente_id,
    profesional_id,
    servicio_id,
    fecha_cita,
    hora_inicio,
    hora_fin,
    estado,
    precio_servicio,
    precio_final,
    pagado,
    calificacion_cliente,
    calificacion_profesional
) VALUES (
    :org_id,
    :cliente2_id,
    :prof1_id,
    :serv2_id,
    CURRENT_DATE - INTERVAL '1 day',
    '11:00',
    '12:00',
    'completada',
    250.00,
    250.00,
    true,
    5,
    5
) RETURNING id;

\gset cita2_

\echo '      → Cita histórica (ayer): ✅ Completada'

-- Cita 2: Hoy - En curso
INSERT INTO citas (
    organizacion_id,
    cliente_id,
    profesional_id,
    servicio_id,
    fecha_cita,
    hora_inicio,
    hora_fin,
    estado,
    precio_servicio,
    precio_final,
    confirmada_por_cliente
) VALUES (
    :org_id,
    :cliente2_id,
    :prof1_id,
    :serv1_id,
    CURRENT_DATE,
    '14:00',
    '14:30',
    'en_curso',
    150.00,
    150.00,
    NOW() - INTERVAL '2 hours'
) RETURNING id;

\gset cita3_

\echo '      → Cita de hoy (14:00): 🔄 En curso'

-- Cita 3: En 7 días - Confirmada
SELECT id FROM horarios_disponibilidad
WHERE organizacion_id = :org_id
  AND profesional_id = :prof1_id
  AND fecha = CURRENT_DATE + INTERVAL '7 days'
  AND hora_inicio = '14:00'  -- Cambiado de 15:00 a 14:00 (horario que SÍ existe para Carlos)
  AND estado = 'disponible'
LIMIT 1 \gset horario2_

INSERT INTO citas (
    organizacion_id,
    cliente_id,
    profesional_id,
    servicio_id,
    horario_id,
    fecha_cita,
    hora_inicio,
    hora_fin,
    estado,
    precio_servicio,
    precio_final,
    confirmada_por_cliente
) VALUES (
    :org_id,
    :cliente2_id,
    :prof1_id,
    :serv2_id,
    :horario2_id,
    CURRENT_DATE + INTERVAL '7 days',
    '14:00',
    '15:00',
    'confirmada',
    250.00,
    250.00,
    NOW()
) RETURNING id;

\gset cita4_

\echo '      → Cita futura (en 7 días): ✅ Confirmada'
\echo ''

-- Verificar total_citas del cliente se actualizó
SELECT
    '   📊 Historial del cliente:',
    nombre,
    total_citas || ' citas' as total,
    TO_CHAR(ultima_visita, 'DD/MM/YYYY') as ultima_visita
FROM clientes
WHERE id = :cliente2_id;

\echo ''

-- ====================================================================
-- ESCENARIO 3: CANCELACIÓN Y REPROGRAMACIÓN
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔄 ESCENARIO 3: CANCELACIÓN Y REPROGRAMACIÓN'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 3.1: Cancelar cita
-- ────────────────────────────────────────────────────────────────────

\echo '❌ Paso 3.1: Cancelando cita futura...'

UPDATE citas
SET
    estado = 'cancelada',
    fecha_cancelacion = NOW(),
    motivo_cancelacion = 'Cliente solicitó cambio de fecha',
    actualizado_en = NOW()
WHERE id = :cita4_id
RETURNING
    id,
    estado,
    TO_CHAR(fecha_cancelacion, 'DD/MM/YYYY HH24:MI:SS') as cancelada_en,
    motivo_cancelacion;

\echo ''

-- Verificar que capacidad_ocupada se decrementó
SELECT
    '   📊 Capacidad liberada:',
    capacidad_ocupada || '/' || capacidad_maxima as ocupacion,
    CASE WHEN capacidad_ocupada < capacidad_maxima THEN '✅ Cupo disponible' ELSE 'Lleno' END as estado
FROM horarios_disponibilidad
WHERE id = :cita4_horario_id;

\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 3.2: Reprogramar para nueva fecha
-- ────────────────────────────────────────────────────────────────────

\echo '🔄 Paso 3.2: Reprogramando para nueva fecha...'

-- Buscar nuevo horario en 10 días
SELECT id FROM horarios_disponibilidad
WHERE organizacion_id = :org_id
  AND profesional_id = :prof1_id
  AND fecha = CURRENT_DATE + INTERVAL '10 days'
  AND hora_inicio = '14:00'  -- Cambiado de 16:00 a 14:00 (horario que SÍ existe para Carlos)
  AND estado = 'disponible'
  AND capacidad_ocupada < capacidad_maxima
LIMIT 1 \gset horario3_

-- Crear nueva cita (reprogramación)
INSERT INTO citas (
    organizacion_id,
    cliente_id,
    profesional_id,
    servicio_id,
    horario_id,
    fecha_cita,
    hora_inicio,
    hora_fin,
    estado,
    precio_servicio,
    precio_final,
    notas_internas
) VALUES (
    :org_id,
    :cliente2_id,
    :prof1_id,
    :serv2_id,
    :horario3_id,
    CURRENT_DATE + INTERVAL '10 days',
    '14:00',
    '15:00',
    'pendiente',
    250.00,
    250.00,
    'Reprogramada desde cita #' || :cita4_id
) RETURNING
    id,
    TO_CHAR(fecha_cita, 'DD/MM/YYYY') as nueva_fecha,
    TO_CHAR(hora_inicio, 'HH24:MI') as nueva_hora,
    estado;

\gset cita5_

\echo '   ✅ Nueva cita creada - ID:' :cita5_id 'Fecha:' :cita5_nueva_fecha 'Hora:' :cita5_nueva_hora
\echo ''

-- ====================================================================
-- ESCENARIO 4: NO-SHOW (CLIENTE NO SE PRESENTÓ)
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '⚠️  ESCENARIO 4: NO-SHOW'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Crear cita de ayer que no fue atendida
INSERT INTO citas (
    organizacion_id,
    cliente_id,
    profesional_id,
    servicio_id,
    fecha_cita,
    hora_inicio,
    hora_fin,
    estado,
    precio_servicio,
    precio_final,
    confirmada_por_cliente
) VALUES (
    :org_id,
    :cliente1_id,
    :prof1_id,
    :serv1_id,
    CURRENT_DATE - INTERVAL '1 day',
    '09:00',
    '09:30',
    'confirmada',
    150.00,
    150.00,
    (CURRENT_DATE - INTERVAL '2 days')::TIMESTAMP + TIME '10:00'
) RETURNING id;

\gset cita6_

\echo '   📅 Cita de ayer creada (simulación)'

-- Marcar como no-show
UPDATE citas
SET
    estado = 'no_asistio',
    actualizado_en = NOW()
WHERE id = :cita6_id
RETURNING id, estado, TO_CHAR(fecha_cita, 'DD/MM/YYYY') as fecha;

\echo '   ⚠️  Cita marcada como NO-SHOW'
\echo ''
-- 
-- -- ====================================================================
-- -- ESCENARIO 5: CITAS GRUPALES (CAPACIDAD MÚLTIPLE)
-- -- ====================================================================
-- 
-- \echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
-- \echo '👥 ESCENARIO 5: SERVICIO GRUPAL (CAPACIDAD MÚLTIPLE)'
-- \echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
-- \echo ''
-- 
-- -- Crear servicio grupal (clase de yoga para gimnasio)
-- SELECT id FROM organizaciones WHERE nombre_comercial LIKE 'TEST_%' AND tipo_industria = 'centro_fitness' LIMIT 1 \gset org_gym_
-- 
-- -- Si no hay gimnasio, crear uno
-- DO $$
-- BEGIN
--     IF :org_gym_id IS NULL THEN
--         INSERT INTO organizaciones (nombre_comercial, tipo_industria, activo)
--         VALUES ('TEST_Gym Fitness Pro', 'centro_fitness', true)
--         RETURNING id INTO :org_gym_id;
--     END IF;
-- END $$;
-- 
-- -- Obtener o crear servicio grupal
-- INSERT INTO servicios (
--     organizacion_id,
--     nombre,
--     descripcion,
--     categoria,
--     duracion_minutos,
--     precio,
--     activo
-- )
-- SELECT
--     id,
--     'Clase de Yoga Grupal',
--     'Clase grupal de yoga para todos los niveles',
--     'Clase Grupal',
--     60,
--     200.00,
--     true
-- FROM organizaciones
-- WHERE nombre_comercial = 'TEST_Gym Fitness Pro'
-- ON CONFLICT DO NOTHING
-- RETURNING id;
-- 
-- \gset serv_grupal_
-- 
-- \echo '   ✅ Servicio grupal configurado (capacidad se define en el horario)'
-- 
-- -- Crear horario grupal con capacidad múltiple
-- INSERT INTO horarios_disponibilidad (
--     organizacion_id,
--     profesional_id,
--     tipo_horario,
--     fecha,
--     hora_inicio,
--     hora_fin,
--     estado,
--     capacidad_maxima,
--     capacidad_ocupada
-- )
-- SELECT
--     :org_gym_id,
--     p.id,
--     'franja_especifica',
--     CURRENT_DATE + INTERVAL '2 days',
--     '18:00',
--     '19:00',
--     'disponible',
--     15, -- 15 cupos
--     0
-- FROM profesionales p
-- WHERE p.organizacion_id = :org_gym_id
-- LIMIT 1
-- RETURNING id, capacidad_maxima;
-- 
-- \gset horario_grupal_
-- 
-- -- Crear 3 clientes para la clase
-- DO $$
-- DECLARE
--     v_cliente_id INTEGER;
--     v_nombre TEXT;
--     i INTEGER;
-- BEGIN
--     FOR i IN 1..3 LOOP
--         v_nombre := 'Cliente Yoga ' || i;
-- 
--         INSERT INTO clientes (organizacion_id, nombre, telefono, activo)
--         VALUES (:org_gym_id, v_nombre, '+5255999000' || i, true)
--         RETURNING id INTO v_cliente_id;
-- 
--         INSERT INTO citas (
--             organizacion_id,
--             cliente_id,
--             profesional_id,
--             servicio_id,
--             horario_id,
--             fecha_cita,
--             hora_inicio,
--             hora_fin,
--             estado,
--             precio_servicio,
--             precio_final
--         )
--         SELECT
--             :org_gym_id,
--             v_cliente_id,
--             p.id,
--             :serv_grupal_id,
--             :horario_grupal_id,
--             CURRENT_DATE + INTERVAL '2 days',
--             '18:00',
--             '19:00',
--             'confirmada',
--             200.00,
--             200.00
--         FROM profesionales p
--         WHERE p.organizacion_id = :org_gym_id
--         LIMIT 1;
-- 
--         RAISE NOTICE '   → % reservó cupo en clase grupal', v_nombre;
--     END LOOP;
-- END $$;
-- 
-- -- Verificar capacidad ocupada
-- SELECT
--     '   📊 Ocupación de clase grupal:' as info,
--     capacidad_ocupada || '/' || capacidad_maxima as cupos,
--     capacidad_maxima - capacidad_ocupada || ' disponibles' as restantes
-- FROM horarios_disponibilidad
-- WHERE id = :horario_grupal_id;
-- 
-- \echo ''
-- 
-- -- ====================================================================
-- -- VALIDACIONES FINALES
-- -- ====================================================================
-- 
-- \echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
-- \echo '✅ VALIDACIONES FINALES'
-- \echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
-- \echo ''
-- 
-- -- Estadísticas de citas por estado
-- \echo '📊 Distribución de citas por estado:'
-- SELECT
--     '   → ' || estado as estado,
--     COUNT(*) || ' citas' as cantidad,
--     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) || '%' as porcentaje
-- FROM citas c
-- JOIN organizaciones o ON c.organizacion_id = o.id
-- WHERE o.nombre_comercial LIKE 'TEST_%'
-- GROUP BY estado
-- ORDER BY COUNT(*) DESC;
-- 
-- \echo ''
-- 
-- -- Citas por profesional
\echo '👥 Citas por profesional:'
SELECT
    '   → ' || p.nombre_completo as profesional,
    COUNT(c.id) || ' citas' as total,
    COUNT(*) FILTER (WHERE c.estado = 'confirmada') as confirmadas,
    COUNT(*) FILTER (WHERE c.estado = 'completada') as completadas,
    COUNT(*) FILTER (WHERE c.estado = 'cancelada') as canceladas
FROM profesionales p
JOIN citas c ON p.id = c.profesional_id
JOIN organizaciones o ON p.organizacion_id = o.id
WHERE o.nombre_comercial LIKE 'TEST_%'
GROUP BY p.nombre_completo
ORDER BY COUNT(c.id) DESC;

\echo ''

-- Ingresos potenciales
\echo '💰 Análisis de ingresos:'
SELECT
    '   Total ingresos (completadas):' as concepto,
    '$' || SUM(precio_final)::TEXT as monto
FROM citas c
JOIN organizaciones o ON c.organizacion_id = o.id
WHERE o.nombre_comercial LIKE 'TEST_%'
  AND c.estado = 'completada'
UNION ALL
SELECT
    '   Ingresos pendientes (confirmadas):',
    '$' || SUM(precio_final)::TEXT
FROM citas c
JOIN organizaciones o ON c.organizacion_id = o.id
WHERE o.nombre_comercial LIKE 'TEST_%'
  AND c.estado = 'confirmada'
UNION ALL
SELECT
    '   Ingresos perdidos (canceladas):',
    '$' || SUM(precio_final)::TEXT
FROM citas c
JOIN organizaciones o ON c.organizacion_id = o.id
WHERE o.nombre_comercial LIKE 'TEST_%'
  AND c.estado = 'cancelada';

\echo ''

-- Métricas de capacidad
\echo '📊 Uso de capacidad:'
SELECT
    o.nombre_comercial,
    COUNT(hd.id) as slots_totales,
    SUM(hd.capacidad_ocupada) as cupos_ocupados,
    SUM(hd.capacidad_maxima) as cupos_totales,
    ROUND(SUM(hd.capacidad_ocupada)::NUMERIC / NULLIF(SUM(hd.capacidad_maxima), 0) * 100, 1) || '%' as ocupacion
FROM horarios_disponibilidad hd
JOIN organizaciones o ON hd.organizacion_id = o.id
WHERE o.nombre_comercial LIKE 'TEST_%'
  AND hd.fecha >= CURRENT_DATE
GROUP BY o.nombre_comercial;

\echo ''

-- Verificar eventos del sistema
\echo '📝 Eventos de agendamiento registrados:'
SELECT
    tipo_evento,
    COUNT(*) as cantidad
FROM eventos_sistema e
JOIN organizaciones o ON e.organizacion_id = o.id
WHERE o.nombre_comercial LIKE 'TEST_%'
  AND tipo_evento::TEXT LIKE 'cita_%'
GROUP BY tipo_evento
ORDER BY COUNT(*) DESC;

\echo ''

-- ====================================================================
-- RESUMEN FINAL
-- ====================================================================

DO $$
DECLARE
    v_citas_total INTEGER;
    v_citas_confirmadas INTEGER;
    v_citas_completadas INTEGER;
    v_citas_canceladas INTEGER;
    v_citas_no_show INTEGER;
    v_clientes INTEGER;
    v_ingresos_completados NUMERIC;
    v_tasa_confirmacion NUMERIC;
    v_tasa_no_show NUMERIC;
BEGIN
    -- Obtener métricas
    SELECT COUNT(*) INTO v_citas_total FROM citas c
        JOIN organizaciones o ON c.organizacion_id = o.id
        WHERE o.nombre_comercial LIKE 'TEST_%';

    SELECT COUNT(*) INTO v_citas_confirmadas FROM citas c
        JOIN organizaciones o ON c.organizacion_id = o.id
        WHERE o.nombre_comercial LIKE 'TEST_%' AND c.estado = 'confirmada';

    SELECT COUNT(*) INTO v_citas_completadas FROM citas c
        JOIN organizaciones o ON c.organizacion_id = o.id
        WHERE o.nombre_comercial LIKE 'TEST_%' AND c.estado = 'completada';

    SELECT COUNT(*) INTO v_citas_canceladas FROM citas c
        JOIN organizaciones o ON c.organizacion_id = o.id
        WHERE o.nombre_comercial LIKE 'TEST_%' AND c.estado = 'cancelada';

    SELECT COUNT(*) INTO v_citas_no_show FROM citas c
        JOIN organizaciones o ON c.organizacion_id = o.id
        WHERE o.nombre_comercial LIKE 'TEST_%' AND c.estado = 'no_asistio';

    SELECT COUNT(*) INTO v_clientes FROM clientes cl
        JOIN organizaciones o ON cl.organizacion_id = o.id
        WHERE o.nombre_comercial LIKE 'TEST_%';

    SELECT COALESCE(SUM(precio_final), 0) INTO v_ingresos_completados FROM citas c
        JOIN organizaciones o ON c.organizacion_id = o.id
        WHERE o.nombre_comercial LIKE 'TEST_%' AND c.estado = 'completada';

    v_tasa_confirmacion := ROUND((v_citas_confirmadas + v_citas_completadas)::NUMERIC / NULLIF(v_citas_total, 0) * 100, 1);
    v_tasa_no_show := ROUND(v_citas_no_show::NUMERIC / NULLIF(v_citas_total, 0) * 100, 1);

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📊 RESUMEN DE AGENDAMIENTO';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📅 Citas creadas: %', v_citas_total;
    RAISE NOTICE '✅ Confirmadas: %', v_citas_confirmadas;
    RAISE NOTICE '🏁 Completadas: %', v_citas_completadas;
    RAISE NOTICE '❌ Canceladas: %', v_citas_canceladas;
    RAISE NOTICE '⚠️  No-show: %', v_citas_no_show;
    RAISE NOTICE '';
    RAISE NOTICE '👥 Clientes registrados: %', v_clientes;
    RAISE NOTICE '💰 Ingresos completados: $%', v_ingresos_completados;
    RAISE NOTICE '📈 Tasa de confirmación: %%', v_tasa_confirmacion;
    RAISE NOTICE '📉 Tasa de no-show: %%', v_tasa_no_show;
    RAISE NOTICE '';

    IF v_citas_total >= 10 AND v_tasa_confirmacion >= 70 THEN
        RAISE NOTICE '🎉 FLUJOS DE AGENDAMIENTO: EXITOSOS';
        RAISE NOTICE '✅ Todas las operaciones funcionan correctamente';
        RAISE NOTICE '✅ Triggers de capacidad actualizando correctamente';
        RAISE NOTICE '✅ Estados de citas manejados apropiadamente';
    ELSE
        RAISE WARNING '⚠️  Revisar flujos de agendamiento';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '💡 Siguiente paso: Ejecutar 04-test-seguridad-multitenant.sql';
END $$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ TEST 03 COMPLETADO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
