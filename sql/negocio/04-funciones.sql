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
    industria_org industria_tipo;
    tipo_info RECORD;
    tipo_compatible BOOLEAN;
BEGIN
    -- 1. Obtener la industria de la organización
    SELECT tipo_industria INTO industria_org
    FROM organizaciones
    WHERE id = NEW.organizacion_id;

    IF industria_org IS NULL THEN
        RAISE EXCEPTION 'No se encontró la organización con ID %', NEW.organizacion_id;
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

    -- 5. Verificar compatibilidad con la industria (cast ENUM to TEXT)
    tipo_compatible := industria_org::text = ANY(tipo_info.industrias_compatibles);

    IF NOT tipo_compatible THEN
        RAISE EXCEPTION
            'El tipo de profesional "%" (código: %) no es compatible con la industria "%" de la organización. Industrias compatibles: %',
            tipo_info.nombre,
            tipo_info.codigo,
            industria_org,
            array_to_string(tipo_info.industrias_compatibles, ', ');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION validar_profesional_industria() IS
'Valida automáticamente que el tipo_profesional_id sea compatible con la industria de la organización consultando la tabla tipos_profesional. Versión 2.0: Soporta catálogo dinámico en lugar de ENUM.';

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
