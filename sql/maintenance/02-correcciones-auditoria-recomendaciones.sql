-- ====================================================================
-- 🔧 CORRECCIONES Y MEJORAS - AUDITORÍA OCTUBRE 2025
-- ====================================================================
--
-- Este archivo contiene las correcciones recomendadas en la auditoría
-- de base de datos, organizadas por prioridad.
--
-- 📋 CONTENIDO:
-- • PRIORIDAD ALTA: Foreign Keys faltantes, consolidación de funciones
-- • PRIORIDAD MEDIA: Manejo de errores, límites plan empresarial
-- • PRIORIDAD BAJA: Archivado automático, preparación particionamiento
--
-- 🔄 ORDEN DE EJECUCIÓN: Después de 01-auditoria-correcciones.sql
-- ⚡ TIEMPO ESTIMADO: 2-3 horas implementación completa
-- ====================================================================

-- ====================================================================
-- ⚠️ PRIORIDAD ALTA - APLICAR INMEDIATAMENTE
-- ====================================================================

-- ====================================================================
-- FIX #1: AGREGAR FOREIGN KEYS FALTANTES EN TABLA USUARIOS
-- ====================================================================
-- PROBLEMA: usuarios.organizacion_id y usuarios.profesional_id no tienen FK
-- IMPACTO: Integridad referencial no forzada a nivel BD
-- TIEMPO: 30 minutos
-- ────────────────────────────────────────────────────────────────────

-- PASO 1: Verificar datos existentes (no debe haber huérfanos)
DO $$
DECLARE
    huerfanos_org INTEGER;
    huerfanos_prof INTEGER;
BEGIN
    -- Verificar usuarios con organizacion_id inválida
    SELECT COUNT(*) INTO huerfanos_org
    FROM usuarios u
    WHERE u.organizacion_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM organizaciones o WHERE o.id = u.organizacion_id);

    -- Verificar usuarios con profesional_id inválida
    SELECT COUNT(*) INTO huerfanos_prof
    FROM usuarios u
    WHERE u.profesional_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM profesionales p WHERE p.id = u.profesional_id);

    IF huerfanos_org > 0 THEN
        RAISE WARNING 'ATENCIÓN: % usuarios con organizacion_id huérfana', huerfanos_org;
        RAISE NOTICE 'Ejecutar: SELECT id, email, organizacion_id FROM usuarios WHERE organizacion_id NOT IN (SELECT id FROM organizaciones);';
    END IF;

    IF huerfanos_prof > 0 THEN
        RAISE WARNING 'ATENCIÓN: % usuarios con profesional_id huérfana', huerfanos_prof;
        RAISE NOTICE 'Ejecutar: SELECT id, email, profesional_id FROM usuarios WHERE profesional_id NOT IN (SELECT id FROM profesionales);';
    END IF;

    IF huerfanos_org = 0 AND huerfanos_prof = 0 THEN
        RAISE NOTICE '✅ No hay registros huérfanos. Seguro agregar FKs.';
    END IF;
END $$;

