-- ====================================================================
-- MÓDULO NEGOCIO: FUNCIONES PL/pgSQL
-- ====================================================================
-- Funciones de validación y mantenimiento automático para las tablas
-- del modelo de negocio.
--
-- FUNCIONES INCLUIDAS:
-- • validar_profesional_industria() - Valida tipo profesional vs industria
-- • actualizar_timestamp_servicios() - Actualiza timestamps en servicios
--
-- Migrado de: sql/schema/02-functions.sql
-- Fecha migración: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- 🔍 FUNCIÓN: VALIDAR_PROFESIONAL_INDUSTRIA
-- ====================================================================
-- Valida automáticamente que el tipo de profesional asignado sea
-- compatible con la industria de la organización.
--
-- 🎯 VALIDACIONES REALIZADAS:
-- • Tipo de profesional existe y está activo
-- • Tipo de profesional es accesible (global o de misma org)
-- • Industria de la organización es compatible con el tipo
--
-- 🔧 MEJORAS v2.0 (2025-10-03):
-- • Catálogo dinámico en lugar de ENUM (tipos_profesional)
-- • Soporta tipos personalizados por organización
-- • Mensajes de error más descriptivos
--
-- 🔄 USO: Trigger BEFORE INSERT/UPDATE en tabla profesionales
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_profesional_industria()
RETURNS TRIGGER AS $$
DECLARE
    categoria_codigo VARCHAR(50);
    tipo_info RECORD;
    tipo_compatible BOOLEAN;
BEGIN
    -- 1. Obtener el código de categoría de la organización (Nov 2025: tabla dinámica)
    SELECT ci.codigo INTO categoria_codigo
    FROM organizaciones o
    JOIN categorias ci ON ci.id = o.categoria_id
    WHERE o.id = NEW.organizacion_id;

    IF categoria_codigo IS NULL THEN
        RAISE EXCEPTION 'No se encontró la organización con ID % o su categoría', NEW.organizacion_id;
    END IF;

    -- 2. Obtener información del tipo de profesional
    SELECT
        tp.id,
        tp.codigo,
        tp.nombre,
        tp.activo,
        tp.organizacion_id,
        tp.industrias_compatibles
    INTO tipo_info
    FROM tipos_profesional tp
    WHERE tp.id = NEW.tipo_profesional_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El tipo de profesional con ID % no existe', NEW.tipo_profesional_id;
    END IF;

    -- 3. Verificar que el tipo está activo
    IF NOT tipo_info.activo THEN
        RAISE EXCEPTION 'El tipo de profesional "%" está inactivo y no puede ser asignado', tipo_info.nombre;
    END IF;

    -- 4. Verificar acceso al tipo (RLS a nivel de función)
    IF tipo_info.organizacion_id IS NOT NULL AND tipo_info.organizacion_id != NEW.organizacion_id THEN
        RAISE EXCEPTION 'El tipo de profesional "%" no pertenece a esta organización', tipo_info.nombre;
    END IF;

    -- 5. Verificar compatibilidad con la categoría (Nov 2025: comparación directa con código)
    tipo_compatible := categoria_codigo = ANY(tipo_info.industrias_compatibles);

    IF NOT tipo_compatible THEN
        RAISE EXCEPTION
            'El tipo de profesional "%" (código: %) no es compatible con la categoría "%" de la organización. Categorías compatibles: %',
            tipo_info.nombre,
            tipo_info.codigo,
            categoria_codigo,
            array_to_string(tipo_info.industrias_compatibles, ', ');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION validar_profesional_industria() IS
'Valida automáticamente que el tipo_profesional_id sea compatible con la categoría de la organización consultando categorias_industria y tipos_profesional. Versión 3.0 (Nov 2025): Migrado de ENUM a tabla dinámica para soportar cualquier tipo de SaaS.';

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
