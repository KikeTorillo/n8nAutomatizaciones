-- ====================================================================
-- 🏗️ MÓDULO: FUNDAMENTOS - FUNCIONES UTILITARIAS GLOBALES
-- ====================================================================
--
-- Descripción: Funciones helper globales usadas por múltiples módulos
-- Dependencias: 01-extensiones, 02-tipos-enums
-- Orden: 03
--
-- Contenido:
-- - actualizar_timestamp() - Trigger function para updated_at automático
-- - normalizar_telefono() - Normalización de números telefónicos
-- ====================================================================

-- ====================================================================
-- ⏰ FUNCIÓN: ACTUALIZAR_TIMESTAMP
-- ====================================================================
-- Función trigger genérica para actualizar campo actualizado_en
-- de forma automática en cualquier tabla.
--
-- 🎯 USO: Trigger BEFORE UPDATE en todas las tablas con actualizado_en
-- ⚡ PERFORMANCE: O(1) - Operación simple de asignación
-- 🔄 USADO POR: Múltiples módulos (núcleo, negocio, citas, etc.)
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_timestamp() IS
'Función trigger genérica que actualiza automáticamente el campo actualizado_en al valor NOW() en cualquier UPDATE.';

-- ====================================================================
-- 📞 FUNCIÓN: NORMALIZAR_TELEFONO
-- ====================================================================
-- Normaliza números telefónicos removiendo caracteres especiales
-- y códigos de país comunes (52 México, 1 USA).
--
-- 🎯 PROPÓSITO:
-- • Facilitar búsquedas fuzzy de clientes por teléfono
-- • Garantizar formato consistente en base de datos
-- • Remover espacios, guiones, paréntesis
--
-- 📋 TRANSFORMACIONES:
-- • "+52 (442) 123-4567" → "4421234567"
-- • "1-555-123-4567"     → "5551234567"
-- • "(555) 123 4567"     → "5551234567"
--
-- 🔄 USADO POR:
-- • Módulo clientes (búsqueda y validación)
-- • Módulo profesionales (contacto)
-- • Cualquier otro módulo que maneje teléfonos
--
-- ⚡ PERFORMANCE: IMMUTABLE - Permite uso en índices
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION normalizar_telefono(telefono_input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Validar entrada nula
    IF telefono_input IS NULL THEN
        RETURN NULL;
    END IF;

    -- Normalización en dos pasos:
    -- 1. Remover códigos de país comunes (52 México, 1 USA)
    -- 2. Remover todos los caracteres no numéricos
    RETURN regexp_replace(
        regexp_replace(telefono_input, '^(52|1)', ''),
        '[^0-9]', '', 'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION normalizar_telefono(TEXT) IS
'Normaliza números telefónicos removiendo caracteres especiales y códigos de país. Optimizada para búsquedas fuzzy en modelos de cliente';
