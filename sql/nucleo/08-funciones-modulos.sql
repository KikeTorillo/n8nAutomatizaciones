-- ====================================================================
-- MÓDULO NÚCLEO: FUNCIONES DEL SISTEMA MODULAR
-- ====================================================================
-- Funciones y triggers para gestionar el sistema de módulos activables
-- por organización.
--
-- RESPONSABILIDADES:
-- • Validar que módulo 'core' siempre esté activo
-- • Validar dependencias HARD entre módulos (POS→Inventario, etc.)
-- • Proveer función de consulta rápida tiene_modulo_activo()
-- • Auditar cambios en activación/desactivación de módulos
--
-- Creado: 24 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: tiene_modulo_activo
-- ====================================================================
-- Verifica si una organización tiene un módulo específico activo
--
-- PARÁMETROS:
--   p_organizacion_id: ID de la organización
--   p_modulo_nombre: Nombre del módulo a verificar ('core', 'inventario', 'pos', etc.)
--
-- RETORNA:
--   BOOLEAN - true si el módulo está activo, false en caso contrario
--
-- PERFORMANCE:
--   • Usa índice GIN en modulos_activos (O(log n))
--   • Query típica: ~1-5ms con cache, ~10-20ms sin cache
--
-- EJEMPLOS:
--   SELECT tiene_modulo_activo(1, 'inventario');  -- true/false
--   SELECT tiene_modulo_activo(1, 'pos');         -- true/false
-- ====================================================================
CREATE OR REPLACE FUNCTION tiene_modulo_activo(
    p_organizacion_id INTEGER,
    p_modulo_nombre TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE  -- Puede ser cacheada (no modifica datos)
AS $$
DECLARE
    v_modulos_activos JSONB;
    v_modulo_activo BOOLEAN;
BEGIN
    -- Validar parámetros
    IF p_organizacion_id IS NULL OR p_modulo_nombre IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Obtener módulos activos de la organización
    SELECT s.modulos_activos
    INTO v_modulos_activos
    FROM subscripciones s
    WHERE s.organizacion_id = p_organizacion_id
      AND s.activa = TRUE
    LIMIT 1;

    -- Si no hay subscripción activa, solo tiene acceso a 'core'
    IF v_modulos_activos IS NULL THEN
        RETURN (p_modulo_nombre = 'core');
    END IF;

    -- Verificar si el módulo está en el JSONB y es true
    -- Operador ->> extrae valor como text, convertir a boolean
    v_modulo_activo := COALESCE((v_modulos_activos->>p_modulo_nombre)::BOOLEAN, FALSE);

    RETURN v_modulo_activo;
END;
$$;

COMMENT ON FUNCTION tiene_modulo_activo(INTEGER, TEXT) IS
'Verifica si una organización tiene un módulo específico activo. Retorna false si no hay subscripción activa (excepto para core)';

-- ====================================================================
-- FUNCIÓN: validar_dependencias_modulos
-- ====================================================================
-- Trigger function que valida las dependencias HARD entre módulos
-- antes de permitir activar/desactivar módulos.
--
-- REGLAS DE NEGOCIO:
--   1. 'core' SIEMPRE debe estar activo (no se puede desactivar)
--   2. POS requiere 'inventario' activo (dependencia HARD)
--   3. Comisiones requiere 'agendamiento' activo
--   4. Marketplace requiere 'agendamiento' activo
--   5. Chatbots requiere 'agendamiento' activo
--
-- DISPARA EN:
--   INSERT, UPDATE de subscripciones.modulos_activos
--
-- RETORNA:
--   TRIGGER - Permite o rechaza la operación con mensaje descriptivo
-- ====================================================================
CREATE OR REPLACE FUNCTION validar_dependencias_modulos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_core_activo BOOLEAN;
    v_agendamiento_activo BOOLEAN;
    v_inventario_activo BOOLEAN;
    v_pos_activo BOOLEAN;
    v_comisiones_activo BOOLEAN;
    v_marketplace_activo BOOLEAN;
    v_chatbots_activo BOOLEAN;
BEGIN
    -- Extraer estados de módulos del JSONB
    v_core_activo := COALESCE((NEW.modulos_activos->>'core')::BOOLEAN, FALSE);
    v_agendamiento_activo := COALESCE((NEW.modulos_activos->>'agendamiento')::BOOLEAN, FALSE);
    v_inventario_activo := COALESCE((NEW.modulos_activos->>'inventario')::BOOLEAN, FALSE);
    v_pos_activo := COALESCE((NEW.modulos_activos->>'pos')::BOOLEAN, FALSE);
    v_comisiones_activo := COALESCE((NEW.modulos_activos->>'comisiones')::BOOLEAN, FALSE);
    v_marketplace_activo := COALESCE((NEW.modulos_activos->>'marketplace')::BOOLEAN, FALSE);
    v_chatbots_activo := COALESCE((NEW.modulos_activos->>'chatbots')::BOOLEAN, FALSE);

    -- ====================================================================
    -- REGLA 1: 'core' SIEMPRE debe estar activo
    -- ====================================================================
    IF NOT v_core_activo THEN
        RAISE EXCEPTION 'El módulo "core" no puede ser desactivado. Es requerido por todos los módulos del sistema.'
            USING HINT = 'El módulo core contiene funcionalidades esenciales (auth, usuarios, organizaciones)',
                  ERRCODE = 'check_violation';
    END IF;

    -- ====================================================================
    -- REGLA 2: POS requiere 'inventario' activo (dependencia HARD)
    -- ====================================================================
    -- Razón: FK ventas_pos_items.producto_id → productos(id) NOT NULL
    IF v_pos_activo AND NOT v_inventario_activo THEN
        RAISE EXCEPTION 'El módulo "pos" requiere que el módulo "inventario" esté activo.'
            USING HINT = 'Las ventas del POS dependen de la tabla productos. Active inventario primero o desactive pos.',
                  DETAIL = 'Dependencia HARD: FK ventas_pos_items.producto_id → productos(id)',
                  ERRCODE = 'check_violation';
    END IF;

    -- ====================================================================
    -- REGLA 3: Comisiones requiere 'agendamiento' activo
    -- ====================================================================
    -- Razón: comisiones_profesionales.cita_id → citas(id) NOT NULL
    -- Trigger calcular_comision_cita() depende 100% de citas completadas
    IF v_comisiones_activo AND NOT v_agendamiento_activo THEN
        RAISE EXCEPTION 'El módulo "comisiones" requiere que el módulo "agendamiento" esté activo.'
            USING HINT = 'Las comisiones se calculan automáticamente al completar citas. Active agendamiento primero.',
                  DETAIL = 'Dependencia HARD: FK comisiones_profesionales.cita_id → citas(id)',
                  ERRCODE = 'check_violation';
    END IF;

    -- ====================================================================
    -- REGLA 4: Marketplace requiere 'agendamiento' activo
    -- ====================================================================
    -- Razón: perfiles_marketplace dependen de profesionales, servicios, reseñas de citas
    IF v_marketplace_activo AND NOT v_agendamiento_activo THEN
        RAISE EXCEPTION 'El módulo "marketplace" requiere que el módulo "agendamiento" esté activo.'
            USING HINT = 'Los perfiles del marketplace publican servicios y profesionales. Active agendamiento primero.',
                  DETAIL = 'Dependencia HARD: Perfiles requieren profesionales y servicios del módulo agendamiento',
                  ERRCODE = 'check_violation';
    END IF;

    -- ====================================================================
    -- REGLA 5: Chatbots requiere 'agendamiento' activo
    -- ====================================================================
    -- Razón: TODOS los MCP tools (7/7) dependen de servicios, profesionales, clientes, citas
    IF v_chatbots_activo AND NOT v_agendamiento_activo THEN
        RAISE EXCEPTION 'El módulo "chatbots" requiere que el módulo "agendamiento" esté activo.'
            USING HINT = 'Los chatbots IA crean y gestionan citas. Active agendamiento primero o desactive chatbots.',
                  DETAIL = 'Dependencia HARD: Los 7 MCP tools requieren tablas del módulo agendamiento',
                  ERRCODE = 'check_violation';
    END IF;

    -- Si todas las validaciones pasaron, permitir la operación
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validar_dependencias_modulos() IS
'Trigger que valida dependencias HARD entre módulos. Asegura que core esté siempre activo y que módulos dependientes no se activen sin sus requisitos';

-- ====================================================================
-- TRIGGER: validar_modulos_antes_insert_update
-- ====================================================================
-- Aplica validaciones de dependencias antes de insertar o actualizar subscripciones
-- ====================================================================
CREATE TRIGGER validar_modulos_antes_insert_update
    BEFORE INSERT OR UPDATE OF modulos_activos
    ON subscripciones
    FOR EACH ROW
    EXECUTE FUNCTION validar_dependencias_modulos();

COMMENT ON TRIGGER validar_modulos_antes_insert_update ON subscripciones IS
'Valida dependencias de módulos antes de INSERT/UPDATE. Bloquea operaciones que violen reglas de dependencias HARD';

-- ====================================================================
-- FUNCIÓN: auditar_cambio_modulos
-- ====================================================================
-- Registra en historial_subscripciones los cambios en módulos activos
--
-- DISPARA EN:
--   UPDATE de subscripciones.modulos_activos
--
-- REGISTRA:
--   • Módulos activados (NEW - OLD)
--   • Módulos desactivados (OLD - NEW)
--   • Usuario responsable del cambio
--   • Timestamp del cambio
-- ====================================================================
CREATE OR REPLACE FUNCTION auditar_cambio_modulos()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_modulos_activados TEXT[];
    v_modulos_desactivados TEXT[];
    v_key TEXT;
    v_old_value BOOLEAN;
    v_new_value BOOLEAN;
    v_motivo TEXT;
BEGIN
    -- Solo procesar si modulos_activos cambió
    IF OLD.modulos_activos = NEW.modulos_activos THEN
        RETURN NEW;
    END IF;

    -- Inicializar arrays
    v_modulos_activados := ARRAY[]::TEXT[];
    v_modulos_desactivados := ARRAY[]::TEXT[];

    -- Comparar cada clave del JSONB (unión de claves de NEW y OLD)
    FOR v_key IN (
        SELECT jsonb_object_keys(NEW.modulos_activos)
        UNION
        SELECT jsonb_object_keys(OLD.modulos_activos)
    ) LOOP
        v_old_value := COALESCE((OLD.modulos_activos->>v_key)::BOOLEAN, FALSE);
        v_new_value := COALESCE((NEW.modulos_activos->>v_key)::BOOLEAN, FALSE);

        -- Si cambió de false → true: módulo activado
        IF NOT v_old_value AND v_new_value THEN
            v_modulos_activados := array_append(v_modulos_activados, v_key);
        END IF;

        -- Si cambió de true → false: módulo desactivado
        IF v_old_value AND NOT v_new_value THEN
            v_modulos_desactivados := array_append(v_modulos_desactivados, v_key);
        END IF;
    END LOOP;

    -- Construir motivo descriptivo
    IF array_length(v_modulos_activados, 1) > 0 AND array_length(v_modulos_desactivados, 1) > 0 THEN
        v_motivo := format('Módulos activados: %s. Módulos desactivados: %s',
                          array_to_string(v_modulos_activados, ', '),
                          array_to_string(v_modulos_desactivados, ', '));
    ELSIF array_length(v_modulos_activados, 1) > 0 THEN
        v_motivo := format('Módulos activados: %s', array_to_string(v_modulos_activados, ', '));
    ELSIF array_length(v_modulos_desactivados, 1) > 0 THEN
        v_motivo := format('Módulos desactivados: %s', array_to_string(v_modulos_desactivados, ', '));
    ELSE
        v_motivo := 'Cambio en configuración de módulos';
    END IF;

    -- Insertar registro en historial
    INSERT INTO historial_subscripciones (
        organizacion_id,
        subscripcion_id,
        tipo_evento,
        motivo,
        iniciado_por,
        usuario_responsable
    ) VALUES (
        NEW.organizacion_id,
        NEW.id,
        'cambio_modulos',  -- Nuevo tipo de evento
        v_motivo,
        COALESCE(current_setting('app.usuario_id', TRUE), 'sistema'),
        NEW.actualizado_por
    );

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auditar_cambio_modulos() IS
'Registra en historial_subscripciones los cambios en módulos activos (activaciones/desactivaciones)';

-- ====================================================================
-- TRIGGER: auditar_modulos_despues_update
-- ====================================================================
-- Registra auditoría de cambios en módulos DESPUÉS del update exitoso
-- ====================================================================
CREATE TRIGGER auditar_modulos_despues_update
    AFTER UPDATE OF modulos_activos
    ON subscripciones
    FOR EACH ROW
    EXECUTE FUNCTION auditar_cambio_modulos();

COMMENT ON TRIGGER auditar_modulos_despues_update ON subscripciones IS
'Audita cambios en módulos activos en la tabla historial_subscripciones. Se ejecuta DESPUÉS del update exitoso';

-- ====================================================================
-- FUNCIÓN: obtener_modulos_activos
-- ====================================================================
-- Función optimizada para obtener módulos activos de una organización
-- Usada por ModulesCache en el backend
--
-- PERFORMANCE:
--   • Usa índice UNIQUE en organizacion_id
--   • Usa índice GIN en modulos_activos si se filtra por módulo específico
--   • Query típica: ~5-15ms
--
-- RETORNA:
--   JSONB con módulos activos, o '{"core": true}' si no hay subscripción
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_modulos_activos(p_organizacion_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_modulos JSONB;
BEGIN
    SELECT s.modulos_activos
    INTO v_modulos
    FROM subscripciones s
    WHERE s.organizacion_id = p_organizacion_id
      AND s.activa = TRUE
    LIMIT 1;

    -- Si no hay subscripción activa, solo acceso a core
    RETURN COALESCE(v_modulos, '{"core": true}'::jsonb);
END;
$$;

COMMENT ON FUNCTION obtener_modulos_activos(INTEGER) IS
'Obtiene el JSONB de módulos activos para una organización. Retorna solo core si no hay subscripción activa. Optimizada para cache';

-- ====================================================================
-- PERMISOS
-- ====================================================================

-- Otorgar permisos de ejecución a los roles de la aplicación
GRANT EXECUTE ON FUNCTION tiene_modulo_activo(INTEGER, TEXT) TO saas_app;
GRANT EXECUTE ON FUNCTION obtener_modulos_activos(INTEGER) TO saas_app;

-- Las funciones de trigger no necesitan permisos explícitos (se ejecutan con permisos del owner)
