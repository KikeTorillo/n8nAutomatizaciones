-- ====================================================================
-- 🚀 TEST 02: FLUJOS DE ONBOARDING
-- ====================================================================
-- Archivo: sql/tests/02-test-onboarding.sql
-- Descripción: Simula onboarding completo de organizaciones
-- Pre-requisito: Ejecutar 01-validacion-setup.sql
-- Ejecución: psql -U admin -d postgres -f sql/tests/02-test-onboarding.sql
-- ====================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🚀 TEST 02: FLUJOS DE ONBOARDING'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Configurar bypass RLS para operaciones de test
SELECT set_config('app.bypass_rls', 'true', false);

-- ====================================================================
-- 🧹 LIMPIEZA DE DATOS DE TESTS ANTERIORES
-- ====================================================================

\echo '🧹 Limpiando datos de tests anteriores...'

DELETE FROM usuarios WHERE organizacion_id IN (
    SELECT id FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%'
);

DELETE FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%';

\echo ''

-- ====================================================================
-- 💈 ESCENARIO 1: ONBOARDING DE BARBERÍA
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '💈 ESCENARIO 1: ONBOARDING DE BARBERÍA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.1: Crear organización
-- ────────────────────────────────────────────────────────────────────

\echo '📝 Paso 1.1: Creando organización...'

INSERT INTO organizaciones (
    codigo_tenant,
    slug,
    nombre_comercial,
    razon_social,
    tipo_industria,
    email_admin,
    telefono,
    sitio_web,
    logo_url,
    colores_marca,
    metadata,
    activo
) VALUES (
    'TEST-BARBERIA-ELEGANTE',
    'barberia-elegante',
    'TEST_Barbería El Elegante',
    'Barbería El Elegante S.A. de C.V.',
    'barberia',
    'contacto@elegante.mx',
    '+525512345678',
    'https://elegante.mx',
    'https://elegante.mx/logo.png',
    '{"primary": "#1a1a1a", "secondary": "#d4af37"}'::jsonb,
    '{"direccion": "Av. Insurgentes Sur 1234", "ciudad": "CDMX", "pais": "México"}'::jsonb,
    true
) RETURNING id, nombre_comercial, tipo_industria
\gset org1_

\echo '   ✅ Organización creada con ID:' :org1_id

-- Verificar suscripción automática
SELECT
    '   📦 Plan:' as info,
    ps.nombre_plan,
    o.plan_actual as estado
FROM organizaciones o
LEFT JOIN planes_subscripcion ps ON ps.codigo_plan = o.plan_actual::TEXT
WHERE o.id = :org1_id;

\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.2: Crear usuario administrador
-- ────────────────────────────────────────────────────────────────────

\echo '👤 Paso 1.2: Creando usuario administrador...'

INSERT INTO usuarios (
    organizacion_id,
    email,
    password_hash,
    rol,
    nombre,
    apellidos,
    telefono,
    activo,
    email_verificado
) VALUES (
    :org1_id,
    'admin@elegante.mx',
    md5('Password123!'),
    'admin',
    'Juan',
    'Pérez',
    '+525512345678',
    true,
    true
) RETURNING id, nombre, apellidos, email, rol
\gset user1_

\echo '   ✅ Usuario admin creado - ID:' :user1_id '(' :user1_nombre :user1_apellidos ')'

\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.3: Crear profesionales
-- ────────────────────────────────────────────────────────────────────

\echo '✂️  Paso 1.3: Creando profesionales...'

-- Profesional 1: Barbero Senior
INSERT INTO profesionales (
    organizacion_id,
    nombre_completo,
    tipo_profesional,
    email,
    telefono,
    especialidades,
    biografia,
    años_experiencia,
    activo,
    disponible_online,
    calificacion_promedio,
    color_calendario
) VALUES (
    :org1_id,
    'Carlos Martínez',
    'barbero',
    'carlos@elegante.mx',
    '+525512345679',
    ARRAY['cortes_clasicos', 'barbas', 'afeitado_navaja'],
    'Maestro barbero con 15 años de experiencia.',
    15,
    true,
    true,
    4.8,
    '#FF6B6B'
) RETURNING id, nombre_completo, tipo_profesional
\gset prof1_

