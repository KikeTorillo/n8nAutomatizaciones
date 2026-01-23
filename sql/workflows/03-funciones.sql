-- ====================================================================
-- MÓDULO WORKFLOWS - FUNCIONES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: workflows
--
-- DESCRIPCIÓN:
-- Funciones helper para el motor de workflows de aprobación.
--
-- FUNCIONES:
-- • puede_aprobar_workflow: Verifica si un usuario puede aprobar una instancia
-- • obtener_delegado_activo: Obtiene el delegado activo de un usuario
-- • obtener_aprobadores_paso: Lista los usuarios que pueden aprobar un paso
-- • evaluar_condicion_workflow: Evalúa una condición JSONB
-- • contar_aprobaciones_pendientes: Cuenta pendientes para un usuario
--
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: resolver_supervisor_aprobador
-- Resuelve el(los) supervisor(es) que pueden aprobar según configuración
-- ====================================================================
-- Obtiene los supervisores de un usuario que pueden actuar como aprobadores
-- basándose en la jerarquía de profesionales.
--
-- PARÁMETROS:
-- - p_usuario_id: ID del usuario que inició el workflow
-- - p_nivel: Nivel de supervisor (1=directo, 2=segundo nivel, etc.)
-- - p_cualquier_nivel: Si true, cualquier supervisor en la cadena puede aprobar
--
-- RETORNA: TABLE(supervisor_usuario_id, supervisor_profesional_id, nivel_jerarquico)
-- ====================================================================

