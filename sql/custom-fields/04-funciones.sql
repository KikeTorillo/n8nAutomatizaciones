-- ====================================================================
-- MÓDULO CUSTOM FIELDS: FUNCIONES
-- ====================================================================
-- Funciones helper para operaciones con campos personalizados.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: obtener_custom_fields_entidad
-- ====================================================================
-- Obtiene todos los campos personalizados de una entidad con sus valores.
-- Retorna JSON listo para usar en frontend.
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_custom_fields_entidad(
    p_organizacion_id INTEGER,
    p_entidad_tipo VARCHAR(50),
    p_entidad_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', d.id,
            'nombre', d.nombre,
            'nombre_clave', d.nombre_clave,
            'descripcion', d.descripcion,
            'tipo_dato', d.tipo_dato,
            'opciones', d.opciones,
            'requerido', d.requerido,
            'placeholder', d.placeholder,
            'seccion', d.seccion,
            'orden', d.orden,
            'ancho_columnas', d.ancho_columnas,
            'icono', d.icono,
            'valor', CASE d.tipo_dato
                WHEN 'texto' THEN to_jsonb(v.valor_texto)
                WHEN 'texto_largo' THEN to_jsonb(v.valor_texto)
                WHEN 'email' THEN to_jsonb(v.valor_texto)
                WHEN 'telefono' THEN to_jsonb(v.valor_texto)
                WHEN 'url' THEN to_jsonb(v.valor_texto)
                WHEN 'numero' THEN to_jsonb(v.valor_numero)
                WHEN 'fecha' THEN to_jsonb(v.valor_fecha)
                WHEN 'hora' THEN to_jsonb(v.valor_hora)
                WHEN 'booleano' THEN to_jsonb(v.valor_booleano)
                WHEN 'select' THEN to_jsonb(v.valor_texto)
                WHEN 'multiselect' THEN v.valor_json
                WHEN 'archivo' THEN jsonb_build_object(
                    'storage_id', v.archivo_storage_id,
                    'url', NULL  -- Se resuelve en backend
                )
                ELSE NULL
            END
        ) ORDER BY d.seccion NULLS LAST, d.orden
    )
    INTO v_resultado
    FROM custom_fields_definiciones d
    LEFT JOIN custom_fields_valores v ON v.definicion_id = d.id AND v.entidad_id = p_entidad_id
    WHERE d.organizacion_id = p_organizacion_id
      AND d.entidad_tipo = p_entidad_tipo
      AND d.activo = TRUE
      AND d.eliminado_en IS NULL
      AND d.visible_en_formulario = TRUE;

    RETURN COALESCE(v_resultado, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION obtener_custom_fields_entidad IS
'Obtiene campos personalizados de una entidad con sus valores. Retorna JSONB listo para frontend.';

-- ====================================================================
-- FUNCIÓN: guardar_custom_fields_entidad
-- ====================================================================
-- Guarda/actualiza los valores de campos personalizados de una entidad.
-- Recibe un JSONB con los valores y los procesa.
-- ====================================================================
CREATE OR REPLACE FUNCTION guardar_custom_fields_entidad(
    p_organizacion_id INTEGER,
    p_entidad_tipo VARCHAR(50),
    p_entidad_id INTEGER,
    p_valores JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_campo RECORD;
    v_valor JSONB;
    v_nombre_clave TEXT;
    v_guardados INTEGER := 0;
BEGIN
    -- Iterar sobre cada campo definido para esta entidad
    FOR v_campo IN
        SELECT id, nombre_clave, tipo_dato
        FROM custom_fields_definiciones
        WHERE organizacion_id = p_organizacion_id
          AND entidad_tipo = p_entidad_tipo
          AND activo = TRUE
          AND eliminado_en IS NULL
    LOOP
        v_nombre_clave := v_campo.nombre_clave;
        v_valor := p_valores -> v_nombre_clave;

        -- Solo procesar si hay valor en el input
        IF v_valor IS NOT NULL AND v_valor != 'null'::jsonb THEN
            INSERT INTO custom_fields_valores (
                organizacion_id,
                definicion_id,
                entidad_tipo,
                entidad_id,
                valor_texto,
                valor_numero,
                valor_fecha,
                valor_hora,
                valor_booleano,
                valor_json
            )
            VALUES (
                p_organizacion_id,
                v_campo.id,
                p_entidad_tipo,
                p_entidad_id,
                CASE WHEN v_campo.tipo_dato IN ('texto', 'texto_largo', 'email', 'telefono', 'url', 'select')
                     THEN v_valor #>> '{}'
                     ELSE NULL END,
                CASE WHEN v_campo.tipo_dato = 'numero'
                     THEN (v_valor #>> '{}')::NUMERIC
                     ELSE NULL END,
                CASE WHEN v_campo.tipo_dato = 'fecha'
                     THEN (v_valor #>> '{}')::DATE
                     ELSE NULL END,
                CASE WHEN v_campo.tipo_dato = 'hora'
                     THEN (v_valor #>> '{}')::TIME
                     ELSE NULL END,
                CASE WHEN v_campo.tipo_dato = 'booleano'
                     THEN (v_valor #>> '{}')::BOOLEAN
                     ELSE NULL END,
                CASE WHEN v_campo.tipo_dato = 'multiselect'
                     THEN v_valor
                     ELSE NULL END
            )
            ON CONFLICT (definicion_id, entidad_id)
            DO UPDATE SET
                valor_texto = EXCLUDED.valor_texto,
                valor_numero = EXCLUDED.valor_numero,
                valor_fecha = EXCLUDED.valor_fecha,
                valor_hora = EXCLUDED.valor_hora,
                valor_booleano = EXCLUDED.valor_booleano,
                valor_json = EXCLUDED.valor_json,
                actualizado_en = NOW();

            v_guardados := v_guardados + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'campos_guardados', v_guardados
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION guardar_custom_fields_entidad IS
'Guarda valores de campos personalizados. Usa UPSERT para crear o actualizar.';

-- ====================================================================
-- FUNCIÓN: validar_custom_fields
-- ====================================================================
-- Valida los valores de campos personalizados antes de guardar.
-- Retorna errores de validación si existen.
-- ====================================================================
CREATE OR REPLACE FUNCTION validar_custom_fields(
    p_organizacion_id INTEGER,
    p_entidad_tipo VARCHAR(50),
    p_valores JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_campo RECORD;
    v_valor JSONB;
    v_valor_texto TEXT;
    v_valor_numero NUMERIC;
    v_errores JSONB := '[]'::jsonb;
BEGIN
    -- Iterar sobre cada campo definido
    FOR v_campo IN
        SELECT *
        FROM custom_fields_definiciones
        WHERE organizacion_id = p_organizacion_id
          AND entidad_tipo = p_entidad_tipo
          AND activo = TRUE
          AND eliminado_en IS NULL
    LOOP
        v_valor := p_valores -> v_campo.nombre_clave;
        v_valor_texto := v_valor #>> '{}';

        -- Validar campo requerido
        IF v_campo.requerido AND (v_valor IS NULL OR v_valor = 'null'::jsonb OR v_valor_texto = '') THEN
            v_errores := v_errores || jsonb_build_object(
                'campo', v_campo.nombre_clave,
                'error', 'El campo "' || v_campo.nombre || '" es requerido'
            );
            CONTINUE;
        END IF;

        -- Si no hay valor, saltar validaciones
        IF v_valor IS NULL OR v_valor = 'null'::jsonb OR v_valor_texto = '' THEN
            CONTINUE;
        END IF;

        -- Validar longitud para texto
        IF v_campo.tipo_dato IN ('texto', 'texto_largo') THEN
            IF v_campo.longitud_minima IS NOT NULL AND length(v_valor_texto) < v_campo.longitud_minima THEN
                v_errores := v_errores || jsonb_build_object(
                    'campo', v_campo.nombre_clave,
                    'error', 'Mínimo ' || v_campo.longitud_minima || ' caracteres'
                );
            END IF;

            IF v_campo.longitud_maxima IS NOT NULL AND length(v_valor_texto) > v_campo.longitud_maxima THEN
                v_errores := v_errores || jsonb_build_object(
                    'campo', v_campo.nombre_clave,
                    'error', 'Máximo ' || v_campo.longitud_maxima || ' caracteres'
                );
            END IF;
        END IF;

        -- Validar rango para números
        IF v_campo.tipo_dato = 'numero' THEN
            BEGIN
                v_valor_numero := v_valor_texto::NUMERIC;

                IF v_campo.valor_minimo IS NOT NULL AND v_valor_numero < v_campo.valor_minimo THEN
                    v_errores := v_errores || jsonb_build_object(
                        'campo', v_campo.nombre_clave,
                        'error', 'Valor mínimo: ' || v_campo.valor_minimo
                    );
                END IF;

                IF v_campo.valor_maximo IS NOT NULL AND v_valor_numero > v_campo.valor_maximo THEN
                    v_errores := v_errores || jsonb_build_object(
                        'campo', v_campo.nombre_clave,
                        'error', 'Valor máximo: ' || v_campo.valor_maximo
                    );
                END IF;
            EXCEPTION WHEN OTHERS THEN
                v_errores := v_errores || jsonb_build_object(
                    'campo', v_campo.nombre_clave,
                    'error', 'Debe ser un número válido'
                );
            END;
        END IF;

        -- Validar regex personalizado
        IF v_campo.patron_regex IS NOT NULL AND v_valor_texto !~ v_campo.patron_regex THEN
            v_errores := v_errores || jsonb_build_object(
                'campo', v_campo.nombre_clave,
                'error', COALESCE(v_campo.mensaje_error, 'Formato inválido')
            );
        END IF;

        -- Validar email
        IF v_campo.tipo_dato = 'email' AND v_valor_texto !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            v_errores := v_errores || jsonb_build_object(
                'campo', v_campo.nombre_clave,
                'error', 'Email inválido'
            );
        END IF;

        -- Validar opciones de select
        IF v_campo.tipo_dato = 'select' AND v_campo.opciones IS NOT NULL THEN
            IF NOT v_campo.opciones ? v_valor_texto THEN
                v_errores := v_errores || jsonb_build_object(
                    'campo', v_campo.nombre_clave,
                    'error', 'Opción no válida'
                );
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'valido', jsonb_array_length(v_errores) = 0,
        'errores', v_errores
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION validar_custom_fields IS
'Valida valores de campos personalizados. Retorna objeto con errores de validación.';

-- ====================================================================
-- FIN: FUNCIONES CUSTOM FIELDS
-- ====================================================================
