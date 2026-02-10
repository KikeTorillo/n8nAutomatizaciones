-- ====================================================================
-- PLANES B2C: INVITACIONES DIGITALES (PAGO ÚNICO)
-- ====================================================================
-- Planes para el flujo B2C de invitaciones digitales.
-- Se crean bajo Nexo Team (org 1) con tipo_cobro = 'unico'.
-- Visibles en /invitaciones/precios.
--
-- @module suscripciones-negocio/planes-invitaciones-b2c
-- @version 1.0.0
-- @date Febrero 2026
-- ====================================================================

DO $$
DECLARE
    v_nexo_team_id INT;
BEGIN
    -- Obtener ID de Nexo Team
    SELECT id INTO v_nexo_team_id
    FROM organizaciones
    WHERE codigo_tenant = 'nexo-team'
    LIMIT 1;

    IF v_nexo_team_id IS NULL THEN
        RAISE NOTICE 'Nexo Team no encontrado — planes B2C no creados';
        RETURN;
    END IF;

    -- Evitar duplicados
    IF EXISTS (
        SELECT 1 FROM planes_suscripcion_org
        WHERE organizacion_id = v_nexo_team_id AND codigo = 'invitacion-basico'
    ) THEN
        RAISE NOTICE 'Planes B2C invitaciones ya existen — saltando';
        RETURN;
    END IF;

    -- ========================================
    -- Plan Básico — $199 pago único
    -- ========================================
    INSERT INTO planes_suscripcion_org (
        organizacion_id, codigo, nombre, descripcion,
        precio_mensual, tipo_cobro, moneda,
        dias_trial, limites, features, modulos_habilitados,
        usuarios_incluidos, max_usuarios_hard,
        color, icono, destacado, publico, activo, orden_display
    ) VALUES (
        v_nexo_team_id,
        'invitacion-basico',
        'Básico',
        'Perfecto para eventos íntimos',
        199, 'unico', 'MXN',
        0,
        '{"eventos_activos": 1, "invitados_evento": 100, "fotos_galeria": 50}'::jsonb,
        '["1 evento activo", "Hasta 100 invitados", "Galería de 50 fotos", "Confirmación RSVP", "Compartir por WhatsApp"]'::jsonb,
        '["eventos-digitales"]'::jsonb,
        1, 1,
        '#ec4899', 'Heart', FALSE,
        TRUE, TRUE, 10
    );

    -- ========================================
    -- Plan Premium — $399 pago único
    -- ========================================
    INSERT INTO planes_suscripcion_org (
        organizacion_id, codigo, nombre, descripcion,
        precio_mensual, tipo_cobro, moneda,
        dias_trial, limites, features, modulos_habilitados,
        usuarios_incluidos, max_usuarios_hard,
        color, icono, destacado, publico, activo, orden_display
    ) VALUES (
        v_nexo_team_id,
        'invitacion-premium',
        'Premium',
        'Para eventos grandes con todas las funciones',
        399, 'unico', 'MXN',
        0,
        '{"eventos_activos": 1, "invitados_evento": 500, "fotos_galeria": 200}'::jsonb,
        '["1 evento activo", "Hasta 500 invitados", "Galería de 200 fotos", "Confirmación RSVP", "Compartir por WhatsApp", "Mesa de regalos", "Seating chart"]'::jsonb,
        '["eventos-digitales"]'::jsonb,
        1, 1,
        '#ec4899', 'Sparkles', TRUE,
        TRUE, TRUE, 20
    );

    -- ========================================
    -- Plan Ilimitado — $699 pago único
    -- ========================================
    INSERT INTO planes_suscripcion_org (
        organizacion_id, codigo, nombre, descripcion,
        precio_mensual, tipo_cobro, moneda,
        dias_trial, limites, features, modulos_habilitados,
        usuarios_incluidos, max_usuarios_hard,
        color, icono, destacado, publico, activo, orden_display
    ) VALUES (
        v_nexo_team_id,
        'invitacion-ilimitado',
        'Ilimitado',
        'Sin límites para tus celebraciones',
        699, 'unico', 'MXN',
        0,
        '{"eventos_activos": 3, "invitados_evento": -1, "fotos_galeria": -1}'::jsonb,
        '["Hasta 3 eventos activos", "Invitados ilimitados", "Fotos ilimitadas", "Confirmación RSVP", "Compartir por WhatsApp", "Mesa de regalos", "Seating chart", "Soporte prioritario"]'::jsonb,
        '["eventos-digitales"]'::jsonb,
        1, 1,
        '#ec4899', 'Crown', FALSE,
        TRUE, TRUE, 30
    );

    RAISE NOTICE 'Nexo Team (id=%): 3 planes B2C invitaciones creados (basico, premium, ilimitado)', v_nexo_team_id;
END $$;
