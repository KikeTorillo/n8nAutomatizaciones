-- ====================================================================
-- MÓDULO CUSTOM FIELDS: TRIGGERS
-- ====================================================================
-- Triggers para automatización de campos personalizados.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER: actualizar_timestamp en definiciones
-- ====================================================================
CREATE TRIGGER trg_cf_definiciones_updated_at
    BEFORE UPDATE ON custom_fields_definiciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trg_cf_definiciones_updated_at ON custom_fields_definiciones IS
'Actualiza automáticamente actualizado_en en cada UPDATE';

-- ====================================================================
-- TRIGGER: actualizar_timestamp en valores
-- ====================================================================
CREATE TRIGGER trg_cf_valores_updated_at
    BEFORE UPDATE ON custom_fields_valores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trg_cf_valores_updated_at ON custom_fields_valores IS
'Actualiza automáticamente actualizado_en en cada UPDATE';

-- ====================================================================
-- FUNCIÓN TRIGGER: sincronizar_entidad_tipo
-- ====================================================================
-- Asegura que entidad_tipo en valores coincida con la definición.
-- ====================================================================
CREATE OR REPLACE FUNCTION sync_cf_valor_entidad_tipo()
RETURNS TRIGGER AS $$
BEGIN
    -- Obtener entidad_tipo de la definición
    SELECT entidad_tipo INTO NEW.entidad_tipo
    FROM custom_fields_definiciones
    WHERE id = NEW.definicion_id;

    -- Copiar organizacion_id de la definición
    SELECT organizacion_id INTO NEW.organizacion_id
    FROM custom_fields_definiciones
    WHERE id = NEW.definicion_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cf_valores_sync_entidad
    BEFORE INSERT ON custom_fields_valores
    FOR EACH ROW
    EXECUTE FUNCTION sync_cf_valor_entidad_tipo();

COMMENT ON TRIGGER trg_cf_valores_sync_entidad ON custom_fields_valores IS
'Sincroniza entidad_tipo y organizacion_id desde la definición al insertar';

-- ====================================================================
-- FUNCIÓN TRIGGER: limpiar_valores_al_eliminar_definicion
-- ====================================================================
-- Cuando se elimina (soft delete) una definición, marca los valores.
-- ====================================================================
CREATE OR REPLACE FUNCTION limpiar_cf_valores_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es soft delete (eliminado_en pasa de NULL a valor)
    IF OLD.eliminado_en IS NULL AND NEW.eliminado_en IS NOT NULL THEN
        -- Eliminar valores asociados (hard delete, ya que la definición no existe)
        DELETE FROM custom_fields_valores
        WHERE definicion_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cf_definiciones_limpiar_valores
    AFTER UPDATE ON custom_fields_definiciones
    FOR EACH ROW
    WHEN (OLD.eliminado_en IS NULL AND NEW.eliminado_en IS NOT NULL)
    EXECUTE FUNCTION limpiar_cf_valores_on_delete();

COMMENT ON TRIGGER trg_cf_definiciones_limpiar_valores ON custom_fields_definiciones IS
'Elimina valores cuando una definición se marca como eliminada (soft delete)';

-- ====================================================================
-- FUNCIÓN TRIGGER: generar_nombre_clave
-- ====================================================================
-- Genera automáticamente nombre_clave a partir de nombre si no se provee.
-- ====================================================================
CREATE OR REPLACE FUNCTION generar_cf_nombre_clave()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo generar si no se proporcionó
    IF NEW.nombre_clave IS NULL OR NEW.nombre_clave = '' THEN
        NEW.nombre_clave := lower(
            regexp_replace(
                regexp_replace(
                    unaccent(NEW.nombre),  -- Remover acentos
                    '[^a-zA-Z0-9]+', '_', 'g'  -- Reemplazar especiales con _
                ),
                '^_|_$', '', 'g'  -- Remover _ al inicio/final
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cf_definiciones_nombre_clave
    BEFORE INSERT ON custom_fields_definiciones
    FOR EACH ROW
    EXECUTE FUNCTION generar_cf_nombre_clave();

COMMENT ON TRIGGER trg_cf_definiciones_nombre_clave ON custom_fields_definiciones IS
'Genera nombre_clave automáticamente a partir del nombre si no se provee';

-- ====================================================================
-- FIN: TRIGGERS CUSTOM FIELDS
-- ====================================================================
