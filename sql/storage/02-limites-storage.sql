-- ====================================================================
-- MÓDULO STORAGE: LÍMITES DE ALMACENAMIENTO POR PLAN
-- ====================================================================
-- Agrega columna de límite de almacenamiento a planes_subscripcion
--
-- Fecha creación: 3 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- AGREGAR COLUMNA DE LÍMITE DE ALMACENAMIENTO
-- ====================================================================

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'planes_subscripcion'
        AND column_name = 'limite_almacenamiento_mb'
    ) THEN
        ALTER TABLE planes_subscripcion
        ADD COLUMN limite_almacenamiento_mb INTEGER DEFAULT 500;

        RAISE NOTICE 'Columna limite_almacenamiento_mb agregada a planes_subscripcion';
    ELSE
        RAISE NOTICE 'Columna limite_almacenamiento_mb ya existe';
    END IF;
END $$;

-- ====================================================================
-- ACTUALIZAR LÍMITES POR TIPO DE PLAN
-- ====================================================================

-- Trial: 500 MB
UPDATE planes_subscripcion
SET limite_almacenamiento_mb = 500
WHERE codigo_plan = 'trial' OR nombre_plan ILIKE '%trial%';

-- Básico: 1 GB
UPDATE planes_subscripcion
SET limite_almacenamiento_mb = 1000
WHERE codigo_plan = 'basico' OR nombre_plan ILIKE '%básico%' OR nombre_plan ILIKE '%basico%';

-- Pro: 5 GB
UPDATE planes_subscripcion
SET limite_almacenamiento_mb = 5000
WHERE codigo_plan = 'pro' OR nombre_plan ILIKE '%pro%';

-- Enterprise: 20 GB
UPDATE planes_subscripcion
SET limite_almacenamiento_mb = 20000
WHERE codigo_plan = 'enterprise' OR nombre_plan ILIKE '%enterprise%';

-- Custom: Sin límite (NULL)
UPDATE planes_subscripcion
SET limite_almacenamiento_mb = NULL
WHERE codigo_plan = 'custom' OR nombre_plan ILIKE '%custom%';

-- ====================================================================
-- COMENTARIO
-- ====================================================================

COMMENT ON COLUMN planes_subscripcion.limite_almacenamiento_mb IS
'Límite de almacenamiento en MB para el plan. NULL = sin límite (planes custom/enterprise especiales)';
