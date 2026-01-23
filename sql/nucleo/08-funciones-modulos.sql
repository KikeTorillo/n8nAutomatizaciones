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
--
-- ACTUALIZADO: Enero 2026
-- - Migrado de subscripciones.modulos_activos a organizaciones.modulos_activos
-- - Eliminadas funciones de auditoría (tabla historial_subscripciones eliminada)
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
-- ACTUALIZADO Ene 2026: Usa organizaciones.modulos_activos
-- ====================================================================
CREATE OR REPLACE FUNCTION tiene_modulo_activo(
    p_organizacion_id INTEGER,
    p_modulo_nombre TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_modulo_activo BOOLEAN;
BEGIN
    -- Validar parámetros
    IF p_organizacion_id IS NULL OR p_modulo_nombre IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Consultar módulo desde organizaciones.modulos_activos
    SELECT COALESCE((modulos_activos->>p_modulo_nombre)::BOOLEAN, FALSE)
    INTO v_modulo_activo
    FROM organizaciones
    WHERE id = p_organizacion_id
      AND activo = TRUE
      AND eliminado_en IS NULL;

    RETURN COALESCE(v_modulo_activo, FALSE);
END;
$$;

COMMENT ON FUNCTION tiene_modulo_activo(INTEGER, TEXT) IS
'Verifica si una organización tiene un módulo específico activo. Actualizado Ene 2026 para usar organizaciones.modulos_activos';

-- ====================================================================
-- FUNCIÓN: validar_dependencias_modulos
-- ====================================================================
-- Trigger function que valida las dependencias HARD entre módulos
-- antes de permitir activar/desactivar módulos.
--
-- REGLAS DE NEGOCIO:
--   1. 'core' SIEMPRE debe estar activo (no se puede desactivar)
--   2. POS requiere 'inventario' activo (dependencia HARD)
--   3. Comisiones requiere 'agendamiento' O 'pos' activo
--   4. Marketplace requiere 'agendamiento' activo
--   5. Chatbots requiere 'agendamiento' activo
--   6. Workflows requiere 'inventario' activo
--
-- DISPARA EN:
--   INSERT, UPDATE de organizaciones.modulos_activos
--
-- ACTUALIZADO Ene 2026: Usa organizaciones en lugar de subscripciones
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
    v_workflows_activo BOOLEAN;
BEGIN
    -- Si modulos_activos no cambió, no validar
    IF TG_OP = 'UPDATE' AND OLD.modulos_activos IS NOT DISTINCT FROM NEW.modulos_activos THEN
        RETURN NEW;
    END IF;

    -- Extraer estados de módulos del JSONB
    v_core_activo := COALESCE((NEW.modulos_activos->>'core')::BOOLEAN, FALSE);
    v_agendamiento_activo := COALESCE((NEW.modulos_activos->>'agendamiento')::BOOLEAN, FALSE);
    v_inventario_activo := COALESCE((NEW.modulos_activos->>'inventario')::BOOLEAN, FALSE);
    v_pos_activo := COALESCE((NEW.modulos_activos->>'pos')::BOOLEAN, FALSE);
    v_comisiones_activo := COALESCE((NEW.modulos_activos->>'comisiones')::BOOLEAN, FALSE);
    v_marketplace_activo := COALESCE((NEW.modulos_activos->>'marketplace')::BOOLEAN, FALSE);
    v_chatbots_activo := COALESCE((NEW.modulos_activos->>'chatbots')::BOOLEAN, FALSE);
    v_workflows_activo := COALESCE((NEW.modulos_activos->>'workflows')::BOOLEAN, FALSE);

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
    IF v_pos_activo AND NOT v_inventario_activo THEN
        RAISE EXCEPTION 'El módulo "pos" requiere que el módulo "inventario" esté activo.'
            USING HINT = 'Las ventas del POS dependen de la tabla productos. Active inventario primero o desactive pos.',
                  ERRCODE = 'check_violation';
    END IF;

    -- ====================================================================
    -- REGLA 3: Marketplace requiere 'agendamiento' activo
    -- ====================================================================
    IF v_marketplace_activo AND NOT v_agendamiento_activo THEN
        RAISE EXCEPTION 'El módulo "marketplace" requiere que el módulo "agendamiento" esté activo.'
            USING HINT = 'Los perfiles del marketplace publican servicios y profesionales. Active agendamiento primero.',
                  ERRCODE = 'check_violation';
    END IF;

    -- ====================================================================
    -- REGLA 4: Chatbots requiere 'agendamiento' activo
    -- ====================================================================
    IF v_chatbots_activo AND NOT v_agendamiento_activo THEN
        RAISE EXCEPTION 'El módulo "chatbots" requiere que el módulo "agendamiento" esté activo.'
            USING HINT = 'Los chatbots IA crean y gestionan citas. Active agendamiento primero o desactive chatbots.',
                  ERRCODE = 'check_violation';
    END IF;

    -- ====================================================================
    -- REGLA 5: Workflows requiere 'inventario' activo
    -- ====================================================================
    IF v_workflows_activo AND NOT v_inventario_activo THEN
        RAISE EXCEPTION 'El módulo "workflows" requiere que el módulo "inventario" esté activo.'
            USING HINT = 'Los flujos de aprobación trabajan con órdenes de compra del inventario.',
                  ERRCODE = 'check_violation';
    END IF;

    -- Si todas las validaciones pasaron, permitir la operación
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validar_dependencias_modulos() IS
'Trigger que valida dependencias HARD entre módulos. Asegura que core esté siempre activo y que módulos dependientes tengan sus requisitos. Actualizado Ene 2026.';

-- ====================================================================
-- TRIGGER: tr_validar_modulos_organizaciones
-- ====================================================================
-- Dispara validación de dependencias cuando se modifican módulos
-- ACTUALIZADO Ene 2026: Aplica a tabla organizaciones
-- ====================================================================
DROP TRIGGER IF EXISTS tr_validar_modulos_organizaciones ON organizaciones;

CREATE TRIGGER tr_validar_modulos_organizaciones
    BEFORE INSERT OR UPDATE OF modulos_activos ON organizaciones
    FOR EACH ROW
    WHEN (NEW.modulos_activos IS NOT NULL)
    EXECUTE FUNCTION validar_dependencias_modulos();

-- ====================================================================
-- FUNCIÓN: obtener_modulos_activos
-- ====================================================================
-- Función optimizada para obtener módulos activos de una organización
-- Usada por ModulesCache en el backend
--
-- ACTUALIZADO Ene 2026: Lee de organizaciones.modulos_activos
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_modulos_activos(p_organizacion_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_modulos JSONB;
BEGIN
    -- Validar parámetros
    IF p_organizacion_id IS NULL THEN
        RETURN '{"core": true}'::jsonb;
    END IF;

    -- Obtener módulos desde organizaciones
    SELECT COALESCE(modulos_activos, '{"core": true}'::jsonb)
    INTO v_modulos
    FROM organizaciones
    WHERE id = p_organizacion_id
      AND activo = TRUE
      AND eliminado_en IS NULL;

    RETURN COALESCE(v_modulos, '{"core": true}'::jsonb);
END;
$$;

COMMENT ON FUNCTION obtener_modulos_activos(INTEGER) IS
'Obtiene el JSONB de módulos activos para una organización desde organizaciones.modulos_activos. Actualizado Ene 2026.';

-- ====================================================================
-- ÍNDICE GIN PARA BÚSQUEDAS EN modulos_activos
-- ====================================================================
-- Optimiza consultas que filtran por módulos específicos
-- Ej: WHERE modulos_activos ? 'inventario'
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_organizaciones_modulos_activos_gin
ON organizaciones USING GIN (modulos_activos);

-- ====================================================================
-- PERMISOS
-- ====================================================================

-- Otorgar permisos de ejecución a los roles de la aplicación
GRANT EXECUTE ON FUNCTION tiene_modulo_activo(INTEGER, TEXT) TO saas_app;
GRANT EXECUTE ON FUNCTION obtener_modulos_activos(INTEGER) TO saas_app;

-- Las funciones de trigger no necesitan permisos explícitos (se ejecutan con permisos del owner)
