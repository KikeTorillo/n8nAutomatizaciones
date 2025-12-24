-- ====================================================================
-- MÓDULO PRECIOS: DATOS INICIALES
-- ====================================================================
-- Lista de precios por defecto para cada organización existente.
-- Se ejecuta después de crear las tablas.
--
-- Fase 5 - Diciembre 2025
-- ====================================================================

-- Crear lista de precios por defecto para organizaciones que no tengan
-- (Solo se ejecuta para organizaciones existentes)
INSERT INTO listas_precios (organizacion_id, codigo, nombre, descripcion, moneda, es_default)
SELECT
    o.id,
    'GENERAL',
    'Precios Generales',
    'Lista de precios por defecto. Usa los precios base de los productos.',
    COALESCE(o.moneda, 'MXN'),
    TRUE
FROM organizaciones o
WHERE o.eliminado_en IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM listas_precios lp
      WHERE lp.organizacion_id = o.id
        AND lp.es_default = TRUE
        AND lp.eliminado_en IS NULL
  );

-- ====================================================================
-- FIN: DATOS INICIALES
-- ====================================================================
