-- ====================================================================
-- DATOS INICIALES: PLANES DE SUSCRIPCIÓN NEXO TEAM
-- ====================================================================
-- Planes de suscripción para la organización Nexo Team (codigo_tenant = 'nexo-team')
-- que gestiona las suscripciones de todas las organizaciones de la plataforma.
--
-- Estos planes se usan en el flujo de dogfooding:
-- 1. Nueva org se registra → se crea cliente en Nexo Team
-- 2. Cliente obtiene suscripción trial automáticamente
-- 3. Al activarse, los features del plan se mapean a módulos
--
-- NOTA: Se detecta Nexo Team por codigo_tenant='nexo-team' (no por id=1)
-- porque el ID puede variar según el orden de creación.
--
-- @module suscripciones-negocio/datos-nexo-team
-- @author Nexo Team
-- @version 2.0.0
-- @date 22 Enero 2026
-- @changes Solo 2 planes: Trial y Pro (eliminados básico y enterprise)
-- ====================================================================

-- ====================================================================
-- PARTE 1: Insertar planes si Nexo Team ya existe (para migraciones)
-- ====================================================================
DO $$
DECLARE
    v_nexo_team_id INT;
    v_superadmin_id INT;
BEGIN
    -- Buscar Nexo Team por codigo_tenant (más robusto que por id)
    SELECT id INTO v_nexo_team_id
    FROM organizaciones
    WHERE codigo_tenant = 'nexo-team';

    IF v_nexo_team_id IS NULL THEN
        RAISE NOTICE 'Nexo Team (codigo_tenant=nexo-team) no existe aún. Los planes se crearán via trigger.';
        RETURN;
    END IF;

    -- Verificar si ya existen planes para Nexo Team
    IF EXISTS (SELECT 1 FROM planes_suscripcion_org WHERE organizacion_id = v_nexo_team_id) THEN
        RAISE NOTICE 'Ya existen planes para Nexo Team (id=%). Saltando inserción.', v_nexo_team_id;
        RETURN;
    END IF;

    -- Obtener ID del superadmin (si existe)
    SELECT id INTO v_superadmin_id
    FROM usuarios
    WHERE organizacion_id = v_nexo_team_id
    ORDER BY id ASC
    LIMIT 1;

    -- Insertar los 2 planes usando el ID dinámico (Trial + Pro)
    INSERT INTO planes_suscripcion_org (
        organizacion_id, codigo, nombre, descripcion,
        precio_mensual, precio_anual, dias_trial, activo, features, limites, creado_por
    ) VALUES
    (v_nexo_team_id, 'trial', 'Plan Trial', 'Prueba gratuita de 14 días con acceso limitado', 0, 0, 14, true,
     '["agendamiento", "inventario", "pos"]'::jsonb,
     '{"citas": 50, "profesionales": 2, "servicios": 10, "clientes": 100}'::jsonb,
     v_superadmin_id),
    (v_nexo_team_id, 'pro', 'Plan Pro', 'Plan completo con todas las funcionalidades para empresas', 249, 2490, 0, true,
     '["agendamiento", "inventario", "pos", "comisiones", "contabilidad", "marketplace", "chatbots", "workflows", "suscripciones-negocio"]'::jsonb,
     '{"citas": -1, "profesionales": -1, "servicios": -1, "clientes": -1}'::jsonb,
     v_superadmin_id);

    RAISE NOTICE 'Planes de suscripción para Nexo Team (id=%) creados exitosamente (2 planes: trial, pro)', v_nexo_team_id;
END $$;

-- ====================================================================
-- PARTE 2: Trigger para crear planes cuando se cree Nexo Team (instalaciones nuevas)
-- ====================================================================
-- NOTA: Usa SECURITY DEFINER para bypassear RLS durante la creación inicial.
-- Sin esto, el SELECT en NOT EXISTS falla porque app.current_tenant_id está vacío.
-- ====================================================================
CREATE OR REPLACE FUNCTION crear_planes_nexo_team()
RETURNS TRIGGER
SECURITY DEFINER  -- Permite ejecutar como owner (bypassea RLS)
SET search_path = public
AS $$
BEGIN
    -- Detectar Nexo Team por codigo_tenant (no por id)
    IF NEW.codigo_tenant = 'nexo-team' THEN
        IF NOT EXISTS (SELECT 1 FROM planes_suscripcion_org WHERE organizacion_id = NEW.id) THEN
            INSERT INTO planes_suscripcion_org (organizacion_id, codigo, nombre, descripcion, precio_mensual, precio_anual, dias_trial, activo, features, limites)
            VALUES
            (NEW.id, 'trial', 'Plan Trial', 'Prueba gratuita de 14 días con acceso limitado', 0, 0, 14, true,
             '["agendamiento", "inventario", "pos"]'::jsonb,
             '{"citas": 50, "profesionales": 2, "servicios": 10, "clientes": 100}'::jsonb),
            (NEW.id, 'pro', 'Plan Pro', 'Plan completo con todas las funcionalidades', 249, 2490, 0, true,
             '["agendamiento", "inventario", "pos", "comisiones", "contabilidad", "marketplace", "chatbots", "workflows", "suscripciones-negocio"]'::jsonb,
             '{"citas": -1, "profesionales": -1, "servicios": -1, "clientes": -1}'::jsonb);
            RAISE NOTICE 'Planes Nexo Team (id=%) creados via trigger (2 planes: trial, pro)', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_crear_planes_nexo_team ON organizaciones;
CREATE TRIGGER trigger_crear_planes_nexo_team
    AFTER INSERT ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION crear_planes_nexo_team();

-- ====================================================================
-- VERIFICACIÓN
-- ====================================================================
DO $$
DECLARE
    v_nexo_team_id INT;
    v_count INT;
BEGIN
    -- Buscar Nexo Team por codigo_tenant
    SELECT id INTO v_nexo_team_id
    FROM organizaciones
    WHERE codigo_tenant = 'nexo-team';

    IF v_nexo_team_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count FROM planes_suscripcion_org WHERE organizacion_id = v_nexo_team_id;
        IF v_count > 0 THEN
            RAISE NOTICE 'Total planes en Nexo Team (id=%): %', v_nexo_team_id, v_count;
        ELSE
            RAISE NOTICE 'Nexo Team existe (id=%) pero no tiene planes. Verificar trigger.', v_nexo_team_id;
        END IF;
    ELSE
        RAISE NOTICE 'Trigger instalado. Planes se crearán cuando se cree Nexo Team (codigo_tenant=nexo-team).';
    END IF;
END $$;
