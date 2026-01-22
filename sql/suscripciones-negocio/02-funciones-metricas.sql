-- ============================================================================
-- MÓDULO: SUSCRIPCIONES-NEGOCIO - FUNCIONES DE MÉTRICAS SAAS
-- ============================================================================
-- Fecha: 21 Enero 2026
-- Descripción: Funciones SQL para calcular métricas clave de SaaS
--
-- Contenido:
-- 1. calcular_mrr() - Monthly Recurring Revenue
-- 2. calcular_arr() - Annual Recurring Revenue
-- 3. calcular_churn_rate() - Tasa de cancelación
-- 4. calcular_ltv() - Lifetime Value promedio
-- 5. obtener_suscriptores_activos() - Conteo de suscriptores
-- 6. obtener_crecimiento_mensual() - Crecimiento mes a mes
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: calcular_mrr
-- ============================================================================
-- Calcula el Monthly Recurring Revenue (MRR) total de una organización.
-- Normaliza todos los períodos de pago a su equivalente mensual.
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--   p_fecha: Fecha de cálculo (default: hoy)
--
-- Retorna: NUMERIC - MRR total en la moneda base de la org
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calcular_mrr(
    p_organizacion_id INTEGER,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
    v_mrr NUMERIC;
BEGIN
    -- Sumar ingresos mensuales normalizados de suscripciones activas
    SELECT COALESCE(SUM(
        CASE periodo
            WHEN 'mensual' THEN precio_actual - COALESCE(descuento_monto, 0)
            WHEN 'trimestral' THEN (precio_actual - COALESCE(descuento_monto, 0)) / 3
            WHEN 'semestral' THEN (precio_actual - COALESCE(descuento_monto, 0)) / 6
            WHEN 'anual' THEN (precio_actual - COALESCE(descuento_monto, 0)) / 12
        END
    ), 0) INTO v_mrr
    FROM suscripciones_org
    WHERE organizacion_id = p_organizacion_id
      AND estado IN ('activa', 'trial')
      AND fecha_inicio <= p_fecha
      AND (fecha_fin IS NULL OR fecha_fin >= p_fecha);

    RETURN v_mrr;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_mrr IS
'Calcula el MRR (Monthly Recurring Revenue) normalizando todos los períodos a mensual.';

-- ============================================================================
-- FUNCIÓN: calcular_arr
-- ============================================================================
-- Calcula el Annual Recurring Revenue (ARR) = MRR * 12.
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--   p_fecha: Fecha de cálculo (default: hoy)
--
-- Retorna: NUMERIC - ARR total
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calcular_arr(
    p_organizacion_id INTEGER,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
BEGIN
    RETURN calcular_mrr(p_organizacion_id, p_fecha) * 12;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_arr IS
'Calcula el ARR (Annual Recurring Revenue) = MRR * 12.';

-- ============================================================================
-- FUNCIÓN: calcular_churn_rate
-- ============================================================================
-- Calcula la tasa de cancelación (churn rate) mensual.
-- Churn Rate = (Suscripciones canceladas en el mes / Suscripciones activas al inicio del mes) * 100
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--   p_mes: Mes de cálculo (formato: YYYY-MM-DD, cualquier día del mes)
--
-- Retorna: NUMERIC - Porcentaje de churn (0-100)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calcular_churn_rate(
    p_organizacion_id INTEGER,
    p_mes DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
    v_inicio_mes DATE;
    v_fin_mes DATE;
    v_activas_inicio INTEGER;
    v_canceladas_mes INTEGER;
    v_churn_rate NUMERIC;
BEGIN
    -- Determinar inicio y fin del mes
    v_inicio_mes := DATE_TRUNC('month', p_mes);
    v_fin_mes := (DATE_TRUNC('month', p_mes) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- Contar suscripciones activas al inicio del mes
    SELECT COUNT(*) INTO v_activas_inicio
    FROM suscripciones_org
    WHERE organizacion_id = p_organizacion_id
      AND fecha_inicio < v_inicio_mes
      AND (fecha_fin IS NULL OR fecha_fin >= v_inicio_mes)
      AND estado IN ('activa', 'trial');

    -- Contar suscripciones canceladas durante el mes
    SELECT COUNT(*) INTO v_canceladas_mes
    FROM suscripciones_org
    WHERE organizacion_id = p_organizacion_id
      AND estado = 'cancelada'
      AND fecha_fin >= v_inicio_mes
      AND fecha_fin <= v_fin_mes;

    -- Calcular churn rate (evitar división por cero)
    IF v_activas_inicio > 0 THEN
        v_churn_rate := (v_canceladas_mes::NUMERIC / v_activas_inicio) * 100;
    ELSE
        v_churn_rate := 0;
    END IF;

    RETURN ROUND(v_churn_rate, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_churn_rate IS
'Calcula el churn rate mensual (% de suscripciones canceladas).';

-- ============================================================================
-- FUNCIÓN: calcular_ltv
-- ============================================================================
-- Calcula el Lifetime Value (LTV) promedio de los clientes.
-- LTV simple = Promedio de ingresos totales por cliente cancelado
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--
-- Retorna: NUMERIC - LTV promedio
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calcular_ltv(
    p_organizacion_id INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_ltv NUMERIC;
BEGIN
    -- Calcular promedio de total_pagado de suscripciones canceladas
    SELECT COALESCE(AVG(total_pagado), 0) INTO v_ltv
    FROM suscripciones_org
    WHERE organizacion_id = p_organizacion_id
      AND estado = 'cancelada'
      AND total_pagado > 0;

    RETURN ROUND(v_ltv, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_ltv IS
'Calcula el LTV (Lifetime Value) promedio de clientes cancelados.';

-- ============================================================================
-- FUNCIÓN: obtener_suscriptores_activos
-- ============================================================================
-- Cuenta suscriptores activos (incluyendo trials) en una fecha específica.
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--   p_fecha: Fecha de consulta (default: hoy)
--
-- Retorna: INTEGER - Número de suscriptores activos
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_suscriptores_activos(
    p_organizacion_id INTEGER,
    p_fecha DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM suscripciones_org
    WHERE organizacion_id = p_organizacion_id
      AND estado IN ('activa', 'trial')
      AND fecha_inicio <= p_fecha
      AND (fecha_fin IS NULL OR fecha_fin >= p_fecha);

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_suscriptores_activos IS
'Retorna el número de suscriptores activos (incluyendo trials) en una fecha.';

-- ============================================================================
-- FUNCIÓN: obtener_crecimiento_mensual
-- ============================================================================
-- Calcula el crecimiento de MRR mes a mes (%).
-- Crecimiento = ((MRR mes actual - MRR mes anterior) / MRR mes anterior) * 100
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--   p_mes: Mes de cálculo (formato: YYYY-MM-DD)
--
-- Retorna: NUMERIC - Porcentaje de crecimiento
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_crecimiento_mensual(
    p_organizacion_id INTEGER,
    p_mes DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
    v_mrr_actual NUMERIC;
    v_mrr_anterior NUMERIC;
    v_crecimiento NUMERIC;
    v_mes_actual DATE;
    v_mes_anterior DATE;
BEGIN
    -- Último día del mes actual
    v_mes_actual := (DATE_TRUNC('month', p_mes) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- Último día del mes anterior
    v_mes_anterior := (DATE_TRUNC('month', p_mes) - INTERVAL '1 day')::DATE;

    -- Calcular MRR de ambos meses
    v_mrr_actual := calcular_mrr(p_organizacion_id, v_mes_actual);
    v_mrr_anterior := calcular_mrr(p_organizacion_id, v_mes_anterior);

    -- Calcular crecimiento (evitar división por cero)
    IF v_mrr_anterior > 0 THEN
        v_crecimiento := ((v_mrr_actual - v_mrr_anterior) / v_mrr_anterior) * 100;
    ELSE
        -- Si no había MRR anterior pero ahora sí, es crecimiento infinito (100%)
        IF v_mrr_actual > 0 THEN
            v_crecimiento := 100;
        ELSE
            v_crecimiento := 0;
        END IF;
    END IF;

    RETURN ROUND(v_crecimiento, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_crecimiento_mensual IS
'Calcula el % de crecimiento de MRR comparando el mes actual con el anterior.';

-- ============================================================================
-- FUNCIÓN: obtener_distribucion_por_estado
-- ============================================================================
-- Retorna la distribución de suscriptores por estado (activa, trial, etc.)
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--
-- Retorna: TABLE - estado, cantidad
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_distribucion_por_estado(
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    estado VARCHAR(20),
    cantidad BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.estado, COUNT(*)::BIGINT
    FROM suscripciones_org s
    WHERE s.organizacion_id = p_organizacion_id
    GROUP BY s.estado
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_distribucion_por_estado IS
'Retorna la distribución de suscripciones por estado (activa, trial, cancelada, etc.)';

-- ============================================================================
-- FUNCIÓN: obtener_top_planes
-- ============================================================================
-- Retorna los planes más populares por número de suscriptores activos.
--
-- Parámetros:
--   p_organizacion_id: ID de la organización
--   p_limit: Número máximo de planes a retornar (default: 10)
--
-- Retorna: TABLE - plan_nombre, suscriptores, mrr
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION obtener_top_planes(
    p_organizacion_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    plan_id INTEGER,
    plan_nombre VARCHAR(100),
    suscriptores BIGINT,
    mrr NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.nombre,
        COUNT(s.id)::BIGINT AS suscriptores,
        SUM(
            CASE s.periodo
                WHEN 'mensual' THEN s.precio_actual - COALESCE(s.descuento_monto, 0)
                WHEN 'trimestral' THEN (s.precio_actual - COALESCE(s.descuento_monto, 0)) / 3
                WHEN 'semestral' THEN (s.precio_actual - COALESCE(s.descuento_monto, 0)) / 6
                WHEN 'anual' THEN (s.precio_actual - COALESCE(s.descuento_monto, 0)) / 12
            END
        )::NUMERIC AS mrr
    FROM planes_suscripcion_org p
    LEFT JOIN suscripciones_org s ON s.plan_id = p.id AND s.estado IN ('activa', 'trial')
    WHERE p.organizacion_id = p_organizacion_id
    GROUP BY p.id, p.nombre
    ORDER BY COUNT(s.id) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_top_planes IS
'Retorna los planes más populares ordenados por número de suscriptores.';

-- ============================================================================
-- FUNCIONES COMPLETADAS
-- ============================================================================
-- 8 funciones de métricas creadas:
-- - calcular_mrr() - MRR total
-- - calcular_arr() - ARR total
-- - calcular_churn_rate() - Tasa de cancelación
-- - calcular_ltv() - Lifetime Value
-- - obtener_suscriptores_activos() - Conteo de activos
-- - obtener_crecimiento_mensual() - % crecimiento MRR
-- - obtener_distribucion_por_estado() - Distribución por estado
-- - obtener_top_planes() - Planes más populares
-- ============================================================================
