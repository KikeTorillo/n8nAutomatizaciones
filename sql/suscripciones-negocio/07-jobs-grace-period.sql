-- ====================================================================
-- MÓDULO SUSCRIPCIONES-NEGOCIO - JOBS GRACE PERIOD
-- ====================================================================
-- Descripción: Jobs pg_cron para gestión automática de grace period
-- Versión: 1.0.0
-- Fecha: Enero 2026
--
-- Jobs incluidos:
-- 1. suscripciones-grace-period: Mover a grace_period después de 7 días sin pago
-- 2. suscripciones-suspender: Suspender después de grace_period vencido
-- ====================================================================

-- ====================================================================
-- JOB 1: MOVER A GRACE PERIOD
-- ====================================================================
-- Ejecuta diariamente a la 01:00
-- Mueve suscripciones activas/vencidas que llevan >7 días sin pago a grace_period
-- ────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
    'suscripciones-grace-period',
    '0 1 * * *',                              -- Todos los días a las 01:00
    $$DO $BODY$
    DECLARE
        v_count INTEGER;
        v_grace_period_days INTEGER := 7;
    BEGIN
        -- Mover a grace_period suscripciones que excedieron el período de gracia inicial
        UPDATE suscripciones_org
        SET estado = 'grace_period',
            fecha_gracia = CURRENT_DATE + v_grace_period_days,
            actualizado_en = NOW()
        WHERE estado IN ('activa', 'pendiente_pago', 'vencida')
          AND fecha_proximo_cobro IS NOT NULL
          AND fecha_proximo_cobro < CURRENT_DATE - v_grace_period_days
          AND auto_cobro = TRUE;

        GET DIAGNOSTICS v_count = ROW_COUNT;

        IF v_count > 0 THEN
            RAISE NOTICE '⏰ [Grace Period] % suscripciones movidas a grace_period', v_count;
        END IF;
    END $BODY$;$$
);

-- ====================================================================
-- JOB 2: SUSPENDER SUSCRIPCIONES CON GRACE PERIOD VENCIDO
-- ====================================================================
-- Ejecuta diariamente a las 02:00 (después del job de grace period)
-- Suspende suscripciones cuyo grace_period ha vencido
-- ────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
    'suscripciones-suspender',
    '0 2 * * *',                              -- Todos los días a las 02:00
    $$DO $BODY$
    DECLARE
        v_count INTEGER;
    BEGIN
        -- Suspender suscripciones con grace_period vencido
        UPDATE suscripciones_org
        SET estado = 'suspendida',
            actualizado_en = NOW()
        WHERE estado = 'grace_period'
          AND fecha_gracia IS NOT NULL
          AND fecha_gracia < CURRENT_DATE;

        GET DIAGNOSTICS v_count = ROW_COUNT;

        IF v_count > 0 THEN
            RAISE NOTICE '⏰ [Suspensión] % suscripciones suspendidas por grace_period vencido', v_count;
        END IF;
    END $BODY$;$$
);

-- ====================================================================
-- JOB 3: LIMPIAR TRIALS EXPIRADOS
-- ====================================================================
-- Ejecuta diariamente a las 03:00
-- Mueve trials expirados a grace_period (pueden convertirse aún)
-- ────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
    'suscripciones-trials-expirados',
    '0 3 * * *',                              -- Todos los días a las 03:00
    $$DO $BODY$
    DECLARE
        v_count INTEGER;
        v_grace_period_days INTEGER := 7;
    BEGIN
        -- Mover trials expirados a grace_period (dar oportunidad de convertir)
        UPDATE suscripciones_org
        SET estado = 'grace_period',
            fecha_gracia = CURRENT_DATE + v_grace_period_days,
            es_trial = FALSE,
            actualizado_en = NOW()
        WHERE estado = 'trial'
          AND es_trial = TRUE
          AND fecha_fin_trial IS NOT NULL
          AND fecha_fin_trial < CURRENT_DATE;

        GET DIAGNOSTICS v_count = ROW_COUNT;

        IF v_count > 0 THEN
            RAISE NOTICE '⏰ [Trials] % trials expirados movidos a grace_period', v_count;
        END IF;
    END $BODY$;$$
);

-- ====================================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- ====================================================================

DO $$
DECLARE
    v_jobs_count INTEGER;
BEGIN
    -- Contar jobs de suscripciones creados
    SELECT COUNT(*) INTO v_jobs_count
    FROM cron.job
    WHERE jobname LIKE 'suscripciones-%';

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📅 JOBS DE SUSCRIPCIONES CONFIGURADOS: %', v_jobs_count;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '1. suscripciones-grace-period: Diario 01:00 - Mover a grace_period';
    RAISE NOTICE '2. suscripciones-suspender: Diario 02:00 - Suspender vencidos';
    RAISE NOTICE '3. suscripciones-trials-expirados: Diario 03:00 - Procesar trials';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