\echo '   ✅ Profesional 1:' :prof1_nombre_completo '(' :prof1_tipo_profesional ')'

-- Profesional 2: Barbero Junior
INSERT INTO profesionales (
    organizacion_id,
    nombre_completo,
    tipo_profesional,
    email,
    telefono,
    especialidades,
    biografia,
    años_experiencia,
    activo,
    disponible_online,
    calificacion_promedio,
    color_calendario
) VALUES (
    :org1_id,
    'Miguel Hernández',
    'barbero',
    'miguel@elegante.mx',
    '+525512345680',
    ARRAY['cortes_modernos', 'degradados', 'fade'],
    'Barbero especializado en estilos modernos.',
    5,
    true,
    true,
    4.5,
    '#4ECDC4'
) RETURNING id, nombre_completo, tipo_profesional
\gset prof2_

\echo '   ✅ Profesional 2:' :prof2_nombre_completo '(' :prof2_tipo_profesional ')'

\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.4: Crear servicios desde plantillas
-- ────────────────────────────────────────────────────────────────────

\echo '💼 Paso 1.4: Creando servicios desde plantillas...'

-- Servicio 1: Corte Clásico
INSERT INTO servicios (
    organizacion_id,
    plantilla_servicio_id,
    nombre,
    descripcion,
    categoria,
    duracion_minutos,
    precio,
    activo
)
SELECT
    :org1_id,
    id,
    nombre,
    descripcion,
    categoria,
    duracion_minutos,
    precio_sugerido,
    true
FROM plantillas_servicios
WHERE tipo_industria = 'barberia'
  AND nombre = 'Corte Clásico'
LIMIT 1
RETURNING id, nombre, precio, duracion_minutos
\gset serv1_

\echo '   ✅ Servicio 1:' :serv1_nombre '- $':serv1_precio '(':serv1_duracion_minutos 'min)'

-- Servicio 2: Corte + Barba
INSERT INTO servicios (
    organizacion_id,
    plantilla_servicio_id,
    nombre,
    descripcion,
    categoria,
    duracion_minutos,
    precio,
    activo
)
SELECT
    :org1_id,
    id,
    nombre,
    descripcion,
    categoria,
    duracion_minutos,
    precio_sugerido,
    true
FROM plantillas_servicios
WHERE tipo_industria = 'barberia'
  AND nombre = 'Corte + Barba'
LIMIT 1
RETURNING id, nombre, precio, duracion_minutos
\gset serv2_

\echo '   ✅ Servicio 2:' :serv2_nombre '- $':serv2_precio '(':serv2_duracion_minutos 'min)'

-- Servicio 3: Afeitado Clásico
INSERT INTO servicios (
    organizacion_id,
    plantilla_servicio_id,
    nombre,
    descripcion,
    categoria,
    duracion_minutos,
    precio,
    activo
)
SELECT
    :org1_id,
    id,
    nombre,
    descripcion,
    categoria,
    duracion_minutos,
    precio_sugerido,
    true
FROM plantillas_servicios
WHERE tipo_industria = 'barberia'
  AND nombre = 'Afeitado Clásico'
LIMIT 1
RETURNING id, nombre, precio, duracion_minutos
\gset serv3_

\echo '   ✅ Servicio 3:' :serv3_nombre '- $':serv3_precio '(':serv3_duracion_minutos 'min)'

\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.5: Asignar servicios a profesionales
-- ────────────────────────────────────────────────────────────────────

\echo '🔗 Paso 1.5: Asignando servicios a profesionales...'

-- Carlos ofrece los 3 servicios
INSERT INTO servicios_profesionales (profesional_id, servicio_id, activo)
VALUES
    (:prof1_id, :serv1_id, true),
    (:prof1_id, :serv2_id, true),
    (:prof1_id, :serv3_id, true);

