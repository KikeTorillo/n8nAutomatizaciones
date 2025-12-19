-- ====================================================================
-- MÓDULO NEGOCIO: FUNCIONES PL/pgSQL
-- ====================================================================
-- Funciones de validación y mantenimiento automático para las tablas
-- del modelo de negocio.
--
-- FUNCIONES INCLUIDAS:
-- • actualizar_timestamp_servicios() - Actualiza timestamps en servicios
-- • poblar_organizacion_id_servicios_profesionales() - Multi-tenant
--
-- Migrado de: sql/schema/02-functions.sql
-- Fecha migración: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- 🛍️ FUNCIÓN: ACTUALIZAR_TIMESTAMP_SERVICIOS
-- ====================================================================
-- Función para actualizar timestamp en servicios
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp_servicios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en funciones
COMMENT ON FUNCTION actualizar_timestamp_servicios() IS
'Actualiza automáticamente el campo actualizado_en cuando se modifica un servicio o relación servicio-profesional';

-- ====================================================================
-- 🔐 FUNCIÓN: POBLAR_ORGANIZACION_ID_SERVICIOS_PROFESIONALES
-- ====================================================================
-- Pobla y valida automáticamente el campo organizacion_id en la tabla
-- servicios_profesionales para garantizar aislamiento multi-tenant.
--
-- 🎯 VALIDACIONES REALIZADAS:
-- • Servicio y profesional pertenecen a la MISMA organización
-- • Previene mezcla de organizaciones (seguridad multi-tenant)
-- • Pobla organizacion_id automáticamente (usuario no lo envía)
--
-- 🔧 CARACTERÍSTICAS:
-- • Ignora cualquier valor de organizacion_id enviado por el usuario
-- • Utiliza BYPASS RLS para consultar org_ids de servicios/profesionales
-- • Bloquea INSERT si servicio y profesional son de orgs diferentes
--
-- 🔄 USO: Trigger BEFORE INSERT/UPDATE en servicios_profesionales
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION poblar_organizacion_id_servicios_profesionales()
RETURNS TRIGGER AS $$
DECLARE
    v_org_servicio INTEGER;
    v_org_profesional INTEGER;
BEGIN
    -- 1. Obtener organizacion_id del servicio
    SELECT organizacion_id INTO v_org_servicio
    FROM servicios
    WHERE id = NEW.servicio_id;

    IF v_org_servicio IS NULL THEN
        RAISE EXCEPTION 'No se encontró el servicio con ID %', NEW.servicio_id;
    END IF;

    -- 2. Obtener organizacion_id del profesional
    SELECT organizacion_id INTO v_org_profesional
    FROM profesionales
    WHERE id = NEW.profesional_id;

    IF v_org_profesional IS NULL THEN
        RAISE EXCEPTION 'No se encontró el profesional con ID %', NEW.profesional_id;
    END IF;

    -- 3. VALIDACIÓN CRÍTICA: Ambos deben pertenecer a la misma organización
    IF v_org_servicio != v_org_profesional THEN
        RAISE EXCEPTION
            'VIOLACIÓN MULTI-TENANT: No se puede asignar servicio (organizacion_id=%) a profesional (organizacion_id=%). Ambos deben pertenecer a la misma organización.',
            v_org_servicio,
            v_org_profesional;
    END IF;

    -- 4. Poblar automáticamente organizacion_id
    -- IMPORTANTE: Ignora cualquier valor que el usuario haya enviado
    NEW.organizacion_id := v_org_servicio;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION poblar_organizacion_id_servicios_profesionales() IS
'Pobla y valida automáticamente organizacion_id en servicios_profesionales. Garantiza que servicio y profesional pertenezcan a la misma organización, previniendo violaciones de seguridad multi-tenant.';
