-- ====================================================================
-- MÓDULO NÚCLEO: FUNCIONES PL/pgSQL
-- ====================================================================
-- Funciones para gestión de subscripciones y métricas de uso.
--
-- FUNCIONES IMPLEMENTADAS:
-- • verificar_limite_plan(): Valida si se puede crear un recurso
-- • tiene_caracteristica_habilitada(): Verifica features por plan
-- • actualizar_metricas_uso(): Actualiza contadores automáticamente
-- • registrar_cambio_subscripcion(): Auditoría de cambios
--
-- Migrado de: sql/schema/10-subscriptions-table.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: verificar_limite_plan
-- ====================================================================
-- Verifica si una organización puede crear más recursos según su plan.
-- Consulta la tabla planes_subscripcion JOIN subscripciones y compara
-- con los contadores de metricas_uso_organizacion.
--
-- Parámetros:
-- • p_organizacion_id: ID de la organización
-- • p_tipo_recurso: 'profesionales', 'clientes', 'servicios', 'usuarios', 'citas_mes'
-- • p_cantidad_adicional: Cuántos recursos se quieren agregar (default 1)
--
-- Retorna:
-- • TRUE si se puede crear el recurso (dentro del límite o plan ilimitado)
-- • FALSE si se excedería el límite del plan
-- ====================================================================
CREATE OR REPLACE FUNCTION verificar_limite_plan(
    p_organizacion_id INTEGER,
    p_tipo_recurso VARCHAR(50),
    p_cantidad_adicional INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limite INTEGER;
    v_uso_actual INTEGER;
BEGIN
    -- Obtener límite del plan actual
    SELECT
        CASE p_tipo_recurso
            WHEN 'profesionales' THEN ps.limite_profesionales
            WHEN 'clientes' THEN ps.limite_clientes
            WHEN 'servicios' THEN ps.limite_servicios
            WHEN 'usuarios' THEN ps.limite_usuarios
            WHEN 'citas_mes' THEN ps.limite_citas_mes
            ELSE NULL
        END
    INTO v_limite
    FROM subscripciones s
    JOIN planes_subscripcion ps ON s.plan_id = ps.id
    WHERE s.organizacion_id = p_organizacion_id AND s.activa = true;

    -- Si no hay subscripción activa, denegar
    IF v_limite IS NULL AND NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Si no hay límite (NULL), permitir (plan ilimitado)
    IF v_limite IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Obtener uso actual desde tabla de métricas
    SELECT
        CASE p_tipo_recurso
            WHEN 'profesionales' THEN uso_profesionales
            WHEN 'clientes' THEN uso_clientes
            WHEN 'servicios' THEN uso_servicios
            WHEN 'usuarios' THEN uso_usuarios
            WHEN 'citas_mes' THEN uso_citas_mes_actual
            ELSE 0
        END
    INTO v_uso_actual
    FROM metricas_uso_organizacion
    WHERE organizacion_id = p_organizacion_id;

    -- Si no existe registro de métricas, crear uno
    IF NOT FOUND THEN
        INSERT INTO metricas_uso_organizacion (organizacion_id)
        VALUES (p_organizacion_id);
        v_uso_actual := 0;
    END IF;

    -- Verificar límite
    RETURN (v_uso_actual + p_cantidad_adicional) <= v_limite;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- FUNCIÓN: tiene_caracteristica_habilitada
-- ====================================================================
-- Verifica si una organización tiene habilitada una característica
-- específica según su plan actual.
--
-- Parámetros:
-- • p_organizacion_id: ID de la organización
-- • p_caracteristica: Nombre de la feature (e.g., 'whatsapp_integration')
--
-- Retorna:
-- • TRUE si la característica está habilitada en el plan
-- • FALSE si no está habilitada o no hay subscripción activa
-- ====================================================================
CREATE OR REPLACE FUNCTION tiene_caracteristica_habilitada(
    p_organizacion_id INTEGER,
    p_caracteristica VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_funciones JSONB;
BEGIN
    SELECT ps.funciones_habilitadas
    INTO v_funciones
    FROM subscripciones s
    JOIN planes_subscripcion ps ON s.plan_id = ps.id
    WHERE s.organizacion_id = p_organizacion_id AND s.activa = true;

    -- Si no existe la subscripción, negar acceso
    IF v_funciones IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verificar si la característica está habilitada
    RETURN COALESCE((v_funciones ->> p_caracteristica)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- FUNCIÓN: actualizar_metricas_uso
-- ====================================================================
-- Función trigger que actualiza automáticamente los contadores
-- en metricas_uso_organizacion cuando se insertan/actualizan/eliminan
-- recursos en las tablas de profesionales, clientes, servicios, usuarios o citas.
--
-- Se ejecuta AFTER INSERT/UPDATE/DELETE en:
-- • profesionales → uso_profesionales
-- • clientes → uso_clientes
-- • servicios → uso_servicios
-- • usuarios → uso_usuarios
-- • citas → uso_citas_mes_actual (reseteo mensual automático)
--
-- Retorna: NEW o OLD según la operación
-- ====================================================================
CREATE OR REPLACE FUNCTION actualizar_metricas_uso()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id INTEGER;
    v_mes_actual DATE;
BEGIN
    v_org_id := COALESCE(NEW.organizacion_id, OLD.organizacion_id);

    -- Si es NULL (super_admin), no hacer nada
    IF v_org_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    v_mes_actual := DATE_TRUNC('month', CURRENT_DATE);

    -- Asegurar que existe registro de métricas
    INSERT INTO metricas_uso_organizacion (organizacion_id, mes_actual)
    VALUES (v_org_id, v_mes_actual)
    ON CONFLICT (organizacion_id) DO NOTHING;

    -- Actualizar contadores según la tabla
    IF TG_TABLE_NAME = 'profesionales' THEN
        UPDATE metricas_uso_organizacion
        SET
            uso_profesionales = (
                SELECT COUNT(*) FROM profesionales
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;

    ELSIF TG_TABLE_NAME = 'clientes' THEN
        UPDATE metricas_uso_organizacion
        SET
            uso_clientes = (
                SELECT COUNT(*) FROM clientes
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;

    ELSIF TG_TABLE_NAME = 'servicios' THEN
        UPDATE metricas_uso_organizacion
        SET
            uso_servicios = (
                SELECT COUNT(*) FROM servicios
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;

    ELSIF TG_TABLE_NAME = 'usuarios' THEN
        UPDATE metricas_uso_organizacion
        SET
            uso_usuarios = (
                SELECT COUNT(*) FROM usuarios
                WHERE organizacion_id = v_org_id AND activo = true
            ),
            ultima_actualizacion = NOW()
        WHERE organizacion_id = v_org_id;

    ELSIF TG_TABLE_NAME = 'citas' THEN
        -- Solo para citas del mes actual
        WITH citas_mes AS (
            SELECT COUNT(*) as total
            FROM citas
            WHERE organizacion_id = v_org_id
            AND DATE_TRUNC('month', fecha_cita) = v_mes_actual
        )
        UPDATE metricas_uso_organizacion
        SET
            uso_citas_mes_actual = citas_mes.total,
            max_citas_mes = GREATEST(max_citas_mes, citas_mes.total),
            mes_max_citas = CASE
                WHEN citas_mes.total > max_citas_mes THEN v_mes_actual
                ELSE mes_max_citas
            END,
            ultima_actualizacion = NOW()
        FROM citas_mes
        WHERE organizacion_id = v_org_id;

        -- Resetear contador si cambió el mes
        UPDATE metricas_uso_organizacion
        SET
            uso_citas_mes_actual = 0,
            mes_actual = v_mes_actual
        WHERE organizacion_id = v_org_id
        AND mes_actual < v_mes_actual;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- FUNCIÓN: registrar_cambio_subscripcion
-- ====================================================================
-- Función trigger que registra automáticamente en historial_subscripciones
-- los cambios importantes:
-- • Creación de subscripción
-- • Cambio de plan (upgrade/downgrade)
-- • Cancelación
-- • Reactivación
--
-- Se ejecuta AFTER INSERT/UPDATE en subscripciones
--
-- Retorna: NEW o OLD según la operación
-- ====================================================================
CREATE OR REPLACE FUNCTION registrar_cambio_subscripcion()
RETURNS TRIGGER AS $$
DECLARE
    plan_codigo_nuevo text;
    plan_codigo_anterior text;
BEGIN
    -- Solo registrar cambios significativos
    IF TG_OP = 'INSERT' THEN
        -- Obtener código del plan nuevo
        SELECT codigo_plan INTO plan_codigo_nuevo
        FROM planes_subscripcion WHERE id = NEW.plan_id;

        INSERT INTO historial_subscripciones (
            organizacion_id, subscripcion_id, tipo_evento,
            plan_nuevo, precio_nuevo, motivo, iniciado_por
        ) VALUES (
            NEW.organizacion_id, NEW.id, 'creacion',
            plan_codigo_nuevo::plan_tipo, NEW.precio_actual, 'Subscripción inicial', 'sistema'
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Obtener códigos de planes
        SELECT codigo_plan INTO plan_codigo_anterior
        FROM planes_subscripcion WHERE id = OLD.plan_id;
        SELECT codigo_plan INTO plan_codigo_nuevo
        FROM planes_subscripcion WHERE id = NEW.plan_id;

        -- Cambio de plan
        IF OLD.plan_id != NEW.plan_id THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                plan_anterior, plan_nuevo, precio_anterior, precio_nuevo,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id,
                CASE WHEN NEW.plan_id > OLD.plan_id THEN 'upgrade' ELSE 'downgrade' END,
                plan_codigo_anterior::plan_tipo, plan_codigo_nuevo::plan_tipo,
                OLD.precio_actual, NEW.precio_actual,
                'Cambio de plan', 'usuario'
            );
        END IF;

        -- Cancelación
        IF OLD.activa = true AND NEW.activa = false THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id, 'cancelacion',
                COALESCE(NEW.motivo_cancelacion, 'Sin motivo especificado'), 'usuario'
            );
        END IF;

        -- Reactivación
        IF OLD.activa = false AND NEW.activa = true THEN
            INSERT INTO historial_subscripciones (
                organizacion_id, subscripcion_id, tipo_evento,
                motivo, iniciado_por
            ) VALUES (
                NEW.organizacion_id, NEW.id, 'reactivacion',
                'Subscripción reactivada', 'usuario'
            );
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON FUNCTION verificar_limite_plan IS
'Valida si una organización puede crear más recursos según límites de su plan.
Usado por middleware subscription.js antes de INSERT.';

COMMENT ON FUNCTION tiene_caracteristica_habilitada IS
'Verifica si una organización tiene acceso a una feature específica.
Usado para control de acceso a funcionalidades premium.';

COMMENT ON FUNCTION actualizar_metricas_uso IS
'Trigger function que mantiene actualizada la tabla metricas_uso_organizacion.
Se ejecuta automáticamente en INSERT/UPDATE/DELETE de recursos.';

COMMENT ON FUNCTION registrar_cambio_subscripcion IS
'Trigger function que audita cambios en subscripciones.
Registra creación, upgrades, downgrades, cancelaciones y reactivaciones.';