\echo '   ✅' :prof1_nombre_completo '→ 3 servicios asignados'

-- Miguel ofrece solo cortes
INSERT INTO servicios_profesionales (profesional_id, servicio_id, activo)
VALUES
    (:prof2_id, :serv1_id, true),
    (:prof2_id, :serv2_id, true);

\echo '   ✅' :prof2_nombre_completo '→ 2 servicios asignados'

\echo ''

-- ────────────────────────────────────────────────────────────────────
-- PASO 1.6: Configurar horarios base de trabajo
-- ────────────────────────────────────────────────────────────────────

\echo '🕐 Paso 1.6: Configurando horarios de trabajo...'

-- Horarios de Carlos: Lunes a Viernes 9-18 con almuerzo + Sábado 9-14
INSERT INTO horarios_profesionales (
    organizacion_id,
    profesional_id,
    dia_semana,
    hora_inicio,
    hora_fin,
    tipo_horario,
    nombre_horario,
    permite_citas,
    duracion_slot_minutos,
    activo
)
VALUES
    -- Lunes
    (:org1_id, :prof1_id, 1, '09:00', '13:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof1_id, 1, '13:00', '14:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof1_id, 1, '14:00', '18:00', 'regular', 'Tarde', true, 30, true),
    -- Martes
    (:org1_id, :prof1_id, 2, '09:00', '13:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof1_id, 2, '13:00', '14:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof1_id, 2, '14:00', '18:00', 'regular', 'Tarde', true, 30, true),
    -- Miércoles
    (:org1_id, :prof1_id, 3, '09:00', '13:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof1_id, 3, '13:00', '14:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof1_id, 3, '14:00', '18:00', 'regular', 'Tarde', true, 30, true),
    -- Jueves
    (:org1_id, :prof1_id, 4, '09:00', '13:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof1_id, 4, '13:00', '14:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof1_id, 4, '14:00', '18:00', 'regular', 'Tarde', true, 30, true),
    -- Viernes
    (:org1_id, :prof1_id, 5, '09:00', '13:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof1_id, 5, '13:00', '14:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof1_id, 5, '14:00', '18:00', 'regular', 'Tarde', true, 30, true),
    -- Sábado (medio día)
    (:org1_id, :prof1_id, 6, '09:00', '14:00', 'regular', 'Mañana', true, 30, true);

\echo '   ✅ Horarios de' :prof1_nombre_completo 'configurados (L-V 9-18, S 9-14)'

-- Horarios de Miguel: Martes a Sábado 10-19
INSERT INTO horarios_profesionales (
    organizacion_id,
    profesional_id,
    dia_semana,
    hora_inicio,
    hora_fin,
    tipo_horario,
    nombre_horario,
    permite_citas,
    duracion_slot_minutos,
    activo
)
VALUES
    -- Martes a Viernes
    (:org1_id, :prof2_id, 2, '10:00', '14:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof2_id, 2, '14:00', '15:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof2_id, 2, '15:00', '19:00', 'regular', 'Tarde', true, 30, true),
    (:org1_id, :prof2_id, 3, '10:00', '14:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof2_id, 3, '14:00', '15:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof2_id, 3, '15:00', '19:00', 'regular', 'Tarde', true, 30, true),
    (:org1_id, :prof2_id, 4, '10:00', '14:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof2_id, 4, '14:00', '15:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof2_id, 4, '15:00', '19:00', 'regular', 'Tarde', true, 30, true),
    (:org1_id, :prof2_id, 5, '10:00', '14:00', 'regular', 'Mañana', true, 30, true),
    (:org1_id, :prof2_id, 5, '14:00', '15:00', 'almuerzo', 'Almuerzo', false, 60, true),
    (:org1_id, :prof2_id, 5, '15:00', '19:00', 'regular', 'Tarde', true, 30, true),
    -- Sábado
    (:org1_id, :prof2_id, 6, '10:00', '19:00', 'regular', 'Turno completo', true, 30, true);

