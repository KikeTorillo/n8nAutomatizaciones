-- ====================================================================
-- 🧪 TEST COMPLETO DEL SISTEMA DE COMISIONES
-- ====================================================================

\set QUIET on
\set ON_ERROR_STOP on

-- Variables
\set org_id 0
\set prof_id 0
\set serv_id 0
\set cliente_id 0
\set cita_id 0

-- 1️⃣ Crear organización de prueba
WITH nueva_org AS (
    INSERT INTO organizaciones (codigo_tenant, slug, nombre_comercial, tipo_industria, email_admin, plan_actual)
    VALUES ('TESTCOM' || floor(random() * 10000)::text, 'test-com-' || floor(random() * 10000)::text, 'Test Comisiones SA', 'barberia', 'test@comisiones.com', 'profesional')
    RETURNING id
)
SELECT id AS org_id INTO TEMP TABLE vars_org FROM nueva_org;

-- 2️⃣ Crear profesional de prueba
WITH nuevo_prof AS (
    INSERT INTO profesionales (organizacion_id, nombre_completo, email, tipo_profesional_id)
    SELECT org_id, 'Juan Barbero', 'juan@test.com', tp.id
    FROM vars_org, tipos_profesional tp
    WHERE tp.codigo = 'barbero'
    LIMIT 1
    RETURNING id
)
SELECT id AS prof_id INTO TEMP TABLE vars_prof FROM nuevo_prof;

-- 3️⃣ Crear servicio de prueba
WITH nuevo_serv AS (
    INSERT INTO servicios (organizacion_id, nombre, descripcion, precio, duracion_minutos, activo)
    SELECT org_id, 'Corte Premium', 'Corte + Barba', 200.00, 30, true
    FROM vars_org
    RETURNING id
)
SELECT id AS serv_id INTO TEMP TABLE vars_serv FROM nuevo_serv;

-- 4️⃣ Asignar servicio al profesional
INSERT INTO servicios_profesionales (profesional_id, servicio_id)
SELECT prof_id, serv_id FROM vars_prof, vars_serv;

-- 5️⃣ Configurar comisión del 15% (global)
INSERT INTO configuracion_comisiones (organizacion_id, profesional_id, servicio_id, tipo_comision, valor_comision, activo)
SELECT org_id, prof_id, NULL, 'porcentaje', 15.00, true
FROM vars_org, vars_prof;

-- 6️⃣ Crear cliente de prueba
WITH nuevo_cliente AS (
    INSERT INTO clientes (organizacion_id, nombre, telefono, email)
    SELECT org_id, 'Cliente Test', '+5215512345678', 'cliente@test.com'
    FROM vars_org
    RETURNING id
)
SELECT id AS cliente_id INTO TEMP TABLE vars_cliente FROM nuevo_cliente;

-- 7️⃣ Crear cita pendiente
WITH nueva_cita AS (
    INSERT INTO citas (organizacion_id, cliente_id, profesional_id, fecha_cita, hora_inicio, hora_fin, estado, precio_total, duracion_total_minutos)
    SELECT org_id, cliente_id, prof_id, '2025-11-20', '14:00', '14:30', 'pendiente', 200.00, 30
    FROM vars_org, vars_cliente, vars_prof
    RETURNING id
)
SELECT id AS cita_id INTO TEMP TABLE vars_cita FROM nueva_cita;

-- 8️⃣ Asociar servicio a la cita
INSERT INTO citas_servicios (cita_id, fecha_cita, servicio_id, orden_ejecucion, precio_aplicado, duracion_minutos)
SELECT cita_id, '2025-11-20', serv_id, 1, 200.00, 30
FROM vars_cita, vars_serv;

\set QUIET off

\echo ''
\echo '======================================================================'
\echo '✅ ESCENARIO DE PRUEBA CREADO'
\echo '======================================================================'

SELECT
    'Organización ID: ' || org_id AS org,
    'Profesional ID: ' || prof_id AS profesional,
    'Servicio ID: ' || serv_id AS servicio,
    'Cita ID: ' || cita_id AS cita
FROM vars_org, vars_prof, vars_serv, vars_cita;

\echo ''
\echo '📋 Configuración de Comisión:'

SELECT
    'Profesional: ' || p.nombre_completo AS profesional,
    'Tipo: ' || cc.tipo_comision AS tipo,
    'Valor: ' || cc.valor_comision || '%' AS valor,
    'Servicio: ' || COALESCE('Específico', 'Global (todos los servicios)') AS alcance
FROM configuracion_comisiones cc
JOIN profesionales p ON p.id = cc.profesional_id
JOIN vars_prof vp ON vp.prof_id = cc.profesional_id;

\echo ''
\echo '======================================================================'
\echo '🧪 TEST: COMPLETAR CITA → TRIGGER COMISIÓN'
\echo '======================================================================'

-- ACCIÓN: Completar la cita (y marcar como pagada)
UPDATE citas
SET estado = 'completada', pagado = TRUE
WHERE id = (SELECT cita_id FROM vars_cita);

\echo ''
\echo '✅ Cita completada → Trigger ejecutado'
\echo ''
\echo '======================================================================'
\echo '📊 RESULTADO: COMISIÓN GENERADA'
\echo '======================================================================'

SELECT
    'ID: ' || cp.id AS comision,
    'Monto Base: $' || cp.monto_base AS base,
    'Comisión: $' || cp.monto_comision AS calculada,
    'Estado: ' || cp.estado_pago AS estado,
    'Fecha: ' || cp.creado_en::date AS fecha
FROM comisiones_profesionales cp
JOIN vars_cita vc ON vc.cita_id = cp.cita_id;

\echo ''
\echo '======================================================================'
\echo '✅ VERIFICACIÓN FINAL'
\echo '======================================================================'

SELECT
    CASE
        WHEN cp.monto_comision = 30.00 THEN '✅ ÉXITO: $30.00 = 15% de $200.00 ✓'
        ELSE '❌ ERROR: Monto = $' || cp.monto_comision || ' (esperado: $30.00)'
    END AS resultado
FROM comisiones_profesionales cp
JOIN vars_cita vc ON vc.cita_id = cp.cita_id;

\echo ''
\echo '📄 Detalle JSON de Servicios:'
SELECT detalle_servicios::jsonb AS detalle
FROM comisiones_profesionales cp
JOIN vars_cita vc ON vc.cita_id = cp.cita_id;

\echo ''
