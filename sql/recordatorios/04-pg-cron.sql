-- ====================================================================
-- 🔔 MÓDULO RECORDATORIOS - PG_CRON Y VISTAS
-- ====================================================================
--
-- Versión: 1.1.0
-- Fecha: 27 Noviembre 2025
-- Módulo: recordatorios
--
-- DESCRIPCIÓN:
-- Job automático de pg_cron que procesa recordatorios cada 5 minutos
-- usando la extensión http para llamar al backend.
--
-- ====================================================================

-- ====================================================================
-- EXTENSIÓN HTTP (para llamadas al backend)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS http;

-- ====================================================================
-- JOB PG_CRON: Procesar recordatorios cada 5 minutos
-- ====================================================================

-- Eliminar job anterior si existe
SELECT cron.unschedule('procesar_recordatorios')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'procesar_recordatorios');

-- Crear job que ejecuta cada 5 minutos
SELECT cron.schedule(
    'procesar_recordatorios',
    '*/5 * * * *',  -- Cada 5 minutos
    $$
    SELECT http_post(
        'http://back:3000/internal/recordatorios/procesar',
        '{"limite": 100}',
        'application/json'
    )
    $$
);

-- ====================================================================
-- VISTA: Recordatorios pendientes (para debugging)
-- ====================================================================

CREATE OR REPLACE VIEW v_recordatorios_pendientes AS
SELECT
    c.id as cita_id,
    c.codigo_cita,
    c.fecha_cita,
    c.hora_inicio,
    o.nombre_comercial as organizacion,
    cl.nombre as cliente,
    cl.telefono,
    cc.plataforma,
    cc.activo as chatbot_activo,
    cr.habilitado as recordatorios_habilitados,
    cr.recordatorio_1_horas,
    c.fecha_cita + c.hora_inicio - (cr.recordatorio_1_horas || ' hours')::INTERVAL as enviar_despues_de,
    CASE
        WHEN NOW() >= c.fecha_cita + c.hora_inicio - (cr.recordatorio_1_horas || ' hours')::INTERVAL
        THEN 'LISTO PARA ENVIAR'
        ELSE 'PENDIENTE'
    END as estado_envio
FROM citas c
JOIN clientes cl ON c.cliente_id = cl.id
JOIN organizaciones o ON c.organizacion_id = o.id
LEFT JOIN chatbot_config cc ON c.organizacion_id = cc.organizacion_id AND cc.activo = TRUE
LEFT JOIN configuracion_recordatorios cr ON c.organizacion_id = cr.organizacion_id
WHERE c.estado IN ('pendiente', 'confirmada')
  AND c.recordatorio_enviado = FALSE
  AND c.fecha_cita + c.hora_inicio > NOW()
ORDER BY c.fecha_cita, c.hora_inicio;

COMMENT ON VIEW v_recordatorios_pendientes IS 'Vista para debugging de recordatorios pendientes de envío';
