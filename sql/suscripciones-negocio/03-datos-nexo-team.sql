-- ====================================================================
-- DATOS INICIALES: PLANES Y SUSCRIPCIÓN NEXO TEAM
-- ====================================================================
-- Trigger que crea automáticamente cuando se crea la organización
-- Nexo Team (codigo_tenant = 'nexo-team'):
--   1. Planes trial y pro (públicos)
--   2. Plan enterprise (interno, no público)
--   3. Cliente interno (Nexo Team suscrito a sí mismo)
--   4. Suscripción permanente al plan enterprise
--
-- @module suscripciones-negocio/datos-nexo-team
-- @version 3.0.0
-- @date Febrero 2026
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_planes_nexo_team()
RETURNS TRIGGER
SECURITY DEFINER  -- Permite ejecutar como owner (bypassea RLS)
SET search_path = public
AS $$
DECLARE
    v_plan_enterprise_id INT;
    v_cliente_id INT;
BEGIN
    -- Solo actuar cuando se crea Nexo Team
    IF NEW.codigo_tenant = 'nexo-team' THEN
        -- Verificar que no existan planes (evitar duplicados)
        IF NOT EXISTS (SELECT 1 FROM planes_suscripcion_org WHERE organizacion_id = NEW.id) THEN

            -- ========================================
            -- 1. Planes públicos: Trial y Pro
            -- ========================================
            INSERT INTO planes_suscripcion_org (
                organizacion_id, codigo, nombre, descripcion,
                precio_mensual, precio_anual, dias_trial, activo, publico,
                features, modulos_habilitados, limites,
                usuarios_incluidos, precio_usuario_adicional, max_usuarios_hard
            )
            VALUES
            (NEW.id, 'trial', 'Plan Trial', 'Prueba gratuita de 14 días con acceso limitado',
             0, 0, 14, true, true,
             '[]'::jsonb,  -- Features descriptivas (display)
             '["agendamiento", "inventario", "pos"]'::jsonb,  -- Módulos habilitados (control acceso)
             '{"citas": 50, "profesionales": 2, "servicios": 10, "clientes": 100, "usuarios": 3}'::jsonb,
             3, NULL, 3),
            (NEW.id, 'pro', 'Plan Pro', 'Plan completo con todas las funcionalidades',
             249, 2490, 0, true, true,
             '[]'::jsonb,  -- Features descriptivas (display)
             '["agendamiento", "inventario", "pos", "comisiones", "contabilidad", "marketplace", "chatbots", "workflows", "suscripciones-negocio"]'::jsonb,
             '{"citas": -1, "profesionales": -1, "servicios": -1, "clientes": -1, "usuarios": 5}'::jsonb,
             5, 49.00, NULL);

            -- ========================================
            -- 2. Plan Enterprise (interno, NO público)
            -- ========================================
            INSERT INTO planes_suscripcion_org (
                organizacion_id, codigo, nombre, descripcion,
                precio_mensual, precio_anual, moneda,
                dias_trial, limites, features, modulos_habilitados,
                usuarios_incluidos, max_usuarios_hard, precio_usuario_adicional,
                color, icono, destacado, publico, activo, orden_display
            ) VALUES (
                NEW.id,
                'enterprise',
                'Plan Enterprise',
                'Plan interno del sistema - acceso completo sin restricciones',
                0, 0, 'MXN',
                0,
                '{"usuarios": 999999, "clientes": 999999, "productos": 999999}'::jsonb,
                '[]'::jsonb,  -- Features descriptivas (display)
                '["agendamiento", "inventario", "pos", "comisiones", "contabilidad", "marketplace", "chatbots", "website", "workflows", "suscripciones-negocio", "eventos-digitales"]'::jsonb,
                999, NULL, NULL,
                '#1a1a2e', 'Shield', FALSE,
                FALSE,  -- NO PÚBLICO - no aparece en /planes/publicos
                TRUE,
                -1
            )
            RETURNING id INTO v_plan_enterprise_id;

            -- ========================================
            -- 3. Cliente interno (Nexo Team → sí mismo)
            -- ========================================
            INSERT INTO clientes (
                organizacion_id, tipo, nombre, email,
                organizacion_vinculada_id, notas_especiales, activo
            ) VALUES (
                NEW.id,
                'empresa',
                'Nexo Team (Sistema)',
                'sistema@nexo.io',
                NEW.id,  -- organizacion_vinculada_id = Nexo Team (se suscribe a sí mismo)
                'Cliente interno del sistema - NO ELIMINAR',
                TRUE
            )
            RETURNING id INTO v_cliente_id;

            -- ========================================
            -- 4. Suscripción permanente (nunca expira)
            -- ========================================
            INSERT INTO suscripciones_org (
                organizacion_id, plan_id, cliente_id,
                periodo, estado, fecha_inicio,
                fecha_proximo_cobro, fecha_fin, es_trial,
                gateway, precio_actual, moneda,
                auto_cobro, meses_activo
            ) VALUES (
                NEW.id,
                v_plan_enterprise_id,
                v_cliente_id,
                'anual',
                'activa',
                CURRENT_DATE,
                NULL,   -- Sin próximo cobro
                NULL,   -- Sin fecha fin (nunca expira)
                FALSE,  -- No es trial
                'manual',
                0,
                'MXN',
                FALSE,  -- No auto-cobro
                9999    -- Meses activo (permanente)
            );

            RAISE NOTICE 'Nexo Team (id=%): 3 planes + cliente interno + suscripción enterprise creados', NEW.id;
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
-- FIN - Todo se crea automáticamente cuando se registra Nexo Team
-- ====================================================================
