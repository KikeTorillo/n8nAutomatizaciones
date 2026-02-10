-- ====================================================================
-- PLANES B2C: INVITACIONES DIGITALES (PAGO ÚNICO)
-- ====================================================================
-- Trigger independiente que crea planes B2C cuando se crea Nexo Team.
-- Separado de 03-datos-nexo-team.sql para facilitar el fork B2C.
--
-- Se ejecuta AFTER INSERT en organizaciones (igual que el trigger B2B).
-- Idempotente: verifica existencia antes de insertar.
--
-- @module suscripciones-negocio/planes-invitaciones-b2c
-- @version 2.0.0
-- @date Febrero 2026
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_planes_b2c_invitaciones()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo actuar cuando se crea Nexo Team
    IF NEW.codigo_tenant = 'nexo-team' THEN
        -- Evitar duplicados
        IF NOT EXISTS (
            SELECT 1 FROM planes_suscripcion_org
            WHERE organizacion_id = NEW.id AND codigo = 'invitacion-basico'
        ) THEN
            INSERT INTO planes_suscripcion_org (
                organizacion_id, codigo, nombre, descripcion,
                precio_mensual, tipo_cobro, moneda,
                dias_trial, limites, features, modulos_habilitados,
                usuarios_incluidos, max_usuarios_hard,
                color, icono, destacado, publico, activo, orden_display
            ) VALUES
            (NEW.id, 'invitacion-basico', 'Básico', 'Perfecto para eventos íntimos',
             199, 'unico', 'MXN', 0,
             '{"eventos_activos": 1, "invitados_evento": 100, "fotos_galeria": 50}'::jsonb,
             '["1 evento activo", "Hasta 100 invitados", "Galería de 50 fotos", "Confirmación RSVP", "Compartir por WhatsApp"]'::jsonb,
             '["eventos-digitales"]'::jsonb,
             1, 1, '#ec4899', 'Heart', FALSE, TRUE, TRUE, 10),
            (NEW.id, 'invitacion-premium', 'Premium', 'Para eventos grandes con todas las funciones',
             399, 'unico', 'MXN', 0,
             '{"eventos_activos": 1, "invitados_evento": 500, "fotos_galeria": 200}'::jsonb,
             '["1 evento activo", "Hasta 500 invitados", "Galería de 200 fotos", "Confirmación RSVP", "Compartir por WhatsApp", "Mesa de regalos", "Seating chart"]'::jsonb,
             '["eventos-digitales"]'::jsonb,
             1, 1, '#ec4899', 'Sparkles', TRUE, TRUE, TRUE, 20),
            (NEW.id, 'invitacion-ilimitado', 'Ilimitado', 'Sin límites para tus celebraciones',
             699, 'unico', 'MXN', 0,
             '{"eventos_activos": 3, "invitados_evento": -1, "fotos_galeria": -1}'::jsonb,
             '["Hasta 3 eventos activos", "Invitados ilimitados", "Fotos ilimitadas", "Confirmación RSVP", "Compartir por WhatsApp", "Mesa de regalos", "Seating chart", "Soporte prioritario"]'::jsonb,
             '["eventos-digitales"]'::jsonb,
             1, 1, '#ec4899', 'Crown', FALSE, TRUE, TRUE, 30);

            RAISE NOTICE 'Nexo Team (id=%): 3 planes B2C invitaciones creados', NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger (separado del trigger B2B)
DROP TRIGGER IF EXISTS trigger_crear_planes_b2c_invitaciones ON organizaciones;
CREATE TRIGGER trigger_crear_planes_b2c_invitaciones
    AFTER INSERT ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION crear_planes_b2c_invitaciones();
