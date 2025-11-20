-- ============================================================================
-- MIGRACIÓN: Agregar límites de Inventario y POS a planes_subscripcion
-- Descripción: Agrega columnas para límites de productos, proveedores y ventas
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- Módulo: Inventario + POS
-- ============================================================================

-- ⚠️ IMPORTANTE: Este script es idempotente (se puede ejecutar múltiples veces sin errores)

-- ============================================================================
-- PASO 1: Agregar nuevas columnas de límites
-- ============================================================================

-- Límites de Inventario
ALTER TABLE planes_subscripcion
ADD COLUMN IF NOT EXISTS limite_productos INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS limite_categorias_productos INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS limite_proveedores INTEGER DEFAULT NULL;

-- Límites de POS
ALTER TABLE planes_subscripcion
ADD COLUMN IF NOT EXISTS limite_ventas_pos_mes INTEGER DEFAULT NULL;

-- ============================================================================
-- PASO 2: Agregar comentarios a las nuevas columnas
-- ============================================================================

COMMENT ON COLUMN planes_subscripcion.limite_productos IS 'Máximo de productos en catálogo (NULL = ilimitado)';
COMMENT ON COLUMN planes_subscripcion.limite_categorias_productos IS 'Máximo de categorías de productos (NULL = ilimitado)';
COMMENT ON COLUMN planes_subscripcion.limite_proveedores IS 'Máximo de proveedores (NULL = ilimitado)';
COMMENT ON COLUMN planes_subscripcion.limite_ventas_pos_mes IS 'Máximo de ventas POS mensuales (NULL = ilimitado)';

-- ============================================================================
-- PASO 3: Actualizar constraint de validación
-- ============================================================================

-- Eliminar constraint antiguo
ALTER TABLE planes_subscripcion DROP CONSTRAINT IF EXISTS valid_limites_plan;

-- Crear nuevo constraint incluyendo los límites de inventario y POS
ALTER TABLE planes_subscripcion
ADD CONSTRAINT valid_limites_plan
    CHECK (
        (limite_profesionales IS NULL OR limite_profesionales > 0) AND
        (limite_clientes IS NULL OR limite_clientes > 0) AND
        (limite_servicios IS NULL OR limite_servicios > 0) AND
        (limite_usuarios > 0) AND
        (limite_citas_mes IS NULL OR limite_citas_mes > 0) AND
        -- Nuevos límites de Inventario y POS
        (limite_productos IS NULL OR limite_productos > 0) AND
        (limite_categorias_productos IS NULL OR limite_categorias_productos > 0) AND
        (limite_proveedores IS NULL OR limite_proveedores > 0) AND
        (limite_ventas_pos_mes IS NULL OR limite_ventas_pos_mes > 0)
    );

-- ============================================================================
-- PASO 4: Sincronizar con backend/app/config/planLimits.js
-- ============================================================================

-- Plan: Gratuito / Trial (14 días)
UPDATE planes_subscripcion
SET
    limite_productos = 20,
    limite_categorias_productos = 5,
    limite_proveedores = 2,
    limite_ventas_pos_mes = 50
WHERE codigo_plan = 'gratuito' OR codigo_plan = 'trial';

-- Plan: Básico ($15 USD/mes)
UPDATE planes_subscripcion
SET
    limite_productos = 100,
    limite_categorias_productos = 20,
    limite_proveedores = 10,
    limite_ventas_pos_mes = 500
WHERE codigo_plan = 'basico';

-- Plan: Profesional ($34 USD/mes) - RECOMENDADO
UPDATE planes_subscripcion
SET
    limite_productos = 500,
    limite_categorias_productos = 50,
    limite_proveedores = 30,
    limite_ventas_pos_mes = 2000
WHERE codigo_plan = 'profesional' OR codigo_plan = 'pro';

-- Plan: Empresarial ($79 USD/mes) - ILIMITADO
UPDATE planes_subscripcion
SET
    limite_productos = NULL,  -- Ilimitado
    limite_categorias_productos = NULL,
    limite_proveedores = NULL,
    limite_ventas_pos_mes = NULL
WHERE codigo_plan = 'empresarial' OR codigo_plan = 'enterprise';

-- ============================================================================
-- PASO 5: Agregar columnas a metricas_uso_organizacion
-- ============================================================================

-- Agregar contadores de uso para inventario y POS
ALTER TABLE metricas_uso_organizacion
ADD COLUMN IF NOT EXISTS uso_productos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uso_categorias_productos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uso_proveedores INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uso_ventas_pos_mes_actual INTEGER DEFAULT 0;

-- Comentarios
COMMENT ON COLUMN metricas_uso_organizacion.uso_productos IS 'Contador actual de productos activos';
COMMENT ON COLUMN metricas_uso_organizacion.uso_categorias_productos IS 'Contador actual de categorías de productos';
COMMENT ON COLUMN metricas_uso_organizacion.uso_proveedores IS 'Contador actual de proveedores activos';
COMMENT ON COLUMN metricas_uso_organizacion.uso_ventas_pos_mes_actual IS 'Contador de ventas POS en el mes actual (se resetea cada mes)';

-- ============================================================================
-- PASO 6: Verificación de sincronización
-- ============================================================================

-- Query de validación: Verificar que los límites coincidan con planLimits.js
SELECT
    codigo_plan,
    nombre_plan,
    -- Límites existentes
    limite_profesionales,
    limite_servicios,
    limite_clientes,
    limite_citas_mes,
    -- Nuevos límites Inventario + POS
    limite_productos,
    limite_categorias_productos,
    limite_proveedores,
    limite_ventas_pos_mes
FROM planes_subscripcion
ORDER BY orden_display;

-- ============================================================================
-- FIN: MIGRACIÓN COMPLETADA
-- ============================================================================

-- ✅ RESULTADO ESPERADO:
-- ┌────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
-- │ codigo_plan    │ profesionales│ servicios    │ productos    │ ventas_mes   │
-- ├────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
-- │ gratuito       │ 2            │ 5            │ 20           │ 50           │
-- │ basico         │ 3            │ 15           │ 100          │ 500          │
-- │ profesional    │ 10           │ 50           │ 500          │ 2000         │
-- │ empresarial    │ NULL         │ NULL         │ NULL         │ NULL         │
-- └────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