\echo '   ✅ Horarios de' :prof2_nombre_completo 'configurados (M-S 10-19)'

\echo ''


-- ====================================================================
-- 💅 ESCENARIO 2: ONBOARDING DE SALÓN DE BELLEZA
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '💅 ESCENARIO 2: ONBOARDING DE SALÓN DE BELLEZA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Crear organización de salón
INSERT INTO organizaciones (
    codigo_tenant,
    slug,
    nombre_comercial,
    razon_social,
    tipo_industria,
    email_admin,
    telefono,
    activo
) VALUES (
    'TEST-SALON-BELLEZA',
    'salon-belleza-total',
    'TEST_Salón Belleza Total',
    'Belleza Total S.A. de C.V.',
    'salon_belleza',
    'contacto@bellezatotal.mx',
    '+525587654321',
    true
) RETURNING id
\gset org2_

-- Crear admin
INSERT INTO usuarios (
    organizacion_id,
    email,
    password_hash,
    nombre,
    apellidos,
    rol,
    activo
) VALUES (
    :org2_id,
    'admin@bellezatotal.mx',
    md5('Password123!'),
    'María',
    'González',
    'admin',
    true
);

-- Crear estilistas
INSERT INTO profesionales (
    organizacion_id,
    nombre_completo,
    tipo_profesional,
    email,
    activo,
    disponible_online
) VALUES
    (:org2_id, 'Laura Sánchez', 'estilista', 'laura@bellezatotal.mx', true, true),
    (:org2_id, 'Ana Rodríguez', 'estilista', 'ana@bellezatotal.mx', true, true);

-- Crear servicios
INSERT INTO servicios (organizacion_id, nombre, categoria, duracion_minutos, precio, activo)
SELECT :org2_id, nombre, categoria, duracion_minutos, precio_sugerido, true
FROM plantillas_servicios
WHERE tipo_industria = 'salon_belleza'
LIMIT 3;

\echo '   ✅ Salón de belleza configurado'

\echo ''

-- ====================================================================
-- 🏥 ESCENARIO 3: ONBOARDING DE CONSULTORIO MÉDICO
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🏥 ESCENARIO 3: ONBOARDING DE CONSULTORIO MÉDICO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Crear organización médica
INSERT INTO organizaciones (
    codigo_tenant,
    slug,
    nombre_comercial,
    razon_social,
    tipo_industria,
    email_admin,
    telefono,
    activo
) VALUES (
    'TEST-CONSULTORIO-PEREZ',
    'consultorio-dr-perez',
    'TEST_Consultorio Dr. Pérez',
    'Consultorio Médico Pérez S.C.',
    'consultorio_medico',
    'contacto@drperez.mx',
    '+525599887766',
    true
) RETURNING id
\gset org3_

-- Crear médico como profesional
INSERT INTO profesionales (
    organizacion_id,
    nombre_completo,
    tipo_profesional,
    email,
    activo,
    disponible_online,
    años_experiencia
) VALUES (
    :org3_id,
    'Dr. Roberto Pérez',
    'doctor_general',
    'dr.perez@drperez.mx',
    true,
    true,
    20
);

-- Crear servicios médicos
INSERT INTO servicios (organizacion_id, nombre, categoria, duracion_minutos, precio, activo)
SELECT :org3_id, nombre, categoria, duracion_minutos, precio_sugerido, true
FROM plantillas_servicios
WHERE tipo_industria = 'consultorio_medico'
LIMIT 2;

\echo '   ✅ Consultorio médico configurado'

\echo ''

-- ====================================================================
-- ✅ VALIDACIONES FINALES
-- ====================================================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ VALIDACIONES FINALES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

\echo '📊 Organizaciones creadas:'
SELECT
    '   → ' || nombre_comercial as organizacion,
    tipo_industria,
    CASE WHEN activo THEN '✅ Activo' ELSE '❌ Inactivo' END as estado
FROM organizaciones
WHERE codigo_tenant LIKE 'TEST-%'
ORDER BY id;