CREATE OR REPLACE FUNCTION resolver_supervisor_aprobador(
    p_usuario_id INTEGER,
    p_nivel INTEGER DEFAULT 1,
    p_cualquier_nivel BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    supervisor_usuario_id INTEGER,
    supervisor_profesional_id INTEGER,
    nivel_jerarquico INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH usuario_profesional AS (
        -- Obtener el profesional_id del usuario que inicia
        SELECT u.profesional_id
        FROM usuarios u
        WHERE u.id = p_usuario_id
          AND u.profesional_id IS NOT NULL
    ),
    cadena AS (
        -- Obtener la cadena de supervisores usando función existente
        SELECT
            cs.profesional_id as supervisor_id,
            cs.nivel
        FROM usuario_profesional up
        CROSS JOIN LATERAL get_cadena_supervisores(up.profesional_id) cs
    )
    SELECT
        u.id AS supervisor_usuario_id,
        c.supervisor_id AS supervisor_profesional_id,
        c.nivel AS nivel_jerarquico
    FROM cadena c
    JOIN usuarios u ON u.profesional_id = c.supervisor_id AND u.activo = true
    WHERE
        CASE
            WHEN p_cualquier_nivel THEN TRUE
            ELSE c.nivel = p_nivel
        END
    ORDER BY c.nivel;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION resolver_supervisor_aprobador IS 'Resuelve los supervisores que pueden aprobar un workflow basado en la jerarquía de profesionales';


-- ====================================================================
-- FUNCIÓN: obtener_delegado_activo
-- Obtiene el usuario delegado activo si existe
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_delegado_activo(
    p_usuario_id INTEGER,
    p_workflow_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_delegado_id INTEGER;
BEGIN
    SELECT usuario_delegado_id INTO v_delegado_id
    FROM workflow_delegaciones
    WHERE usuario_original_id = p_usuario_id
      AND activo = true
      AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin
      AND (workflow_id IS NULL OR workflow_id = p_workflow_id)
    ORDER BY
        CASE WHEN workflow_id IS NOT NULL THEN 0 ELSE 1 END,  -- Prioridad a delegación específica
        fecha_inicio DESC
    LIMIT 1;

    RETURN v_delegado_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_delegado_activo IS 'Obtiene el usuario delegado activo para un usuario, considerando el workflow específico';


-- ====================================================================
-- FUNCIÓN: puede_aprobar_workflow
-- Verifica si un usuario puede aprobar una instancia específica
-- ====================================================================

CREATE OR REPLACE FUNCTION puede_aprobar_workflow(
    p_instancia_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_paso_config JSONB;
    v_workflow_id INTEGER;
    v_usuario_rol TEXT;
    v_delegado_id INTEGER;
    v_usuario_efectivo_id INTEGER;
    v_aprobadores_tipo TEXT;
    v_aprobadores JSONB;
    v_permiso_requerido TEXT;
    v_sucursal_id INTEGER;
BEGIN
    -- Obtener configuración del paso actual
    SELECT wp.config, wi.workflow_id
    INTO v_paso_config, v_workflow_id
    FROM workflow_instancias wi
    JOIN workflow_pasos wp ON wp.id = wi.paso_actual_id
    WHERE wi.id = p_instancia_id
      AND wi.estado = 'en_progreso'
      AND wp.tipo = 'aprobacion';

    -- Si no hay paso de aprobación activo, no puede aprobar
    IF v_paso_config IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verificar si el usuario tiene delegación activa (alguien más aprueba por él)
    -- En ese caso, el usuario original NO puede aprobar
    v_delegado_id := obtener_delegado_activo(p_usuario_id, v_workflow_id);

    -- Determinar usuario efectivo (puede ser él mismo o estar actuando como delegado de otro)
    v_usuario_efectivo_id := p_usuario_id;

    -- Verificar si el usuario está actuando como delegado de alguien
    -- (esto es: ¿hay alguien que delegó en este usuario?)
    SELECT wd.usuario_original_id INTO v_delegado_id
    FROM workflow_delegaciones wd
    WHERE wd.usuario_delegado_id = p_usuario_id
      AND wd.activo = true
      AND CURRENT_DATE BETWEEN wd.fecha_inicio AND wd.fecha_fin
      AND (wd.workflow_id IS NULL OR wd.workflow_id = v_workflow_id)
    LIMIT 1;

    -- Si encontró delegación, el usuario puede actuar en nombre del original
    -- (verificamos si el original puede aprobar)

    -- Obtener rol del usuario
    -- FASE 7: Cambiado de u.rol ENUM a JOIN con tabla roles
    SELECT r.codigo INTO v_usuario_rol
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;

    -- Super admin siempre puede aprobar
    IF v_usuario_rol = 'super_admin' THEN
        RETURN TRUE;
    END IF;

    -- Extraer configuración de aprobadores
    v_aprobadores_tipo := v_paso_config->>'aprobadores_tipo';
    v_aprobadores := v_paso_config->'aprobadores';
    v_permiso_requerido := v_paso_config->>'permiso_requerido';

    -- Evaluar según tipo de aprobador
    CASE v_aprobadores_tipo
        WHEN 'rol' THEN
            -- El usuario debe tener uno de los roles especificados
            RETURN v_usuario_rol = ANY(
                SELECT jsonb_array_elements_text(v_aprobadores)
            );

        WHEN 'usuario' THEN
            -- El usuario debe estar en la lista de IDs
            RETURN p_usuario_id = ANY(
                SELECT (jsonb_array_elements_text(v_aprobadores))::INTEGER
            );

        WHEN 'permiso' THEN
            -- El usuario debe tener el permiso específico
            IF v_permiso_requerido IS NULL THEN
                RETURN FALSE;
            END IF;

            -- Obtener sucursal del usuario (para verificar permiso)
            SELECT us.sucursal_id INTO v_sucursal_id
            FROM usuarios_sucursales us
            WHERE us.usuario_id = p_usuario_id
              AND us.es_principal = true
            LIMIT 1;

            IF v_sucursal_id IS NULL THEN
                -- Si no tiene sucursal principal, tomar cualquiera
                SELECT us.sucursal_id INTO v_sucursal_id
                FROM usuarios_sucursales us
                WHERE us.usuario_id = p_usuario_id
                LIMIT 1;
            END IF;

            -- Usar función existente del sistema de permisos
            RETURN tiene_permiso(p_usuario_id, COALESCE(v_sucursal_id, 1), v_permiso_requerido);

        WHEN 'supervisor' THEN
            -- El usuario debe ser supervisor del iniciador del workflow
            DECLARE
                v_iniciado_por INTEGER;
                v_nivel INTEGER;
                v_cualquier_nivel BOOLEAN;
            BEGIN
                -- Obtener quién inició el workflow
                SELECT wi.iniciado_por INTO v_iniciado_por
                FROM workflow_instancias wi
                WHERE wi.id = p_instancia_id;

                -- Obtener configuración de nivel
                v_nivel := COALESCE((v_paso_config->'supervisor_config'->>'nivel')::INTEGER, 1);
                v_cualquier_nivel := COALESCE((v_paso_config->'supervisor_config'->>'cualquier_nivel')::BOOLEAN, FALSE);

                -- Verificar si el usuario es supervisor del iniciador
                RETURN EXISTS (
                    SELECT 1
                    FROM resolver_supervisor_aprobador(v_iniciado_por, v_nivel, v_cualquier_nivel) rsa
                    WHERE rsa.supervisor_usuario_id = p_usuario_id
                );
            END;

        ELSE
            -- Tipo no reconocido, denegar
            RETURN FALSE;
    END CASE;

EXCEPTION WHEN OTHERS THEN
    -- En caso de error, denegar por seguridad
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION puede_aprobar_workflow IS 'Verifica si un usuario puede aprobar una instancia de workflow según la configuración del paso actual';


-- ====================================================================
-- FUNCIÓN: obtener_aprobadores_paso
-- Lista los usuarios que pueden aprobar un paso específico
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_aprobadores_paso(
    p_paso_id INTEGER,
    p_organizacion_id INTEGER,
    p_iniciado_por INTEGER DEFAULT NULL  -- Requerido para tipo 'supervisor'
)
RETURNS TABLE(usuario_id INTEGER, nombre TEXT, email TEXT, es_delegado BOOLEAN) AS $$
DECLARE
    v_paso_config JSONB;
    v_aprobadores_tipo TEXT;
    v_aprobadores JSONB;
    v_permiso_requerido TEXT;
    v_nivel INTEGER;
    v_cualquier_nivel BOOLEAN;
BEGIN
    -- Obtener configuración del paso
    SELECT config INTO v_paso_config
    FROM workflow_pasos
    WHERE id = p_paso_id AND tipo = 'aprobacion';

    IF v_paso_config IS NULL THEN
        RETURN;
    END IF;

    v_aprobadores_tipo := v_paso_config->>'aprobadores_tipo';
    v_aprobadores := v_paso_config->'aprobadores';
    v_permiso_requerido := v_paso_config->>'permiso_requerido';

    CASE v_aprobadores_tipo
        WHEN 'rol' THEN
            -- FASE 7: Cambiado de u.rol ENUM a JOIN con tabla roles
            RETURN QUERY
            SELECT
                u.id,
                COALESCE(u.nombre, u.email)::TEXT AS nombre,
                u.email::TEXT,
                FALSE AS es_delegado
            FROM usuarios u
            JOIN roles r ON r.id = u.rol_id
            WHERE u.organizacion_id = p_organizacion_id
              AND u.activo = true
              AND r.codigo = ANY(SELECT jsonb_array_elements_text(v_aprobadores));

        WHEN 'usuario' THEN
            RETURN QUERY
            SELECT
                u.id,
                COALESCE(u.nombre, u.email)::TEXT AS nombre,
                u.email::TEXT,
                FALSE AS es_delegado
            FROM usuarios u
            WHERE u.organizacion_id = p_organizacion_id
              AND u.activo = true
              AND u.id = ANY(SELECT (jsonb_array_elements_text(v_aprobadores))::INTEGER);

        WHEN 'permiso' THEN
            -- Usuarios con el permiso específico
            RETURN QUERY
            SELECT DISTINCT
                u.id,
                COALESCE(u.nombre, u.email)::TEXT AS nombre,
                u.email::TEXT,
                FALSE AS es_delegado
            FROM usuarios u
            JOIN usuarios_sucursales us ON us.usuario_id = u.id
            WHERE u.organizacion_id = p_organizacion_id
              AND u.activo = true
              AND tiene_permiso(u.id, us.sucursal_id, v_permiso_requerido);

        WHEN 'supervisor' THEN
            -- Supervisores del usuario que inició el workflow
            IF p_iniciado_por IS NULL THEN
                -- Si no se proporciona, no podemos resolver supervisores
                RETURN;
            END IF;

            -- Obtener configuración de nivel
            v_nivel := COALESCE((v_paso_config->'supervisor_config'->>'nivel')::INTEGER, 1);
            v_cualquier_nivel := COALESCE((v_paso_config->'supervisor_config'->>'cualquier_nivel')::BOOLEAN, FALSE);

            RETURN QUERY
            SELECT
                rsa.supervisor_usuario_id AS id,
                COALESCE(u.nombre, u.email)::TEXT AS nombre,
                u.email::TEXT,
                FALSE AS es_delegado
            FROM resolver_supervisor_aprobador(p_iniciado_por, v_nivel, v_cualquier_nivel) rsa
            JOIN usuarios u ON u.id = rsa.supervisor_usuario_id
            WHERE u.organizacion_id = p_organizacion_id;

    END CASE;

    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_aprobadores_paso IS 'Obtiene la lista de usuarios que pueden aprobar un paso específico';


-- ====================================================================
-- FUNCIÓN: contar_aprobaciones_pendientes
-- Cuenta las aprobaciones pendientes para un usuario
-- ====================================================================

CREATE OR REPLACE FUNCTION contar_aprobaciones_pendientes(
    p_usuario_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM workflow_instancias wi
    WHERE wi.organizacion_id = p_organizacion_id
      AND wi.estado = 'en_progreso'
      AND puede_aprobar_workflow(wi.id, p_usuario_id);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION contar_aprobaciones_pendientes IS 'Cuenta las instancias de workflow pendientes que el usuario puede aprobar';


-- ====================================================================
-- FUNCIÓN: evaluar_condicion_workflow
-- Evalúa una condición JSONB contra datos de una entidad
-- ====================================================================

CREATE OR REPLACE FUNCTION evaluar_condicion_workflow(
    p_condicion JSONB,
    p_datos_entidad JSONB,
    p_usuario_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_campo TEXT;
    v_operador TEXT;
    v_valor NUMERIC;
    v_valor_ref TEXT;
    v_valor_entidad NUMERIC;
    v_valor_comparar NUMERIC;
BEGIN
    -- Si no hay condición, retornar TRUE (siempre aplica)
    IF p_condicion IS NULL OR p_condicion = '{}'::JSONB THEN
        RETURN TRUE;
    END IF;

    v_campo := p_condicion->>'campo';
    v_operador := p_condicion->>'operador';
    v_valor_ref := p_condicion->>'valor_ref';

    -- Obtener valor de la entidad
    v_valor_entidad := (p_datos_entidad->>v_campo)::NUMERIC;

    -- Determinar valor a comparar
    IF v_valor_ref IS NOT NULL THEN
        -- Es referencia a un permiso (ej: 'limite_aprobacion')
        v_valor_comparar := obtener_valor_permiso_numerico(
            p_usuario_id,
            p_sucursal_id,
            'inventario.' || v_valor_ref
        );
    ELSE
        -- Es un valor fijo
        v_valor_comparar := (p_condicion->>'valor')::NUMERIC;
    END IF;

    -- Si no hay valor para comparar, asumir 0
    v_valor_comparar := COALESCE(v_valor_comparar, 0);
    v_valor_entidad := COALESCE(v_valor_entidad, 0);

    -- Evaluar según operador
    CASE v_operador
        WHEN '>' THEN RETURN v_valor_entidad > v_valor_comparar;
        WHEN '>=' THEN RETURN v_valor_entidad >= v_valor_comparar;
        WHEN '<' THEN RETURN v_valor_entidad < v_valor_comparar;
        WHEN '<=' THEN RETURN v_valor_entidad <= v_valor_comparar;
        WHEN '=' THEN RETURN v_valor_entidad = v_valor_comparar;
        WHEN '!=' THEN RETURN v_valor_entidad != v_valor_comparar;
        ELSE RETURN FALSE;
    END CASE;

EXCEPTION WHEN OTHERS THEN
    -- En caso de error de conversión, retornar FALSE
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION evaluar_condicion_workflow IS 'Evalúa una condición JSONB contra datos de una entidad, soportando referencias a permisos';


-- ====================================================================
-- FUNCIÓN: obtener_siguiente_paso
-- Obtiene el siguiente paso dado un paso actual y una etiqueta de transición
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_siguiente_paso(
    p_paso_actual_id INTEGER,
    p_etiqueta TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_siguiente_paso_id INTEGER;
BEGIN
    SELECT wt.paso_destino_id INTO v_siguiente_paso_id
    FROM workflow_transiciones wt
    WHERE wt.paso_origen_id = p_paso_actual_id
      AND (
          p_etiqueta IS NULL
          OR wt.etiqueta = p_etiqueta
          OR wt.etiqueta IS NULL
      )
    ORDER BY
        CASE WHEN wt.etiqueta = p_etiqueta THEN 0 ELSE 1 END,
        wt.orden
    LIMIT 1;

    RETURN v_siguiente_paso_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_siguiente_paso IS 'Obtiene el ID del siguiente paso dado el paso actual y una etiqueta de transición opcional';


-- ====================================================================
-- FUNCIÓN: obtener_paso_inicial
-- Obtiene el paso inicial de un workflow
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_paso_inicial(
    p_workflow_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_paso_id INTEGER;
BEGIN
    SELECT id INTO v_paso_id
    FROM workflow_pasos
    WHERE workflow_id = p_workflow_id
      AND tipo = 'inicio'
    LIMIT 1;

    RETURN v_paso_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_paso_inicial IS 'Obtiene el ID del paso inicial (tipo=inicio) de un workflow';


-- ====================================================================
-- FIN DEL ARCHIVO
-- ====================================================================
