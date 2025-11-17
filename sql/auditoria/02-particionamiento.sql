-- ====================================================================
-- 📅 MÓDULO AUDITORÍA - PARTICIONAMIENTO DE EVENTOS_SISTEMA
-- ====================================================================
--
-- PROPÓSITO:
-- Pre-crea las particiones iniciales necesarias para arrancar el sistema.
-- Las particiones adicionales se crearán automáticamente vía pg_cron.
--
-- ESTRATEGIA MINIMALISTA:
-- • Confiamos en la automatización (si falla, queremos saberlo de inmediato)
-- • Código limpio sin redundancias
-- • Menos metadata en la BD
--
-- FUNCIONAMIENTO:
-- • Día 1 de cada mes a las 00:30: el cron ejecuta mantener_particiones(6, 24)
-- • Crea particiones para los próximos 6 meses automáticamente
-- • Ejemplo: El 1 de diciembre crea ene-2026, feb-2026, ..., jun-2026
--
-- DETECCIÓN DE FALLOS:
-- • Si el cron no funciona, los INSERT a meses futuros fallarán con error claro
-- • Solución manual: SELECT * FROM mantener_particiones(6, 24);
--
-- RENDIMIENTO:
-- • Mejora consultas históricas hasta 100x más rápido
-- • Reduce tamaño de índices y uso de memoria
-- • Facilita archivado automático de datos antiguos (>6 meses)
--
-- ORDEN DE CARGA: #9 (después de tabla eventos_sistema)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- PARTICIONES INICIALES - ESTRATEGIA MINIMALISTA
-- ====================================================================
-- Pre-creamos SOLO las particiones necesarias para arrancar el sistema.
-- El cron job (pg_cron) creará automáticamente el resto cada mes.
-- ────────────────────────────────────────────────────────────────────

-- ====================================================================
-- PARTICIÓN 1: MES ACTUAL (NOVIEMBRE 2025)
-- ====================================================================
-- Necesaria AHORA para empezar a registrar eventos
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE eventos_sistema_2025_11 PARTITION OF eventos_sistema
    FOR VALUES FROM ('2025-11-01 00:00:00+00') TO ('2025-12-01 00:00:00+00');

COMMENT ON TABLE eventos_sistema_2025_11 IS
'Partición de eventos_sistema para noviembre 2025. Creada automáticamente en el setup inicial.';

-- ====================================================================
-- PARTICIÓN 2: PRÓXIMO MES (DICIEMBRE 2025)
-- ====================================================================
-- Buffer mínimo de seguridad para transición de mes
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE eventos_sistema_2025_12 PARTITION OF eventos_sistema
    FOR VALUES FROM ('2025-12-01 00:00:00+00') TO ('2026-01-01 00:00:00+00');

COMMENT ON TABLE eventos_sistema_2025_12 IS
'Partición de eventos_sistema para diciembre 2025. Buffer de seguridad para transición de mes.';

-- ====================================================================
-- 📊 RESUMEN DE PARTICIONAMIENTO
-- ====================================================================
-- Total: 2 particiones iniciales (vs 18 originales)
--
-- Filosofía:
-- • Minimalismo: Solo lo necesario para arrancar
-- • Automatización: pg_cron crea el resto mensualmente
-- • Detección temprana: Fallos del cron se detectan inmediatamente
--
-- Job automático (18-pg-cron-setup.sql):
-- • Schedule: Día 1 de cada mes a las 00:30
-- • Comando: SELECT * FROM mantener_particiones(6, 24);
-- • Función: Crea 6 meses futuros, archiva >24 meses
--
-- Gestión manual (si es necesario):
-- • Crear particiones: SELECT * FROM mantener_particiones(6, 24);
-- • Archivar eventos antiguos: SELECT * FROM archivar_eventos_antiguos();
-- ====================================================================