\echo ''

\echo '📦 Suscripciones asignadas:'
SELECT
    '   → ' || o.nombre_comercial as organizacion,
    o.plan_actual as plan,
    CASE WHEN o.activo THEN '✅ Activo' ELSE '❌ Inactivo' END as estado
FROM organizaciones o
WHERE codigo_tenant LIKE 'TEST-%'
ORDER BY o.id;

\echo ''

\echo '👥 Profesionales creados:'
SELECT
    '   → ' || p.nombre_completo as profesional,
    p.tipo_profesional,
    o.nombre_comercial as organizacion
FROM profesionales p
JOIN organizaciones o ON p.organizacion_id = o.id
WHERE o.codigo_tenant LIKE 'TEST-%'
ORDER BY o.id, p.id;

\echo ''

\echo '💼 Servicios creados:'
SELECT
    '   → ' || s.nombre as servicio,
    '$' || s.precio as precio,
    s.duracion_minutos || ' min' as duracion,
    o.nombre_comercial as organizacion
FROM servicios s
JOIN organizaciones o ON s.organizacion_id = o.id
WHERE o.codigo_tenant LIKE 'TEST-%'
ORDER BY o.id, s.id;

\echo ''

\echo '🔗 Asignaciones servicio-profesional:'
SELECT
    '   → ' || p.nombre_completo as profesional,
    COUNT(sp.servicio_id) as servicios_asignados
FROM servicios_profesionales sp
JOIN profesionales p ON sp.profesional_id = p.id
JOIN organizaciones o ON p.organizacion_id = o.id
WHERE o.codigo_tenant LIKE 'TEST-%'
GROUP BY p.id, p.nombre_completo
ORDER BY p.id;

\echo ''

-- ====================================================================
-- RESUMEN FINAL
-- ====================================================================

DO $$
DECLARE
    v_orgs INTEGER;
    v_users INTEGER;
    v_profs INTEGER;
    v_servs INTEGER;
    v_horarios INTEGER;
    v_asignaciones INTEGER;
BEGIN
    -- Contar elementos creados
    SELECT COUNT(*) INTO v_orgs FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%';
    SELECT COUNT(*) INTO v_users FROM usuarios WHERE organizacion_id IN (
        SELECT id FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%'
    );
    SELECT COUNT(*) INTO v_profs FROM profesionales WHERE organizacion_id IN (
        SELECT id FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%'
    );
    SELECT COUNT(*) INTO v_servs FROM servicios WHERE organizacion_id IN (
        SELECT id FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%'
    );
    SELECT COUNT(*) INTO v_horarios FROM horarios_profesionales WHERE organizacion_id IN (
        SELECT id FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%'
    );
    SELECT COUNT(*) INTO v_asignaciones FROM servicios_profesionales WHERE profesional_id IN (
        SELECT id FROM profesionales WHERE organizacion_id IN (
            SELECT id FROM organizaciones WHERE codigo_tenant LIKE 'TEST-%'
        )
    );

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📊 RESUMEN DE ONBOARDING';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Organizaciones creadas: %', v_orgs;
    RAISE NOTICE '✅ Usuarios creados: %', v_users;
    RAISE NOTICE '✅ Profesionales registrados: %', v_profs;
    RAISE NOTICE '✅ Servicios configurados: %', v_servs;
    RAISE NOTICE '✅ Horarios base definidos: %', v_horarios;
    RAISE NOTICE '✅ Asignaciones servicio-profesional: %', v_asignaciones;
    RAISE NOTICE '';

    IF v_orgs = 3 AND v_users >= 3 AND v_profs >= 3 AND v_servs >= 8 THEN
        RAISE NOTICE '🎉 ONBOARDING COMPLETADO EXITOSAMENTE';
    ELSE
        RAISE WARNING '⚠️  ONBOARDING INCOMPLETO - Revisar datos';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '💡 Siguiente paso: Ejecutar 03-test-agendamiento.sql';
END $$;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ TEST 02 COMPLETADO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
