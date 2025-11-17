-- ====================================================================
-- 📅 MÓDULO CITAS - PARTICIONAMIENTO
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: citas
--
-- DESCRIPCIÓN:
-- Define las particiones iniciales para la tabla citas.
-- Estrategia minimalista: solo 2 particiones iniciales.
-- pg_cron crea el resto automáticamente cada mes.
--
-- ESTRATEGIA:
-- • Mes actual + próximo mes (buffer mínimo)
-- • Automatización vía pg_cron (día 1 de cada mes a las 00:30)
-- • Función mantener_particiones(6, 24) crea particiones futuras
--
-- BENEFICIOS:
-- • 10x+ más rápido en queries históricas
-- • Facilita archivado de datos antiguos
-- • Mantenimiento automático
--
-- DETECCIÓN DE FALLOS:
-- • Si pg_cron falla, INSERT a meses futuros generará error claro
-- • Solución manual: SELECT * FROM mantener_particiones(6, 24);
--
-- ====================================================================

-- ====================================================================
-- 📅 PARTICIONES INICIALES DE CITAS
-- ====================================================================

-- Mes actual (necesario AHORA)
CREATE TABLE citas_2025_11 PARTITION OF citas
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- Próximo mes (buffer mínimo de seguridad)
CREATE TABLE citas_2025_12 PARTITION OF citas
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE citas_2025_11 IS
'Partición de citas para noviembre 2025. Las particiones futuras se crean automáticamente vía pg_cron.';

COMMENT ON TABLE citas_2025_12 IS
'Partición de citas para diciembre 2025. Buffer de seguridad antes de automatización completa.';

-- ====================================================================
-- ⚠️ NOTA IMPORTANTE
-- ====================================================================
-- ✅ TOTAL: 2 particiones (vs 18 originales)
-- ⏰ El cron job mantener_particiones() se encargará del resto
-- 🔧 Configurado en: sql/schema/18-pg-cron-setup.sql
-- ====================================================================