-- PASO 2: Agregar FK para usuarios.organizacion_id
ALTER TABLE usuarios
    DROP CONSTRAINT IF EXISTS fk_usuarios_organizacion;

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuarios_organizacion
    FOREIGN KEY (organizacion_id)
    REFERENCES organizaciones(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_usuarios_organizacion ON usuarios IS
'FK a organizaciones. ON DELETE CASCADE elimina usuarios al eliminar organización.
Excepto super_admin que tiene organizacion_id NULL.';

-- PASO 3: Agregar FK para usuarios.profesional_id
ALTER TABLE usuarios
    DROP CONSTRAINT IF EXISTS fk_usuarios_profesional;

ALTER TABLE usuarios
    ADD CONSTRAINT fk_usuarios_profesional
    FOREIGN KEY (profesional_id)
    REFERENCES profesionales(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_usuarios_profesional ON usuarios IS
'FK a profesionales. ON DELETE SET NULL preserva usuario al eliminar profesional.
Permite mantener cuenta de usuario aunque ya no sea profesional activo.';

-- PASO 4: Agregar FK para clientes.profesional_preferido_id (si falta)
ALTER TABLE clientes
    DROP CONSTRAINT IF EXISTS fk_clientes_profesional_preferido;

ALTER TABLE clientes
    ADD CONSTRAINT fk_clientes_profesional_preferido
    FOREIGN KEY (profesional_preferido_id)
    REFERENCES profesionales(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_clientes_profesional_preferido ON clientes IS
'FK a profesional preferido del cliente. SET NULL si profesional se elimina.';

-- ====================================================================
-- FIX #2: CONSOLIDAR FUNCIONES DE MÉTRICAS DUPLICADAS
-- ====================================================================
-- PROBLEMA: Dos funciones hacen lo mismo (actualizar_metricas_uso y actualizar_contadores_subscripcion)
-- IMPACTO: Confusión, posibles inconsistencias
-- TIEMPO: 1 hora
-- ────────────────────────────────────────────────────────────────────

-- PASO 1: Eliminar triggers duplicados antiguos
DROP TRIGGER IF EXISTS trigger_actualizar_contador_profesionales ON profesionales;
DROP TRIGGER IF EXISTS trigger_actualizar_contador_clientes ON clientes;
DROP TRIGGER IF EXISTS trigger_actualizar_contador_servicios ON servicios;
DROP TRIGGER IF EXISTS trigger_actualizar_contador_usuarios ON usuarios;

-- PASO 2: Eliminar función duplicada
DROP FUNCTION IF EXISTS actualizar_contadores_subscripcion();

COMMENT ON FUNCTION actualizar_metricas_uso() IS
'Función UNIFICADA para actualizar métricas de uso en tabla metricas_uso_organizacion.
Reemplaza a actualizar_contadores_subscripcion() (eliminada por duplicación).
Actualiza automáticamente contadores de: profesionales, clientes, servicios, usuarios, citas.
Resetea contador de citas mensualmente de forma automática.';

-- ====================================================================
-- 📋 PRIORIDAD MEDIA - APLICAR ANTES DE PRODUCCIÓN
-- ====================================================================

-- ====================================================================
-- FIX #3: MEJORAR MANEJO DE ERRORES EN FUNCIONES PL/pgSQL
-- ====================================================================
-- PROBLEMA: Algunas funciones no validan existencia de registros
-- IMPACTO: Errores confusos, comportamiento inesperado
-- TIEMPO: 2 horas
-- ────────────────────────────────────────────────────────────────────

-- Reemplazar función validar_coherencia_cita con mejor manejo de errores
CREATE OR REPLACE FUNCTION validar_coherencia_cita()
RETURNS TRIGGER AS $$
DECLARE
    cliente_org INTEGER;
    profesional_org INTEGER;
    servicio_org INTEGER;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL CLIENTE
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO cliente_org
    FROM clientes
    WHERE id = NEW.cliente_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente con ID % no existe', NEW.cliente_id
            USING HINT = 'Verificar que el cliente esté registrado en la base de datos',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF cliente_org != NEW.organizacion_id THEN
        RAISE EXCEPTION 'Incoherencia organizacional: cliente % (org:%) no pertenece a organización %',
            NEW.cliente_id, cliente_org, NEW.organizacion_id
            USING HINT = 'El cliente debe pertenecer a la misma organización que la cita';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL PROFESIONAL
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO profesional_org
    FROM profesionales
    WHERE id = NEW.profesional_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profesional con ID % no existe', NEW.profesional_id
            USING HINT = 'Verificar que el profesional esté registrado en la base de datos',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF profesional_org != NEW.organizacion_id THEN
        RAISE EXCEPTION 'Incoherencia organizacional: profesional % (org:%) no pertenece a organización %',
            NEW.profesional_id, profesional_org, NEW.organizacion_id
            USING HINT = 'El profesional debe pertenecer a la misma organización que la cita';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL SERVICIO
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO servicio_org
    FROM servicios
    WHERE id = NEW.servicio_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Servicio con ID % no existe', NEW.servicio_id
            USING HINT = 'Verificar que el servicio esté registrado en la base de datos',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF servicio_org != NEW.organizacion_id THEN
        RAISE EXCEPTION 'Incoherencia organizacional: servicio % (org:%) no pertenece a organización %',
            NEW.servicio_id, servicio_org, NEW.organizacion_id
            USING HINT = 'El servicio debe pertenecer a la misma organización que la cita';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_coherencia_cita() IS
'Versión mejorada con validación de existencia de registros.
Valida que cliente, profesional y servicio existan y pertenezcan a la misma organización.
Incluye mensajes de error descriptivos con HINT y ERRCODE apropiados.';

-- Reemplazar función validar_coherencia_horario con mejor manejo de errores
CREATE OR REPLACE FUNCTION validar_coherencia_horario()
RETURNS TRIGGER AS $$
DECLARE
    profesional_org INTEGER;
    servicio_org INTEGER;
    cita_org INTEGER;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL PROFESIONAL
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO profesional_org
    FROM profesionales
    WHERE id = NEW.profesional_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profesional con ID % no existe', NEW.profesional_id
            USING HINT = 'Verificar que el profesional esté registrado',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF NEW.organizacion_id != profesional_org THEN
        RAISE EXCEPTION 'Incoherencia organizacional: profesional % (org:%) debe pertenecer a organización %',
            NEW.profesional_id, profesional_org, NEW.organizacion_id
            USING HINT = 'El profesional debe pertenecer a la organización del horario';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR SERVICIO SI ESTÁ ESPECIFICADO
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.servicio_id IS NOT NULL THEN
        SELECT organizacion_id INTO servicio_org
        FROM servicios
        WHERE id = NEW.servicio_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Servicio con ID % no existe', NEW.servicio_id
                USING HINT = 'Verificar que el servicio esté registrado',
                      ERRCODE = 'foreign_key_violation';
        END IF;

        IF NEW.organizacion_id != servicio_org THEN
            RAISE EXCEPTION 'Incoherencia organizacional: servicio % (org:%) debe pertenecer a organización %',
                NEW.servicio_id, servicio_org, NEW.organizacion_id
                USING HINT = 'El servicio debe pertenecer a la organización del horario';
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR CITA SI ESTÁ ESPECIFICADA
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.cita_id IS NOT NULL THEN
        SELECT organizacion_id INTO cita_org
        FROM citas
        WHERE id = NEW.cita_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cita con ID % no existe', NEW.cita_id
                USING HINT = 'Verificar que la cita esté registrada',
                      ERRCODE = 'foreign_key_violation';
        END IF;

        IF NEW.organizacion_id != cita_org THEN
            RAISE EXCEPTION 'Incoherencia organizacional: cita % (org:%) debe pertenecer a organización %',
                NEW.cita_id, cita_org, NEW.organizacion_id
                USING HINT = 'La cita debe pertenecer a la organización del horario';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_coherencia_horario() IS
'Versión mejorada con validación de existencia de registros.
Valida coherencia organizacional entre profesional, servicio (opcional) y cita (opcional).
Incluye mensajes de error descriptivos con HINT y ERRCODE.';

-- ====================================================================
-- FIX #4: DEFINIR LÍMITES PARA PLAN EMPRESARIAL
-- ====================================================================
-- PROBLEMA: Plan empresarial tiene límites NULL (ilimitados)
-- IMPACTO: Falta de control de recursos
-- TIEMPO: 30 minutos
-- ────────────────────────────────────────────────────────────────────

-- Opción A: Definir límites generosos pero controlados
UPDATE planes_subscripcion
SET
    limite_profesionales = 100,      -- 100 profesionales
    limite_clientes = 50000,         -- 50K clientes
    limite_servicios = 500,          -- 500 servicios
    limite_citas_mes = 10000,        -- 10K citas/mes
    actualizado_en = NOW()
WHERE codigo_plan = 'empresarial';

-- Agregar plan "custom" para casos verdaderamente ilimitados
INSERT INTO planes_subscripcion (
    codigo_plan, nombre_plan, descripcion,
    precio_mensual, precio_anual, moneda,
    limite_profesionales, limite_clientes, limite_servicios,
    limite_usuarios, limite_citas_mes,
    funciones_habilitadas, orden_display, activo
) VALUES (
    'custom',
    'Plan Personalizado',
    'Plan a medida para organizaciones con necesidades específicas',
    0.00,  -- Precio negociado caso por caso
    NULL,
    'MXN',
    NULL,  -- Ilimitado profesionales
    NULL,  -- Ilimitado clientes
    NULL,  -- Ilimitado servicios
    NULL,  -- Ilimitado usuarios
    NULL,  -- Ilimitado citas
    '{
        "whatsapp_integration": true,
        "advanced_reports": true,
        "custom_branding": true,
        "api_access": true,
        "dedicated_support": true,
        "custom_features": true,
        "sla_guarantee": true
    }'::jsonb,
    5,     -- Orden display
    false  -- No visible públicamente, solo por negociación
) ON CONFLICT (codigo_plan) DO NOTHING;

COMMENT ON TABLE planes_subscripcion IS
'Planes de subscripción del sistema SaaS.
- trial: Gratuito 30 días, límites bajos
- basico: Para pequeños negocios (5 profesionales)
- profesional: Para negocios en crecimiento (15 profesionales)
- empresarial: Para empresas grandes (100 profesionales, 50K clientes)
- custom: Plan personalizado negociado (límites según necesidades)';

-- ====================================================================
-- 🔄 PRIORIDAD BAJA - IMPLEMENTAR EN FASE 2
-- ====================================================================

-- ====================================================================
-- FIX #5: FUNCIÓN DE ARCHIVADO AUTOMÁTICO DE EVENTOS ANTIGUOS
-- ====================================================================
-- PROBLEMA: eventos_sistema crecerá indefinidamente
-- IMPACTO: Performance degradado en queries de auditoría
-- TIEMPO: 3 horas
-- ────────────────────────────────────────────────────────────────────

-- PASO 1: Crear tabla de archivo
CREATE TABLE IF NOT EXISTS eventos_sistema_archivo (
    LIKE eventos_sistema INCLUDING ALL
);

COMMENT ON TABLE eventos_sistema_archivo IS
'Tabla de archivo para eventos_sistema antiguos (>12 meses).
Estructura idéntica a eventos_sistema pero sin RLS ni triggers.
Solo para consulta histórica y compliance.';

-- PASO 2: Crear función de archivado
CREATE OR REPLACE FUNCTION archivar_eventos_antiguos(
    p_meses_antiguedad INTEGER DEFAULT 12
)
RETURNS TABLE(
    eventos_archivados BIGINT,
    eventos_eliminados BIGINT,
    fecha_corte TIMESTAMPTZ
) AS $$
DECLARE
    v_fecha_corte TIMESTAMPTZ;
    v_archivados BIGINT;
    v_eliminados BIGINT;
BEGIN
    -- Calcular fecha de corte
    v_fecha_corte := NOW() - (p_meses_antiguedad || ' months')::INTERVAL;

    RAISE NOTICE 'Archivando eventos anteriores a: %', v_fecha_corte;

    -- Insertar en tabla de archivo (con bypass RLS)
    PERFORM set_config('app.bypass_rls', 'true', true);

    INSERT INTO eventos_sistema_archivo
    SELECT * FROM eventos_sistema
    WHERE creado_en < v_fecha_corte
    ON CONFLICT (id) DO NOTHING;  -- Por si ya existen

    GET DIAGNOSTICS v_archivados = ROW_COUNT;

    -- Eliminar de tabla principal
    DELETE FROM eventos_sistema
    WHERE creado_en < v_fecha_corte;

    GET DIAGNOSTICS v_eliminados = ROW_COUNT;

    PERFORM set_config('app.bypass_rls', 'false', true);

    -- Retornar estadísticas
    RETURN QUERY SELECT v_archivados, v_eliminados, v_fecha_corte;

    RAISE NOTICE '✅ Archivados: % eventos | Eliminados: % eventos',
                 v_archivados, v_eliminados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archivar_eventos_antiguos(INTEGER) IS
'Archiva eventos antiguos de eventos_sistema a eventos_sistema_archivo.
Por defecto archiva eventos >12 meses. Ejecutar mensualmente via cron.
Ejemplo: SELECT * FROM archivar_eventos_antiguos(12);';

-- PASO 3: Función de limpieza de citas antiguas
CREATE OR REPLACE FUNCTION archivar_citas_antiguas(
    p_meses_antiguedad INTEGER DEFAULT 24
)
RETURNS TABLE(
    citas_archivadas BIGINT,
    fecha_corte DATE
) AS $$
DECLARE
    v_fecha_corte DATE;
    v_archivadas BIGINT;
BEGIN
    v_fecha_corte := CURRENT_DATE - (p_meses_antiguedad || ' months')::INTERVAL;

    RAISE NOTICE 'Marcando como archivadas citas anteriores a: %', v_fecha_corte;

    -- Agregar campo estado_archivo si no existe
    ALTER TABLE citas ADD COLUMN IF NOT EXISTS archivada BOOLEAN DEFAULT FALSE;

    -- Marcar como archivadas (soft delete)
    UPDATE citas
    SET archivada = TRUE,
        actualizado_en = NOW()
    WHERE fecha_cita < v_fecha_corte
      AND estado IN ('completada', 'cancelada', 'no_asistio')
      AND archivada = FALSE;

    GET DIAGNOSTICS v_archivadas = ROW_COUNT;

    RETURN QUERY SELECT v_archivadas, v_fecha_corte;

    RAISE NOTICE '✅ Citas archivadas: %', v_archivadas;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archivar_citas_antiguas(INTEGER) IS
'Marca citas antiguas completadas/canceladas como archivadas (soft delete).
Por defecto archiva citas >24 meses. Ejecutar trimestralmente.
Las citas archivadas pueden excluirse de queries con WHERE archivada = FALSE.';

-- ====================================================================
-- FIX #6: PREPARACIÓN PARA PARTICIONAMIENTO FUTURO
-- ====================================================================
-- PROBLEMA: Tablas crecerán a >1M registros eventualmente
-- IMPACTO: Performance en queries y mantenimiento
-- TIEMPO: 4 horas (cuando sea necesario)
-- ────────────────────────────────────────────────────────────────────

-- NOTA: Este código está COMENTADO. Solo ejecutar cuando:
-- 1. eventos_sistema > 10M registros
-- 2. citas > 1M registros
-- 3. historial_subscripciones > 500K registros

/*
-- ═══════════════════════════════════════════════════════════════════
-- PARTICIONAMIENTO DE EVENTOS_SISTEMA POR MES
-- ═══════════════════════════════════════════════════════════════════

-- PASO 1: Crear tabla particionada
CREATE TABLE eventos_sistema_particionada (
    LIKE eventos_sistema INCLUDING ALL
) PARTITION BY RANGE (creado_en);

-- PASO 2: Crear particiones para 12 meses
-- Automatizar con función generadora
CREATE OR REPLACE FUNCTION crear_particiones_eventos_sistema(
    p_meses_adelante INTEGER DEFAULT 12
)
RETURNS INTEGER AS $$
DECLARE
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
    v_nombre_particion TEXT;
    v_contador INTEGER := 0;
BEGIN
    FOR i IN 0..p_meses_adelante LOOP
        v_fecha_inicio := DATE_TRUNC('month', CURRENT_DATE + (i || ' months')::INTERVAL);
        v_fecha_fin := DATE_TRUNC('month', CURRENT_DATE + ((i+1) || ' months')::INTERVAL);
        v_nombre_particion := 'eventos_sistema_' || TO_CHAR(v_fecha_inicio, 'YYYY_MM');

        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF eventos_sistema_particionada
             FOR VALUES FROM (%L) TO (%L)',
            v_nombre_particion,
            v_fecha_inicio,
            v_fecha_fin
        );

        v_contador := v_contador + 1;
    END LOOP;

    RETURN v_contador;
END;
$$ LANGUAGE plpgsql;

-- Crear particiones para próximos 12 meses
SELECT crear_particiones_eventos_sistema(12);

-- PASO 3: Migrar datos existentes
INSERT INTO eventos_sistema_particionada
SELECT * FROM eventos_sistema;

-- PASO 4: Renombrar tablas
ALTER TABLE eventos_sistema RENAME TO eventos_sistema_old;
ALTER TABLE eventos_sistema_particionada RENAME TO eventos_sistema;

-- PASO 5: Recrear triggers y políticas RLS en nueva tabla
-- [Código de triggers y RLS aquí]

RAISE NOTICE '✅ Particionamiento de eventos_sistema completado';
*/

-- ====================================================================
-- FIX #7: ÍNDICES MEJORADOS PARA QUERIES ESPECÍFICAS
-- ====================================================================
-- MEJORA: Optimizar índices parciales con mejor selectividad
-- TIEMPO: 1 hora
-- ────────────────────────────────────────────────────────────────────

-- Mejorar índice de recordatorios con fecha
DROP INDEX IF EXISTS idx_citas_recordatorios;

-- Nota: No podemos usar CURRENT_DATE en WHERE de índice parcial (no es IMMUTABLE)
-- Usamos un índice sin restricción de fecha, que sigue siendo eficiente
CREATE INDEX idx_citas_recordatorios_pendientes
ON citas (fecha_recordatorio, fecha_cita, organizacion_id, cliente_id)
WHERE recordatorio_enviado = FALSE
  AND estado = 'confirmada';

COMMENT ON INDEX idx_citas_recordatorios_pendientes IS
'Índice optimizado para job de envío de recordatorios.
Incluye fecha_cita y organizacion_id en el índice.
Incluye cliente_id para join con datos de contacto.
Índice parcial: solo citas confirmadas sin recordatorio enviado.
Nota: Filtro por fecha se aplica en query (WHERE fecha_cita >= CURRENT_DATE).';

-- Índice para búsqueda de citas por rango de fechas
CREATE INDEX IF NOT EXISTS idx_citas_rango_fechas
ON citas (organizacion_id, fecha_cita, estado)
INCLUDE (cliente_id, profesional_id, servicio_id, hora_inicio, hora_fin);

COMMENT ON INDEX idx_citas_rango_fechas IS
'Índice covering para búsqueda de citas por rango de fechas.
INCLUDE columns evita acceso a tabla principal (index-only scan).
Ideal para reportes y dashboards que muestran agenda semanal/mensual.';

-- Índice para profesionales disponibles
CREATE INDEX IF NOT EXISTS idx_profesionales_disponibles
ON profesionales (organizacion_id, activo, disponible_online, tipo_profesional)
INCLUDE (nombre_completo, calificacion_promedio, especialidades)
WHERE activo = TRUE AND disponible_online = TRUE;

COMMENT ON INDEX idx_profesionales_disponibles IS
'Índice covering para búsqueda de profesionales disponibles.
INCLUDE columns optimiza listados sin acceso a tabla.
Usado en: Asignación de citas, búsqueda de disponibilidad.';

-- ====================================================================
-- VERIFICACIÓN FINAL DE TODAS LAS CORRECCIONES
-- ====================================================================

DO $$
DECLARE
    fk_count INTEGER;
    func_duplicada BOOLEAN;
    plan_custom_existe BOOLEAN;
    indice_mejorado BOOLEAN;
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'VERIFICANDO CORRECCIONES APLICADAS...';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    -- Verificar FKs agregadas
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_name IN ('fk_usuarios_organizacion', 'fk_usuarios_profesional', 'fk_clientes_profesional_preferido')
      AND constraint_type = 'FOREIGN KEY';

    IF fk_count >= 3 THEN
        RAISE NOTICE '✅ Foreign Keys agregadas: %/3', fk_count;
    ELSE
        RAISE WARNING '⚠️  Faltan Foreign Keys: %/3 encontradas', fk_count;
    END IF;

    -- Verificar función duplicada eliminada
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'actualizar_contadores_subscripcion'
    ) INTO func_duplicada;

    IF NOT func_duplicada THEN
        RAISE NOTICE '✅ Función duplicada eliminada correctamente';
    ELSE
        RAISE WARNING '⚠️  Función actualizar_contadores_subscripcion todavía existe';
    END IF;

    -- Verificar plan custom creado
    SELECT EXISTS (
        SELECT 1 FROM planes_subscripcion WHERE codigo_plan = 'custom'
    ) INTO plan_custom_existe;

    IF plan_custom_existe THEN
        RAISE NOTICE '✅ Plan "custom" creado exitosamente';
    ELSE
        RAISE WARNING '⚠️  Plan "custom" no fue creado';
    END IF;

    -- Verificar índice mejorado
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_citas_recordatorios_pendientes'
    ) INTO indice_mejorado;

    IF indice_mejorado THEN
        RAISE NOTICE '✅ Índices mejorados creados';
    ELSE
        RAISE WARNING '⚠️  Índices mejorados no fueron creados';
    END IF;

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ CORRECCIONES Y MEJORAS COMPLETADAS';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE 'PRÓXIMOS PASOS:';
    RAISE NOTICE '1. Ejecutar ANALYZE VERBOSE; para actualizar estadísticas';
    RAISE NOTICE '2. Monitorear performance con pg_stat_user_indexes';
    RAISE NOTICE '3. Configurar cron job para archivar_eventos_antiguos() mensualmente';
    RAISE NOTICE '4. Revisar logs de aplicación para errores mejorados';
    RAISE NOTICE '';
END $$;
